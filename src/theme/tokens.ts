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
 * Multi-Theme Foundation — Named themes: Precision, Lumen, Aether, Prism, Forge, Cairn
 */

export type NamedTheme = 'precision' | 'lumen' | 'aether' | 'prism' | 'forge' | 'cairn';

export interface ThemeVisualGeometry {
  radiusCard: string;
  radiusButton: string;
  radiusModal: string;
  radiusBadge: string;
  radiusInput: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
}

export interface ThemeVisualTypography {
  headingWeight: string;
  headingTracking: string;
  labelWeight: string;
  labelTracking: string;
  labelTransform?: 'none' | 'uppercase';
}

export interface ThemeVisualAtmosphere {
  canvasBg: string;
  backdrop: string;
  shadowCard: string;
  shadowModal: string;
  shadowPopover: string;
  glowAccent: string;
  borderWidth: string;
}

export interface ThemeColorPalette {
  name: string;
  baseMode: 'dark' | 'light';
  canvas: string;
  workspace: string;
  surface: string;
  raised: string;
  overlay: string;
  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  focus: string;
  status: {
    success: string;
    successMuted: string;
    warning: string;
    warningMuted: string;
    danger: string;
    dangerMuted: string;
    info: string;
    infoMuted: string;
  };
  shadow: string;
  glow: string;
  geometry: ThemeVisualGeometry;
  typography: ThemeVisualTypography;
  atmosphere: ThemeVisualAtmosphere;
}

/**
 * Multi-Theme Foundation Palettes (Semantic Token Sets)
 * Visual identities for Precision, Lumen, Aether, Prism, Forge, and Cairn.
 */
