export type LatLng = { latitude: number; longitude: number };

export type Convention = LatLng & {
  id: number;
  name: string;
  city: string;
  /** US state/Canadian province code, or a country name for events abroad. */
  state: string;
  /** ISO dates, YYYY-MM-DD */
  startDate: string;
  endDate: string;
  popularityRank: number;
  lastYearAttendance: number | null;
  websiteUrl: string | null;
};
