import { useColorScheme } from 'react-native';
import { MAP_STYLES } from './config';

export type Palette = {
  surface: string;
  ink: string;
  muted: string;
  hairline: string;
  brand: string;
  brandSoft: string;
  /** Text/icon color on top of `brand`. */
  onBrand: string;
  me: string;
  warnBg: string;
  warnInk: string;
  gold: string;
  /** Shown behind the map while tiles load. */
  mapBg: string;
};

/** Every text/background pair here is checked against WCAG AA in __tests__/theme.test.ts. */
export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    surface: '#FFFFFF',
    ink: '#1F2937',
    muted: '#4B5563',
    hairline: '#E5E7EB',
    brand: '#6B21A8',
    brandSoft: 'rgba(107, 33, 168, 0.22)',
    onBrand: '#FFFFFF',
    me: '#2563EB',
    warnBg: '#FEF3C7',
    warnInk: '#78350F',
    gold: '#D97706',
    mapBg: '#E5E7EB',
  },
  dark: {
    surface: '#1E2330',
    ink: '#F3F4F6',
    muted: '#C3C8D4',
    hairline: '#374151',
    brand: '#C084FC',
    brandSoft: 'rgba(192, 132, 252, 0.28)',
    onBrand: '#1B0B2E',
    me: '#60A5FA',
    warnBg: '#3B2F0B',
    warnInk: '#FDE68A',
    gold: '#FBBF24',
    mapBg: '#12151C',
  },
};

/** Follows the phone's light/dark setting. */
export function useTheme() {
  const scheme: 'light' | 'dark' = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: palettes[scheme], mapStyle: MAP_STYLES[scheme] };
}
