const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type EventStatus = 'upcoming' | 'past';

/** Local calendar date as YYYY-MM-DD (ISO strings compare correctly as text). */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function eventStatus(endDate: string, today: string = todayISO()): EventStatus {
  return endDate >= today ? 'upcoming' : 'past';
}

function parts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

/** "Jul 3–6, 2025", "Dec 30, 2025 – Jan 2, 2026" */
export function formatDateRange(startISO: string, endISO: string): string {
  const s = parts(startISO);
  const e = parts(endISO);
  if (startISO === endISO) return `${MONTHS[s.m - 1]} ${s.d}, ${s.y}`;
  if (s.y === e.y && s.m === e.m) return `${MONTHS[s.m - 1]} ${s.d}–${e.d}, ${s.y}`;
  if (s.y === e.y) return `${MONTHS[s.m - 1]} ${s.d} – ${MONTHS[e.m - 1]} ${e.d}, ${s.y}`;
  return `${MONTHS[s.m - 1]} ${s.d}, ${s.y} – ${MONTHS[e.m - 1]} ${e.d}, ${e.y}`;
}
