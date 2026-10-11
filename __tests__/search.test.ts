import { createSearcher, normalize } from '../src/lib/search';
import type { Convention } from '../src/types';

const make = (id: number, name: string, city: string, state: string, rank: number): Convention => ({
  id,
  name,
  city,
  state,
  startDate: '2026-01-01',
  endDate: '2026-01-03',
  latitude: 1,
  longitude: 1,
  popularityRank: rank,
  lastYearAttendance: null,
  websiteUrl: null,
});

const list = [
  make(1, 'Anthrocon', 'Pittsburgh', 'PA', 1),
  make(2, 'Anthro New England', 'Boston', 'MA', 9),
  make(3, 'FurFest', 'Pittsburgh', 'PA', 5),
  make(4, 'NordicFuzzCon', 'Malmö', 'Sweden', 7),
];
const search = createSearcher(list);

describe('search', () => {
  it('normalizes accents and case', () => expect(normalize('  Malmö ')).toBe('malmo'));

  it('finds accented cities without accents', () => {
    expect(search('malmo').map((c) => c.id)).toEqual([4]);
  });

  it('ranks name-prefix matches before city matches, then by popularity', () => {
    expect(search('anthro').map((c) => c.id)).toEqual([1, 2]);
    expect(search('pittsburgh').map((c) => c.id)).toEqual([1, 3]);
  });

  it('returns nothing for an empty query and respects the limit', () => {
    expect(search('   ')).toEqual([]);
    expect(search('a', 2)).toHaveLength(2);
  });
});
