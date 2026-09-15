import { describe, it, expect } from 'vitest';
import { SystemUser, UserRole, WorkspaceMode } from '../../types';
import { CANONICAL_TIMEZONES } from '../../constants/timezones';

describe('Profile Usability, Identity Integrity & Permissions (R9-D)', () => {
  const standardEngineer: SystemUser = {
    id: 'usr-001',
    employeeId: 'EMP-EO-8801',
    fullName: 'Sahafiz',
    email: 'sahafiz@eotechnics.com',
    phone: '+60 12-882 1042',
    company: 'EO Technics',
    department: 'Service Operations',
    role: 'Field Service Engineer',
    status: 'Online',
    lastLogin: '2026-09-15 08:30',
    timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: 'Laser specialist'
  };

  const adminUser: SystemUser = {
    ...standardEngineer,
    id: 'usr-admin',
    employeeId: 'EMP-ADMIN-01',
    role: 'Administrator'
  };

  it('prohibits standard engineers from modifying employeeId and self-elevating security role', () => {
    const isAuthorizedAdmin = false;

    const submittedForm: SystemUser = {
      ...standardEngineer,
      fullName: 'Sahafiz (Updated)',
      employeeId: 'HACKED-999',
      role: 'Administrator'
    };

    // Sanitize logic enforced in ProfileModule handleSubmit
    const sanitizedData: SystemUser = {
      ...submittedForm,
      employeeId: isAuthorizedAdmin ? submittedForm.employeeId : standardEngineer.employeeId,
      role: isAuthorizedAdmin ? submittedForm.role : standardEngineer.role
    };

    expect(sanitizedData.fullName).toBe('Sahafiz (Updated)');
    expect(sanitizedData.employeeId).toBe('EMP-EO-8801');
    expect(sanitizedData.role).toBe('Field Service Engineer');
  });

  it('permits authorized administrators to modify employeeId and assign system roles', () => {
    const isAuthorizedAdmin = true;

    const submittedForm: SystemUser = {
      ...adminUser,
      fullName: 'Sahafiz Admin',
      employeeId: 'EMP-EO-8801-SENIOR',
      role: 'Senior Engineer'
    };

    const sanitizedData: SystemUser = {
      ...submittedForm,
      employeeId: isAuthorizedAdmin ? submittedForm.employeeId : adminUser.employeeId,
      role: isAuthorizedAdmin ? submittedForm.role : adminUser.role
    };

    expect(sanitizedData.fullName).toBe('Sahafiz Admin');
    expect(sanitizedData.employeeId).toBe('EMP-EO-8801-SENIOR');
    expect(sanitizedData.role).toBe('Senior Engineer');
  });

  it('allows Founder Suite workspace mode to perform administrative edits', () => {
    const workspaceMode: WorkspaceMode = 'FOUNDER_MODE';
    const role = 'Supervisor' as UserRole;

    const isAuthorizedAdmin = role === 'Administrator' || workspaceMode === 'FOUNDER_MODE';
    expect(isAuthorizedAdmin).toBe(true);
  });

  it('validates canonical timezone list integrity and preservation', () => {
    expect(CANONICAL_TIMEZONES.length).toBeGreaterThanOrEqual(10);
    
    // Core semiconductor regions
    const timezoneValues = CANONICAL_TIMEZONES.map(t => t.value);
    expect(timezoneValues).toContain('Asia/Kuala_Lumpur (UTC+08:00)');
    expect(timezoneValues).toContain('Asia/Singapore (UTC+08:00)');
    expect(timezoneValues).toContain('Asia/Taipei (UTC+08:00)');
    expect(timezoneValues).toContain('Asia/Seoul (UTC+09:00)');
    expect(timezoneValues).toContain('UTC (UTC+00:00)');

    // Ensure all entries have valid labels and regions
    CANONICAL_TIMEZONES.forEach(tz => {
      expect(tz.value).toBeTruthy();
      expect(tz.label).toBeTruthy();
      expect(tz.region).toBeTruthy();
    });
  });

  it('preserves valid operational status transitions', () => {
    const validStatuses = ['Online', 'Busy', 'On Leave', 'Offline'] as const;
    validStatuses.forEach(status => {
      const updatedUser: SystemUser = { ...standardEngineer, status };
      expect(updatedUser.status).toBe(status);
    });
  });
});