export const themePalettes: Record<NamedTheme, ThemeColorPalette> = {
  precision: {
    name: 'Precision',
    baseMode: 'dark',
    canvas: '#111315',
    workspace: '#16191D',
    surface: '#1C2026',
    raised: '#242A32',
    overlay: '#2C333D',
    borderSubtle: 'rgba(43, 50, 58, 0.45)',
    borderDefault: '#2B323A',
    borderStrong: '#3D4754',
    textPrimary: '#F3F4F6',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textSubtle: '#475569',
    accent: '#8B9DFF',
    accentHover: '#A3B2FF',
    accentMuted: 'rgba(139, 157, 255, 0.15)',
    focus: '#8B9DFF',
    status: {
      success: '#7FD4A6',
      successMuted: 'rgba(127, 212, 166, 0.15)',
      warning: '#EFCB7A',
      warningMuted: 'rgba(239, 203, 122, 0.15)',
      danger: '#E98A8A',
      dangerMuted: 'rgba(233, 138, 138, 0.15)',
      info: '#8ECDF7',
      infoMuted: 'rgba(142, 205, 247, 0.15)',
    },
    shadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
    glow: 'none',
    geometry: {
      radiusCard: '0.75rem',     // 12px
      radiusButton: '0.5rem',     // 8px
      radiusModal: '1rem',        // 16px
      radiusBadge: '0.25rem',     // 4px
      radiusInput: '0.5rem',      // 8px
      radiusSm: '0.375rem',
      radiusMd: '0.5rem',
      radiusLg: '0.75rem',
    },
    typography: {
      headingWeight: '600',
      headingTracking: '-0.015em',
      labelWeight: '500',
      labelTracking: '0.02em',
      labelTransform: 'none',
    },
    atmosphere: {
      canvasBg: '#111315',
      backdrop: 'none',
      shadowCard: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      shadowModal: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
      shadowPopover: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      glowAccent: 'none',
      borderWidth: '1px',
    },
  },
  lumen: {
    name: 'Lumen',
    baseMode: 'dark',
    canvas: '#070A0F',
    workspace: '#0B0F17',
    surface: '#0E141F',
    raised: '#141C2B',
    overlay: '#1B2638',
    borderSubtle: 'rgba(56, 189, 248, 0.14)',
    borderDefault: 'rgba(56, 189, 248, 0.22)',
    borderStrong: 'rgba(56, 189, 248, 0.45)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textSubtle: '#475569',
    accent: '#38BDF8',
    accentHover: '#7DD3FC',
    accentMuted: 'rgba(56, 189, 248, 0.15)',
    focus: '#38BDF8',
    status: {
      success: '#34D399',
      successMuted: 'rgba(52, 211, 153, 0.15)',
      warning: '#FBBF24',
      warningMuted: 'rgba(251, 191, 36, 0.15)',
      danger: '#F87171',
      dangerMuted: 'rgba(248, 113, 113, 0.15)',
      info: '#38BDF8',
      infoMuted: 'rgba(56, 189, 248, 0.15)',
    },
    shadow: 'inset 0 1px 0 0 rgba(186, 230, 253, 0.22), 0 0 24px -4px rgba(56, 189, 248, 0.10), 0 12px 32px -4px rgba(0, 0, 0, 0.75)',
    glow: '0 0 18px rgba(56, 189, 248, 0.45)',
    geometry: {
      radiusCard: '0.875rem',    // 14px
      radiusButton: '0.625rem',   // 10px
      radiusModal: '1.125rem',    // 18px
      radiusBadge: '0.375rem',    // 6px
      radiusInput: '0.625rem',    // 10px
      radiusSm: '0.375rem',
      radiusMd: '0.625rem',
      radiusLg: '0.875rem',
    },
    typography: {
      headingWeight: '600',
      headingTracking: '-0.025em',
      labelWeight: '500',
      labelTracking: '0.04em',
      labelTransform: 'none',
    },
    atmosphere: {
      canvasBg: 'radial-gradient(1100px 580px at 50% -80px, rgba(38, 70, 112, 0.38) 0%, rgba(14, 24, 38, 0.18) 50%, transparent 100%), radial-gradient(1300px 700px at 50% calc(100% + 100px), rgba(14, 165, 233, 0.14) 0%, transparent 65%), #070A0F',
      backdrop: 'blur(12px)',
      shadowCard: 'inset 0 1px 0 0 rgba(186, 230, 253, 0.22), 0 0 24px -4px rgba(56, 189, 248, 0.10), 0 12px 32px -4px rgba(0, 0, 0, 0.75)',
      shadowModal: 'inset 0 1px 0 0 rgba(186, 230, 253, 0.35), 0 0 45px -5px rgba(56, 189, 248, 0.28), 0 30px 60px -10px rgba(0, 0, 0, 0.85)',
      shadowPopover: 'inset 0 1px 0 0 rgba(186, 230, 253, 0.25), 0 0 24px -3px rgba(56, 189, 248, 0.20), 0 14px 28px -4px rgba(0, 0, 0, 0.65)',
      glowAccent: '0 0 18px rgba(56, 189, 248, 0.45)',
      borderWidth: '1px',
    },
  },
  aether: {
    name: 'Aether',
    baseMode: 'light',
    canvas: '#EEF2F6',
    workspace: '#E3E8EF',
    surface: 'rgba(255, 255, 255, 0.88)',
    raised: 'rgba(248, 250, 252, 0.95)',
    overlay: '#FFFFFF',
    borderSubtle: 'rgba(148, 163, 184, 0.28)',
    borderDefault: 'rgba(203, 213, 225, 0.85)',
    borderStrong: '#94A3B8',
    textPrimary: '#1E293B',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textSubtle: '#94A3B8',
    accent: '#6366F1',
    accentHover: '#4F46E5',
    accentMuted: 'rgba(99, 102, 241, 0.12)',
    focus: '#6366F1',
    status: {
      success: '#059669',
      successMuted: 'rgba(5, 150, 105, 0.12)',
      warning: '#D97706',
      warningMuted: 'rgba(217, 119, 6, 0.12)',
      danger: '#DC2626',
      dangerMuted: 'rgba(220, 38, 38, 0.12)',
      info: '#2563EB',
      infoMuted: 'rgba(37, 99, 235, 0.12)',
    },
    shadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 0 1px rgba(148, 163, 184, 0.3)',
    glow: '0 0 12px rgba(99, 102, 241, 0.18)',
    geometry: {
      radiusCard: '1.125rem',    // 18px
      radiusButton: '0.75rem',    // 12px
      radiusModal: '1.375rem',    // 22px
      radiusBadge: '0.5rem',      // 8px
      radiusInput: '0.75rem',     // 12px
      radiusSm: '0.5rem',
      radiusMd: '0.75rem',
      radiusLg: '1.125rem',
    },
    typography: {
      headingWeight: '600',
      headingTracking: '-0.01em',
      labelWeight: '500',
      labelTracking: '0.01em',
      labelTransform: 'none',
    },
    atmosphere: {
      canvasBg: 'radial-gradient(130% 100% at 50% 0%, #FFFFFF 0%, #EEF2F6 60%, #E2E8F0 100%)',
      backdrop: 'blur(12px)',
      shadowCard: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 0 1px rgba(99, 102, 241, 0.15)',
      shadowModal: '0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 0 1px rgba(99, 102, 241, 0.2)',
      shadowPopover: '0 12px 28px -4px rgba(15, 23, 42, 0.10)',
      glowAccent: '0 0 14px rgba(99, 102, 241, 0.22)',
      borderWidth: '1px',
    },
  },
  prism: {
    name: 'Prism',
    baseMode: 'light',
    canvas: '#FAF9F6',
    workspace: '#F4F1EB',
    surface: '#FFFFFF',
    raised: '#FFFFFF',
    overlay: '#FFFFFF',
    borderSubtle: '#ECE7DF',
    borderDefault: '#DDD7CD',
    borderStrong: '#BDB5A6',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#6B7280',
    textSubtle: '#9CA3AF',
    accent: '#0284C7',
    accentHover: '#0369A1',
    accentMuted: 'rgba(2, 132, 199, 0.10)',
    focus: '#0284C7',
    status: {
      success: '#16A34A',
      successMuted: 'rgba(22, 163, 74, 0.10)',
      warning: '#D97706',
      warningMuted: 'rgba(217, 119, 6, 0.10)',
      danger: '#DC2626',
      dangerMuted: 'rgba(220, 38, 38, 0.10)',
      info: '#0284C7',
      infoMuted: 'rgba(2, 132, 199, 0.10)',
    },
    shadow: '0 2px 8px -1px rgba(0, 0, 0, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
    glow: 'none',
    geometry: {
      radiusCard: '0.5rem',      // 8px
      radiusButton: '0.375rem',   // 6px
      radiusModal: '0.625rem',    // 10px
      radiusBadge: '0.25rem',     // 4px
      radiusInput: '0.375rem',    // 6px
      radiusSm: '0.25rem',
      radiusMd: '0.375rem',
      radiusLg: '0.5rem',
    },
    typography: {
      headingWeight: '700',
      headingTracking: '-0.025em',
      labelWeight: '600',
      labelTracking: '0.04em',
      labelTransform: 'uppercase',
    },
    atmosphere: {
      canvasBg: '#FAF9F6',
      backdrop: 'none',
      shadowCard: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
      shadowModal: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      shadowPopover: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
      glowAccent: 'none',
      borderWidth: '1px',
    },
  },
  forge: {
    name: 'Forge',
    baseMode: 'dark',
    canvas: '#100F0E',
    workspace: '#181614',
    surface: '#211D19',
    raised: '#2C2621',
    overlay: '#38312A',
    borderSubtle: 'rgba(245, 158, 11, 0.16)',
    borderDefault: '#3D352D',
    borderStrong: '#5A4E42',
    textPrimary: '#F5F2ED',
    textSecondary: '#A8A199',
    textMuted: '#78726A',
    textSubtle: '#524D46',
    accent: '#F59E0B',
    accentHover: '#FBBF24',
    accentMuted: 'rgba(245, 158, 11, 0.15)',
    focus: '#F59E0B',
    status: {
      success: '#34D399',
      successMuted: 'rgba(52, 211, 153, 0.15)',
      warning: '#F59E0B',
      warningMuted: 'rgba(245, 158, 11, 0.15)',
      danger: '#F87171',
      dangerMuted: 'rgba(248, 113, 113, 0.15)',
      info: '#60A5FA',
      infoMuted: 'rgba(96, 165, 250, 0.15)',
    },
    shadow: '0 6px 24px -4px rgba(0, 0, 0, 0.65), 0 0 1px rgba(245, 158, 11, 0.2)',
    glow: '0 0 16px rgba(245, 158, 11, 0.20)',
    geometry: {
      radiusCard: '0.375rem',    // 6px
      radiusButton: '0.25rem',    // 4px
      radiusModal: '0.5rem',      // 8px
      radiusBadge: '0.1875rem',   // 3px
      radiusInput: '0.25rem',     // 4px
      radiusSm: '0.1875rem',
      radiusMd: '0.25rem',
      radiusLg: '0.375rem',
    },
    typography: {
      headingWeight: '600',
      headingTracking: '-0.01em',
      labelWeight: '600',
      labelTracking: '0.05em',
      labelTransform: 'none',
    },
    atmosphere: {
      canvasBg: 'linear-gradient(180deg, #181512 0%, #100F0E 40%, #0D0C0B 100%)',
      backdrop: 'none',
      shadowCard: '0 4px 16px -2px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      shadowModal: '0 20px 30px -8px rgba(0, 0, 0, 0.85), 0 0 1px rgba(245, 158, 11, 0.3)',
      shadowPopover: '0 8px 20px -3px rgba(0, 0, 0, 0.7)',
      glowAccent: '0 0 14px rgba(245, 158, 11, 0.25)',
      borderWidth: '1px',
    },
  },
  cairn: {
    name: 'Cairn',
    baseMode: 'dark',
    canvas: '#0D1011',
    workspace: '#121617',
    surface: '#192021',
    raised: '#212A2C',
    overlay: '#2A3638',
    borderSubtle: 'rgba(16, 185, 129, 0.12)',
    borderDefault: '#283435',
    borderStrong: '#3D4E50',
    textPrimary: '#ECF2F1',
    textSecondary: '#93A2A1',
    textMuted: '#637271',
    textSubtle: '#44504F',
    accent: '#10B981',
    accentHover: '#34D399',
    accentMuted: 'rgba(16, 185, 129, 0.15)',
    focus: '#10B981',
    status: {
      success: '#10B981',
      successMuted: 'rgba(16, 185, 129, 0.15)',
      warning: '#FBBF24',
      warningMuted: 'rgba(251, 191, 36, 0.15)',
      danger: '#F87171',
      dangerMuted: 'rgba(248, 113, 113, 0.15)',
      info: '#38BDF8',
      infoMuted: 'rgba(56, 189, 248, 0.15)',
    },
    shadow: '0 6px 20px -3px rgba(0, 0, 0, 0.6), 0 0 1px rgba(16, 185, 129, 0.15)',
    glow: '0 0 14px rgba(16, 185, 129, 0.18)',
    geometry: {
      radiusCard: '0.75rem',     // 12px
      radiusButton: '0.5rem',     // 8px
      radiusModal: '0.875rem',    // 14px
      radiusBadge: '0.25rem',     // 4px
      radiusInput: '0.5rem',      // 8px
      radiusSm: '0.25rem',
      radiusMd: '0.5rem',
      radiusLg: '0.75rem',
    },
    typography: {
      headingWeight: '500',
      headingTracking: '0',
      labelWeight: '500',
      labelTracking: '0.02em',
      labelTransform: 'none',
    },
    atmosphere: {
      canvasBg: 'radial-gradient(140% 100% at 50% -20%, #141C1D 0%, #0D1011 50%, #080A0A 100%)',
      backdrop: 'none',
      shadowCard: '0 6px 20px -3px rgba(0, 0, 0, 0.65), 0 0 1px rgba(16, 185, 129, 0.15)',
      shadowModal: '0 24px 40px -10px rgba(0, 0, 0, 0.8), 0 0 1px rgba(16, 185, 129, 0.25)',
      shadowPopover: '0 10px 22px -4px rgba(0, 0, 0, 0.65)',
      glowAccent: '0 0 12px rgba(16, 185, 129, 0.22)',
      borderWidth: '1px',
    },
  },
};

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

export * from './motion';

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

