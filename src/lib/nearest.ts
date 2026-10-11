import type { Convention, LatLng } from '../types';
import { haversineMiles } from './geo';

export type Ranked = { convention: Convention; miles: number };

export type RouteCollection = GeoJSON.FeatureCollection<GeoJSON.LineString, { id: number; label: string }>;

export const EMPTY_ROUTES: RouteCollection = { type: 'FeatureCollection', features: [] };

export function nearestTo(from: LatLng, list: Convention[], count: number): Ranked[] {
  return list
    .map((convention) => ({ convention, miles: haversineMiles(from, convention) }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, count);
}

/** One line from the user to each convention, labelled with its distance (for the dotted lines). */
export function routeFeatures(from: LatLng, items: Ranked[]): RouteCollection {
  return {
    type: 'FeatureCollection',
    features: items.map(({ convention, miles }) => ({
      type: 'Feature',
      id: convention.id,
      properties: { id: convention.id, label: `${Math.round(miles).toLocaleString('en-US')} mi` },
      geometry: {
        type: 'LineString',
        coordinates: [
          [from.longitude, from.latitude],
          [convention.longitude, convention.latitude],
        ],
      },
    })),
  };
}
