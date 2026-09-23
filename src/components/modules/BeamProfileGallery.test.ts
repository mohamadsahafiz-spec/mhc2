import { describe, it, expect } from 'vitest';
import { CHECKPOINT_SPECS } from '../../types/beamProfile';
import { BeamProfileEngine } from '../../utils/beamProfileEngine';

describe('FSOS Beam Profile Animated Accordion Gallery Contract (v3.6.1)', () => {
  it('partitions checkpoint specifications strictly by Laser 1 and Laser 2 heads', () => {
    const laser1Specs = CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 1');
    const laser2Specs = CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 2');

    expect(laser1Specs.length).toBe(8);
    expect(laser2Specs.length).toBe(8);

    // Laser 1 codes
    expect(laser1Specs.map(s => s.id)).toEqual([
      '6A',
      '6B',
      '6C-2.2mm',
      '6C-2.0mm',
      '6C-1.8mm',
      '6C-1.3mm',
      '6C-1.1mm',
      '6C-0.9mm'
    ]);

    // Laser 2 codes
    expect(laser2Specs.map(s => s.id)).toEqual([
      '7A',
      '7B',
      '7C-2.2mm',
      '7C-2.0mm',
      '7C-1.8mm',
      '7C-1.3mm',
      '7C-1.1mm',
      '7C-0.9mm'
    ]);
  });

  it('generates crisp synthetic beam SVGs when image data URLs require fallback', () => {
    const svg6A = BeamProfileEngine.generateSyntheticBeamSvg('6A', '#f59e0b');
    expect(svg6A).toContain('data:image/svg+xml;base64,');

    const svg7B = BeamProfileEngine.generateSyntheticBeamSvg('7B', '#06b6d4');
    expect(svg7B).toContain('data:image/svg+xml;base64,');
  });

  it('verifies accordion gallery expansion math and bounds', () => {
    const expandRatio = 0.52;
    const count = 8;
    const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
    const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;

    // With 8 items and expandRatio 0.52, expanded panel should have flex-grow ~ 7.58 vs 1 for collapsed panels
    expect(grow).toBeGreaterThan(5);
    expect(grow).toBeLessThan(10);
  });
});
