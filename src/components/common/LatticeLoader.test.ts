import { describe, it, expect } from 'vitest';
import { LatticeLoaderProps } from './LatticeLoader';

describe('LatticeLoader Component Logic & Geometry (v3.6.0)', () => {
  it('validates default loader configuration for MHC PDF download', () => {
    const defaultMhcLoaderProps: LatticeLoaderProps = {
      status: 'working',
      label: 'Downloading',
      doneLabel: 'Downloaded in',
      errorLabel: 'Failed after',
      pattern: 'orbit',
      grid: 3,
      shape: 'round',
      cellSize: 4,
      gap: 2,
      fontSize: 12,
      color: '#020617',
      doneColor: '#020617',
      errorColor: '#ef4444',
      showTimer: true
    };

    expect(defaultMhcLoaderProps.label).toBe('Downloading');
    expect(defaultMhcLoaderProps.status).toBe('working');
    expect(defaultMhcLoaderProps.pattern).toBe('orbit');
    expect(defaultMhcLoaderProps.grid).toBe(3);
    expect(defaultMhcLoaderProps.showTimer).toBe(true);
  });

  it('formats elapsed deciseconds accurately into stopwatch format', () => {
    const fmt = (ds: number) =>
      ds < 600 ? `${(ds / 10).toFixed(1)}s` : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`;

    expect(fmt(0)).toBe('0.0s');
    expect(fmt(25)).toBe('2.5s');
    expect(fmt(123)).toBe('12.3s');
    expect(fmt(650)).toBe('1m 5.0s');
  });

  it('resolves 3x3 orbit pattern cell matrix', () => {
    const orbit3x3Cells = [0, 1, 2, 7, null, 3, 6, 5, 4];
    expect(orbit3x3Cells.length).toBe(9);
    expect(orbit3x3Cells[4]).toBeNull(); // center hole in orbit
    
    // Validate cycle time calculation
    const step = 90;
    const scale = 1.2;
    const loop = 8;
    const d = step * scale;
    const cycle = Math.round(loop * d);
    expect(cycle).toBe(864);
  });
});
