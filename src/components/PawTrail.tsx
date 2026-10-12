import { useEffect, useMemo, useState } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { Marker } from '@maplibre/maplibre-react-native';
import { haversineMiles } from '../lib/geo';
import { useReducedMotion } from '../lib/useReducedMotion';
import type { LatLng } from '../types';

const MIN_STEPS = 8;
const MAX_STEPS = 40;
const TARGET_SPACING_PX = 8;
// At the maximum 40 stamps, the full trail draws in 640 ms.
const STEP_INTERVAL_MS = 16;
const PAW_IMAGE = require('../../assets/paw.png');

/** A compact paw-print trail stamped quickly from the user's position toward the selected con. */
export function PawTrail({ from, to, routeKey, zoom }: { from: LatLng; to: LatLng; routeKey: number; zoom: number }) {
  const reduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(0);

  const { stamps, count } = useMemo(() => {
    const dLng = to.longitude - from.longitude;
    const dLat = to.latitude - from.latitude;
    const bearing = (Math.atan2(dLng * Math.cos((from.latitude * Math.PI) / 180), dLat) * 180) / Math.PI;
    const metersPerPixel = (78271.51696 * Math.max(0.2, Math.cos((from.latitude * Math.PI) / 180))) / 2 ** Math.max(0, zoom);
    const screenLength = (haversineMiles(from, to) * 1609.344) / metersPerPixel;
    const count = Math.max(MIN_STEPS, Math.min(MAX_STEPS, Math.ceil(screenLength / TARGET_SPACING_PX)));
    const stamps = Array.from({ length: count }, (_, index) => {
      const t = (index + 0.5) / count;
      return {
        id: index,
        lngLat: [from.longitude + dLng * t, from.latitude + dLat * t] as [number, number],
        rotation: `${bearing + (index % 2 === 0 ? -14 : 14)}deg`,
      };
    });
    return { stamps, count };
  }, [from, to, zoom]);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(count);
      return;
    }
    setVisibleCount(0);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setVisibleCount(current);
      if (current >= count) clearInterval(timer);
    }, STEP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [routeKey, reduceMotion, count]);

  return (
    <>
      {stamps.slice(0, visibleCount).map(({ id, lngLat, rotation }) => (
        <Marker key={`${routeKey}-${id}`} lngLat={lngLat} anchor="center">
          <PawStamp key={`${routeKey}-${id}-stamp`} rotation={rotation} reduceMotion={reduceMotion} />
        </Marker>
      ))}
    </>
  );
}

function PawStamp({ rotation, reduceMotion }: { rotation: string; reduceMotion: boolean }) {
  const progress = useMemo(() => new Animated.Value(reduceMotion ? 1 : 0), [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    Animated.spring(progress, { toValue: 1, damping: 18, stiffness: 300, useNativeDriver: true }).start();
  }, [progress, reduceMotion]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.78] }),
        transform: [
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) },
          { rotate: rotation },
        ],
      }}
    >
      <Image source={PAW_IMAGE} resizeMode="contain" style={styles.paw} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({ paw: { width: 16, height: 16 } });
