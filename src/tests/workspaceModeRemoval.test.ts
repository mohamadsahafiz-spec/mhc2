import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Legacy Workspace Mode Removal Verification', () => {
  it('confirms SettingsModule UI does not contain Default Workspace Mode selector', () => {
    const settingsPath = path.resolve(__dirname, '../components/modules/SettingsModule.tsx');
    const settingsContent = fs.readFileSync(settingsPath, 'utf-8');

    // Confirm selector title and mode cards are completely removed
    expect(settingsContent).not.toContain('Default Workspace Mode');
    expect(settingsContent).not.toContain('MHC MODE');
    expect(settingsContent).not.toContain('OPERATIONS SUITE');
    expect(settingsContent).not.toContain('handleWorkspaceModeChange');
    expect(settingsContent).not.toContain('setWorkspaceModeState');

    // Confirm other Application settings remain fully intact
    expect(settingsContent).toContain('Application & Workspace Configuration');
    expect(settingsContent).toContain('Sidebar Default State');
    expect(settingsContent).toContain('handleSidebarPrefToggle');
  });

  it('confirms LoginPage UI does not contain Target Workspace Mode selector', () => {
    const loginPath = path.resolve(__dirname, '../components/auth/LoginPage.tsx');
    const loginContent = fs.readFileSync(loginPath, 'utf-8');

    // Confirm Target Workspace Mode radio group and mode buttons are completely removed
    expect(loginContent).not.toContain('Target Workspace Mode');
    expect(loginContent).not.toContain('login-mode-container');
    expect(loginContent).not.toContain('login-mode-btn');
    expect(loginContent).not.toContain('activeWorkspaceMode');
    expect(loginContent).not.toContain('setPreferredMode');

    // Confirm standard login form controls remain fully operational
    expect(loginContent).toContain('id="email-input"');
    expect(loginContent).toContain('id="password-input"');
    expect(loginContent).toContain('id="login-submit-btn"');
    expect(loginContent).toContain('handleSubmit');
  });

  it('confirms App.tsx does not contain workspaceMode routing or dead handleModeChange handler', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // Confirm workspaceMode state and dead handler are removed
    expect(appContent).not.toContain('handleModeChange');
    expect(appContent).not.toContain('setWorkspaceMode');
    expect(appContent).not.toContain('savedWorkspaceMode');
    expect(appContent).not.toContain('workspaceMode={workspaceMode}');

    // Confirm standard application layout and login flows remain intact
    expect(appContent).toContain('handleLoginSuccess');
    expect(appContent).toContain('handleLogout');
    expect(appContent).toContain('activeTab');
  });

  it('confirms Sidebar.tsx does not filter navigation groups by workspace mode', () => {
    const sidebarPath = path.resolve(__dirname, '../components/layout/Sidebar.tsx');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

    // Confirm workspaceMode prop and isMhcMode filtering logic are removed
    expect(sidebarContent).not.toContain('workspaceMode');
    expect(sidebarContent).not.toContain('isMhcMode');

    // Confirm canonical operational navigation groups are preserved
    expect(sidebarContent).toContain("key: 'work'");
    expect(sidebarContent).toContain("key: 'mhc_category'");
    expect(sidebarContent).toContain("key: 'assets'");
    expect(sidebarContent).toContain("key: 'fleet'");
    expect(sidebarContent).toContain("key: 'system'");
  });

  it('confirms obsolete WorkspaceModeSelector component is completely removed', () => {
    const selectorPath = path.resolve(__dirname, '../components/layout/WorkspaceModeSelector.tsx');
    expect(fs.existsSync(selectorPath)).toBe(false);
  });
});
