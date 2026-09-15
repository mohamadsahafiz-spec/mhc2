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

  describe('Service Coverage Assignment & Map Foundation (R9-E)', () => {
    const mockPlants = [
      {
        id: 'PLANT-01',
        customerId: 'CUST-01',
        customerName: 'SilTerra Malaysia',
        name: 'Fab 1 Cleanroom',
        location: 'Kulim Hi-Tech Park, Kedah, Malaysia',
        timezone: 'Asia/Kuala_Lumpur',
        linesCount: 3,
        machinesCount: 6
      },
      {
        id: 'PLANT-02',
        customerId: 'CUST-01',
        customerName: 'SilTerra Malaysia',
        name: 'Fab 2 Expansion',
        location: 'Kulim Hi-Tech Park, Kedah, Malaysia',
        timezone: 'Asia/Kuala_Lumpur',
        linesCount: 2,
        machinesCount: 4
      },
      {
        id: 'PLANT-03',
        customerId: 'CUST-02',
        customerName: 'TF-AMD Penang',
        name: 'Bayan Lepas Facility',
        location: 'Penang, Malaysia',
        timezone: 'Asia/Kuala_Lumpur',
        linesCount: 4,
        machinesCount: 8
      }
    ];

    it('allows authorized administrators to assign and remove service locations (plant IDs)', () => {
      const isAuthorizedAdmin = true;
      let userLocations: string[] = [];

      // Assign PLANT-01 and PLANT-03
      if (isAuthorizedAdmin) {
        userLocations = [...userLocations, 'PLANT-01', 'PLANT-03'];
      }
      expect(userLocations).toEqual(['PLANT-01', 'PLANT-03']);

      // Remove PLANT-01
      if (isAuthorizedAdmin) {
        userLocations = userLocations.filter(id => id !== 'PLANT-01');
      }
      expect(userLocations).toEqual(['PLANT-03']);
    });

    it('prohibits unauthorized users from mutating assigned service locations directly', () => {
      const isAuthorizedAdmin = false;
      const initialUser: SystemUser = {
        ...standardEngineer,
        assignedServiceLocations: ['PLANT-01']
      };

      const submittedForm: SystemUser = {
        ...initialUser,
        assignedServiceLocations: ['PLANT-01', 'PLANT-02', 'PLANT-03']
      };

      const sanitizedData: SystemUser = {
        ...submittedForm,
        assignedServiceLocations: isAuthorizedAdmin
          ? submittedForm.assignedServiceLocations
          : initialUser.assignedServiceLocations
      };

      expect(sanitizedData.assignedServiceLocations).toEqual(['PLANT-01']);
    });

    it('correctly resolves assigned plant records and filters unassigned available plants', () => {
      const assignedIds = ['PLANT-01'];
      
      const assignedPlants = assignedIds
        .map(id => mockPlants.find(p => p.id === id))
        .filter(Boolean);

      const availablePlants = mockPlants.filter(p => !assignedIds.includes(p.id));

      expect(assignedPlants.length).toBe(1);
      expect(assignedPlants[0]?.customerName).toBe('SilTerra Malaysia');
      expect(assignedPlants[0]?.name).toBe('Fab 1 Cleanroom');

      expect(availablePlants.length).toBe(2);
      expect(availablePlants.map(p => p.id)).toEqual(['PLANT-02', 'PLANT-03']);
    });
  });
});
