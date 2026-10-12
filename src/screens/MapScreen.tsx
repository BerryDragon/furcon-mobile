import {
  Camera,
  GeoJSONSource,
  Images,
  Layer,
  Map as MapView,
  Marker,
  type CameraRef,
  type PressEventWithFeatures,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomBar, type Panel } from '../components/BottomBar';
import { DetailsPanel } from '../components/DetailsPanel';
import { ListPanel, toListItems, type ListItem } from '../components/ListPanel';
import { PawTrail } from '../components/PawTrail';
import { SelectedPaw } from '../components/SelectedPaw';
import { SearchBar } from '../components/SearchBar';
import { Sheet, type SheetMode } from '../components/Sheet';
import { ThemeToggle } from '../components/ThemeToggle';
import { UserRadar } from '../components/UserRadar';
import {
  BAR_HEIGHT,
  BAR_MARGIN,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  LOCATE_ZOOM,
  NEAREST_COUNT,
  SHEET_PEEK_FRACTION,
} from '../config';
import {
  conventionFeatures,
  conventions,
  conventionsById,
  nearTargets,
  pinCoordinatesById,
} from '../data/conventions';
import { boundsOf, haversineMiles } from '../lib/geo';
import { eventStatus } from '../lib/dates';
import { EMPTY_ROUTES, nearestTo, routeFeatures } from '../lib/nearest';
import { createSearcher } from '../lib/search';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useSaved } from '../lib/useSaved';
import { useTheme } from '../theme';
import type { Convention, LatLng } from '../types';

// Built once at startup: no per-keystroke or per-render rebuilding.
const search = createSearcher(conventions);
const popular = [...conventions].sort((a, b) => a.popularityRank - b.popularityRank);
const PIN_IMAGES = {
  paw: require('../../assets/paw.png'),
  'paw-past': require('../../assets/paw-past.png'),
  'paw-saved': require('../../assets/paw-saved.png'),
};
const NO_SELECTION = -1;
const PANEL_LABELS: Record<Panel, string> = {
  nearest: 'Nearest 10',
  saved: 'Saved',
  popular: 'Popular',
};

