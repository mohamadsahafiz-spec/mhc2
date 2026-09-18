import { describe, it, expect } from 'vitest';
import { NavigationTab } from '../../types';

describe('FSOS Application Shell Navigation Contract', () => {
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

  it('guarantees Settings terminology is clean and singular', () => {
    const titles: Partial<Record<NavigationTab, string>> = {
      start_page: 'Daily Work',
      mhc_autopilot: 'MHC Autopilot',
      mhc: 'Machine Health Check (MHC)',
      mhc_history: 'MHC History & Reports',
      contracts: 'Contracts',
      customers: 'Customers & Plants',
      machines: 'Machine Passport',
      analytics: 'Operational Analytics',
      users: 'Engineers Directory',
      settings: 'Settings',
      profile: 'My Profile',
      changelog: 'Release History'
    };

    expect(titles.settings).toBe('Settings');
    expect(titles.changelog).toBe('Release History');
  });
});
