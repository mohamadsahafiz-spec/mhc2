/**
 * Centralized Design Token System
 * Document ID: ECO-20260730-013 (v0.3.1)
 * Single Source of Truth for spacing, typography, colors, radii, shadows, and transitions.
 */

export const designTokens = {
  colors: {
    dark: {
      background: '#111315',
      surface: '#1A1D21',
      card: '#20252B',
      border: '#2B323A',
      borderSubtle: '#2B323A/60',
      primary: '#8B9DFF',
      primaryHover: '#A3B2FF',
      primaryMuted: '#8B9DFF/15',
      success: '#7FD4A6',
      successMuted: '#7FD4A6/15',
      warning: '#EFCB7A',
      warningMuted: '#EFCB7A/15',
      danger: '#E98A8A',
      dangerMuted: '#E98A8A/15',
      info: '#8ECDF7',
      infoMuted: '#8ECDF7/15',
      text: {
        primary: '#F3F4F6',
        secondary: '#94A3B8',
        muted: '#64748B',
      },
    },
    light: {
      background: '#F1F5F9', // Surface Level 0: Crisp Slate-100
      surface: '#FFFFFF',    // Surface Level 1: Pure White
      card: '#FFFFFF',       // Surface Level 1: Elevated White
      border: '#CBD5E1',     // Visible crisp border (Slate-300)
      borderSubtle: '#E2E8F0', // Subtle border (Slate-200)
      primary: '#4338CA',    // Indigo-700
      primaryHover: '#3730A3', // Indigo-800
      primaryMuted: '#EEF2FF', // Indigo-50
      success: '#047857',    // Emerald-700
      successMuted: '#ECFDF5', // Emerald-50
      warning: '#B45309',    // Amber-700
      warningMuted: '#FFFBEB', // Amber-50
      danger: '#B91C1C',     // Rose-700
      dangerMuted: '#FEF2F2', // Rose-50
      info: '#0369A1',       // Sky-700
      infoMuted: '#F0F9FF', // Sky-50
      text: {
        primary: '#0F172A',  // Slate-900 (High contrast)
        secondary: '#334155',// Slate-700 (Strong contrast)
        muted: '#64748B',    // Slate-500 (Readable muted)
      },
    },
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
  },
  radius: {
    sm: '0.5rem',  // 8px - rounded-lg
    md: '0.75rem', // 12px - rounded-xl
    lg: '1rem',    // 16px - rounded-2xl
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  },
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Utility helper to return theme classes matching the active theme mode
 */
export function getThemeClasses(isDark: boolean) {
  return {
    bg: isDark ? 'bg-[#111315]' : 'bg-slate-50',
    surface: isDark ? 'bg-[#1A1D21]' : 'bg-white',
    card: isDark ? 'bg-[#20252B]' : 'bg-white',
    border: isDark ? 'border-[#2B323A]' : 'border-slate-200/90',
    borderSubtle: isDark ? 'border-[#2B323A]/60' : 'border-slate-200/60',
    textPrimary: isDark ? 'text-[#F3F4F6]' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-700',
    textMuted: isDark ? 'text-slate-500' : 'text-slate-500',
    primary: isDark ? 'text-[#8B9DFF]' : 'text-indigo-700',
    primaryBg: isDark ? 'bg-[#8B9DFF]' : 'bg-indigo-600',
    primaryBgMuted: isDark ? 'bg-[#8B9DFF]/15' : 'bg-indigo-50',
    primaryBorder: isDark ? 'border-[#8B9DFF]/30' : 'border-indigo-200',
    success: isDark ? 'text-[#7FD4A6]' : 'text-emerald-700',
    successBgMuted: isDark ? 'bg-[#7FD4A6]/10' : 'bg-emerald-50',
    warning: isDark ? 'text-[#EFCB7A]' : 'text-amber-700',
    warningBgMuted: isDark ? 'bg-[#EFCB7A]/10' : 'bg-amber-50',
    danger: isDark ? 'text-[#E98A8A]' : 'text-rose-700',
    dangerBgMuted: isDark ? 'bg-[#E98A8A]/10' : 'bg-rose-50',
    cardContainer: isDark 
      ? 'bg-[#20252B] border-[#2B323A] text-[#F3F4F6]' 
      : 'bg-white border-slate-200/90 text-slate-900 shadow-sm hover:shadow-md transition-shadow',
    surfaceContainer: isDark
      ? 'bg-[#1A1D21] border-[#2B323A]'
      : 'bg-slate-50 border-slate-200 text-slate-900 shadow-2xs',
  };
}
