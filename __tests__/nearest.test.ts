import { nearestTo, routeFeatures } from '../src/lib/nearest';
import type { Convention } from '../src/types';

const make = (id: number, latitude: number, longitude: number): Convention => ({
  id,
  name: `Con ${id}`,
  city: 'X',
  state: 'Y',
  startDate: '2026-01-01',
  endDate: '2026-01-02',
  latitude,
  longitude,
  popularityRank: id,
  lastYearAttendance: null,
  websiteUrl: null,
});

const me = { latitude: 28.0, longitude: -82.7 };
const list = [make(1, 40.4, -80.0), make(2, 28.5, -81.4), make(3, 30.3, -81.7), make(4, 33.7, -84.4)];

describe('nearestTo', () => {
  it('sorts by distance and respects the count', () => {
    expect(nearestTo(me, list, 3).map((r) => r.convention.id)).toEqual([2, 3, 4]);
  });
  it('returns miles in ascending order', () => {
    const miles = nearestTo(me, list, 4).map((r) => r.miles);
    expect([...miles].sort((a, b) => a - b)).toEqual(miles);
  });
  it('handles count larger than the list', () => expect(nearestTo(me, list, 99)).toHaveLength(4));
});

describe('routeFeatures', () => {
  const routes = routeFeatures(me, nearestTo(me, list, 2));
  it('draws one line per item, user first, as [longitude, latitude]', () => {
    expect(routes.features).toHaveLength(2);
    expect(routes.features[0].geometry.coordinates).toEqual([
      [-82.7, 28.0],
      [-81.4, 28.5],
    ]);
  });
  it('labels each line with its rounded distance', () => {
    expect(routes.features[0].properties.label).toMatch(/^\d+ mi$/);
    expect(routes.features[0].properties.id).toBe(2);
  });
});
