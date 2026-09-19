import { describe, it, expect } from 'vitest';
import {
  createFadeSlideVariants,
  createScaleFadeVariants,
  createStaggerContainerVariants,
  mechanicalPressConfig,
  motionTimings,
  motionEasings,
} from '../../theme/motion';

describe('FSOS M4 MHC Autopilot Motion System', () => {
  it('provides mechanical fade slide variants for activity workstation transitions', () => {
    const activityVariants = createFadeSlideVariants({
      direction: 'up',
      distance: 'component',
      prefersReducedMotion: false,
    });
    expect(activityVariants.hidden).toBeDefined();
    expect(activityVariants.visible).toBeDefined();
    expect(activityVariants.exit).toBeDefined();
    expect(activityVariants.visible).toHaveProperty('y', 0);
  });

  it('respects prefers-reduced-motion for all activity transitions', () => {
    const reducedVariants = createFadeSlideVariants({
      direction: 'up',
      distance: 'component',
      prefersReducedMotion: true,
    });
    // In reduced motion, there should be no spatial translation (no y property on hidden)
    expect(reducedVariants.hidden).not.toHaveProperty('y');
    expect(reducedVariants.visible).toHaveProperty('opacity', 1);
  });

  it('provides scale and fade variants for review and discard modals', () => {
    const modalVariants = createScaleFadeVariants(false);
    expect(modalVariants.hidden).toBeDefined();
    expect(modalVariants.visible).toBeDefined();
    expect(modalVariants.exit).toBeDefined();
    expect(modalVariants.hidden).toHaveProperty('scale', 0.97);

    const reducedModalVariants = createScaleFadeVariants(true);
    expect(reducedModalVariants.hidden).not.toHaveProperty('scale');
    expect(reducedModalVariants.visible).toHaveProperty('opacity', 1);
  });

  it('ensures tactile button interactions adhere to FSOS mechanical scale specifications', () => {
    expect(mechanicalPressConfig.subtleTap.scale).toBe(0.99);
    expect(mechanicalPressConfig.tap.scale).toBe(0.98);
    expect(mechanicalPressConfig.tap.transition.duration).toBe(motionTimings.instant);
  });
});
