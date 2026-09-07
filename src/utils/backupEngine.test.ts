import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import {
  generateFullBackupEnvelope,
  validateBackup,
  restoreFullBackup,
  getBackupFilename
} from './backupEngine';
import { StorageService, STORAGE_KEYS, safeJsonStringify } from './persistence';
import { SyncEngine } from './syncEngine';
import { Machine } from '../types';

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

describe('FSOS P1.2 Full Core Data Backup & Restore Engine', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      (globalThis as any).localStorage = new MockLocalStorage();
    }
  });

  beforeEach(() => {
    localStorage.clear();
    SyncEngine.resetLocalSyncState();
  });

  it('generates a full backup envelope containing complete Machine objects and embedded engineering records', () => {
    const testMachine = {
      id: 'WD-TEST-001',
      serialNumber: 'SN-ENG-9988',
      model: 'WT-3000',
      name: 'Precision Drilling Rig #1',
      customerName: 'Advanced Semiconductor Lab',
      customerId: 'cust-semi-01',
      plantName: 'Fab 1',
      productionLineName: 'Line Alpha',
      equipmentStatus: 'Operational',
      operatingHours: 4200,
      lasers: [
        {
          id: 'WD-TEST-001-L1',
          name: 'Primary Laser Head',
          serialNumber: 'LH-SN-11',
          model: 'Fiber-500',
          powerWatts: 500,
          currentHours: 1200,
          ratedHours: 10000,
          status: 'Active',
          lastCalibrated: '2026-08-01'
        }
      ],
      focusOptimizationRecords: [
        {
          id: 'foc-rec-01',
          date: '2026-08-10T10:00:00Z',
          nominalFocus: 15.2,
          optimalFocus: 15.35,
          shiftAmount: 0.15,
          laserPowerWatts: 450,
          spotSizeMicrons: 22.4,
          symmetryRatio: 0.98,
          performedBy: 'Lead Tech',
          notes: 'Optimal alignment reached'
        }
      ],
      laserPowerRecords: [
        {
          id: 'pwr-rec-01',
          date: '2026-08-12T14:00:00Z',
          powerPercentage: 100,
          powerSetpoint: 500,
          measuredWatts: 498.2,
          efficiency: 99.6,
          ambientTempC: 22.5,
          performedBy: 'Lead Tech',
          status: 'Pass'
        }
      ],
      beamProfileRecords: [
        {
          id: 'beam-rec-01',
          date: '2026-08-15T09:00:00Z',
          m2Factor: 1.08,
          astigmatism: 0.02,
          ellipticity: 0.96,
          divergenceMrad: 1.15,
          performedBy: 'Lead Tech'
        }
      ],
      temperatureRecords: [
        {
          id: 'temp-rec-01',
          date: '2026-08-18T16:00:00Z',
          fileName: 'thermal_run_alpha.csv',
          totalTime: 3600,
          samplingRate: 1,
          rawRecordsCount: 3600,
          records: [],
          channelStats: { 1: { min: 21.0, max: 24.5, avg: 22.8, stdDev: 0.5, p95: 23.9 } },
          channelData: { 1: [{ ts: new Date('2026-08-18T16:00:00Z'), val: 22.8 }] }
        }
      ],
      manualTemperatureReadings: [
        {
          id: 'man-temp-01',
          timestamp: '2026-08-20T11:00:00Z',
          probeLocation: 'Resonator Block',
          temperatureCelsius: 23.2,
          status: 'Normal',
          technician: 'Lead Tech'
        }
      ],
      productProcessRecords: [
        {
          id: 'proc-rec-01',
          date: '2026-08-22T08:00:00Z',
          recipeName: 'Silicon Wafer Mark v4',
          cycleTimeSeconds: 4.8,
          yieldPercentage: 99.9,
          operator: 'Operator 1'
        }
      ],
      maintenanceHistory: [
        {
          id: 'maint-01',
          date: '2026-08-25',
          type: 'Preventive',
          description: 'Optics cleaning and beam alignment check',
          technician: 'Lead Tech',
          cost: 0
        }
      ]
    } as unknown as Machine;

    localStorage.setItem(STORAGE_KEYS.MACHINES, safeJsonStringify([testMachine]));

    const envelope = generateFullBackupEnvelope();

    // Verify manifest
    expect(envelope.manifest).toBeDefined();
    expect(envelope.manifest.backupVersion).toBe('1.0.0');
    expect(envelope.manifest.appVersion).toBeDefined();
    expect(envelope.manifest.includesImages).toBe(false);
    expect(envelope.manifest.includesRawTemperature).toBe(false);
    expect(envelope.manifest.domainCounts.machines).toBe(1);

    // Verify full Machine object with all embedded engineering records
    const exportedMachine = envelope.data.machines[0];
    expect(exportedMachine.id).toBe('WD-TEST-001');
    expect(exportedMachine.focusOptimizationRecords).toHaveLength(1);
    expect(exportedMachine.focusOptimizationRecords![0].id).toBe('foc-rec-01');
    expect(exportedMachine.laserPowerRecords).toHaveLength(1);
    expect((exportedMachine.laserPowerRecords![0] as any).measuredWatts).toBe(498.2);
    expect(exportedMachine.beamProfileRecords).toHaveLength(1);
    expect((exportedMachine.beamProfileRecords![0] as any).m2Factor).toBe(1.08);
    expect(exportedMachine.temperatureRecords).toHaveLength(1);
    expect(exportedMachine.manualTemperatureReadings).toHaveLength(1);
    expect(exportedMachine.productProcessRecords).toHaveLength(1);
    expect(exportedMachine.maintenanceHistory).toHaveLength(1);
    expect(exportedMachine.lasers).toHaveLength(1);
  });

  it('validates a valid backup envelope and calculates domain counts without mutating storage', () => {
    const envelope = generateFullBackupEnvelope();
    const jsonStr = safeJsonStringify(envelope);

    const result = validateBackup(jsonStr);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.manifest?.backupVersion).toBe('1.0.0');
    expect(result.domainCounts).toBeDefined();

    // Verify zero mutations occurred during validation
    expect(localStorage.getItem(STORAGE_KEYS.MACHINES)).toBeNull();
  });

  it('rejects invalid JSON, missing manifest, or unsupported schema versions', () => {
    // 1. Invalid JSON
    const invalidJson = validateBackup('{"corrupt": json');
    expect(invalidJson.valid).toBe(false);
    expect(invalidJson.errors[0]).toContain('Invalid JSON formatting');

    // 2. Missing manifest
    const missingManifest = validateBackup(JSON.stringify({ data: { machines: [] } }));
    expect(missingManifest.valid).toBe(false);
    expect(missingManifest.errors.some(e => e.includes('Missing or invalid "manifest"'))).toBe(true);

    // 3. Unsupported backup version
    const unsupportedVersion = validateBackup(JSON.stringify({
      manifest: { backupVersion: '99.0.0', backupId: 'b1', createdAt: new Date().toISOString(), appVersion: 'v1.5.8' },
      data: {}
    }));
    expect(unsupportedVersion.valid).toBe(false);
    expect(unsupportedVersion.errors.some(e => e.includes('Unsupported backup version'))).toBe(true);

    // 4. Invalid domain structure
    const invalidDomain = validateBackup(JSON.stringify({
      manifest: { backupVersion: '1.0.0', backupId: 'b1', createdAt: new Date().toISOString(), appVersion: 'v1.5.8' },
      data: { machines: 'not-an-array' }
    }));
    expect(invalidDomain.valid).toBe(false);
    expect(invalidDomain.errors.some(e => e.includes('must be an array'))).toBe(true);
  });

  it('restores core data via direct localStorage writes without triggering sync enqueue wrappers', async () => {
    const testMachines: Machine[] = [
      {
        id: 'WD-RESTORED-01',
        serialNumber: 'SN-RES-100',
        model: 'WT-DR-2000',
        machineName: 'Restored Machine Alpha',
        customerName: 'Restored Customer Inc',
        status: 'OPERATIONAL',
        operatingHours: 500,
        lasers: [],
        focusOptimizationRecords: [{ id: 'f1', date: '2026-08-01', nominalFocus: 10 } as any]
      } as unknown as Machine
    ];

    const testCustomers = [
      { id: 'cust-res-01', name: 'Restored Customer Inc', industry: 'Semiconductor' }
    ];

    const backupEnvelope = generateFullBackupEnvelope();
    backupEnvelope.data.machines = testMachines;
    backupEnvelope.data.customers = testCustomers as any;

    const resetSpy = vi.spyOn(SyncEngine, 'resetLocalSyncState');

    const result = await restoreFullBackup(backupEnvelope, { skipReload: true, skipSafetyDownload: true });
    expect(result.success).toBe(true);

    // Verify localStorage replaced directly
    const storedMachines = JSON.parse(localStorage.getItem(STORAGE_KEYS.MACHINES)!);
    expect(storedMachines).toHaveLength(1);
    expect(storedMachines[0].id).toBe('WD-RESTORED-01');
    expect(storedMachines[0].focusOptimizationRecords).toHaveLength(1);

    const storedCustomers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS)!);
    expect(storedCustomers).toHaveLength(1);
    expect(storedCustomers[0].name).toBe('Restored Customer Inc');

    // Verify SyncEngine state was cleanly reset
    expect(resetSpy).toHaveBeenCalled();
    expect(SyncEngine.getState().pendingCount).toBe(0);
  });

  it('formats backup filenames consistently with ISO dates', () => {
    const backupName = getBackupFilename('fsos-full-backup');
    expect(backupName).toMatch(/^fsos-full-backup-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);

    const safetyName = getBackupFilename('fsos-pre-restore-safety-snapshot');
    expect(safetyName).toMatch(/^fsos-pre-restore-safety-snapshot-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);
  });
});
