/**
 * FSOS Visual Foundation — Centralized Design Token System
 * Document ID: ECO-20260730-013 / FSOS-R1-FOUNDATION
 * 
 * Philosophy: Personal Engineering Workspace with Calm Industrial Software characteristics.
 * Restrained, confident, technically clear, and object-focused.
 * 
 * Foundation Structure:
 * R1-A — Semantic Design Tokens (Surfaces, Text, Borders, Status, Spacing)
 * R1-B — Typography and Spacing
 * R1-C — Surfaces, Borders and Geometry
 * R1-D — Motion and Interaction
 */

/**
 * R1-A & R1-C Semantic Design Tokens
 */
export const semanticTokens = {
  surfaces: {
    dark: {
      canvas: '#111315',      // L0: Root viewport background
      workspace: '#16191D',   // L1: Working area / section backdrop
      surface: '#1C2026',     // L2: Base content panel / sheet
      raised: '#242A32',      // L3: Elevated cards / modals / active items
      overlay: '#2C333D',     // L4: Popovers / floating menus / tooltips
    },
    light: {
      canvas: '#F8FAFC',      // L0: Root viewport (Slate-50)
      workspace: '#F1F5F9',   // L1: Working area (Slate-100)
      surface: '#FFFFFF',     // L2: Base content panel (Pure White)
      raised: '#FFFFFF',      // L3: Elevated card (Elevated White)
      overlay: '#FFFFFF',     // L4: Popovers / floating menus
    },
  },
  text: {
    dark: {
      primary: '#F3F4F6',     // High contrast reading text (Gray-100)
      secondary: '#94A3B8',   // Structural labels, secondary information (Slate-400)
      muted: '#64748B',       // Metadata, timestamps, placeholders (Slate-500)
      subtle: '#475569',      // Disabled text, de-emphasized hints (Slate-600)
    },
    light: {
      primary: '#0F172A',     // High contrast reading text (Slate-900)
      secondary: '#334155',   // Structural labels, secondary information (Slate-700)
      muted: '#64748B',       // Metadata, timestamps (Slate-500)
      subtle: '#94A3B8',      // Disabled text, de-emphasized hints (Slate-400)
    },
  },
  borders: {
    dark: {
      subtle: 'rgba(43, 50, 58, 0.45)', // Hairline inner dividers
      default: '#2B323A',                // Standard container boundary
      strong: '#3D4754',                 // Emphasized boundary / active focus
    },
    light: {
      subtle: '#F1F5F9',                 // Hairline inner dividers (Slate-100)
      default: '#E2E8F0',                // Standard container boundary (Slate-200)
      strong: '#CBD5E1',                 // Emphasized boundary / active focus (Slate-300)
    },
  },
  status: {
    dark: {
      success: '#7FD4A6',
      successMuted: 'rgba(127, 212, 166, 0.15)',
      warning: '#EFCB7A',
      warningMuted: 'rgba(239, 203, 122, 0.15)',
      danger: '#E98A8A',
      dangerMuted: 'rgba(233, 138, 138, 0.15)',
      info: '#8ECDF7',
      infoMuted: 'rgba(142, 205, 247, 0.15)',
    },
    light: {
      success: '#047857',
      successMuted: '#ECFDF5',
      warning: '#B45309',
      warningMuted: '#FFFBEB',
      danger: '#B91C1C',
      dangerMuted: '#FEF2F2',
      info: '#0369A1',
      infoMuted: '#F0F9FF',
    },
  },
  spacing: {
    xs: '0.25rem',  // 4px - micro token/badge padding, icon gap
    sm: '0.5rem',   // 8px - compact padding, button padding-y
    md: '1rem',     // 16px - standard container padding, grid gap
    lg: '1.5rem',   // 24px - relaxed section padding, modal padding
    xl: '2rem',     // 32px - major region gap, hero spacing
    '2xl': '3rem',  // 48px - viewport margin, primary workspace divider
  },
  geometry: {
    compact: '0.25rem',   // 4px - chips, inline tags, compact controls
    standard: '0.5rem',   // 8px - standard buttons, form inputs, panels
    relaxed: '0.75rem',   // 12px - workspace surfaces, major cards, dialogs
    pill: '9999px',       // Status pills, avatar circles
  },
  typography: {
    display: {
      fontSize: '1.75rem',    // 28px
      lineHeight: '2.125rem', // 34px
      fontWeight: '600',
      letterSpacing: '-0.02em',
    },
    title: {
      fontSize: '1.25rem',    // 20px
      lineHeight: '1.625rem', // 26px
      fontWeight: '600',
      letterSpacing: '-0.015em',
    },
    section: {
      fontSize: '0.9375rem',  // 15px
      lineHeight: '1.375rem', // 22px
      fontWeight: '500',
      letterSpacing: '-0.01em',
    },
    body: {
      fontSize: '0.875rem',   // 14px
      lineHeight: '1.375rem', // 22px
      fontWeight: '400',
      letterSpacing: '0',
    },
    label: {
      fontSize: '0.75rem',    // 12px
      lineHeight: '1rem',     // 16px
      fontWeight: '500',
      letterSpacing: '0.02em',
    },
    caption: {
      fontSize: '0.6875rem',  // 11px
      lineHeight: '0.875rem', // 14px
      fontWeight: '400',
      letterSpacing: '0.01em',
    },
  },
  motion: {
    micro: {
      duration: 0.15,
      ease: [0.2, 0, 0, 1] as [number, number, number, number],
    },
    standard: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
    object: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 28,
      mass: 0.8,
    },
  },
};

