import { contrastRatio } from '../src/lib/contrast';
import { palettes } from '../src/theme';

const AA = 4.5;

describe.each(['light', 'dark'] as const)('%s palette meets WCAG AA', (scheme) => {
  const c = palettes[scheme];
  it.each([
    ['ink on surface', c.ink, c.surface],
    ['muted on surface', c.muted, c.surface],
    ['brand on surface (text buttons)', c.brand, c.surface],
    ['onBrand on brand (filled buttons)', c.onBrand, c.brand],
    ['warnInk on warnBg (notices)', c.warnInk, c.warnBg],
  ])('%s', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });
});

describe('contrastRatio', () => {
  it('matches the known extremes', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
});
