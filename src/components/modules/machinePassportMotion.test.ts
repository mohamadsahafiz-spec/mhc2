import { describe, it, expect } from 'vitest';
import {
  createFadeSlideVariants,
  createStaggerContainerVariants,
  slidingIndicatorTransition,
  mechanicalPressConfig,
  motionTimings,
  motionEasings,
} from '../../theme/motion';

describe('FSOS M3 Machine Passport Motion System', () => {
  it('provides mechanical fade slide variants for machine identity and subsystems', () => {
    const defaultVariants = createFadeSlideVariants({ direction: 'up', distance: 'component' });
    expect(defaultVariants.hidden).toBeDefined();
    expect(defaultVariants.visible).toBeDefined();
    expect(defaultVariants.exit).toBeDefined();
    expect(defaultVariants.visible).toHaveProperty('y', 0);
  });

  it('respects prefers-reduced-motion for all machine passport transitions', () => {
    const reducedVariants = createFadeSlideVariants({
      direction: 'left',
      distance: 'component',
      prefersReducedMotion: true,
    });
    // In reduced motion, there should be no spatial translation (no x or y)
    expect(reducedVariants.hidden).not.toHaveProperty('x');
    expect(reducedVariants.hidden).not.toHaveProperty('y');
    expect(reducedVariants.visible).toHaveProperty('opacity', 1);
  });

  it('provides structured stagger variants for machine passport layout', () => {
    const stagger = createStaggerContainerVariants(0.04, false);
    expect(stagger.visible).toBeDefined();
    expect((stagger.visible as any).transition).toHaveProperty('staggerChildren', 0.04);

    const reducedStagger = createStaggerContainerVariants(0.04, true);
    expect((reducedStagger.visible as any).transition).toHaveProperty('staggerChildren', 0);
  });

  it('validates physical sliding indicator transition for active subsystem indicator', () => {
    expect(slidingIndicatorTransition).toBeDefined();
    expect(slidingIndicatorTransition).toHaveProperty('type', 'spring');
    expect(slidingIndicatorTransition).toHaveProperty('stiffness', 420);
    expect(slidingIndicatorTransition).toHaveProperty('damping', 34);
  });

  it('ensures tactile button interactions adhere to FSOS mechanical scale specifications', () => {
    expect(mechanicalPressConfig.subtleTap.scale).toBe(0.99);
    expect(mechanicalPressConfig.tap.scale).toBe(0.98);
    expect(mechanicalPressConfig.subtleTap.transition.duration).toBe(motionTimings.instant);
    expect(mechanicalPressConfig.subtleTap.transition.ease).toBe(motionEasings.responsive);
  });
});
