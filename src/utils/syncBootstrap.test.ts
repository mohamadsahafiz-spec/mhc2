/* =====================================================
   FSOS LOCAL-TO-D1 BOOTSTRAP & RECONCILIATION TESTS (syncBootstrap.test.ts)
   ===================================================== */
import { describe, it, expect } from 'vitest';
import worker from '../worker';
import { SyncEngine } from './syncEngine';
import { StorageService } from './persistence';

import { ImageStore } from './imageStore';

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

interface MockImageChunkRow {
  image_id: string;
  chunk_index: number;
  total_chunks: number;
  data: Uint8Array;
  mime_type: string;
  byte_size: number;
  created_at: string;
}

class MockD1Database {
  public rows = new Map<string, MockD1Row>();
  public imageChunks = new Map<string, MockImageChunkRow[]>();
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

        if (sql.includes("INSERT INTO image_chunks")) {
          const [imageId, chunkIndex, totalChunks, chunkData, mimeType, byteSize, createdAt] = boundArgs;
          const existing = self.imageChunks.get(imageId) || [];
          const updated = existing.filter(c => c.chunk_index !== Number(chunkIndex));
          updated.push({
            image_id: imageId,
            chunk_index: Number(chunkIndex),
            total_chunks: Number(totalChunks),
            data: chunkData,
            mime_type: mimeType,
            byte_size: Number(byteSize),
            created_at: createdAt
          });
          self.imageChunks.set(imageId, updated);
          return { success: true };
        }

        if (sql.includes("DELETE FROM image_chunks WHERE image_id = ? AND chunk_index >= ?")) {
          const [imageId, totalChunks] = boundArgs;
          const existing = self.imageChunks.get(imageId);
          if (existing) {
            self.imageChunks.set(imageId, existing.filter(c => c.chunk_index < Number(totalChunks)));
          }
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

        if (sql.includes("FROM image_chunks WHERE image_id = ? AND chunk_index = ?")) {
          const [imageId, chunkIndex] = boundArgs;
          const chunks = self.imageChunks.get(imageId);
          if (!chunks) return { results: [] };
          const matched = chunks.find(c => c.chunk_index === Number(chunkIndex));
          return { results: matched ? [matched] : [] };
        }

        if (sql.includes("FROM image_chunks WHERE image_id = ?")) {
          const [imageId] = boundArgs;
          const chunks = self.imageChunks.get(imageId);
          if (!chunks || chunks.length === 0) return { results: [] };
          const sorted = [...chunks].sort((a, b) => a.chunk_index - b.chunk_index);
          return { results: [sorted[0]] };
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

  it('F: Machine number edit persists through StorageService, SyncEngine, and getMachines hydration', async () => {
    const mockDb = new MockD1Database();
    const env = { DB: mockDb };

    const storageMap = new Map<string, string>();
    const mockLocalStorage = {
      getItem: (key: string) => storageMap.get(key) || null,
      setItem: (key: string, val: string) => storageMap.set(key, val),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
      get length() { return storageMap.size; },
      key: (i: number) => Array.from(storageMap.keys())[i] || null
    };

    const originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = mockLocalStorage;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const req = new Request(urlStr.startsWith('http') ? urlStr : `https://worker.dev${urlStr}`, init);
      return await worker.fetch(req, env);
    };

    try {
      SyncEngine.resetLocalSyncState();

      // 1. Initial machine state
      const initialMachine = {
        id: 'WD-81810',
        machineNumber: 'WLVIA#002',
        machineNo: 'WLVIA#002',
        serialNumber: 'MC240005',
        serialNo: 'MC240005',
        model: 'BMD250WM',
        customerId: 'cust-1',
        customerName: 'Customer Alpha',
        lasers: [{ id: 'WD-81810-L1', serialNo: 'MC240005-L1', baseLaserHour: 4000 }]
      };

      StorageService.saveMachines([initialMachine as any]);
      await SyncEngine.processQueue();

      // 2. User edits machine number in UI and saves
      const editedMachine = {
        ...initialMachine,
        machineNumber: 'WLVIA#002-MODIFIED',
        machineNo: 'WLVIA#002-MODIFIED'
      };

      StorageService.saveMachines([editedMachine as any]);

      // 3. Sync cycle processes the updated machine record
      await SyncEngine.processQueue();

      // 4. Reload from StorageService (simulating App sync listener and page refresh)
      const reloadedMachines = StorageService.getMachines();
      expect(reloadedMachines.length).toBe(1);
      expect(reloadedMachines[0].machineNumber).toBe('WLVIA#002-MODIFIED');
      expect(reloadedMachines[0].machineNo).toBe('WLVIA#002-MODIFIED');
      expect(reloadedMachines[0].model).toBe('BMD250WM');
      expect(reloadedMachines[0].id).toBe('WD-81810');
    } finally {
      globalThis.fetch = originalFetch;
      (globalThis as any).localStorage = originalLocalStorage;
    }
  });

  it('G: Invalidates legacy stale image sync tracker and uploads local idb: image to D1', async () => {
    const mockDb = new MockD1Database();
    const env = { DB: mockDb };

    const storageMap = new Map<string, string>();
    // Inject legacy stale tracker simulating older/failed sync state
    storageMap.set('fsos_synced_images_v1', JSON.stringify(['idb:photo-stale-001']));

    const mockLocalStorage = {
      getItem: (key: string) => storageMap.get(key) || null,
      setItem: (key: string, val: string) => storageMap.set(key, val),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
      get length() { return storageMap.size; },
      key: (i: number) => Array.from(storageMap.keys())[i] || null
    };

    const originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = mockLocalStorage;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const req = new Request(urlStr.startsWith('http') ? urlStr : `https://worker.dev${urlStr}`, init);
      return await worker.fetch(req, env);
    };

    try {
      // 1. Save an image to local ImageStore
      const testImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      await ImageStore.saveImage('idb:photo-stale-001', testImageDataUrl);

      // 2. Add a record referencing the image
      const reportRecord = {
        id: 'rep-001',
        title: 'MHC Inspection Report',
        evidenceImageId: 'idb:photo-stale-001'
      };

      SyncEngine.resetLocalSyncState();
      SyncEngine.registerLocalDataProvider(() => ({
        reports: [reportRecord]
      }));

      // Confirm legacy tracker was purged
      expect(storageMap.has('fsos_synced_images_v1')).toBe(false);

      // 3. Process queue -> triggers reconciliation and uploadPendingImages
      await SyncEngine.processQueue();

      // 4. Verify that image was uploaded into D1 image_chunks table despite legacy marker
      expect(mockDb.imageChunks.has('idb:photo-stale-001')).toBe(true);
      const chunks = mockDb.imageChunks.get('idb:photo-stale-001');
      expect(chunks).toBeDefined();
      expect(chunks!.length).toBe(1);
      expect(chunks![0].mime_type).toBe('image/png');

      // 5. Verify confirmed tracker is now persisted
      const confirmedSaved = storageMap.get('fsos_confirmed_cloud_images_v2');
      expect(confirmedSaved).toBeDefined();
      expect(confirmedSaved).toContain('idb:photo-stale-001');
    } finally {
      globalThis.fetch = originalFetch;
      (globalThis as any).localStorage = originalLocalStorage;
    }
  });

