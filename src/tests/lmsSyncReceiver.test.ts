import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import worker from '../worker';
import { LaserEngine } from '../utils/laserEngine';

// In-Memory Simulated D1 Database for Worker testing
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
          for (const val of self.records.values()) {
            if (!val.is_deleted) count++;
          }
          return { total: count };
        }
        if (sql.includes('SELECT version, updated_at FROM records WHERE key = ?')) {
          const key = boundParams[0];
          const rec = self.records.get(key);
          if (!rec) return null;
          return { version: rec.version, updated_at: rec.updated_at };
        }
        return null;
      },
      async all() {
        if (sql.includes("FROM records WHERE table_name = 'machines' AND is_deleted = 0")) {
          const results: any[] = [];
          for (const val of self.records.values()) {
            if (val.table_name === 'machines' && !val.is_deleted) {
              results.push({ data: val.data });
            }
          }
          return { results };
        }
        if (sql.includes("FROM records")) {
          const results: any[] = [];
          for (const val of self.records.values()) {
            if (!val.is_deleted) {
              results.push({
                key: val.key,
                table: val.table_name,
                recordId: val.record_id,
                data: val.data,
                updatedAt: val.updated_at,
                deviceId: val.device_id,
                version: val.version,
                isDeleted: val.is_deleted
              });
            }
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

describe('LMS → FSOS Sync Receiver (POST /api/lms/sync)', () => {
  let mockDb: MockD1Database;
  const mockEnv: any = {};
  const LMS_TEST_SECRET = 'test-lms-secret-12345';

  beforeEach(() => {
    mockDb = new MockD1Database();
    mockEnv.DB = mockDb;
    mockEnv.LMS_SYNC_SECRET = LMS_TEST_SECRET;

    // Seed existing FSOS machine with embedded MHC specifications and engineering records
    const existingMachine = {
      id: 'WD-77972',
      machineNumber: 'WLVIA#1',
      serialNo: 'MC23006',
      model: 'BMD250WM',
      customerName: 'Global Semiconductor Corp',
      plantName: 'Fab 12 Cleanroom',
      mhcSpecs: {
        laserPower: { targetPowerWatts: 11.2, powerTolerancePercent: 4 },
        beamProfile: { profileMode: 'TEM00 Gaussian' },
        stageCalibration: { toleranceUm: 1.2 }
      },
      productProcessRecords: [
        { id: 'ppr-001', topViaMeasuredUm: 15.2, bottomViaMeasuredUm: 12.1 }
      ],
      lasers: [
        {
          id: 'WD-77972-L1',
          name: 'Laser Head 1',
          serialNo: 'MC23006-L1',
          baseLaserHour: 10000,
          baseTimestamp: '2026-01-01T00:00:00.000Z',
          ratedLife: 25000,
          warningLife: 20000,
          calibrationHistory: [
            { date: '2026-01-01', actualHour: 10000, reason: 'Initial Setup' }
          ]
        }
      ]
    };

    mockDb.records.set('machines:WD-77972', {
      key: 'machines:WD-77972',
      table_name: 'machines',
      record_id: 'WD-77972',
      data: JSON.stringify(existingMachine),
      updated_at: '2026-01-01T00:00:00.000Z',
      device_id: 'INITIAL-DEVICE',
      version: 1000,
      is_deleted: false
    });
  });

  it('rejects unauthenticated requests or invalid auth tokens with HTTP 401', async () => {
    // Missing token
    const noAuthReq = new Request('https://worker.dev/api/lms/sync', {
      method: 'POST',
      body: JSON.stringify({ machines: [] })
    });
    const noAuthRes = await worker.fetch(noAuthReq, mockEnv);
    expect(noAuthRes.status).toBe(401);

    // Wrong token
    const wrongAuthReq = new Request('https://worker.dev/api/lms/sync', {
      method: 'POST',
      headers: {
        'X-LMS-Auth-Token': 'incorrect-token'
      },
      body: JSON.stringify({ machines: [] })
    });
    const wrongAuthRes = await worker.fetch(wrongAuthReq, mockEnv);
    expect(wrongAuthRes.status).toBe(401);
  });

  it('accepts valid authentication via X-LMS-Auth-Token or Authorization Bearer header', async () => {
    const lmsPayload = {
      version: '0.9.0',
      machines: [
        {
          id: 'WD-77972',
          machineNumber: 'WLVIA#1',
          serialNo: 'MC23006',
          lasers: [
            {
              id: 'WD-77972-L1',
              name: 'Laser Head 1',
              serialNo: 'MC23006-L1',
              baseLaserHour: 14500,
              baseTimestamp: '2026-09-25T07:00:00.000Z',
              ratedLife: 25000,
              warningLife: 20000
            }
          ]
        }
      ]
    };

    // Header 1: X-LMS-Auth-Token
    const req1 = new Request('https://worker.dev/api/lms/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LMS-Auth-Token': LMS_TEST_SECRET
      },
      body: JSON.stringify(lmsPayload)
    });
    const res1 = await worker.fetch(req1, mockEnv);
    expect(res1.status).toBe(200);
    const json1: any = await res1.json();
    expect(json1.success).toBe(true);
    expect(json1.matchedCount).toBe(1);
    expect(json1.updatedMachineIds).toContain('WD-77972');

    // Header 2: Authorization: Bearer
    const req2 = new Request('https://worker.dev/api/lms/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LMS_TEST_SECRET}`
      },
      body: JSON.stringify(lmsPayload)
    });
    const res2 = await worker.fetch(req2, mockEnv);
    expect(res2.status).toBe(200);
    const json2: any = await res2.json();
    expect(json2.success).toBe(true);
  });

  it('updates LMS laser lifecycle fields while strictly preserving FSOS-owned specifications & records', async () => {
    const lmsPayload = {
      version: '0.9.0',
      machines: [
        {
          machineNumber: 'WLVIA#1',
          serialNo: 'MC23006',
          lasers: [
            {
              id: 'WD-77972-L1',
              name: 'Laser Head 1',
              serialNo: 'MC23006-L1',
              baseLaserHour: 18200,
              baseTimestamp: '2026-09-25T07:15:00.000Z',
              ratedLife: 25000,
              warningLife: 20000,
              calibrationHistory: [
                { date: '2026-09-25', actualHour: 18200, reason: 'LMS Calibration' }
              ]
            }
          ]
        }
      ]
    };

    const req = new Request('https://worker.dev/api/lms/sync', {
      method: 'POST',
      headers: {
        'X-LMS-Auth-Token': LMS_TEST_SECRET
      },
      body: JSON.stringify(lmsPayload)
    });

    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);

    // Verify stored D1 record
    const updatedRecord = mockDb.records.get('machines:WD-77972');
    expect(updatedRecord).toBeDefined();
    expect(updatedRecord.device_id).toBe('LMS-SYNC');

    const updatedMachine = JSON.parse(updatedRecord.data);

    // 1. LMS fields updated
    expect(updatedMachine.lasers[0].baseLaserHour).toBe(18200);
    expect(updatedMachine.lasers[0].baseTimestamp).toBe('2026-09-25T07:15:00.000Z');
    expect(updatedMachine.lasers[0].calibrationHistory.length).toBe(2);

    // 2. FSOS-owned data preserved intact
    expect(updatedMachine.mhcSpecs.laserPower.targetPowerWatts).toBe(11.2);
    expect(updatedMachine.mhcSpecs.beamProfile.profileMode).toBe('TEM00 Gaussian');
    expect(updatedMachine.mhcSpecs.stageCalibration.toleranceUm).toBe(1.2);
    expect(updatedMachine.productProcessRecords[0].topViaMeasuredUm).toBe(15.2);
    expect(updatedMachine.customerName).toBe('Global Semiconductor Corp');
  });

  it('safely rejects unmatched LMS machines and never creates stripped machine stubs', async () => {
    const lmsPayloadWithUnmatched = {
      version: '0.9.0',
      machines: [
        {
          id: 'UNKNOWN-MACHINE-99',
          machineNumber: 'NON-EXISTENT-#99',
          serialNo: 'SN-UNKNOWN-99',
          lasers: [
            { id: 'L-99', serialNo: 'SN-L99', baseLaserHour: 5000 }
          ]
        }
      ]
    };

    const req = new Request('https://worker.dev/api/lms/sync', {
      method: 'POST',
      headers: {
        'X-LMS-Auth-Token': LMS_TEST_SECRET
      },
      body: JSON.stringify(lmsPayloadWithUnmatched)
    });

    const res = await worker.fetch(req, mockEnv);
    expect(res.status).toBe(200);
    const json: any = await res.json();

    expect(json.success).toBe(true);
    expect(json.matchedCount).toBe(0);
    expect(json.skippedUnmatched).toBe(1);
    expect(json.updatedMachineIds.length).toBe(0);

    // Ensure NO stub machine was created in D1
    expect(mockDb.records.has('machines:UNKNOWN-MACHINE-99')).toBe(false);
    expect(mockDb.records.size).toBe(1); // Only initial seed machine exists
  });

  it('exposes updated machine to client devices through existing /api/changes query', async () => {
    // 1. Post LMS update
    const lmsPayload = {
      machines: [
        {
          id: 'WD-77972',
          serialNo: 'MC23006',
          lasers: [{ id: 'WD-77972-L1', serialNo: 'MC23006-L1', baseLaserHour: 22000 }]
        }
      ]
    };

    await worker.fetch(
      new Request('https://worker.dev/api/lms/sync', {
        method: 'POST',
        headers: { 'X-LMS-Auth-Token': LMS_TEST_SECRET },
        body: JSON.stringify(lmsPayload)
      }),
      mockEnv
    );

    // 2. Client Device (e.g. 'ENGINEER-LAPTOP') queries /api/changes
    const changesReq = new Request('https://worker.dev/api/changes?since=0&deviceId=ENGINEER-LAPTOP');
    const changesRes = await worker.fetch(changesReq, mockEnv);
    expect(changesRes.status).toBe(200);

    const changesJson: any = await changesRes.json();
    expect(changesJson.success).toBe(true);
    expect(changesJson.changes.length).toBeGreaterThanOrEqual(1);

    const machineChange = changesJson.changes.find((c: any) => c.table === 'machines' && c.recordId === 'WD-77972');
    expect(machineChange).toBeDefined();
    expect(machineChange.deviceId).toBe('LMS-SYNC');

    const changeData = typeof machineChange.data === 'string' ? JSON.parse(machineChange.data) : machineChange.data;
    expect(changeData.lasers[0].baseLaserHour).toBe(22000);
  });

  it('confirms the manual Sync LMS button is removed from MachinePassportModule', () => {
    const passportPath = path.resolve(__dirname, '../components/modules/MachinePassportModule.tsx');
    const content = fs.readFileSync(passportPath, 'utf-8');

    // Confirm button label and action trigger are removed from JSX toolbar
    expect(content).not.toContain('>Sync LMS<');
    expect(content).not.toContain('Sync LMS\n');
    expect(content).not.toContain('title="Import Laser Monitor JSON"');
  });
});
