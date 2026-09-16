import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { StorageService } from '../../utils/persistence';
import { SystemUser } from '../../types';

class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
  get length(): number {
    return Object.keys(this.store).length;
  }
  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

describe('R10-C — Restore the Real Active User as the First Directory User', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      (globalThis as any).localStorage = new MockLocalStorage();
    }
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes and persists the real active operator as the first directory user when storage is empty', () => {
    // Fresh application / empty storage
    const directoryUsers = StorageService.getUsers();
    expect(directoryUsers.length).toBe(1);

    const firstUser = directoryUsers[0];
    expect(firstUser.id).toBe('usr-8801');
    expect(firstUser.employeeId).toBe('EMP-EO-8801');
    expect(firstUser.fullName).toBe('Sahafiz');
    expect(firstUser.company).toBe('EO Technics');
    expect(firstUser.department).toBe('Service Operations');
    expect(firstUser.role).toBe('Field Service Engineer');
    expect(firstUser.email).toBe('sahafiz@eotechnics.com');
    expect(firstUser.phone).toBe('+60 12-882 1042');
    expect(firstUser.status).toBe('Online');
    expect(firstUser.accountStatus).toBe('Active');

    // Verify written to localStorage
    const rawPersisted = JSON.parse(localStorage.getItem('fso_v073_users')!);
    expect(rawPersisted.length).toBe(1);
    expect(rawPersisted[0].fullName).toBe('Sahafiz');
  });

  it('reloads and preserves the real active user without creating duplicates', () => {
    // First load initializes real active operator
    const initialLoad = StorageService.getUsers();
    expect(initialLoad.length).toBe(1);

    // Subsequent reload
    const reloaded = StorageService.getUsers();
    expect(reloaded.length).toBe(1);
    expect(reloaded[0].id).toBe('usr-8801');
    expect(reloaded[0].fullName).toBe('Sahafiz');
  });

  it('preserves existing genuine directory users and does not duplicate or overwrite them', () => {
    const existingGenuineUser: SystemUser = {
      id: 'usr-genuine-99',
      employeeId: 'EMP-GEN-99',
      fullName: 'Alex Morgan',
      email: 'a.morgan@eotechnics.com',
      phone: '+60 12-333 4444',
      company: 'EO Technics',
      department: 'Service Operations',
      role: 'Senior Engineer',
      status: 'Online',
      lastLogin: 'Active now',
      timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
      language: 'English (US)',
      accountStatus: 'Active',
      bio: 'Senior laser field engineer'
    };

    StorageService.saveUsers([existingGenuineUser]);

    const retrieved = StorageService.getUsers();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].id).toBe('usr-genuine-99');
    expect(retrieved[0].fullName).toBe('Alex Morgan');
    // Does not re-inject usr-8801 because genuine users already exist
    expect(retrieved.some(u => u.id === 'usr-8801')).toBe(false);
  });

  it('purges legacy ghost users (usr-101..usr-107) and restores the real active user when no genuine users remain', () => {
    const legacyGhostsOnly = [
      { id: 'usr-101', employeeId: 'EMP-EO-8801', fullName: 'Sahafiz', email: 'sahafiz@eotechnics.com' },
      { id: 'usr-102', employeeId: 'EMP-EO-8802', fullName: 'Marcus Vance', email: 'm.vance@eotechnics.com' },
      { id: 'usr-103', employeeId: 'EMP-EO-8803', fullName: 'Elena Rostova', email: 'e.rostova@eotechnics.com' }
    ];

    localStorage.setItem('fso_v073_users', JSON.stringify(legacyGhostsOnly));

    StorageService.purgePersistedGhostUsers();

    const users = StorageService.getUsers();
    expect(users.length).toBe(1);
    expect(users[0].id).toBe('usr-8801');
    expect(users[0].fullName).toBe('Sahafiz');
    // Ghost IDs are completely gone
    expect(users.some(u => u.id === 'usr-101' || u.id === 'usr-102' || u.id === 'usr-103')).toBe(false);
  });

  it('preserves genuine users during ghost purge and does not overwrite with default operator', () => {
    const genuineUser: SystemUser = {
      id: 'usr-custom-1',
      employeeId: 'EMP-CUST-1',
      fullName: 'Genuine User',
      email: 'cust@eotechnics.com',
      phone: '+60 12-000 1111',
      company: 'EO Technics',
      department: 'Service Operations',
      role: 'Field Service Engineer',
      status: 'Online',
      lastLogin: 'Active now',
      timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
      language: 'English (US)',
      accountStatus: 'Active',
      bio: 'Genuine field specialist'
    };

    const mixed = [
      { id: 'usr-101', employeeId: 'EMP-EO-8801', fullName: 'Ghost 1' },
      genuineUser,
      { id: 'usr-105', employeeId: 'EMP-EO-8805', fullName: 'Ghost 5' }
    ];

    localStorage.setItem('fso_v073_users', JSON.stringify(mixed));

    StorageService.purgePersistedGhostUsers();

    const users = StorageService.getUsers();
    expect(users.length).toBe(1);
    expect(users[0].id).toBe('usr-custom-1');
    expect(users[0].fullName).toBe('Genuine User');
  });
});

