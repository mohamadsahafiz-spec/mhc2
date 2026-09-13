import { describe, it, expect } from 'vitest';
import { semanticTokens, designTokens, getThemeClasses, motionPresets } from './tokens';

describe('FSOS R1 Visual Foundation Tokens', () => {
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
