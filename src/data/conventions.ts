import type { Convention } from '../types';
import { eventStatus, todayISO } from '../lib/dates';
import { spreadCoincidentPins } from '../lib/pinPositions';
import seed from './conventions.seed.json';

/**
 * Everything the map needs is built ONCE, at startup, from data bundled in the
 * app: no network wait before first paint, nothing recomputed per frame.
 * (Later milestones refresh this from the API and cache it on the device.)
 */
const isValid = (c: Convention) =>
  Number.isFinite(c.latitude) &&
  Number.isFinite(c.longitude) &&
  !(c.latitude === 0 && c.longitude === 0);

export const conventions: Convention[] = (seed.conventions as Convention[]).filter(isValid);

export const conventionsById = new Map<number, Convention>(conventions.map((c) => [c.id, c]));
export const pinCoordinatesById = spreadCoincidentPins(conventions);

export const snapshotYear: string = seed.meta.generatedAt.slice(0, 4);

const today = todayISO();

export const upcomingCount = conventions.filter(
  (c) => eventStatus(c.endDate, today) === 'upcoming',
).length;

/** What "Near me" should aim at: upcoming events if there are any, else everything. */
export const nearTargets: Convention[] =
  upcomingCount > 0 ? conventions.filter((c) => eventStatus(c.endDate, today) === 'upcoming') : conventions;

/** Lean on purpose: the native map only receives the two fields it renders by. */
export const conventionFeatures: GeoJSON.FeatureCollection<
  GeoJSON.Point,
  { id: number; past: boolean }
> = {
  type: 'FeatureCollection',
  features: conventions.map((c) => ({
    type: 'Feature',
    id: c.id,
    geometry: { type: 'Point', coordinates: pinCoordinatesById.get(c.id)! },
    properties: { id: c.id, past: eventStatus(c.endDate, today) === 'past' },
  })),
};
