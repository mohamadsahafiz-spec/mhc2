import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import worker from '../worker';

// Mock D1 Database
class MockD1Database {
  records: Map<string, any> = new Map();

  prepare(sql: string) {
    const self = this;
    let boundParams: any[] = [];

    const statement = {
      bind(...params: any[]) {
        boundParams = params;
        return statement;
      },
      async first() {
        if (sql.includes('SELECT COUNT(*)')) {
          let count = 0;
          for (const rec of self.records.values()) {
            if (!rec.is_deleted) count++;
          }
          return { total: count };
        }
        return null;
      },
      async all() {
        if (sql.includes("FROM records WHERE table_name = 'machines'")) {
          const results: any[] = [];
          for (const rec of self.records.values()) {
            if (rec.table_name === 'machines' && !rec.is_deleted) {
              results.push({
                data: rec.data,
                updated_at: rec.updated_at,
                device_id: rec.device_id
              });
            }
          }
          return { results };
        }
        if (sql.includes('SELECT key, table_name')) {
          const results: any[] = [];
          for (const rec of self.records.values()) {
            results.push({
              key: rec.key,
              table: rec.table_name,
              recordId: rec.record_id,
              data: rec.data,
              updatedAt: rec.updated_at,
              deviceId: rec.device_id,
              version: rec.version,
              isDeleted: rec.is_deleted ? 1 : 0
            });
          }
          return { results };
        }
        return { results: [] };
      },
      async run() {
        if (sql.includes('INSERT INTO records')) {
          const [key, tableName, recordId, data, updatedAt, deviceId, version, isDeleted] = boundParams;
          self.records.set(key, {
            key,
            table_name: tableName,
            record_id: recordId,
            data,
            updated_at: updatedAt,
            device_id: deviceId,
            version,
            is_deleted: isDeleted === 1
          });
          return { success: true };
        }
        return { success: true };
      }
    };

    return statement;
  }
}

