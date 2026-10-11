import {
  Camera,
  GeoJSONSource,
  Images,
  Layer,
  Map as MapView,
  Marker,
  type CameraRef,
  type GeoJSONSourceRef,
  type PressEventWithFeatures,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
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
import { SearchBar } from '../components/SearchBar';
import { Sheet, type SheetMode } from '../components/Sheet';
import { UserRadar } from '../components/UserRadar';
import {
  BAR_HEIGHT,
  BAR_MARGIN,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  LOCATE_ZOOM,
  NEAREST_COUNT,
  SHEET_LIST_FRACTION,
  SHEET_PEEK_FRACTION,
} from '../config';
import {
  conventionFeatures,
  conventions,
  conventionsById,
  nearTargets,
  snapshotYear,
  upcomingCount,
} from '../data/conventions';
import { boundsOf, haversineMiles } from '../lib/geo';
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

  const cameraRef = useRef<CameraRef>(null);
  const sourceRef = useRef<GeoJSONSourceRef>(null);
  // Refs, not state: panning must never re-render React. Also lets a theme switch keep the view.
  const viewRef = useRef<{ center: [number, number]; zoom: number }>({
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<LatLng | null>(null);
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
  const listSheetPx = (height - sheetInset) * SHEET_LIST_FRACTION + sheetInset;
  const peekSheetPx = (height - sheetInset) * SHEET_PEEK_FRACTION + sheetInset;

  const results = useMemo(() => search(query), [query]);
  const selected = selectedId === null ? null : (conventionsById.get(selectedId) ?? null);

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
    () => (panel === 'nearest' && user ? routeFeatures(user, nearest) : EMPTY_ROUTES),
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
    (convention: Convention | null, fly = false) => {
      Keyboard.dismiss();
      setQuery('');
      setSelectedId(convention ? convention.id : null);
      if (!convention) return;
      const stop = {
        center: [convention.longitude, convention.latitude] as [number, number],
        // Coming from search or a list the pin may be hiding inside a cluster, so go in far
        // enough (clusters break up at zoom 10). Tapping a visible pin keeps the user's zoom.
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
    async (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      event.stopPropagation(); // otherwise the map's own onPress would immediately deselect
      const feature = event.nativeEvent.features[0];
      if (!feature) return;
      const props = (feature.properties ?? {}) as Record<string, unknown>;

      if (typeof props.point_count === 'number') {
        const zoom = await sourceRef.current?.getClusterExpansionZoom(Number(props.cluster_id));
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
        cameraRef.current?.easeTo({
          center: [lng, lat],
          zoom: zoom ?? viewRef.current.zoom + 2,
          duration: dur(350),
        });
        return;
      }
      const convention = conventionsById.get(Number(props.id));
      if (convention) select(convention);
    },
    [select, dur],
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
        const bounds = boundsOf([me, ...nearestTo(me, nearTargets, NEAREST_COUNT).map((r) => r.convention)]);
        if (bounds) {
          cameraRef.current?.fitBounds(bounds, {
            padding: { top: insets.top + 150, right: 48, bottom: listSheetPx + 24, left: 48 },
            duration: dur(800),
          });
        }
      }
      setSelectedId(null);
      setPanel(next);
    },
    [panel, user, locating, ensureLocation, dismiss, insets.top, listSheetPx, dur],
  );

  const onRegionDidChange = useCallback((event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const { center, zoom } = event.nativeEvent;
    viewRef.current = { center: [center[0], center[1]], zoom };
  }, []);

  const staleBanner =
    upcomingCount === 0 ? `Dates are from the ${snapshotYear} dataset and may be out of date.` : null;
  const banner = notice ?? staleBanner;

  return (
    <View style={[styles.root, { backgroundColor: colors.mapBg }]}>
      <MapView
        key={scheme /* a theme switch loads the other basemap cleanly */}
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        touchRotate={false}
        touchPitch={false}
        compass={false}
        onPress={() => select(null)}
        onRegionDidChange={onRegionDidChange}
      >
        <Images images={PIN_IMAGES} />
        <Camera
          ref={cameraRef}
          initialViewState={viewRef.current}
          minZoom={1.5}
          maxZoom={16}
        />

        {/* Dotted lines from you to the 10 nearest. Drawn first so pins sit on top. */}
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

        <GeoJSONSource
          ref={sourceRef}
          id="conventions"
          data={conventionFeatures}
          cluster
          clusterRadius={44}
          clusterMaxZoom={9}
          onPress={onSourcePress}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            style={{
              circleColor: colors.brand,
              circleRadius: ['step', ['get', 'point_count'], 18, 10, 23, 30, 29],
              circleStrokeWidth: 3,
              circleStrokeColor: colors.surface,
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textFont: ['Noto Sans Bold'],
              textSize: 14,
              textColor: colors.onBrand,
              textAllowOverlap: true,
              textIgnorePlacement: true,
            }}
          />
          <Layer
            id="saved-ring"
            type="circle"
            filter={['all', ['!', ['has', 'point_count']], ['in', ['get', 'id'], ['literal', savedIds]]]}
            style={{
              circleRadius: 22,
              circleColor: 'rgba(0, 0, 0, 0)',
              circleStrokeWidth: 3.5,
              circleStrokeColor: colors.gold,
            }}
          />
          <Layer
            id="selected-halo"
            type="circle"
            filter={['==', ['get', 'id'], selectedId ?? NO_SELECTION]}
            style={{
              circleRadius: 24,
              circleColor: colors.brandSoft,
              circleStrokeWidth: 3,
              circleStrokeColor: colors.brand,
            }}
          />
          <Layer
            id="pins"
            type="symbol"
            filter={['!', ['has', 'point_count']]}
            style={{
              iconImage: ['case', ['get', 'past'], 'paw-past', 'paw'],
              iconSize: ['case', ['==', ['get', 'id'], selectedId ?? NO_SELECTION], 1.3, 1],
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
              iconAnchor: 'center',
            }}
          />
        </GeoJSONSource>

        {user && (
          <Marker lngLat={[user.longitude, user.latitude]} anchor="center">
            <UserRadar pingKey={radarKey} />
          </Marker>
        )}
      </MapView>

      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <SearchBar
          query={query}
          onChangeQuery={setQuery}
          results={results}
          onSelect={(c) => select(c, true)}
        />
        <View style={styles.row} pointerEvents="box-none">
          {banner ? (
            <View
              style={[styles.banner, { backgroundColor: colors.warnBg }]}
              accessibilityLiveRegion="polite"
            >
              <Text style={[styles.bannerText, { color: colors.warnInk }]}>{banner}</Text>
            </View>
          ) : (
            <View style={styles.spacer} />
          )}
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

      <Sheet mode={mode} bottomInset={sheetInset} onDismiss={dismiss}>
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
            onSelect={(c) => select(c, true)}
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
