import { describe, it, expect } from 'vitest';
import {
  motionTimings,
  motionEasings,
  motionDistances,
  motionScales,
  motionOpacities,
  createFadeSlideVariants,
  createFadeVariants,
  createScaleFadeVariants,
  createStaggerContainerVariants,
  mechanicalPressConfig,
  slidingIndicatorTransition,
  getFSOSReducedTransition,
  buildFSOSVariant,
} from './motion';

describe('FSOS Motion System (M0 Foundation)', () => {
  describe('A. Timing System', () => {
    it('defines standardized durations within field-engineering constraints', () => {
      expect(motionTimings.instant).toBe(0.08);
      expect(motionTimings.quick).toBe(0.15);
      expect(motionTimings.standard).toBe(0.25);
      expect(motionTimings.deliberate).toBe(0.4);
      expect(motionTimings.scan).toBe(3.0);

      // Verify hierarchy: instant < quick < standard < deliberate < scan
      expect(motionTimings.instant).toBeLessThan(motionTimings.quick);
      expect(motionTimings.quick).toBeLessThan(motionTimings.standard);
      expect(motionTimings.standard).toBeLessThan(motionTimings.deliberate);
      expect(motionTimings.deliberate).toBeLessThan(motionTimings.scan);
    });
  });

  describe('B. Easing System', () => {
    it('defines mechanical + smooth easing curves', () => {
      expect(motionEasings.responsive).toEqual([0.2, 0, 0, 1]);
      expect(motionEasings.smooth).toEqual([0.25, 0.1, 0.25, 1]);
      expect(motionEasings.deliberate).toEqual([0.16, 1, 0.3, 1]);
      expect(motionEasings.linear).toBe('linear');
    });
  });

  describe('C. Motion Distance System', () => {
    it('defines restrained pixel displacements', () => {
      expect(motionDistances.micro).toBe(2);
      expect(motionDistances.subtle).toBe(4);
      expect(motionDistances.component).toBe(8);
      expect(motionDistances.section).toBe(16);
      expect(motionDistances.page).toBe(24);

      // Verify distance bounds
      expect(motionDistances.micro).toBeLessThan(motionDistances.subtle);
      expect(motionDistances.subtle).toBeLessThan(motionDistances.component);
      expect(motionDistances.component).toBeLessThan(motionDistances.section);
      expect(motionDistances.section).toBeLessThan(motionDistances.page);
    });
  });

  describe('D. Scale System', () => {
    it('defines restrained scale factors avoiding hyperactive bouncing', () => {
      expect(motionScales.press).toBe(0.98);
      expect(motionScales.subtlePress).toBe(0.99);
      expect(motionScales.hover).toBe(1.015);
      expect(motionScales.dialogEntry).toBe(0.97);
      expect(motionScales.none).toBe(1.0);

      // All press states must be <= 1.0
      expect(motionScales.press).toBeLessThan(1.0);
      expect(motionScales.subtlePress).toBeLessThan(1.0);
      // Hover must be subtle (<= 1.02)
      expect(motionScales.hover).toBeLessThanOrEqual(1.02);
    });
  });

  describe('E. Opacity System', () => {
    it('defines standard opacity thresholds', () => {
      expect(motionOpacities.hidden).toBe(0);
      expect(motionOpacities.muted).toBe(0.45);
      expect(motionOpacities.subtle).toBe(0.75);
      expect(motionOpacities.visible).toBe(1);
    });
  });

  describe('F. Reduced Motion & Accessibility', () => {
    it('provides clean fade-only transitions for reduced motion', () => {
      const reducedTrans = getFSOSReducedTransition();
      expect(reducedTrans.duration).toBe(motionTimings.quick);
      expect(reducedTrans.ease).toEqual(motionEasings.smooth);
    });

    it('builds reduced-motion variants without spatial displacement', () => {
      const standard = { opacity: 1, y: 0 };
      const reduced = { opacity: 1 };

      const activeStandard = buildFSOSVariant(standard, reduced, false);
      const activeReduced = buildFSOSVariant(standard, reduced, true);

      expect(activeStandard).toEqual(standard);
      expect(activeReduced).toEqual(reduced);
    });
  });

  describe('G. Motion Primitives & Presets', () => {
    it('creates directional fadeSlide variants with proper axis offset', () => {
      const variantsUp = createFadeSlideVariants({ direction: 'up', distance: 'component' });
      expect(variantsUp.hidden).toHaveProperty('y', 8);
      expect(variantsUp.visible).toHaveProperty('y', 0);

      const variantsLeft = createFadeSlideVariants({ direction: 'left', distance: 'page' });
      expect(variantsLeft.hidden).toHaveProperty('x', 24);
      expect(variantsLeft.visible).toHaveProperty('x', 0);
    });

    it('collapses fadeSlide variants when prefersReducedMotion is true', () => {
      const variants = createFadeSlideVariants({ prefersReducedMotion: true });
      expect(variants.hidden).toEqual({ opacity: 0 });
      expect(variants.visible).not.toHaveProperty('y');
      expect(variants.visible).not.toHaveProperty('x');
    });

    it('creates scaleFade variants for dialogs and modals', () => {
      const variants = createScaleFadeVariants(false);
      expect(variants.hidden).toHaveProperty('scale', 0.97);
      expect(variants.visible).toHaveProperty('scale', 1.0);

      const reducedVariants = createScaleFadeVariants(true);
      expect(reducedVariants.hidden).toEqual({ opacity: 0 });
    });

    it('creates stagger container variants with bounded delay', () => {
      const stagger = createStaggerContainerVariants(0.04, false);
      expect(stagger.visible).toBeDefined();

      const reducedStagger = createStaggerContainerVariants(0.04, true);
      expect(reducedStagger.visible).toBeDefined();
    });

    it('provides tactile mechanical press and sliding indicator presets', () => {
      expect(mechanicalPressConfig.tap.scale).toBe(0.98);
      expect(mechanicalPressConfig.hover.scale).toBe(1.015);
      expect(slidingIndicatorTransition.type).toBe('spring');
    });
  });
});
