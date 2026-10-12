import type { Convention } from '../types';

const OFFSET_MILES = 0.32;
const MILES_PER_LATITUDE_DEGREE = 69.0;

/** Nudge exact duplicate map coordinates apart so each convention pin can be tapped. */
export function spreadCoincidentPins(items: Convention[]): Map<number, [number, number]> {
  const groups = new Map<string, Convention[]>();
  for (const convention of items) {
    const key = `${convention.latitude.toFixed(5)},${convention.longitude.toFixed(5)}`;
    const group = groups.get(key) ?? [];
    group.push(convention);
    groups.set(key, group);
  }

  const positions = new Map<number, [number, number]>();
  for (const group of groups.values()) {
    group.sort((a, b) => a.id - b.id);
    if (group.length === 1) {
      const only = group[0];
      positions.set(only.id, [only.longitude, only.latitude]);
      continue;
    }

    const center = group[0];
    const latitudeOffset = OFFSET_MILES / MILES_PER_LATITUDE_DEGREE;
    const longitudeOffset = latitudeOffset / Math.cos((center.latitude * Math.PI) / 180);
    group.forEach((convention, index) => {
      const angle = (2 * Math.PI * index) / group.length - Math.PI / 2;
      positions.set(convention.id, [
        center.longitude + longitudeOffset * Math.cos(angle),
        center.latitude + latitudeOffset * Math.sin(angle),
      ]);
    });
  }

  return positions;
}
