import { describe, it, expect } from 'vitest';
import { semanticTokens, designTokens, getThemeClasses, motionPresets, themePalettes, NamedTheme } from './tokens';

describe('FSOS R1 Visual Foundation Tokens', () => {
  describe('Multi-Theme Foundation: Named Themes', () => {
    const requiredThemes: NamedTheme[] = ['precision', 'lumen', 'aether', 'prism', 'forge', 'cairn'];

    it('defines complete palettes for all 6 target named themes', () => {
      for (const theme of requiredThemes) {
        const palette = themePalettes[theme];
        expect(palette, `Palette for ${theme} should exist`).toBeDefined();
        expect(palette.name).toBeDefined();
        expect(palette.canvas).toBeDefined();
        expect(palette.workspace).toBeDefined();
        expect(palette.surface).toBeDefined();
        expect(palette.raised).toBeDefined();
        expect(palette.overlay).toBeDefined();
        expect(palette.borderSubtle).toBeDefined();
        expect(palette.borderDefault).toBeDefined();
        expect(palette.borderStrong).toBeDefined();
        expect(palette.textPrimary).toBeDefined();
        expect(palette.textSecondary).toBeDefined();
        expect(palette.textMuted).toBeDefined();
        expect(palette.textSubtle).toBeDefined();
        expect(palette.accent).toBeDefined();
        expect(palette.accentHover).toBeDefined();
        expect(palette.accentMuted).toBeDefined();
        expect(palette.focus).toBeDefined();
        expect(palette.shadow).toBeDefined();
        expect(palette.glow).toBeDefined();
        expect(palette.status.success).toBeDefined();
        expect(palette.status.warning).toBeDefined();
        expect(palette.status.danger).toBeDefined();
        expect(palette.status.info).toBeDefined();
        expect(['dark', 'light']).toContain(palette.baseMode);
      }
    });

    it('keeps Precision mapped to baseline industrial dark palette', () => {
      expect(themePalettes.precision.baseMode).toBe('dark');
      expect(themePalettes.precision.canvas).toBe('#111315');
      expect(themePalettes.precision.surface).toBe('#1C2026');
      expect(themePalettes.precision.textPrimary).toBe('#F3F4F6');
    });

    it('configures Lumen with deep obsidian charcoal and luminous cyan depth', () => {
      expect(themePalettes.lumen.baseMode).toBe('dark');
      expect(themePalettes.lumen.canvas).toBe('#0A0D12');
      expect(themePalettes.lumen.accent).toBe('#38BDF8');
    });

    it('configures Aether with soft pearl frosted surfaces and refracted violet-indigo', () => {
      expect(themePalettes.aether.baseMode).toBe('light');
      expect(themePalettes.aether.canvas).toBe('#EEF2F6');
      expect(themePalettes.aether.accent).toBe('#6366F1');
    });

    it('configures Prism with light editorial alabaster and sapphire accents', () => {
      expect(themePalettes.prism.baseMode).toBe('light');
      expect(themePalettes.prism.canvas).toBe('#FAF9F6');
      expect(themePalettes.prism.accent).toBe('#0284C7');
    });

    it('configures Forge with deep industrial graphite and warm amber accents', () => {
      expect(themePalettes.forge.baseMode).toBe('dark');
      expect(themePalettes.forge.canvas).toBe('#100F0E');
      expect(themePalettes.forge.accent).toBe('#F59E0B');
    });

    it('configures Cairn with basalt mineral canvas and emerald accents', () => {
      expect(themePalettes.cairn.baseMode).toBe('dark');
      expect(themePalettes.cairn.canvas).toBe('#0D1011');
      expect(themePalettes.cairn.accent).toBe('#10B981');
    });

    it('defines distinct visual geometry, typography, and atmosphere across all 6 named themes', () => {
      for (const theme of requiredThemes) {
        const palette = themePalettes[theme];
        expect(palette.geometry, `Geometry for ${theme} should exist`).toBeDefined();
        expect(palette.geometry.radiusCard).toBeDefined();
        expect(palette.geometry.radiusButton).toBeDefined();
        expect(palette.geometry.radiusModal).toBeDefined();
        expect(palette.geometry.radiusBadge).toBeDefined();
        expect(palette.geometry.radiusInput).toBeDefined();

        expect(palette.typography, `Typography for ${theme} should exist`).toBeDefined();
        expect(palette.typography.headingWeight).toBeDefined();
        expect(palette.typography.headingTracking).toBeDefined();
        expect(palette.typography.labelWeight).toBeDefined();
        expect(palette.typography.labelTracking).toBeDefined();

        expect(palette.atmosphere, `Atmosphere for ${theme} should exist`).toBeDefined();
        expect(palette.atmosphere.canvasBg).toBeDefined();
        expect(palette.atmosphere.backdrop).toBeDefined();
        expect(palette.atmosphere.shadowCard).toBeDefined();
        expect(palette.atmosphere.shadowModal).toBeDefined();
        expect(palette.atmosphere.shadowPopover).toBeDefined();
        expect(palette.atmosphere.glowAccent).toBeDefined();
        expect(palette.atmosphere.borderWidth).toBeDefined();
      }
    });

    it('enforces distinct geometry language between themes (e.g. Forge is compact/angular, Aether is refined/soft)', () => {
      expect(themePalettes.forge.geometry.radiusCard).toBe('8px');
      expect(themePalettes.forge.geometry.radiusButton).toBe('6px');

      expect(themePalettes.aether.geometry.radiusCard).toBe('16px');
      expect(themePalettes.aether.geometry.radiusButton).toBe('12px');

      expect(themePalettes.prism.geometry.radiusCard).toBe('6px');
      expect(themePalettes.prism.typography.headingWeight).toBe('700');
    });
  });

  describe('R1-A & R1-C: Surfaces', () => {
    it('defines complete semantic surfaces for both dark and light themes', () => {
      const surfaceKeys = ['canvas', 'workspace', 'surface', 'raised', 'overlay'] as const;
      
      for (const key of surfaceKeys) {
        expect(semanticTokens.surfaces.dark[key]).toBeDefined();
        expect(typeof semanticTokens.surfaces.dark[key]).toBe('string');
        expect(semanticTokens.surfaces.light[key]).toBeDefined();
        expect(typeof semanticTokens.surfaces.light[key]).toBe('string');
      }
    });
  });

  describe('R1-A: Text Hierarchy', () => {
    it('defines complete semantic text colors for dark and light themes', () => {
      const textKeys = ['primary', 'secondary', 'muted', 'subtle'] as const;

      for (const key of textKeys) {
        expect(semanticTokens.text.dark[key]).toBeDefined();
        expect(typeof semanticTokens.text.dark[key]).toBe('string');
        expect(semanticTokens.text.light[key]).toBeDefined();
        expect(typeof semanticTokens.text.light[key]).toBe('string');
      }
    });
  });

  describe('R1-A & R1-C: Borders Hierarchy', () => {
    it('defines subtle, default, and strong borders for both themes', () => {
      const borderKeys = ['subtle', 'default', 'strong'] as const;

      for (const key of borderKeys) {
        expect(semanticTokens.borders.dark[key]).toBeDefined();
        expect(typeof semanticTokens.borders.dark[key]).toBe('string');
        expect(semanticTokens.borders.light[key]).toBeDefined();
        expect(typeof semanticTokens.borders.light[key]).toBe('string');
      }
    });
  });

  describe('R1-A: Status Meaning', () => {
    it('defines success, warning, danger, and info colors with muted variants', () => {
      const statuses = ['success', 'warning', 'danger', 'info'] as const;

      for (const status of statuses) {
        expect(semanticTokens.status.dark[status]).toBeDefined();
        expect(semanticTokens.status.dark[`${status}Muted` as const]).toBeDefined();
        expect(semanticTokens.status.light[status]).toBeDefined();
        expect(semanticTokens.status.light[`${status}Muted` as const]).toBeDefined();
      }
    });
  });

  describe('R1-B: Spacing Scale', () => {
    it('defines consistent spacing rhythm from xs through 2xl', () => {
      const spacingKeys = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

      for (const key of spacingKeys) {
        expect(semanticTokens.spacing[key]).toBeDefined();
        expect(typeof semanticTokens.spacing[key]).toBe('string');
      }
    });
  });

  describe('R1-B: Typography Hierarchy', () => {
    it('defines display, title, section, body, label, and caption typography tokens', () => {
      const roles = ['display', 'title', 'section', 'body', 'label', 'caption'] as const;

      for (const role of roles) {
        const typo = semanticTokens.typography[role];
        expect(typo).toBeDefined();
        expect(typo.fontSize).toBeDefined();
        expect(typo.lineHeight).toBeDefined();
        expect(typo.fontWeight).toBeDefined();
        expect(typo.letterSpacing).toBeDefined();
      }
    });
  });

  describe('R1-C: Geometry Scale', () => {
    it('defines compact, standard, relaxed, and pill radii', () => {
      const geometryKeys = ['compact', 'standard', 'relaxed', 'pill'] as const;

      for (const key of geometryKeys) {
        expect(semanticTokens.geometry[key]).toBeDefined();
        expect(typeof semanticTokens.geometry[key]).toBe('string');
      }
    });
  });

  describe('R1-D: Motion Foundation', () => {
    it('defines micro, standard, and object motion categories', () => {
      expect(semanticTokens.motion.micro.duration).toBeLessThanOrEqual(0.2);
      expect(semanticTokens.motion.standard.duration).toBeLessThanOrEqual(0.3);
      expect(semanticTokens.motion.object.type).toBe('spring');
    });

    it('provides reusable motion presets for interactions', () => {
      expect(motionPresets.microHover).toBeDefined();
      expect(motionPresets.microTap).toBeDefined();
      expect(motionPresets.fadeSlideIn).toBeDefined();
      expect(motionPresets.objectTransition).toBeDefined();
    });
  });

  describe('Backward Compatibility: designTokens & getThemeClasses', () => {
    it('preserves legacy designTokens object structure', () => {
      expect(designTokens.colors.dark.background).toBeDefined();
      expect(designTokens.colors.light.background).toBeDefined();
      expect(designTokens.spacing.md).toBe('1rem');
      expect(designTokens.radius.full).toBe('9999px');
    });

    it('returns appropriate theme classes for dark and light modes', () => {
      const darkClasses = getThemeClasses(true);
      const lightClasses = getThemeClasses(false);

      expect(darkClasses.canvas).toContain('bg-[#111315]');
      expect(lightClasses.canvas).toContain('bg-slate-50');
      expect(darkClasses.workspace).toContain('bg-[#16191D]');
      expect(lightClasses.workspace).toContain('bg-slate-100');
      expect(darkClasses.borderDefault).toBeDefined();
      expect(lightClasses.borderDefault).toBeDefined();
      expect(darkClasses.textSubtle).toBeDefined();
      expect(lightClasses.textSubtle).toBeDefined();
    });
  });
});
