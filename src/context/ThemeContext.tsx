import React, { createContext, useContext, useEffect, useState } from 'react';
import { NamedTheme, themePalettes } from '../theme/tokens';

export type { NamedTheme };

export const VALID_NAMED_THEMES: readonly NamedTheme[] = [
  'precision',
  'lumen',
  'aether',
  'prism',
  'forge',
  'cairn',
] as const;

export type ThemeMode = NamedTheme;

export function isNamedTheme(value: unknown): value is NamedTheme {
  return typeof value === 'string' && (VALID_NAMED_THEMES as readonly string[]).includes(value);
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
    if (saved === 'lumen') {
      return 'lumen';
    }
    return 'precision';
  });

  // Active theme is directly the selected pilot theme
  const activeTheme: NamedTheme = theme === 'lumen' ? 'lumen' : 'precision';

  // Both Precision and Lumen operate on dark base mode with distinct visual systems
  const effectiveTheme: 'dark' | 'light' = themePalettes[activeTheme]?.baseMode || 'dark';
  const isDark = effectiveTheme === 'dark';

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fso_theme_mode', theme);
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

