/* =====================================================
   FSOS MULTI-DEVICE ENGINEER PROFILE SYNC TESTS (profileSync.test.ts)
   ===================================================== */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import worker from '../worker';
import { SyncEngine } from './syncEngine';
import { StorageService } from './persistence';
import { EngineerProfile } from '../types';

interface MockD1Row {
  key: string;
  table_name: string;
  record_id: string;
  data: string | null;
  updated_at: string;
  device_id: string;
  version: number;
  is_deleted: number;
}

class MockD1Database {
  public rows = new Map<string, MockD1Row>();

  prepare(sql: string) {
    const self = this;
    let boundArgs: any[] = [];

    const stmt = {
      bind(...args: any[]) {
        boundArgs = args;
        return stmt;
      },
      async run() {
        if (sql.includes("CREATE TABLE IF NOT EXISTS")) {
          return { success: true };
        }

        if (sql.includes("INSERT INTO records")) {
          const [key, table_name, record_id, data, updated_at, device_id, version, is_deleted] = boundArgs;
          self.rows.set(key, {
            key,
            table_name,
            record_id,
            data: typeof data === 'string' ? data : JSON.stringify(data),
            updated_at,
            device_id,
            version: Number(version),
            is_deleted: Number(is_deleted)
          });
          return { success: true };
        }

        return { success: true };
      },
      async first() {
        if (sql.includes("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0")) {
          let count = 0;
          for (const r of self.rows.values()) {
            if (r.is_deleted === 0) count++;
          }
          return { total: count };
        }

        if (sql.includes("SELECT version, updated_at FROM records WHERE key = ?")) {
          const [key] = boundArgs;
          const found = self.rows.get(key);
          if (found) {
            return { version: found.version, updated_at: found.updated_at };
          }
          return null;
        }

        return null;
      },
      async all() {
        if (sql.includes("FROM records") && !sql.includes("COUNT")) {
          // If query has device_id != ?, filter out matching device records
          const results = Array.from(self.rows.values())
            .filter(r => {
              if (sql.includes("device_id !=")) {
                const devId = boundArgs[boundArgs.length - 1];
                if (r.device_id === devId) return false;
              }
              return r.is_deleted === 0;
            })
            .map(r => ({
              key: r.key,
              table: r.table_name,
              recordId: r.record_id,
              data: r.data ? JSON.parse(r.data) : null,
              updatedAt: r.updated_at,
              deviceId: r.device_id,
              version: r.version,
              isDeleted: r.is_deleted === 1
            }));
          return { results };
        }
        return { results: [] };
      }
    };

    return stmt;
  }
}

