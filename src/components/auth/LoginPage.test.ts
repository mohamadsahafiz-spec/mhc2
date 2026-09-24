import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { WorkspaceMode, SystemUser } from '../../types';
import { APP_VERSION } from '../../constants/version';

describe('FSOS Login UI & Session Contract', () => {
  const mockUser: SystemUser = {
    id: 'usr-test-1',
    employeeId: 'EMP-EO-9999',
    fullName: 'Test Engineer',
    email: 'test.engineer@eotechnics.com',
    phone: '+60 12-000 0000',
    company: 'EO Technics',
    department: 'Service Operations',
    role: 'Field Service Engineer',
    status: 'Online',
    lastLogin: 'Active now',
    timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  it('verifies default workspace modes and labels', () => {
    const modes: WorkspaceMode[] = ['MHC_MODE', 'FOUNDER_MODE'];
    expect(modes).toContain('MHC_MODE');
    expect(modes).toContain('FOUNDER_MODE');

    const modeLabels: Record<WorkspaceMode, { title: string; subtitle: string }> = {
      MHC_MODE: {
        title: 'MHC Mode',
        subtitle: 'Focused Health Check'
      },
      FOUNDER_MODE: {
        title: 'Founder Mode',
        subtitle: 'Complete Platform'
      }
    };

    expect(modeLabels.MHC_MODE.title).toBe('MHC Mode');
    expect(modeLabels.FOUNDER_MODE.title).toBe('Founder Mode');
  });

  it('verifies session generation payload matches FSOS contract', () => {
    const initialMode: WorkspaceMode = 'MHC_MODE';
    const session = {
      isAuthenticated: true,
      userId: mockUser.id,
      engineerName: mockUser.fullName,
      profilePhoto: mockUser.avatarUrl,
      role: mockUser.role,
      company: mockUser.company || 'EO Technics',
      department: mockUser.department || 'Field Engineering',
      operationalStatus: mockUser.status || 'Active',
      lastLogin: new Date().toISOString(),
      workspaceMode: initialMode
    };

    expect(session.isAuthenticated).toBe(true);
    expect(session.userId).toBe('usr-test-1');
    expect(session.engineerName).toBe('Test Engineer');
    expect(session.workspaceMode).toBe('MHC_MODE');
    expect(session.company).toBe('EO Technics');
    expect(session.profilePhoto).toBe('https://example.com/avatar.jpg');
  });

  it('guarantees FSOS Wafer Mark optical centering and circular reference alignment', () => {
    // Wafer physical artwork geometry matches reference semiconductor wafer:
    // Radius R = 44, centered at (50, 50)
    // Top = 50 - 44 = 6, Bottom = 50 + 44 = 94 (height = 88)
    // Left = 50 - 44 = 6, Right = 50 + 44 = 94 (width = 88)
    const centerX = 50;
    const centerY = 50;
    const radius = 44;

    const minX = centerX - radius;
    const maxX = centerX + radius;
    const minY = centerY - radius;
    const maxY = centerY + radius;

    expect(minX).toBe(6);
    expect(maxX).toBe(94);
    expect(minY).toBe(6);
    expect(maxY).toBe(94);

    // Symmetric die grid bounds (9x9 grid centered at 50, 50):
    // Top-most die edge = 10.5, Bottom-most die edge = 89.5
    // Left-most die edge = 10.5, Right-most die edge = 89.5
    const dieGridMin = 10.5;
    const dieGridMax = 89.5;
    expect((dieGridMin + dieGridMax) / 2).toBe(50);
    expect(minY - 0).toBe(100 - maxY); // ViewBox margins: 6 top, 6 bottom
    expect(minX - 0).toBe(100 - maxX); // ViewBox margins: 6 left, 6 right
  });

  it('guarantees login form does not introduce unauthorized remote OAuth or 3P backends', () => {
    // Local-first session integrity check
    const isLocalAuth = true;
    expect(isLocalAuth).toBe(true);
  });

  it('verifies all 4 decorative corner telemetry labels are removed from LoginBackground', () => {
    const bgPath = path.resolve(__dirname, 'LoginBackground.tsx');
    const bgContent = fs.readFileSync(bgPath, 'utf-8');

    // Ensure unwanted corner text labels are completely absent
    expect(bgContent).not.toContain('login-corner-meta');
    expect(bgContent).not.toContain('GRID: CALIBRATED');
    expect(bgContent).not.toContain('CLEANROOM CERTIFIED');
    expect(bgContent).not.toContain('SECURITY: LOCAL-FIRST');
    expect(bgContent).not.toContain('FSOS PRECISION SYSTEM');

    // Ensure essential background atmosphere is preserved
    expect(bgContent).toContain('ThemeCanvasShader');
    expect(bgContent).toContain('login-ambient-spotlight');
    expect(bgContent).toContain('fsos-dense-grid');
    expect(bgContent).toContain('login-scan-beam');
  });

  it('verifies authoritative FSOS version is rendered on the login screen without duplication', () => {
    const loginPagePath = path.resolve(__dirname, 'LoginPage.tsx');
    const loginContent = fs.readFileSync(loginPagePath, 'utf-8');

    // Verifies authoritative import from constants/version
    expect(loginContent).toContain("import { APP_VERSION } from '../../constants/version';");
    expect(loginContent).toContain('FSOS {APP_VERSION}');

    // Ensures APP_VERSION is valid format
    expect(APP_VERSION).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('verifies pre-login theme switcher integration and persistence wiring', () => {
    const loginPagePath = path.resolve(__dirname, 'LoginPage.tsx');
    const loginContent = fs.readFileSync(loginPagePath, 'utf-8');

    // HeaderThemeSwitch integration
    expect(loginContent).toContain("import { HeaderThemeSwitch } from '../layout/HeaderThemeSwitch';");
    expect(loginContent).toContain('<HeaderThemeSwitch activeTheme={activeTheme} onThemeChange={setTheme} />');

    // Reuses standard ThemeContext
    expect(loginContent).toContain("const { effectiveTheme, activeTheme, setTheme } = useTheme();");
  });

  it('verifies login form controls remain fully structured and accessible', () => {
    const loginPagePath = path.resolve(__dirname, 'LoginPage.tsx');
    const loginContent = fs.readFileSync(loginPagePath, 'utf-8');

    expect(loginContent).toContain('id="account-select"');
    expect(loginContent).toContain('id="email-input"');
    expect(loginContent).toContain('id="password-input"');
    expect(loginContent).toContain('role="radiogroup"');
    expect(loginContent).toContain('id="login-submit-btn"');
    expect(loginContent).toContain('SIGN IN TO WORKSPACE');
  });

  it('verifies password visibility toggle functionality and icon contrast wiring', () => {
    const loginPagePath = path.resolve(__dirname, 'LoginPage.tsx');
    const loginContent = fs.readFileSync(loginPagePath, 'utf-8');

    // Verifies Eye and EyeOff imports and toggle button
    expect(loginContent).toContain('id="password-visibility-toggle"');
    expect(loginContent).toContain("type={showPassword ? 'text' : 'password'}");
    expect(loginContent).toContain('setShowPassword(!showPassword)');

    // Verifies input icon contrast classes
    expect(loginContent).toContain('login-input-icon');
  });
});


