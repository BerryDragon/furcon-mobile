import { estimateTravel } from '../src/lib/travel';

describe('estimateTravel', () => {
  it('short trips: drive only', () => {
    expect(estimateTravel(120)).toEqual({ mode: 'drive', driveCost: 60, flightCost: null });
  });

  it('mid trips: drive or fly, same tiers and rate as the website', () => {
    expect(estimateTravel(305)).toEqual({ mode: 'drive-or-fly', driveCost: 153, flightCost: 200 });
    expect(estimateTravel(1200)).toEqual({ mode: 'drive-or-fly', driveCost: 600, flightCost: 350 });
  });

  it('long domestic trips: fly, no driving cost', () => {
    expect(estimateTravel(2400)).toEqual({ mode: 'fly', driveCost: null, flightCost: 500 });
  });

  it('intercontinental trips: no invented prices', () => {
    expect(estimateTravel(7000)).toEqual({ mode: 'long-haul', driveCost: null, flightCost: null });
  });

  it('tier boundaries', () => {
    expect(estimateTravel(299).mode).toBe('drive');
    expect(estimateTravel(300).flightCost).toBe(200);
    expect(estimateTravel(999).flightCost).toBe(200);
    expect(estimateTravel(1000).flightCost).toBe(350);
    expect(estimateTravel(1500).driveCost).toBe(750);
    expect(estimateTravel(1501).driveCost).toBeNull();
    expect(estimateTravel(3500).flightCost).toBe(500);
    expect(estimateTravel(3501).mode).toBe('long-haul');
  });
});