describe('Manual FSOS Pull from LMS Laser-Hours (/api/lms/pull)', () => {
  let mockDb: MockD1Database;
  const mockEnv: any = {};
  const LMS_TEST_SECRET = 'test-lms-read-secret-xyz';

  beforeEach(() => {
    mockDb = new MockD1Database();
    mockEnv.DB = mockDb;
    mockEnv.LMS_SYNC_SECRET = LMS_TEST_SECRET;

    // Seed authoritative FSOS machine WD-77972 (WLVIA#1) with laser WD-77972-L1
    const existingMachine = {
      id: 'WD-77972',
      machineNumber: 'WLVIA#1',
      serialNo: 'MC23006',
      model: 'BMD250WM',
      customerName: 'STMicroelectronics',
      plantName: 'P3',
      lasers: [
        {
          id: 'WD-77972-L1',
          name: 'Laser Head 1',
          serialNo: 'MC23006-L1',
          baseLaserHour: 10000,
          baseTimestamp: '2026-07-29T04:12:00.000Z',
          ratedLife: 25000,
          warningLife: 20000
        },
        {
          id: 'WD-77972-L2',
          name: 'Laser Head 2',
          serialNo: 'MC23006-L2',
          baseLaserHour: 9500,
          baseTimestamp: '2026-07-29T04:12:00.000Z',
          ratedLife: 25000,
          warningLife: 20000
        }
      ]
    };

    mockDb.records.set('machines:WD-77972', {
      key: 'machines:WD-77972',
      table_name: 'machines',
      record_id: 'WD-77972',
      data: JSON.stringify(existingMachine),
      updated_at: '2026-07-29T04:12:00.000Z',
      device_id: 'HOME-PC',
      version: 1780000000000,
      is_deleted: false
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. WLVIA#1 + LH1 maps to WD-77972 + WD-77972-L1 and updates laser hours', async () => {
    const lmsResponsePayload = {
      success: true,
      laserHours: [
        {
          machineNumber: 'WLVIA#1',
          laserHead: 'LH1',
          hours: 14500,
          timestamp: '2026-09-27T18:00:00.000Z'
        }
      ]
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/lms/laser-hours')) {
        expect(init?.headers?.['X-LMS-Auth-Token']).toBe(LMS_TEST_SECRET);
        return new Response(JSON.stringify(lmsResponsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response('Not Found', { status: 404 });
    });

    const req = new Request('https://worker.dev/api/lms/pull', { method: 'POST' });
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.source).toBe('LMS_PULL');
    expect(json.matchedCount).toBe(1);
    expect(json.updatedCount).toBe(1);
    expect(json.updatedMachineIds).toEqual(['WD-77972']);
    expect(json.skippedCount).toBe(0);

    // Verify D1 record updated with new hours and preserved identities
    const d1Record = mockDb.records.get('machines:WD-77972');
    expect(d1Record).toBeDefined();
    expect(d1Record.device_id).toBe('LMS-PULL');
    const machine = JSON.parse(d1Record.data);
    expect(machine.id).toBe('WD-77972');
    expect(machine.lasers[0].id).toBe('WD-77972-L1');
    expect(machine.lasers[0].baseLaserHour).toBe(14500);
    expect(machine.lasers[0].baseTimestamp).toBe('2026-09-27T18:00:00.000Z');
    // LH2 remains unchanged
    expect(machine.lasers[1].id).toBe('WD-77972-L2');
    expect(machine.lasers[1].baseLaserHour).toBe(9500);
  });

  it('2. Authoritative FSOS IDs are strictly preserved and no duplicate records are created', async () => {
    const lmsResponsePayload = [
      {
        machine: 'WLVIA#1',
        laser: 'LH1',
        baseLaserHour: 15200
      }
    ];

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify(lmsResponsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const req = new Request('https://worker.dev/api/lms/pull', { method: 'POST' });
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);

    // Primary key in D1 remains machines:WD-77972
    expect(mockDb.records.has('machines:WD-77972')).toBe(true);
    expect(mockDb.records.has('machines:WLVIA#1')).toBe(false);

    const d1Record = mockDb.records.get('machines:WD-77972');
    const machine = JSON.parse(d1Record.data);
    expect(machine.id).toBe('WD-77972');
    expect(machine.lasers[0].id).toBe('WD-77972-L1');
    expect(machine.lasers[0].baseLaserHour).toBe(15200);
  });

  it('3. Safely skips unmatched machines and unmatched laser heads without creating records', async () => {
    const lmsResponsePayload = {
      records: [
        {
          machineNumber: 'NON-EXISTENT-MACHINE',
          laserHead: 'LH1',
          hours: 9999
        },
        {
          machineNumber: 'WLVIA#1',
          laserHead: 'UNKNOWN-LASER-HEAD-99',
          hours: 8888
        }
      ]
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify(lmsResponsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const req = new Request('https://worker.dev/api/lms/pull', { method: 'POST' });
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.matchedCount).toBe(0);
    expect(json.updatedCount).toBe(0);
    expect(json.updatedMachineIds).toEqual([]);
    expect(json.skippedCount).toBe(2);
    expect(json.unmatched.length).toBe(2);

    // Ensure non-existent machine is NOT created in D1
    expect(mockDb.records.has('machines:NON-EXISTENT-MACHINE')).toBe(false);
  });

  it('4. Handles LMS authentication failure gracefully with HTTP 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    });

    const req = new Request('https://worker.dev/api/lms/pull', { method: 'POST' });
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(401);

    const json: any = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('LMS Authentication Failure');
  });

  it('5. Handles LMS read/API failure gracefully with HTTP 502', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response('Internal Server Error in LMS', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    });

    const req = new Request('https://worker.dev/api/lms/pull', { method: 'POST' });
    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(502);

    const json: any = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('LMS API Read Failure');
  });

  describe('Automated 5-Minute Polling Schedule (scheduled handler)', () => {
    it('6. scheduled event invokes the shared pull function and completes a successful sync', async () => {
      const lmsResponsePayload = {
        success: true,
        laserHours: [
          {
            machineNumber: 'WLVIA#1',
            laserHead: 'LH1',
            hours: 16800,
            timestamp: '2026-09-27T18:50:00.000Z'
          }
        ]
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/lms/laser-hours')) {
          expect(init?.headers?.['X-LMS-Auth-Token']).toBe(LMS_TEST_SECRET);
          return new Response(JSON.stringify(lmsResponsePayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      // Trigger Cloudflare scheduled event
      const cronEvent = {
        cron: '*/5 * * * *',
        type: 'scheduled',
        scheduledTime: Date.now()
      };

      await expect(worker.scheduled(cronEvent, mockEnv)).resolves.not.toThrow();

      // Verify D1 record updated by scheduled task
      const d1Record = mockDb.records.get('machines:WD-77972');
      expect(d1Record).toBeDefined();
      expect(d1Record.device_id).toBe('LMS-PULL');
      const machine = JSON.parse(d1Record.data);
      expect(machine.id).toBe('WD-77972');
      expect(machine.lasers[0].id).toBe('WD-77972-L1');
      expect(machine.lasers[0].baseLaserHour).toBe(16800);
      expect(machine.lasers[0].baseTimestamp).toBe('2026-09-27T18:50:00.000Z');
    });

    it('7. scheduled event gracefully contains LMS/API failure without throwing an unhandled exception', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        throw new Error('Network timeout connecting to upstream LMS');
      });

      const cronEvent = {
        cron: '*/5 * * * *',
        type: 'scheduled',
        scheduledTime: Date.now()
      };

      // Must resolve without unhandled exception so the next cron schedule is never broken
      await expect(worker.scheduled(cronEvent, mockEnv)).resolves.not.toThrow();

      // Verify previous D1 state remains untouched
      const d1Record = mockDb.records.get('machines:WD-77972');
      expect(d1Record).toBeDefined();
      const machine = JSON.parse(d1Record.data);
      expect(machine.lasers[0].baseLaserHour).toBe(10000);
    });

    it('8. scheduled event gracefully contains LMS auth failure without throwing', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      });

      const cronEvent = {
        cron: '*/5 * * * *',
        type: 'scheduled',
        scheduledTime: Date.now()
      };

      await expect(worker.scheduled(cronEvent, mockEnv)).resolves.not.toThrow();
    });
  });
});
