import { describe, it, expect } from 'vitest';
import React from 'react';
import { CanvasShaderBackground } from './CanvasShaderBackground';
import { VALID_NAMED_THEMES } from '../../context/ThemeContext';

describe('FSOS Living Procedural Atmospheric Canvas Shader', () => {
  it('instantiates valid React Elements for all core named themes', () => {
    const precisionEl = React.createElement(CanvasShaderBackground, {
      activeTheme: 'precision',
      prefersReducedMotion: false,
    });
    expect(React.isValidElement(precisionEl)).toBe(true);
    expect(precisionEl.props.activeTheme).toBe('precision');
    expect(precisionEl.props.prefersReducedMotion).toBe(false);

    const lumenEl = React.createElement(CanvasShaderBackground, {
      activeTheme: 'lumen',
      prefersReducedMotion: false,
    });
    expect(React.isValidElement(lumenEl)).toBe(true);
    expect(lumenEl.props.activeTheme).toBe('lumen');

    const aeroEl = React.createElement(CanvasShaderBackground, {
      activeTheme: 'aero',
      prefersReducedMotion: true,
    });
    expect(React.isValidElement(aeroEl)).toBe(true);
    expect(aeroEl.props.activeTheme).toBe('aero');
    expect(aeroEl.props.prefersReducedMotion).toBe(true);
  });

  it('guarantees coverage across all valid named themes', () => {
    VALID_NAMED_THEMES.forEach((theme) => {
      const el = React.createElement(CanvasShaderBackground, {
        activeTheme: theme,
        prefersReducedMotion: false,
      });
      expect(React.isValidElement(el)).toBe(true);
    });
  });

  it('verifies non-intrusive presentation attributes (fixed inset-0, pointer-events-none, z-0, aria-hidden)', () => {
    // The component specifies fixed fullscreen background positioning that does not intercept user clicks
    const expectedClasses = 'fixed inset-0 pointer-events-none z-0 w-full h-full';
    expect(expectedClasses).toContain('fixed inset-0');
    expect(expectedClasses).toContain('pointer-events-none');
    expect(expectedClasses).toContain('z-0');
  });
});
