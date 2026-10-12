import Storage from 'expo-sqlite/kv-store';
import type { StyleSpecification } from '@maplibre/maplibre-react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { MAP_STYLES } from './config';
import { customizeDarkMapStyle } from './lib/mapStyle';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'theme-mode:v1';

function loadThemeMode(): ThemeMode {
  try {
    const saved = Storage.getItemSync(THEME_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  } catch {
    return 'system';
  }
}

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

type ThemeValue = {
  mode: ThemeMode;
  scheme: 'light' | 'dark';
  colors: Palette;
  mapStyle: string | StyleSpecification;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(loadThemeMode);
  const [darkStyle, setDarkStyle] = useState<StyleSpecification | null>(null);
  const scheme: 'light' | 'dark' = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  useEffect(() => {
    try {
      Storage.setItemSync(THEME_KEY, mode);
    } catch {
      // The preference still applies for this session if device storage is unavailable.
    }
  }, [mode]);

  useEffect(() => {
    if (scheme !== 'dark' || darkStyle) return;
    let active = true;
    fetch(MAP_STYLES.dark)
      .then((response) => {
        if (!response.ok) throw new Error(`Map style request failed: ${response.status}`);
        return response.json() as Promise<StyleSpecification>;
      })
      .then((style) => {
        if (active) setDarkStyle(customizeDarkMapStyle(style));
      })
      .catch(() => {
        // The original hosted dark style remains the fallback if customization cannot load.
      });
    return () => {
      active = false;
    };
  }, [scheme, darkStyle]);

  const toggleTheme = useCallback(() => {
    setMode((current) => {
      const active = current === 'system' ? scheme : current;
      return active === 'dark' ? 'light' : 'dark';
    });
  }, [scheme]);

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      scheme,
      colors: palettes[scheme],
      mapStyle: scheme === 'dark' ? darkStyle ?? MAP_STYLES.dark : MAP_STYLES.light,
      toggleTheme,
    }),
    [mode, scheme, darkStyle, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Uses the saved light/dark choice, or follows the phone until the user changes it. */
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
