/**
 * Free vector basemaps (OpenStreetMap data) from OpenFreeMap: no API key, no usage limits on the
 * public instance, commercial use allowed, funded by donations. Their dark style is an unmodified
 * fork of OpenMapTiles "Dark Matter" and is labelled "not yet complete" upstream, so expect to
 * restyle it after launch. Swap these two lines to change provider.
 */
export const MAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

/** Continental US, shown on first launch. */
export const INITIAL_CENTER: [number, number] = [-98.5795, 39.8283]; // [lng, lat]
export const INITIAL_ZOOM = 3;

/** "Where am I" zooms to roughly neighborhood level. */
export const LOCATE_ZOOM = 12.5;
export const NEAREST_COUNT = 10;

/** Bottom sheet resting heights (peek / list / expanded). */
export const SHEET_SNAPS = ['26%', '58%', '90%'] as const;
export const SHEET_PEEK_FRACTION = 0.26;
export const SHEET_LIST_FRACTION = 0.58;

/** Floating bottom bar. */
export const BAR_HEIGHT = 56;
export const BAR_MARGIN = 10;
