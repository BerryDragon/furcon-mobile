import { eventStatus, formatDateRange, todayISO } from '../src/lib/dates';

describe('formatDateRange', () => {
  it('same month', () => expect(formatDateRange('2025-07-03', '2025-07-06')).toBe('Jul 3–6, 2025'));
  it('same year, different months', () =>
    expect(formatDateRange('2025-08-29', '2025-09-01')).toBe('Aug 29 – Sep 1, 2025'));
  it('across a year boundary', () =>
    expect(formatDateRange('2025-12-30', '2026-01-02')).toBe('Dec 30, 2025 – Jan 2, 2026'));
  it('single day', () => expect(formatDateRange('2026-03-05', '2026-03-05')).toBe('Mar 5, 2026'));
});

describe('eventStatus', () => {
  it('is upcoming through the last day of the event, past after it', () => {
    expect(eventStatus('2026-10-10', '2026-10-09')).toBe('upcoming');
    expect(eventStatus('2026-10-09', '2026-10-09')).toBe('upcoming');
    expect(eventStatus('2026-10-08', '2026-10-09')).toBe('past');
  });
});

describe('todayISO', () => {
  it('pads month and day', () => expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05'));
});
