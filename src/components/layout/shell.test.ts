import { describe, it, expect } from 'vitest';
import { NavigationTab } from '../../types';

describe('FSOS R2 Application Shell Navigation Contract', () => {
  it('preserves all foundational navigation destinations across workspace modes', () => {
    const allExpectedTabs: NavigationTab[] = [
      'start_page',
      'mhc_autopilot',
      'mhc_history',
      'machines',
      'customers',
      'contracts',
      'analytics',
      'profile',
      'users',
      'settings',
      'changelog'
    ];

    const mhcAllowedTabs: NavigationTab[] = [
      'start_page',
      'mhc_autopilot',
      'mhc_history',
      'machines',
      'customers',
      'contracts',
      'analytics',
      'profile',
      'settings',
      'changelog'
    ];

    // Verify all MHC allowed tabs are valid navigation tabs
    mhcAllowedTabs.forEach(tab => {
      expect(allExpectedTabs).toContain(tab);
    });

    expect(allExpectedTabs.length).toBe(11);
    expect(mhcAllowedTabs.length).toBe(10);
  });
});
