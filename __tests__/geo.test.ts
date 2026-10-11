import { boundsOf, haversineMiles } from '../src/lib/geo';

// Reference values from geopy's WGS84 geodesic. Haversine should land within 0.5%.
const cases: [string, [number, number], [number, number], number][] = [
  ['Pittsburgh to Philadelphia', [40.4406, -79.9959], [39.9526, -75.1652], 257.76],
  ['Tampa to Pittsburgh', [27.9506, -82.4572], [40.4467, -80.0028], 872.61],
  ['Tampa to Tokyo', [27.9506, -82.4572], [35.6762, 139.6503], 7268.79],
];

describe('haversineMiles', () => {
  it.each(cases)('%s is within 0.5%% of the geodesic', (_name, a, b, expected) => {
    const miles = haversineMiles(
      { latitude: a[0], longitude: a[1] },
      { latitude: b[0], longitude: b[1] },
    );
    expect(Math.abs(miles - expected) / expected).toBeLessThan(0.005);
  });

  it('is zero for the same point and symmetric', () => {
    const a = { latitude: 40, longitude: -80 };
    const b = { latitude: 41, longitude: -75 };
    expect(haversineMiles(a, a)).toBe(0);
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 9);
  });
});

describe('boundsOf', () => {
  it('returns [west, south, east, north]', () => {
    const box = boundsOf([
      { latitude: 10, longitude: -100 },
      { latitude: 30, longitude: -80 },
      { latitude: 20, longitude: -90 },
    ]);
    expect(box).toEqual([-100, 10, -80, 30]);
  });

  it('returns null for no points', () => {
    expect(boundsOf([])).toBeNull();
  });
});
