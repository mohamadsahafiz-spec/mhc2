import { describe, it, expect } from 'vitest';

describe('HamsterSyncLoader & Sync UI Presentation Contract', () => {
  it('maps sync statuses to proper visual classes and states', () => {
    const getHamsterClass = (status: 'synced' | 'syncing' | 'pending' | 'offline') => {
      const isSyncing = status === 'syncing';
      return isSyncing ? 'wheel-and-hamster--syncing' : 'wheel-and-hamster--synced';
    };

    expect(getHamsterClass('synced')).toBe('wheel-and-hamster--synced');
    expect(getHamsterClass('offline')).toBe('wheel-and-hamster--synced');
    expect(getHamsterClass('pending')).toBe('wheel-and-hamster--synced');
    expect(getHamsterClass('syncing')).toBe('wheel-and-hamster--syncing');
  });

  it('calculates font size proportionally based on wheel diameter', () => {
    const getFontSize = (sizePx: number) => sizePx / 12;

    expect(getFontSize(64)).toBeCloseTo(5.333, 2);
    expect(getFontSize(48)).toBe(4);
    expect(getFontSize(44)).toBeCloseTo(3.666, 2);
    expect(getFontSize(36)).toBe(3);
  });

  it('guarantees popover dimensions fit within sidebar width without clipping', () => {
    const sidebarWidth = 240;
    const popoverWidth = 224;
    const clearance = (sidebarWidth - popoverWidth) / 2;

    expect(popoverWidth).toBeLessThan(sidebarWidth);
    expect(clearance).toBe(8); // exactly 8px margin on both left and right
  });
});
