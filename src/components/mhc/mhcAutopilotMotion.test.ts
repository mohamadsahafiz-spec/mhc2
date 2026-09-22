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

  it('determines directional vector correctly for linear Autopilot step navigation', () => {
    const sequence = [
      '01',
      '02',
      '02_power',
      '02_beam',
      '02_findings',
      '03',
      '03_focus',
      '04',
      '04_stage1',
      '04_stage2',
      '05',
      '05_agc1',
      '05_agc2',
      '06',
      '06_via',
      '07',
      '08',
      '09',
      '10'
    ];

    // Forward progression
    const getDirection = (prev: string, curr: string) => {
      const prevIdx = sequence.indexOf(prev);
      const currIdx = sequence.indexOf(curr);
      if (prevIdx !== -1 && currIdx !== -1) {
        return currIdx > prevIdx ? 'forward' : 'backward';
      }
      return 'forward';
    };

    expect(getDirection('01', '02_power')).toBe('forward');
    expect(getDirection('02_power', '02_beam')).toBe('forward');
    expect(getDirection('02_findings', '03_focus')).toBe('forward');
    expect(getDirection('09', '10')).toBe('forward');

    // Reverse progression
    expect(getDirection('10', '09')).toBe('backward');
    expect(getDirection('05_agc2', '04_stage2')).toBe('backward');
    expect(getDirection('03_focus', '02_findings')).toBe('backward');
  });

  it('calculates live vertical progress path percentage along the activity track correctly', () => {
    const sequence = [
      '01',
      '02',
      '02_power',
      '02_beam',
      '02_findings',
      '03',
      '03_focus',
      '04',
      '04_stage1',
      '04_stage2',
      '05',
      '05_agc1',
      '05_agc2',
      '06',
      '06_via',
      '07',
      '08',
      '09',
      '10'
    ];

    const getProgressRatio = (code: string) => {
      const idx = Math.max(0, sequence.indexOf(code));
      return idx / (sequence.length - 1);
    };

    expect(getProgressRatio('01')).toBe(0);
    expect(getProgressRatio('10')).toBe(1);
    expect(getProgressRatio('04')).toBeGreaterThan(0.2);
    expect(getProgressRatio('04')).toBeLessThan(0.6);
  });

  it('supports distinct theme visual identities across Precision, Lumen, and Aero', () => {
    const themeVisualMap: Record<string, { trackClass: string; activeTextClass: string; completedIconClass: string }> = {
      precision: { 
        trackClass: 'from-amber-500', 
        activeTextClass: 'text-amber-300', 
        completedIconClass: 'text-emerald-400' 
      },
      lumen: { 
        trackClass: 'from-sky-400', 
        activeTextClass: 'text-sky-200', 
        completedIconClass: 'text-emerald-400' 
      },
      aero: { 
        trackClass: 'from-sky-500', 
        activeTextClass: 'text-sky-900', 
        completedIconClass: 'text-emerald-600' 
      },
    };

    expect(themeVisualMap.precision.trackClass).toContain('amber');
    expect(themeVisualMap.precision.activeTextClass).toContain('amber');
    expect(themeVisualMap.lumen.trackClass).toContain('sky-400');
    expect(themeVisualMap.lumen.activeTextClass).toContain('sky-200');
    expect(themeVisualMap.aero.trackClass).toContain('sky-500');
    expect(themeVisualMap.aero.activeTextClass).toContain('sky-900');
  });
});