/**
 * Backward-compatible single source of truth object
 */
export const designTokens = {
  colors: {
    dark: {
      background: semanticTokens.surfaces.dark.canvas,
      surface: semanticTokens.surfaces.dark.surface,
      card: semanticTokens.surfaces.dark.raised,
      border: semanticTokens.borders.dark.default,
      borderSubtle: semanticTokens.borders.dark.subtle,
      primary: '#8B9DFF',
      primaryHover: '#A3B2FF',
      primaryMuted: '#8B9DFF/15',
      success: semanticTokens.status.dark.success,
      successMuted: semanticTokens.status.dark.successMuted,
      warning: semanticTokens.status.dark.warning,
      warningMuted: semanticTokens.status.dark.warningMuted,
      danger: semanticTokens.status.dark.danger,
      dangerMuted: semanticTokens.status.dark.dangerMuted,
      info: semanticTokens.status.dark.info,
      infoMuted: semanticTokens.status.dark.infoMuted,
      text: {
        primary: semanticTokens.text.dark.primary,
        secondary: semanticTokens.text.dark.secondary,
        muted: semanticTokens.text.dark.muted,
        subtle: semanticTokens.text.dark.subtle,
      },
    },
    light: {
      background: semanticTokens.surfaces.light.workspace,
      surface: semanticTokens.surfaces.light.surface,
      card: semanticTokens.surfaces.light.raised,
      border: semanticTokens.borders.light.strong,
      borderSubtle: semanticTokens.borders.light.default,
      primary: '#4338CA',
      primaryHover: '#3730A3',
      primaryMuted: '#EEF2FF',
      success: semanticTokens.status.light.success,
      successMuted: semanticTokens.status.light.successMuted,
      warning: semanticTokens.status.light.warning,
      warningMuted: semanticTokens.status.light.warningMuted,
      danger: semanticTokens.status.light.danger,
      dangerMuted: semanticTokens.status.light.dangerMuted,
      info: semanticTokens.status.light.info,
      infoMuted: semanticTokens.status.light.infoMuted,
      text: {
        primary: semanticTokens.text.light.primary,
        secondary: semanticTokens.text.light.secondary,
        muted: semanticTokens.text.light.muted,
        subtle: semanticTokens.text.light.subtle,
      },
    },
  },
  spacing: semanticTokens.spacing,
  radius: {
    sm: semanticTokens.geometry.standard,
    md: semanticTokens.geometry.relaxed,
    lg: '1rem',
    full: semanticTokens.geometry.pill,
  },
  shadow: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  },
  transition: {
    fast: '150ms cubic-bezier(0.2, 0, 0, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * R1-D Lightweight Motion Foundation
 * Standardized transition configurations compatible with 'motion/react'.
 */
export const motionPresets = {
  microHover: {
    scale: 1.02,
    transition: {
      duration: semanticTokens.motion.micro.duration,
      ease: semanticTokens.motion.micro.ease,
    },
  },
  microTap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: 'easeOut',
    },
  },
  fadeSlideIn: {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: {
      duration: semanticTokens.motion.standard.duration,
      ease: semanticTokens.motion.standard.ease,
    },
  },
  objectTransition: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.97 },
    transition: semanticTokens.motion.object,
  },
};

/**
 * Utility helper to return theme classes matching the active theme mode
 */
export function getThemeClasses(isDark: boolean) {
  return {
    // Legacy mapping preserved for existing UI
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

    // R1 Semantic surface hierarchy
    canvas: isDark ? 'bg-[#111315]' : 'bg-slate-50',
    workspace: isDark ? 'bg-[#16191D]' : 'bg-slate-100',
    raised: isDark ? 'bg-[#242A32]' : 'bg-white',
    overlay: isDark ? 'bg-[#2C333D]' : 'bg-white',

    // R1 Semantic border hierarchy
    borderDefault: isDark ? 'border-[#2B323A]' : 'border-slate-200',
    borderStrong: isDark ? 'border-[#3D4754]' : 'border-slate-300',

    // R1 Semantic text hierarchy
    textSubtle: isDark ? 'text-slate-600' : 'text-slate-400',
  };
}