describe('FSOS Multi-Device Engineer Profile Sync', () => {
  let mockDb: MockD1Database;
  let env: any;
  let originalFetch: any;
  let originalLocalStorage: any;

  beforeEach(() => {
    mockDb = new MockD1Database();
    env = { DB: mockDb };

    originalFetch = global.fetch;
    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const req = new Request(urlStr.startsWith('http') ? urlStr : `https://worker.dev${urlStr}`, init);
      return await worker.fetch(req, env);
    };

    global.fetch = mockFetch;
    globalThis.fetch = mockFetch;
    if (typeof window !== 'undefined') {
      (window as any).fetch = mockFetch;
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
    globalThis.fetch = originalFetch;
    if (typeof window !== 'undefined') {
      (window as any).fetch = originalFetch;
    }
    if (originalLocalStorage) {
      (globalThis as any).localStorage = originalLocalStorage;
      (global as any).localStorage = originalLocalStorage;
    }
  });

  it('1. saveProfile persists profile locally and queues profile change in SyncEngine', () => {
    const memoryStorage = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => memoryStorage.get(k) || null,
      setItem: (k: string, v: string) => memoryStorage.set(k, v),
      removeItem: (k: string) => memoryStorage.delete(k),
      clear: () => memoryStorage.clear(),
      get length() { return memoryStorage.size; },
      key: (i: number) => Array.from(memoryStorage.keys())[i] || null
    };
    (globalThis as any).localStorage = mockStorage;
    (global as any).localStorage = mockStorage;

    SyncEngine.resetLocalSyncState();

    const testProfile: EngineerProfile = {
      name: 'Mohamad Sahafiz',
      company: 'EO Technics Malaysia',
      role: 'Senior Field Service Engineer',
      department: 'Laser Precision Systems',
      email: 'sahafiz@eotechnics.com',
      badge: 'EMP-EO-8801',
      avatarUrl: ''
    };

    StorageService.saveProfile(testProfile);

    // Verify localStorage
    const saved = StorageService.getProfile();
    expect(saved.name).toBe('Mohamad Sahafiz');
    expect(saved.email).toBe('sahafiz@eotechnics.com');
    expect(saved.badge).toBe('EMP-EO-8801');
    expect(saved.version).toBeDefined();

    // Verify SyncEngine queue contains the change
    const state = SyncEngine.getState();
    expect(state.pendingCount).toBeGreaterThanOrEqual(1);

    const queueStr = memoryStorage.get('fsos_sync_queue');
    expect(queueStr).toBeDefined();
    const queue = JSON.parse(queueStr!);
    const profileItem = queue.find((q: any) => q.table === 'profile' && q.recordId === 'profile');
    expect(profileItem).toBeDefined();
    expect(profileItem.data.name).toBe('Mohamad Sahafiz');
    expect(profileItem.data.badge).toBe('EMP-EO-8801');
  });

  it('2. getAllLocalData includes authoritative profile entity for cloud reconciliation', () => {
    const allData = StorageService.getAllLocalData();
    expect(allData.profile).toBeDefined();
    expect(Array.isArray(allData.profile)).toBe(true);
    expect(allData.profile.length).toBe(1);
    expect(allData.profile[0].id).toBe('profile');
    expect(allData.profile[0].name).toBeDefined();
  });

  it('3. Multi-device sync: Device A edits profile -> Cloud D1 persists -> Device B pulls updated profile', async () => {
    // -------------------------------------------------------------
    // Device A (STM-LAPTOP)
    // -------------------------------------------------------------
    const storageDeviceA = new Map<string, string>();
    const mockStorageA = {
      getItem: (k: string) => storageDeviceA.get(k) || null,
      setItem: (k: string, v: string) => storageDeviceA.set(k, v),
      removeItem: (k: string) => storageDeviceA.delete(k),
      clear: () => storageDeviceA.clear(),
      get length() { return storageDeviceA.size; },
      key: (i: number) => Array.from(storageDeviceA.keys())[i] || null
    };
    (globalThis as any).localStorage = mockStorageA;
    (global as any).localStorage = mockStorageA;

    SyncEngine.resetLocalSyncState();
    SyncEngine.setDeviceId('STM-LAPTOP');

    // Device A updates profile
    const deviceAProfile: EngineerProfile = {
      name: 'Mohamad Sahafiz',
      company: 'EO Technics Asia',
      role: 'Principal Field Service Engineer',
      department: 'Global Advanced Support',
      email: 'sahafiz.lead@eotechnics.com',
      badge: 'BADGE-9902',
      avatarUrl: ''
    };
    StorageService.saveProfile(deviceAProfile);

    // Device A flushes queue to D1
    await SyncEngine.processQueue();

    // Verify Cloud D1 record
    expect(mockDb.rows.has('profile:profile')).toBe(true);
    const cloudRecord = mockDb.rows.get('profile:profile')!;
    expect(cloudRecord.device_id).toBe('STM-LAPTOP');
    const parsedCloudData = JSON.parse(cloudRecord.data!);
    expect(parsedCloudData.name).toBe('Mohamad Sahafiz');
    expect(parsedCloudData.email).toBe('sahafiz.lead@eotechnics.com');
    expect(parsedCloudData.badge).toBe('BADGE-9902');

    // -------------------------------------------------------------
    // Device B (HOME-PC)
    // -------------------------------------------------------------
    const storageDeviceB = new Map<string, string>();
    const mockStorageB = {
      getItem: (k: string) => storageDeviceB.get(k) || null,
      setItem: (k: string, v: string) => storageDeviceB.set(k, v),
      removeItem: (k: string) => storageDeviceB.delete(k),
      clear: () => storageDeviceB.clear(),
      get length() { return storageDeviceB.size; },
      key: (i: number) => Array.from(storageDeviceB.keys())[i] || null
    };
    (globalThis as any).localStorage = mockStorageB;
    (global as any).localStorage = mockStorageB;

    SyncEngine.resetLocalSyncState();
    SyncEngine.setDeviceId('HOME-PC');

    // Device B syncs with cloud
    await SyncEngine.processQueue();

    // Device B should now have Device A's updated profile
    const syncedBProfile = StorageService.getProfile();
    expect(syncedBProfile.name).toBe('Mohamad Sahafiz');
    expect(syncedBProfile.email).toBe('sahafiz.lead@eotechnics.com');
    expect(syncedBProfile.badge).toBe('BADGE-9902');

    // Device B initial active operator reflects synced values
    const syncedOperator = StorageService.getInitialActiveOperator();
    expect(syncedOperator.fullName).toBe('Mohamad Sahafiz');
    expect(syncedOperator.email).toBe('sahafiz.lead@eotechnics.com');
    expect(syncedOperator.employeeId).toBe('BADGE-9902');
  });

  it('4. Legacy profile fallback: reads existing legacy format without error', () => {
    const memoryStorage = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => memoryStorage.get(k) || null,
      setItem: (k: string, v: string) => memoryStorage.set(k, v),
      removeItem: (k: string) => memoryStorage.delete(k),
      clear: () => memoryStorage.clear(),
      get length() { return memoryStorage.size; },
      key: (i: number) => Array.from(memoryStorage.keys())[i] || null
    };
    (globalThis as any).localStorage = mockStorage;
    (global as any).localStorage = mockStorage;

    // Stored without badge or employeeId
    const legacyRaw = JSON.stringify({
      name: 'Legacy Engineer',
      company: 'Legacy Co',
      role: 'Technician',
      department: 'Field'
    });
    memoryStorage.set('fso_v072_profile', legacyRaw);

    const loaded = StorageService.getProfile();
    expect(loaded.name).toBe('Legacy Engineer');
    expect(loaded.company).toBe('Legacy Co');
    expect(loaded.badge).toBe('EMP-EO-8801'); // Safe fallback
    expect(loaded.email).toBe('sahafiz@eotechnics.com'); // Safe fallback
  });
});
