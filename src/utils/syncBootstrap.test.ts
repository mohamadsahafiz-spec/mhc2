/* =====================================================
   FSOS LOCAL-TO-D1 BOOTSTRAP & RECONCILIATION TESTS (syncBootstrap.test.ts)
   ===================================================== */
import { describe, it, expect } from 'vitest';
import worker from '../worker';
import { SyncEngine } from './syncEngine';
import { StorageService } from './persistence';

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
  public shouldFail = false;

  prepare(sql: string) {
    const self = this;
    let boundArgs: any[] = [];

    const stmt = {
      bind(...args: any[]) {
        boundArgs = args;
        return stmt;
      },
      async run() {
        if (self.shouldFail) {
          throw new Error("D1 Database connection failed (Simulated outage)");
        }

        if (sql.includes("CREATE TABLE IF NOT EXISTS")) {
          return { success: true };
        }

        if (sql.includes("INSERT INTO records")) {
          const [key, table_name, record_id, data, updated_at, device_id, version, is_deleted] = boundArgs;
          self.rows.set(key, {
            key,
            table_name,
            record_id,
            data,
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
        if (self.shouldFail) {
          throw new Error("D1 Database query failed (Simulated outage)");
        }

        if (sql.includes("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0")) {
          let count = 0;
          for (const row of self.rows.values()) {
            if (row.is_deleted === 0) count++;
          }
          return { total: count };
        }

        if (sql.includes("SELECT version, updated_at FROM records WHERE key = ?")) {
          const [key] = boundArgs;
          const row = self.rows.get(key);
          if (!row) return null;
          return { version: row.version, updated_at: row.updated_at };
        }

        return null;
      },
      async all() {
        if (self.shouldFail) {
          throw new Error("D1 Database fetch failed (Simulated outage)");
        }

        if (sql.includes("FROM records") && !sql.includes("COUNT")) {
          const results = Array.from(self.rows.values()).map(r => ({
            key: r.key,
            table: r.table_name,
            recordId: r.record_id,
            data: r.data,
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

describe('SyncEngine Bootstrap & Cross-Device Reconciliation', () => {
  it('A: Bootstraps pre-existing unqueued local records to D1 without loss or duplication', async () => {
    const mockDb = new MockD1Database();
    const env = { DB: mockDb };

    // Simulate pre-existing records on Home PC
    const preExistingLocalData = {
      customers: [
        { id: 'cust-101', name: 'Precision Aerospace Ltd', industry: 'Aerospace' }
      ],
      machines: [
        { id: 'M-101', customerId: 'cust-101', machineNo: 'TRUMPF-3030', model: 'TruLaser 3030' }
      ],
      mhc_sessions: [
        { id: 'mhc-sess-1', machineId: 'M-101', status: 'COMPLETED', date: '2026-08-20' }
      ]
    };

    // Construct mock fetch pointing to worker instance
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const req = new Request(urlStr.startsWith('http') ? urlStr : `https://worker.dev${urlStr}`, init);
      return await worker.fetch(req, env);
    };

    try {
      SyncEngine.resetLocalSyncState();
      SyncEngine.registerLocalDataProvider(() => preExistingLocalData);

      // Trigger reconciliation
      await SyncEngine.reconcileLocalData();

      const stateBeforePush = SyncEngine.getState();
      expect(stateBeforePush.pendingCount).toBe(3);

      // Process queue to upload
      await SyncEngine.processQueue();

      const stateAfterPush = SyncEngine.getState();
      expect(stateAfterPush.pendingCount).toBe(0);
      expect(stateAfterPush.status).toBe('synced');
      expect(mockDb.rows.size).toBe(3);
      expect(mockDb.rows.has('customers:cust-101')).toBe(true);
      expect(mockDb.rows.has('machines:M-101')).toBe(true);
      expect(mockDb.rows.has('mhc_sessions:mhc-sess-1')).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('B: Second device (clean state) pulls bootstrapped records from D1', async () => {
    const mockDb = new MockD1Database();
    const env = { DB: mockDb };

    // Populate D1 with bootstrapped records
    mockDb.rows.set('customers:cust-101', {
      key: 'customers:cust-101',
      table_name: 'customers',
      record_id: 'cust-101',
      data: JSON.stringify({ id: 'cust-101', name: 'Precision Aerospace Ltd' }),
      updated_at: new Date().toISOString(),
      device_id: 'HOME-PC',
      version: 100,
      is_deleted: 0
    });

    const receivedTables: Record<string, any[]> = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const req = new Request(urlStr.startsWith('http') ? urlStr : `https://worker.dev${urlStr}`, init);
      return await worker.fetch(req, env);
    };

    try {
      SyncEngine.resetLocalSyncState();
      SyncEngine.registerRemoteUpdateCallback((table, records) => {
        receivedTables[table] = records;
      });
      SyncEngine.registerLocalDataProvider(() => ({}));
      SyncEngine.setDeviceId('WORK-LAPTOP');

      // Work laptop processes queue -> pulls from D1
      await SyncEngine.processQueue();

      expect(receivedTables['customers']).toBeDefined();
      expect(receivedTables['customers'].length).toBe(1);
      expect(receivedTables['customers'][0].data.name).toBe('Precision Aerospace Ltd');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('C & E: Repeated reconciliation is idempotent and does not create duplicates', async () => {
    const mockDb = new MockD1Database();
    const env = { DB: mockDb };

    const localData = {
      machines: [
        { id: 'M-200', machineNo: 'TRUMPF-5030', model: 'TruLaser 5030' }
      ]
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const req = new Request(urlStr.startsWith('http') ? urlStr : `https://worker.dev${urlStr}`, init);
      return await worker.fetch(req, env);
    };

    try {
      SyncEngine.resetLocalSyncState();
      SyncEngine.registerLocalDataProvider(() => localData);

      // Run 1
      await SyncEngine.reconcileLocalData();
      await SyncEngine.processQueue();
      expect(mockDb.rows.size).toBe(1);

      // Run 2 (Repeated bootstrap)
      await SyncEngine.reconcileLocalData();
      const state2 = SyncEngine.getState();
      expect(state2.pendingCount).toBe(0);

      await SyncEngine.processQueue();
      expect(mockDb.rows.size).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('D: Network failure leaves local data and queue intact and safely resumes', async () => {
    const mockDb = new MockD1Database();
    const env = { DB: mockDb };
    mockDb.shouldFail = true; // Simulate network/D1 failure

    const localData = {
      machines: [
        { id: 'M-ERR', machineNo: 'ERROR-TEST' }
      ]
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const req = new Request(urlStr.startsWith('http') ? urlStr : `https://worker.dev${urlStr}`, init);
      return await worker.fetch(req, env);
    };

    try {
      SyncEngine.resetLocalSyncState();
      SyncEngine.registerLocalDataProvider(() => localData);

      await SyncEngine.reconcileLocalData();
      await SyncEngine.processQueue();

      // Queue should retain item on failure
      const state = SyncEngine.getState();
      expect(state.pendingCount).toBe(1);
      expect(state.status).toBe('pending');
      expect(state.lastError).toBeDefined();

      // Recover network
      mockDb.shouldFail = false;
      await SyncEngine.processQueue();

      const recoveredState = SyncEngine.getState();
      expect(recoveredState.pendingCount).toBe(0);
      expect(recoveredState.status).toBe('synced');
      expect(mockDb.rows.has('machines:M-ERR')).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
