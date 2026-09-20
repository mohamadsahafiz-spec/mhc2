import React, { createContext, useContext, useEffect, useState } from 'react';
import { NamedTheme, themePalettes } from '../theme/tokens';

export type { NamedTheme } from '../theme/tokens';
export type ThemeMode = NamedTheme | 'system' | 'dark' | 'light';

export const VALID_NAMED_THEMES: readonly NamedTheme[] = [
  'precision',
  'lumen',
  'aether',
  'prism',
  'forge',
  'cairn',
] as const;

export function isNamedTheme(value: unknown): value is NamedTheme {
  return typeof value === 'string' && VALID_NAMED_THEMES.includes(value as NamedTheme);
}

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  activeTheme: NamedTheme;
  effectiveTheme: 'dark' | 'light';
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('fso_theme_mode') : null;
    if (saved && (isNamedTheme(saved) || saved === 'system' || saved === 'dark' || saved === 'light')) {
      return saved;
    }
    return 'precision';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Resolve active visual named theme
  const activeTheme: NamedTheme = (() => {
    if (theme === 'system') {
      return systemIsDark ? 'precision' : 'lumen';
    }
    if (theme === 'dark') return 'precision';
    if (theme === 'light') return 'lumen';
    if (isNamedTheme(theme)) return theme;
    return 'precision';
  })();

  // Backward compatibility: determine binary dark/light base mode
  const effectiveTheme: 'dark' | 'light' = themePalettes[activeTheme]?.baseMode || 'dark';
  const isDark = effectiveTheme === 'dark';

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fso_theme_mode', theme);
    }

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Synchronize document.documentElement attributes and classes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      // Authoritative data-theme attribute
      root.setAttribute('data-theme', activeTheme);

      // Backward compatible class toggles for legacy Tailwind dark: variant
      if (effectiveTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [activeTheme, effectiveTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, activeTheme, effectiveTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

