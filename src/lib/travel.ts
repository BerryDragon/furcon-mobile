/**
 * Rough travel-cost estimate. Same rules as the website ($0.50/mile driving,
 * flight tiers by distance), in ONE place instead of three, plus two guards the
 * website lacked: no "driving cost" for trips nobody drives, and no made-up
 * flight price for intercontinental trips.
 */
export const DRIVE_COST_PER_MILE = 0.5;
export const DRIVE_MAX_MILES = 1500;
export const FLIGHT_MAX_MILES = 3500;

export type TravelMode = 'drive' | 'drive-or-fly' | 'fly' | 'long-haul';

export type TravelEstimate = {
  mode: TravelMode;
  /** Dollars, or null when the trip is too far to drive. */
  driveCost: number | null;
  /** Dollars, or null when driving is the obvious choice or the trip is too far to estimate. */
  flightCost: number | null;
};

export function estimateTravel(miles: number): TravelEstimate {
  const driveCost = miles <= DRIVE_MAX_MILES ? Math.round(miles * DRIVE_COST_PER_MILE) : null;

  if (miles < 300) return { mode: 'drive', driveCost, flightCost: null };
  if (miles > FLIGHT_MAX_MILES) return { mode: 'long-haul', driveCost: null, flightCost: null };

  const flightCost = miles < 1000 ? 200 : miles < 2000 ? 350 : 500;
  return {
    mode: miles <= DRIVE_MAX_MILES ? 'drive-or-fly' : 'fly',
    driveCost,
    flightCost,
  };
}