  it('H: Target device (e.g. Work Laptop) pulls remote record and replicates missing image chunks from D1', async () => {
    const mockDb = new MockD1Database();
    const env = { DB: mockDb };

    // 1. Source PC uploads image chunks to D1
    const testBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    mockDb.imageChunks.set('idb:cross-dev-img-999', [{
      image_id: 'idb:cross-dev-img-999',
      chunk_index: 0,
      total_chunks: 1,
      data: testBytes,
      mime_type: 'image/png',
      byte_size: testBytes.byteLength,
      created_at: new Date().toISOString()
    }]);

    // Populate D1 records table with report containing the image ref
    mockDb.rows.set('mhc_reports:rep-999', {
      key: 'mhc_reports:rep-999',
      table_name: 'mhc_reports',
      record_id: 'rep-999',
      data: JSON.stringify({ id: 'rep-999', photoRef: 'idb:cross-dev-img-999' }),
      updated_at: new Date().toISOString(),
      device_id: 'HOME-PC',
      version: 1,
      is_deleted: 0
    });

    const storageMap = new Map<string, string>();
    const mockLocalStorage = {
      getItem: (key: string) => storageMap.get(key) || null,
      setItem: (key: string, val: string) => storageMap.set(key, val),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
      get length() { return storageMap.size; },
      key: (i: number) => Array.from(storageMap.keys())[i] || null
    };

    const originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = mockLocalStorage;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const req = new Request(urlStr.startsWith('http') ? urlStr : `https://worker.dev${urlStr}`, init);
      return await worker.fetch(req, env);
    };

    try {
      SyncEngine.resetLocalSyncState();
      SyncEngine.setDeviceId('WORK-LAPTOP');
      SyncEngine.registerLocalDataProvider(() => ({}));

      let receivedRecord: any = null;
      SyncEngine.registerRemoteUpdateCallback((_table, records) => {
        if (records.length > 0) {
          receivedRecord = records[0].data;
        }
      });

      // 2. Work Laptop processes queue -> pulls record from D1 and queues image download
      await SyncEngine.processQueue();

      expect(receivedRecord).toBeDefined();
      expect(receivedRecord.photoRef).toBe('idb:cross-dev-img-999');

      // 3. Hydrate or verify image replicated to local ImageStore
      const imagePayload = await SyncEngine.fetchImageOnDemand('idb:cross-dev-img-999');
      expect(imagePayload).toBeDefined();
      expect(imagePayload).toContain('data:image/png;base64,');
      expect(ImageStore.hasLocalImage('idb:cross-dev-img-999')).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      (globalThis as any).localStorage = originalLocalStorage;
    }
  });
});