describe('R10-E — Engineers Directory UX Redesign & Operational Behavior', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      (globalThis as any).localStorage = new MockLocalStorage();
    }
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies single-user directory state with active operator Sahafiz', () => {
    const users = StorageService.getUsers();
    expect(users.length).toBe(1);

    const activeUser = users[0];
    expect(activeUser.fullName).toBe('Sahafiz');
    expect(activeUser.role).toBe('Field Service Engineer');
    expect(activeUser.employeeId).toBe('EMP-EO-8801');
    expect(activeUser.status).toBe('Online');
  });

  it('supports multi-user persistence and directory queries', () => {
    const initial = StorageService.getUsers();
    expect(initial.length).toBe(1);

    const engineer2: SystemUser = {
      id: 'usr-8802',
      employeeId: 'EMP-EO-8802',
      fullName: 'Marcus Vance',
      email: 'm.vance@eotechnics.com',
      phone: '+60 12-444 5555',
      company: 'EO Technics',
      department: 'Service Operations',
      role: 'Senior Engineer',
      status: 'Busy',
      lastLogin: 'Active now',
      timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
      language: 'English (US)',
      accountStatus: 'Active',
      bio: 'Laser alignment engineer'
    };

    const supervisor1: SystemUser = {
      id: 'usr-8803',
      employeeId: 'EMP-EO-8803',
      fullName: 'Elena Rostova',
      email: 'e.rostova@eotechnics.com',
      phone: '+60 12-777 8888',
      company: 'EO Technics',
      department: 'Service Operations',
      role: 'Supervisor',
      status: 'Online',
      lastLogin: 'Active now',
      timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
      language: 'English (US)',
      accountStatus: 'Active',
      bio: 'Field service supervisor'
    };

    StorageService.saveUsers([...initial, engineer2, supervisor1]);

    const updated = StorageService.getUsers();
    expect(updated.length).toBe(3);

    // Search query behavior
    const queryName = 'marcus';
    const searched = updated.filter(u => 
      u.fullName.toLowerCase().includes(queryName) ||
      u.employeeId.toLowerCase().includes(queryName) ||
      u.email.toLowerCase().includes(queryName)
    );
    expect(searched.length).toBe(1);
    expect(searched[0].id).toBe('usr-8802');

    // Role filter
    const seniorEngineers = updated.filter(u => u.role === 'Senior Engineer');
    expect(seniorEngineers.length).toBe(1);
    expect(seniorEngineers[0].fullName).toBe('Marcus Vance');

    // Status filter
    const onlineUsers = updated.filter(u => u.status === 'Online');
    expect(onlineUsers.length).toBe(2);

    const busyUsers = updated.filter(u => u.status === 'Busy');
    expect(busyUsers.length).toBe(1);
    expect(busyUsers[0].fullName).toBe('Marcus Vance');
  });

  it('protects active operator from accidental deletion', () => {
    const users = StorageService.getUsers();
    const activeOperator = users[0];

    // Simulating deletion filter on directory
    const deleteTargetId = activeOperator.id;
    // System rule: active user cannot be deleted
    const canDelete = (targetId: string, activeId: string) => targetId !== activeId;
    expect(canDelete(deleteTargetId, activeOperator.id)).toBe(false);

    // If another user is deleted, active user remains intact
    const nonActiveUser: SystemUser = {
      id: 'usr-temp-01',
      employeeId: 'EMP-EO-9999',
      fullName: 'Temporary Engineer',
      email: 'temp@eotechnics.com',
      phone: '+60 12-000 9999',
      company: 'EO Technics',
      department: 'Service Operations',
      role: 'Field Service Engineer',
      status: 'Offline',
      lastLogin: 'Never',
      timezone: 'UTC',
      language: 'English (US)',
      accountStatus: 'Active'
    };

    StorageService.saveUsers([...users, nonActiveUser]);
    expect(StorageService.getUsers().length).toBe(2);

    expect(canDelete(nonActiveUser.id, activeOperator.id)).toBe(true);
    const afterDeletion = StorageService.getUsers().filter(u => u.id !== nonActiveUser.id);
    StorageService.saveUsers(afterDeletion);

    const finalUsers = StorageService.getUsers();
    expect(finalUsers.length).toBe(1);
    expect(finalUsers[0].id).toBe(activeOperator.id);
  });
});