export function MapScreen() {
  const { scheme, colors, mapStyle } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const dur = useCallback((ms: number) => (reduceMotion ? 0 : ms), [reduceMotion]);
  const themeWash = useRef(new Animated.Value(0)).current;
  const previousScheme = useRef(scheme);

  useEffect(() => {
    if (previousScheme.current === scheme) return;
    previousScheme.current = scheme;
    if (reduceMotion) {
      themeWash.setValue(0);
      return;
    }
    themeWash.setValue(0);
    Animated.sequence([
      Animated.timing(themeWash, { toValue: 0.12, duration: 110, useNativeDriver: true }),
      Animated.timing(themeWash, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [scheme, reduceMotion, themeWash]);

  const cameraRef = useRef<CameraRef>(null);
  // Refs, not state: panning must never re-render React. Also lets a theme switch keep the view.
  const viewRef = useRef<{ center: [number, number]; zoom: number }>({
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<LatLng | null>(null);
  const [mapZoom, setMapZoom] = useState(INITIAL_ZOOM);
  const [radarKey, setRadarKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { ids: savedIds, savedSet, toggle } = useSaved();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Layout: the sheet floats above the bottom bar.
  const barOffset = insets.bottom + BAR_MARGIN;
  const sheetInset = barOffset + BAR_HEIGHT + 8;
  const peekSheetPx = (height - sheetInset) * SHEET_PEEK_FRACTION + sheetInset;

  const results = useMemo(() => search(query), [query]);
  const selected = selectedId === null ? null : (conventionsById.get(selectedId) ?? null);
  const selectedPin = selected
    ? pinCoordinatesById.get(selected.id) ?? [selected.longitude, selected.latitude]
    : null;

  // Computed once per location fix (100 haversines is well under a millisecond), so opening a
  // pin or a list never waits on math.
  const distances = useMemo(() => {
    const out = new Map<number, number>();
    if (user) for (const c of conventions) out.set(c.id, haversineMiles(user, c));
    return out;
  }, [user]);

  const nearest = useMemo(
    () => (user ? nearestTo(user, nearTargets, NEAREST_COUNT) : []),
    [user],
  );
  const routes = useMemo(
    () => (panel === 'nearest' && user ? routeFeatures(user, nearest, pinCoordinatesById) : EMPTY_ROUTES),
    [panel, user, nearest],
  );
  const listItems = useMemo<ListItem[]>(() => {
    if (panel === 'nearest') return toListItems(nearest, true);
    if (panel === 'saved') {
      return savedIds.flatMap((id) => {
        const convention = conventionsById.get(id);
        return convention ? [{ convention, miles: distances.get(id) }] : [];
      });
    }
    if (panel === 'popular') {
      return popular.map((convention) => ({
        convention,
        badge: convention.popularityRank,
        miles: distances.get(convention.id),
      }));
    }
    return [];
  }, [panel, nearest, savedIds, distances]);

  const mode: SheetMode = selected ? 'details' : panel ? 'list' : null;

  const select = useCallback(
    (convention: Convention | null, fly: boolean | 'none' = false) => {
      Keyboard.dismiss();
      setQuery('');
      if (convention) setNotice(null);
      setSelectedId(convention ? convention.id : null);
      if (!convention || fly === 'none') return;
      const stop = {
        center: pinCoordinatesById.get(convention.id) ?? [convention.longitude, convention.latitude],
        // Search and list selections fly to neighborhood scale. Tapping a map pin keeps the zoom.
        zoom: fly ? Math.max(viewRef.current.zoom, 10) : viewRef.current.zoom,
        // Shift the target up so the pin lands in the visible map, above the sheet.
        padding: { bottom: peekSheetPx },
        duration: dur(fly ? 900 : 450),
      };
      if (fly) cameraRef.current?.flyTo(stop);
      else cameraRef.current?.easeTo(stop);
    },
    [peekSheetPx, dur],
  );

  const back = useCallback(() => setSelectedId(null), []);
  const dismiss = useCallback(() => {
    setSelectedId(null);
    setPanel(null);
  }, []);

  // Android back button: step out of details, then out of the list, then leave the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedId !== null) {
        back();
        return true;
      }
      if (panel !== null) {
        setPanel(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [selectedId, panel, back]);

  const onSourcePress = useCallback(
    (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      event.stopPropagation(); // otherwise the map's own onPress would immediately deselect
      const feature = event.nativeEvent.features[0];
      if (!feature) return;
      const props = (feature.properties ?? {}) as Record<string, unknown>;
      const convention = conventionsById.get(Number(props.id));
      if (convention) select(convention);
    },
    [select],
  );

  const ensureLocation = useCallback(async (): Promise<LatLng | null> => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setNotice('Location is off. You can still search by name, city, or state.');
        return null;
      }
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 120_000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      if (!position) {
        setNotice("Couldn't find your location. Check that GPS is on and try again.");
        return null;
      }
      const me = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setUser(me);
      return me;
    } catch {
      setNotice("Couldn't find your location. Check that GPS is on and try again.");
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  const onLocate = useCallback(async () => {
    if (locating) return;
    const me = await ensureLocation();
    if (!me) return;
    setRadarKey((k) => k + 1); // replays the radar ping
    cameraRef.current?.flyTo({
      center: [me.longitude, me.latitude],
      zoom: LOCATE_ZOOM,
      duration: dur(1400),
    });
  }, [locating, ensureLocation, dur]);

  const onPanelPress = useCallback(
    async (next: Panel) => {
      if (panel === next) {
        dismiss(); // tapping the active tab closes it
        return;
      }
      if (next === 'nearest') {
        if (locating) return;
        const me = user ?? (await ensureLocation());
        if (!me) return;
        const bounds = boundsOf([
          me,
          ...nearestTo(me, nearTargets, NEAREST_COUNT).map(({ convention }) => {
            const pin = pinCoordinatesById.get(convention.id) ?? [convention.longitude, convention.latitude];
            return { longitude: pin[0], latitude: pin[1] };
          }),
        ]);
        if (bounds) {
          cameraRef.current?.fitBounds(bounds, {
            // The nearest sheet opens at its peek snap; fit to the actual visible map, with
            // modest edge padding so the tenth result lands near the screen edge.
            padding: { top: insets.top + 105, right: 36, bottom: peekSheetPx + 16, left: 36 },
            duration: dur(800),
          });
        }
      }
      setSelectedId(null);
      setPanel(next);
    },
    [panel, user, locating, ensureLocation, dismiss, insets.top, peekSheetPx, dur],
  );

  const onRegionDidChange = useCallback((event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const { center, zoom } = event.nativeEvent;
    viewRef.current = { center: [center[0], center[1]], zoom };
    setMapZoom(zoom);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.mapBg }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        touchRotate={false}
        touchPitch={false}
        compass={false}
        onPress={(event) => {
          // A source tap can also arrive here on some native event paths. Keep the selection
          // when the event contains a feature; only an empty map tap dismisses details.
          if ('features' in event.nativeEvent && event.nativeEvent.features?.length) return;
          select(null);
        }}
        onRegionDidChange={onRegionDidChange}
      >
        <Images images={PIN_IMAGES} />
        <Camera
          ref={cameraRef}
          initialViewState={viewRef.current}
          minZoom={1.5}
          maxZoom={16}
        />

        {panel === 'nearest' && user && (
          <GeoJSONSource id="routes" data={routes}>
            <Layer
              id="route-lines"
              type="line"
              style={{
                lineColor: colors.brand,
                lineWidth: 3,
                lineCap: 'round',
                lineDasharray: [0.2, 2.2],
              }}
            />
            <Layer
              id="route-labels"
              type="symbol"
              style={{
                symbolPlacement: 'line-center',
                textField: ['get', 'label'],
                textFont: ['Noto Sans Bold'],
                textSize: 12,
                textColor: colors.ink,
                textHaloColor: colors.surface,
                textHaloWidth: 2,
              }}
            />
          </GeoJSONSource>
        )}

        <GeoJSONSource
          id="conventions"
          data={conventionFeatures}
          cluster={false}
          onPress={onSourcePress}
        >
          <Layer
            id="pins"
            type="symbol"
            filter={['!=', ['get', 'id'], selectedId ?? NO_SELECTION]}
            style={{
              iconImage: [
                'case',
                ['in', ['get', 'id'], ['literal', savedIds]], 'paw-saved',
                ['get', 'past'], 'paw-past',
                'paw',
              ],
              iconSize: 1,
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
              iconAnchor: 'center',
            }}
          />
        </GeoJSONSource>

        {selected && selectedPin && (
          <SelectedPaw
            key={`selected-paw-${selected.id}`}
            id={selected.id}
            coordinate={{ longitude: selectedPin[0], latitude: selectedPin[1] }}
            saved={savedSet.has(selected.id)}
            past={eventStatus(selected.endDate) === 'past'}
            onPress={() => select(selected)}
          />
        )}

        {selected && selectedPin && user && (
          <PawTrail
            key={`selected-trail-${selected.id}`}
            routeKey={selected.id}
            from={user}
            to={{ longitude: selectedPin[0], latitude: selectedPin[1] }}
            zoom={mapZoom}
          />
        )}

        {user && (
          <Marker lngLat={[user.longitude, user.latitude]} anchor="center">
            <UserRadar pingKey={radarKey} />
          </Marker>
        )}
      </MapView>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.mapBg, opacity: themeWash }]}
      />

      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <SearchBar
          query={query}
          onChangeQuery={setQuery}
          results={results}
          onSelect={(c) => select(c, true)}
        />
        <View style={styles.row} pointerEvents="box-none">
          {notice ? (
            <View
              style={[styles.banner, { backgroundColor: colors.warnBg }]}
              accessibilityLiveRegion="polite"
            >
              <Text style={[styles.bannerText, { color: colors.warnInk }]}>{notice}</Text>
            </View>
          ) : (
            <View style={styles.spacer} />
          )}
          <ThemeToggle />
          <Pressable
            onPress={onLocate}
            style={[styles.locate, { backgroundColor: colors.surface }, locating && styles.busy]}
            accessibilityRole="button"
            accessibilityLabel="Show where I am"
            accessibilityState={{ busy: locating }}
          >
            <View style={[styles.target, { borderColor: colors.brand }]}>
              <View style={[styles.targetDot, { backgroundColor: colors.brand }]} />
            </View>
          </Pressable>
        </View>
      </View>

      <BottomBar
        active={panel}
        savedCount={savedIds.length}
        onPress={onPanelPress}
        bottomOffset={barOffset}
      />

      <Sheet mode={mode} listSnap={panel === 'nearest' ? 'peek' : 'list'} bottomInset={sheetInset} onDismiss={dismiss}>
        {selected ? (
          <DetailsPanel
            convention={selected}
            distanceMiles={distances.get(selected.id) ?? null}
            saved={savedSet.has(selected.id)}
            onToggleSave={toggle}
            backLabel={panel ? PANEL_LABELS[panel] : null}
            onBack={back}
          />
        ) : panel ? (
          <ListPanel
            panel={panel}
            items={listItems}
            savedSet={savedSet}
            onSelect={(c) => select(c, panel === 'nearest' ? 'none' : true)}
            onToggleSave={toggle}
          />
        ) : (
          <View />
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { position: 'absolute', left: 12, right: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 10 },
  spacer: { flex: 1 },
  banner: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 4,
  },
  bannerText: { fontSize: 13 },
  locate: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  busy: { opacity: 0.5 },
  target: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetDot: { width: 8, height: 8, borderRadius: 4 },
});
