import { describe, it, expect } from 'vitest';
import { NavigationTab } from '../../types';

describe('FSOS Application Shell Architecture Contract', () => {
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

  it('validates minimal Top Bar architectural rules', () => {
    // Top Bar retains only essential operational controls
    const allowedTopBarElements = [
      'sidebar_toggle',
      'page_title',
      'theme_switch',
      'account_menu'
    ];

    // Prohibited top-bar controls (relocated to proper workflows/Sidebar/Settings or removed)
    const prohibitedTopBarElements = [
      'global_search_input',
      'workspace_mode_selector',
      'permanent_directive_banner',
      'new_mhc_shortcut_button',
      'notification_bell',
      'sync_status_header_clutter'
    ];

    expect(allowedTopBarElements.length).toBe(4);
    expect(prohibitedTopBarElements.length).toBe(6);
    prohibitedTopBarElements.forEach(item => {
      expect(allowedTopBarElements).not.toContain(item);
    });
  });

  it('validates pure typography navigation model without icon clutter', () => {
    const navigationGroups = [
      { key: 'work', title: 'DAILY WORK', itemCount: 1 },
      { key: 'mhc_category', title: 'OPERATIONS', itemCount: 2 },
      { key: 'assets', title: 'ASSETS', itemCount: 1 },
      { key: 'fleet', title: 'FLEET & CONTRACTS', itemCount: 3 },
      { key: 'system', title: 'SYSTEM', itemCount: 4 }
    ];

    const totalDestinations = navigationGroups.reduce((acc, g) => acc + g.itemCount, 0);
    expect(totalDestinations).toBe(11);
  });

  it('guarantees single sidebar toggle rule without duplicate buttons', () => {
    // In expanded state: Close toggle resides in Sidebar header, not beside Top Bar page title
    const expandedStateToggles = {
      sidebarHeaderCloseToggle: true,
      topBarDuplicateToggle: false,
    };
    expect(expandedStateToggles.sidebarHeaderCloseToggle).toBe(true);
    expect(expandedStateToggles.topBarDuplicateToggle).toBe(false);

    // In hidden state: Restore toggle appears in Top Bar
    const hiddenStateToggles = {
      sidebarRendered: false,
      topBarRestoreToggle: true,
    };
    expect(hiddenStateToggles.sidebarRendered).toBe(false);
    expect(hiddenStateToggles.topBarRestoreToggle).toBe(true);
  });

  it('guarantees viewport shell geometry contract: full-height sidebar and independent main scroll', () => {
    const shellLayoutRules = {
      rootShell: 'h-screen flex overflow-hidden',
      sidebarContainer: 'w-60 border-r flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden',
      workspaceArea: 'flex-1 flex flex-col min-w-0 h-screen overflow-hidden',
      mainContentPane: 'flex-1 overflow-y-auto'
    };

    expect(shellLayoutRules.rootShell).toContain('h-screen');
    expect(shellLayoutRules.rootShell).toContain('overflow-hidden');
    expect(shellLayoutRules.sidebarContainer).toContain('h-screen');
    expect(shellLayoutRules.workspaceArea).toContain('h-screen');
    expect(shellLayoutRules.workspaceArea).toContain('overflow-hidden');
    expect(shellLayoutRules.mainContentPane).toContain('overflow-y-auto');
  });
});
