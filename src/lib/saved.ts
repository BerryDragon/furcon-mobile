/** Reads the saved-id list back from storage. Never throws; drops junk, duplicates, and unknown ids. */
export function parseSaved(raw: string | null, isKnown: (id: number) => boolean): number[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const seen = new Set<number>();
    const out: number[] = [];
    for (const item of value) {
      if (typeof item === 'number' && Number.isInteger(item) && isKnown(item) && !seen.has(item)) {
        seen.add(item);
        out.push(item);
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Newest save goes first. */
export function toggleSaved(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
}
