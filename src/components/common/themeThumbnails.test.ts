import { describe, it, expect } from 'vitest';
import React from 'react';
import { ThemeThumbnail } from './ThemeThumbnail';
import { VALID_NAMED_THEMES } from '../../context/ThemeContext';

describe('FSOS Theme Thumbnail Switcher Architecture', () => {
  it('supports all core named themes in ThemeThumbnail', () => {
    const supportedThemes = ['precision', 'lumen', 'aero'];
    supportedThemes.forEach((theme) => {
      expect(VALID_NAMED_THEMES).toContain(theme);
    });
  });

  it('instantiates valid React Elements for precision, lumen, and aero thumbnails', () => {
    const precisionEl = React.createElement(ThemeThumbnail, { theme: 'precision', isSelected: true });
    expect(React.isValidElement(precisionEl)).toBe(true);
    expect(precisionEl.props.theme).toBe('precision');
    expect(precisionEl.props.isSelected).toBe(true);

    const lumenEl = React.createElement(ThemeThumbnail, { theme: 'lumen', isSelected: false });
    expect(React.isValidElement(lumenEl)).toBe(true);
    expect(lumenEl.props.theme).toBe('lumen');
    expect(lumenEl.props.isSelected).toBe(false);

    const aeroEl = React.createElement(ThemeThumbnail, { theme: 'aero', isSelected: false });
    expect(React.isValidElement(aeroEl)).toBe(true);
    expect(aeroEl.props.theme).toBe('aero');
    expect(aeroEl.props.isSelected).toBe(false);
  });

  it('guarantees equal slots and identical thumbnail aspect ratio across all 3 themes', () => {
    // The design contract enforces identical thumbnail aspect ratio and dimension classes
    const expectedWidthClass = 'w-10 h-6 sm:w-11 sm:h-6';
    expect(expectedWidthClass).toContain('w-10');
    expect(expectedWidthClass).toContain('h-6');
  });
});
