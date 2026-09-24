import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('FSOS v3.6.8 — Aero Theme Visual Consistency Architecture', () => {
  it('guarantees high text contrast for selected Schedule Index rows in Aero theme', () => {
    const navFilePath = path.resolve(__dirname, 'MhcWorkstationNavigator.tsx');
    const content = fs.readFileSync(navFilePath, 'utf-8');

    // Extract aero theme block in getThemeVisuals
    const aeroMatch = content.match(/case 'aero':[\s\S]*?case 'precision':/);
    expect(aeroMatch).toBeTruthy();
    const aeroBlock = aeroMatch![0];

    // activeText must use high-contrast navy/slate tokens, never faint text-sky-100
    expect(aeroBlock).toContain("activeText: 'text-sky-950 dark:text-sky-950 font-bold'");
    expect(aeroBlock).not.toContain('dark:text-sky-100');

    // activeSecondaryText must use readable sky-800, never faint text-sky-300
    expect(aeroBlock).toContain("activeSecondaryText: 'text-sky-800 dark:text-sky-800 font-mono font-bold'");
    expect(aeroBlock).not.toContain('dark:text-sky-300');

    // activeDayText must use readable sky-700, never faint text-sky-400
    expect(aeroBlock).toContain("activeDayText: 'text-sky-700 dark:text-sky-700 font-mono font-bold'");
    expect(aeroBlock).not.toContain('dark:text-sky-400');
  });

  it('guarantees CSS rules enforce dark text contrast on active schedule items in Aero mode', () => {
    const cssFilePath = path.resolve(__dirname, '../../../index.css');
    const cssContent = fs.readFileSync(cssFilePath, 'utf-8');

    // Check .mhc-schedule-item-active rules under [data-theme="aero"]
    expect(cssContent).toContain('[data-theme="aero"] .mhc-schedule-item-active');
    expect(cssContent).toContain('color: #082F49 !important');
  });

  it('guarantees Activity 01 (Laser Hours) uses standard Aero surfaces and eliminates unintended green tints', () => {
    const activityFilePath = path.resolve(__dirname, 'MhcLaserHoursActivity.tsx');
    const content = fs.readFileSync(activityFilePath, 'utf-8');

    // 1. Laser Head card container must use standard surface tokens
    expect(content).toContain('className="p-5 rounded-2xl border space-y-4 transition-all bg-[var(--surface-surface)] border-[var(--border-default)]"');
    expect(content).not.toContain('bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20');

    // 2. Laser Head LH badge must use primary accent token, not turning green
    expect(content).toContain('w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30');

    // 3. Activity 01 Completion Readiness container must use standard raised surface token
    expect(content).toContain('className="p-5 rounded-2xl border space-y-4 bg-[var(--surface-raised)] border-[var(--border-default)]"');

    // 4. Legitimate status indicators must be preserved
    expect(content).toContain('<span>VERIFIED</span>');
    expect(content).toContain('<span>UNVERIFIED</span>');
    expect(content).toContain('bg-emerald-600 hover:bg-emerald-500 text-white');
    expect(content).toContain('text-emerald-500 dark:text-emerald-400 font-extrabold');
  });
});
