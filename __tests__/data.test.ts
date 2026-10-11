import { conventionFeatures, conventions, conventionsById } from '../src/data/conventions';

describe('bundled convention data', () => {
  it('has the full set with unique ids', () => {
    expect(conventions).toHaveLength(100);
    expect(conventionsById.size).toBe(conventions.length);
  });

  it('has valid coordinates and ISO dates, ending on or after they start', () => {
    for (const c of conventions) {
      expect(Math.abs(c.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(c.longitude)).toBeLessThanOrEqual(180);
      expect(c.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.endDate >= c.startDate).toBe(true);
    }
  });

  it('keeps accented names intact (regression: the website DB had mojibake)', () => {
    const cities = conventions.map((c) => c.city);
    expect(cities).toContain('Malmö');
    expect(cities).toContain('São Paulo');
    expect(cities).toContain('Gdańsk');
  });

  it('builds map features as [longitude, latitude]', () => {
    expect(conventionFeatures.features).toHaveLength(conventions.length);
    const first = conventions[0];
    const feature = conventionFeatures.features[0];
    expect(feature.geometry.coordinates).toEqual([first.longitude, first.latitude]);
    expect(feature.properties.id).toBe(first.id);
  });
});
