import { Marker } from '@maplibre/maplibre-react-native';
import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { useReducedMotion } from '../lib/useReducedMotion';
import type { LatLng } from '../types';

const DURATION_MS = 900;
const PAW_IMAGE = require('../../assets/paw.png');
const SAVED_PAW_IMAGE = require('../../assets/paw-saved.png');

/** A paw continuously travels toward the selected convention along its dotted route. */
export function RoutePaw({ from, to, routeKey, saved }: {
  from: LatLng;
  to: LatLng;
  routeKey: number;
  saved: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    setProgress(0);
    let startedAt: number | null = null;
    let frame = 0;
    const step = (now: number) => {
      if (startedAt === null) startedAt = now;
      const next = ((now - startedAt) % DURATION_MS) / DURATION_MS;
      setProgress(next);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [from.latitude, from.longitude, reduceMotion, routeKey, to.latitude, to.longitude]);

  if (reduceMotion) return null;

  // Smooth the movement while staying on the same straight route shown by the dotted line.
  const eased = progress * progress * (3 - 2 * progress);
  const latitude = from.latitude + (to.latitude - from.latitude) * eased;
  const longitude = from.longitude + (to.longitude - from.longitude) * eased;
  const dLng = to.longitude - from.longitude;
  const dLat = to.latitude - from.latitude;
  const bearing = (Math.atan2(dLng * Math.cos((from.latitude * Math.PI) / 180), dLat) * 180) / Math.PI;
  const edgeFade = Math.min(1, progress / 0.08, (1 - progress) / 0.08);

  return (
    <Marker id={`route-paw-${routeKey}`} lngLat={[longitude, latitude]} anchor="center">
      <Image
        source={saved ? SAVED_PAW_IMAGE : PAW_IMAGE}
        resizeMode="contain"
        style={[styles.paw, { opacity: edgeFade, transform: [{ rotate: `${bearing}deg` }] }]}
      />
    </Marker>
  );
}

const styles = StyleSheet.create({ paw: { width: 28, height: 28 } });
