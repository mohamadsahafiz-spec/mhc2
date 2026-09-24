import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { NamedTheme } from '../../theme/tokens';
import { ThemeThumbnail } from '../common/ThemeThumbnail';

interface HeaderThemeSwitchProps {
  activeTheme: NamedTheme;
  onThemeChange: (theme: NamedTheme) => void;
}

interface ThemeOption {
  id: NamedTheme;
  name: string;
  shortLabel: string;
  tooltip: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'precision',
    name: 'Precision',
    shortLabel: 'PRC',
    tooltip: 'Precision — Industrial Graphite & Laser Reticle',
  },
  {
    id: 'lumen',
    name: 'Lumen',
    shortLabel: 'LMN',
    tooltip: 'Lumen — Luminous Obsidian & Cyan Horizon',
  },
  {
    id: 'aero',
    name: 'aero',
    shortLabel: 'AERO',
    tooltip: 'Frutiger Aero — Daylight Sky & Cloud Atmosphere',
  },
];

export const HeaderThemeSwitch: React.FC<HeaderThemeSwitchProps> = ({
  activeTheme,
  onThemeChange,
}) => {
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <div
      role="radiogroup"
      aria-label="Theme Selector"
      className="header-theme-switch-container relative flex items-center p-0.5 rounded-full border border-theme-default select-none transition-all duration-200"
    >
      {THEME_OPTIONS.map((opt) => {
        const isSelected = activeTheme === opt.id;

        return (
          <button
            key={opt.id}
            role="radio"
            type="button"
            aria-checked={isSelected}
            aria-label={opt.tooltip}
            title={opt.tooltip}
            onClick={() => onThemeChange(opt.id)}
            className={`relative z-10 flex items-center justify-center h-6 px-1.5 rounded-full transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] ${
              isSelected ? 'opacity-100' : 'opacity-65 hover:opacity-100'
            }`}
          >
            {/* Sliding Pill Background for Active Theme */}
            {isSelected && (
              <motion.div
                layoutId="header-theme-active-indicator"
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 450, damping: 32 }
                }
                className="absolute inset-0 rounded-full pointer-events-none transition-all"
                style={{
                  boxShadow:
                    opt.id === 'precision'
                      ? '0 0 10px rgba(245,158,11,0.35), inset 0 1px 1px rgba(255,255,255,0.15)'
                      : opt.id === 'lumen'
                      ? '0 0 10px rgba(56,189,248,0.4), inset 0 1px 1px rgba(56,189,248,0.3)'
                      : '0 0 10px rgba(14,165,233,0.45), inset 0 1px 2px rgba(255,255,255,0.95)',
                  border:
                    opt.id === 'aero'
                      ? '1px solid rgba(14,165,233,0.8)'
                      : '1px solid rgba(255,255,255,0.25)',
                }}
              />
            )}

            {/* Visual Micro Pill Content */}
            <div className="relative z-10">
              <ThemeThumbnail
                theme={opt.id}
                size="sm"
                isSelected={isSelected}
                className="w-8.5 h-4.5 rounded-full border-0"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};
