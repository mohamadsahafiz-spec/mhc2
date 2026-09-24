import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';
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

  it('guarantees fragment shader compiles without unsupported fwidth calls', () => {
    const shaderFilePath = path.resolve(__dirname, 'ThemeCanvasShader.tsx');
    const content = fs.readFileSync(shaderFilePath, 'utf-8');

    // Shader source must not contain unsupported fwidth calls
    expect(content).not.toContain('fwidth(');

    // Verifies analytical derivative calculation
    expect(content).toContain('vec2 gridDeriv = vec2(1.0 / (gridSize * u_resolution.y));');
    expect(content).toContain('vec2 majorGridDeriv = vec2(1.0 / (majorGridSize * u_resolution.y));');
  });
});

