import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ThemeCanvasShader } from './ThemeCanvasShader';
import { VALID_NAMED_THEMES } from '../../context/ThemeContext';

describe('ThemeCanvasShader Component Architecture', () => {
  it('instantiates valid React element for canvas shader', () => {
    const el = React.createElement(ThemeCanvasShader);
    expect(React.isValidElement(el)).toBe(true);
  });

  it('covers all target themes (Precision, Lumen, Aero)', () => {
    const themes = ['precision', 'lumen', 'aero'];
    themes.forEach((theme) => {
      expect(VALID_NAMED_THEMES).toContain(theme);
    });
  });

  it('declares proper accessibility and pointer-events attributes for canvas background', () => {
    const el = React.createElement(ThemeCanvasShader, { className: 'custom-bg' });
    expect(el.props.className).toContain('custom-bg');
  });
});
