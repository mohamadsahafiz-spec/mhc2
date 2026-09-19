import { describe, it, expect } from 'vitest';
import {
  motionTimings,
  motionEasings,
  mechanicalPressConfig,
  createFadeSlideVariants,
} from '../../theme/motion';

describe('FSOS M6 Experimental Engineering Motion System', () => {
  it('defines calibrated inspection datum timings and easings', () => {
    expect(motionTimings.standard).toBe(0.25);
    expect(motionTimings.deliberate).toBe(0.4);
    expect(motionEasings.responsive).toBeDefined();
    expect(motionEasings.smooth).toBeDefined();
  });

  it('guarantees zero spatial motion during reduced-motion mode for inspection views', () => {
    const reducedVariants = createFadeSlideVariants({
      direction: 'up',
      distance: 'component',
      prefersReducedMotion: true,
    });
    expect(reducedVariants.hidden).not.toHaveProperty('y');
    expect(reducedVariants.exit).not.toHaveProperty('y');
    expect(reducedVariants.visible).toHaveProperty('opacity', 1);
  });

  it('validates mechanical tactile feedback config for evidence and measurement actions', () => {
    expect(mechanicalPressConfig.subtleTap.scale).toBe(0.99);
    expect(mechanicalPressConfig.tap.scale).toBe(0.98);
  });
});
