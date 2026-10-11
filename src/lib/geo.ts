import type { LatLng } from '../types';

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance. Within ~0.5% of a WGS84 geodesic, and instant. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** [west, south, east, north] — the order MapLibre's fitBounds expects. */
export function boundsOf(points: LatLng[]): [number, number, number, number] | null {
  if (points.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const p of points) {
    west = Math.min(west, p.longitude);
    east = Math.max(east, p.longitude);
    south = Math.min(south, p.latitude);
    north = Math.max(north, p.latitude);
  }
  return [west, south, east, north];
}
