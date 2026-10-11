import type { Convention } from '../types';

/** Lowercase and strip accents so "malmo" finds "Malmö". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Builds the search index once (at startup), so each keystroke only does cheap
 * string checks. Results: name-prefix matches first, then name matches, then
 * city/state matches; ties broken by popularity.
 */
export function createSearcher(list: Convention[]) {
  const index = list.map((convention) => ({
    convention,
    name: normalize(convention.name),
    place: normalize(`${convention.city} ${convention.state}`),
  }));

  return function search(query: string, limit = 6): Convention[] {
    const q = normalize(query);
    if (q.length === 0) return [];

    const scored: { convention: Convention; score: number }[] = [];
    for (const entry of index) {
      let score = -1;
      if (entry.name.startsWith(q)) score = 0;
      else if (entry.name.includes(q)) score = 1;
      else if (entry.place.includes(q)) score = 2;
      if (score >= 0) scored.push({ convention: entry.convention, score });
    }
    scored.sort(
      (a, b) => a.score - b.score || a.convention.popularityRank - b.convention.popularityRank,
    );
    return scored.slice(0, limit).map((s) => s.convention);
  };
}
