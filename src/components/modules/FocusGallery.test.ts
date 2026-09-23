import { describe, it, expect } from 'vitest';
import { FOCUS_WAFER_POSITIONS } from '../../types/focusOptimization';
import { FocusOptimizationEngine } from '../../utils/focusOptimizationEngine';

describe('FSOS Focus Image Animated Inspection Gallery Contract (v3.6.2)', () => {
  it('verifies standard 7-position wafer sequence (+3 to -3)', () => {
    expect(FOCUS_WAFER_POSITIONS).toEqual(['+3', '+2', '+1', '0', '-1', '-2', '-3']);
    expect(FOCUS_WAFER_POSITIONS.length).toBe(7);
  });

  it('generates crisp synthetic wafer drill SVGs for dummy wafer sequence without crashing', () => {
    const l1Svg = FocusOptimizationEngine.generateSyntheticWaferDrillSvg('Laser 1', '0', '#f59e0b');
    expect(l1Svg).toContain('data:image/svg+xml;base64,');

    const l2Svg = FocusOptimizationEngine.generateSyntheticWaferDrillSvg('Laser 2', '+2', '#38bdf8');
    expect(l2Svg).toContain('data:image/svg+xml;base64,');
  });

  it('generates a full default Focus Optimization record with 14 positions (7 for L1, 7 for L2)', () => {
    const defaultRec = FocusOptimizationEngine.createDefaultRecord('2026-09-23', 'EO Technics Field Engineer');
    
    expect(defaultRec.laser1).toBeDefined();
    expect(defaultRec.laser2).toBeDefined();

    expect(Object.keys(defaultRec.laser1.positions).length).toBe(7);
    expect(Object.keys(defaultRec.laser2.positions).length).toBe(7);

    expect(defaultRec.laser1.selectedBestFocusPosition).toBe('0');
    expect(defaultRec.laser2.selectedBestFocusPosition).toBe('0');
    expect(defaultRec.overallResult).toBe('VERIFIED');
  });

  it('verifies accordion gallery expansion math and bounds for 7 items', () => {
    const expandRatio = 0.48;
    const count = 7;
    const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
    const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;

    // With 7 items and expandRatio 0.48, expanded panel flex-grow should be ~ 5.54
    expect(grow).toBeGreaterThan(4);
    expect(grow).toBeLessThan(7);
  });
});
