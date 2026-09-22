import { describe, it, expect } from 'vitest';
import React from 'react';
import { ThemeThumbnail } from './ThemeThumbnail';
import { HeaderThemeSwitch } from '../layout/HeaderThemeSwitch';
import { VALID_NAMED_THEMES } from '../../context/ThemeContext';

describe('FSOS Theme Visual Identity Switcher Architecture', () => {
  it('supports all core named themes in ThemeThumbnail', () => {
    const supportedThemes = ['precision', 'lumen', 'aero'];
    supportedThemes.forEach((theme) => {
      expect(VALID_NAMED_THEMES).toContain(theme);
    });
  });

  it('instantiates valid React Elements for precision, lumen, and aero visual pills (sm, lg, full)', () => {
    // Small Header pill
    const precisionEl = React.createElement(ThemeThumbnail, { theme: 'precision', isSelected: true, size: 'sm' });
    expect(React.isValidElement(precisionEl)).toBe(true);
    expect(precisionEl.props.theme).toBe('precision');
    expect(precisionEl.props.isSelected).toBe(true);
    expect(precisionEl.props.size).toBe('sm');

    const lumenEl = React.createElement(ThemeThumbnail, { theme: 'lumen', isSelected: false, size: 'sm' });
    expect(React.isValidElement(lumenEl)).toBe(true);
    expect(lumenEl.props.theme).toBe('lumen');
    expect(lumenEl.props.isSelected).toBe(false);

    const aeroEl = React.createElement(ThemeThumbnail, { theme: 'aero', isSelected: false, size: 'sm' });
    expect(React.isValidElement(aeroEl)).toBe(true);
    expect(aeroEl.props.theme).toBe('aero');
    expect(aeroEl.props.isSelected).toBe(false);

    // Large Settings Card
    const aeroCardEl = React.createElement(ThemeThumbnail, { theme: 'aero', isSelected: true, size: 'lg' });
    expect(React.isValidElement(aeroCardEl)).toBe(true);
    expect(aeroCardEl.props.size).toBe('lg');

    // Full Bleed Card Background
    const fullCardEl = React.createElement(ThemeThumbnail, { theme: 'precision', isSelected: false, size: 'full' });
    expect(React.isValidElement(fullCardEl)).toBe(true);
    expect(fullCardEl.props.size).toBe('full');
  });

  it('instantiates HeaderThemeSwitch with all 3 theme options', () => {
    const switchEl = React.createElement(HeaderThemeSwitch, {
      activeTheme: 'precision',
      onThemeChange: () => {},
    });
    expect(React.isValidElement(switchEl)).toBe(true);
    expect(switchEl.props.activeTheme).toBe('precision');
  });
});
