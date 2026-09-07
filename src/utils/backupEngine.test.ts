import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import {
  generateFullBackupEnvelope,
  generateMediaBackupEnvelope,
  validateBackup,
  validateMediaBackup,
  validateCompleteBackup,
  restoreFullBackup,
  restoreCompleteBackup,
  getBackupFilename
} from './backupEngine';
import { StorageService, STORAGE_KEYS, safeJsonStringify } from './persistence';
import { SyncEngine } from './syncEngine';
import { ImageStore } from './imageStore';
import { Machine, FSOSMediaBackupEnvelope } from '../types';

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
    expect(missingManifest.errors.some(e => e.includes('Missing or malformed "manifest"'))).toBe(true);

    // 3. Unsupported backup version
    const unsupportedVersion = validateBackup(JSON.stringify({
      manifest: { backupVersion: '99.0.0', backupId: 'b1', createdAt: new Date().toISOString(), appVersion: 'v1.5.9' },
      data: {}
    }));
    expect(unsupportedVersion.valid).toBe(false);
    expect(unsupportedVersion.errors.some(e => e.includes('Unsupported backup version'))).toBe(true);

    // 4. Invalid domain structure
    const invalidDomain = validateBackup(JSON.stringify({
      manifest: { backupVersion: '1.0.0', backupId: 'b1', createdAt: new Date().toISOString(), appVersion: 'v1.5.9' },
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
    const backupName = getBackupFilename('fsos-core-backup');
    expect(backupName).toMatch(/^fsos-core-backup-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);

    const safetyName = getBackupFilename('fsos-pre-restore-safety-snapshot');
    expect(safetyName).toMatch(/^fsos-pre-restore-safety-snapshot-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);
  });
});

describe('FSOS P1.3 Complete Archive (Media Evidence Backup & Restore)', () => {
  beforeEach(async () => {
    localStorage.clear();
    SyncEngine.resetLocalSyncState();
    await ImageStore.clearAll();
  });

  it('Media Export: preserves exact original idb: keys, image payloads, and generates valid manifest', async () => {
    // 1. Store images in ImageStore
    const key1 = 'idb:MHC-SESS-123_evidence_0';
    const payload1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const key2 = 'idb:MACHINE-99_optics_lens';
    const payload2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    ImageStore.saveImage(key1, payload1);
    ImageStore.saveImage(key2, payload2);

    // 2. Generate Media Backup Envelope
    const sharedBackupId = 'fsos_backup_test_shared_123';
    const mediaEnvelope = await generateMediaBackupEnvelope(sharedBackupId);

    // 3. Verify Manifest
    expect(mediaEnvelope.manifest).toBeDefined();
    expect(mediaEnvelope.manifest.backupId).toBe(sharedBackupId);
    expect(mediaEnvelope.manifest.backupVersion).toBe('1.0.0');
    expect(mediaEnvelope.manifest.includesImages).toBe(true);
    expect(mediaEnvelope.manifest.imageCount).toBe(2);

    // 4. Verify exact image keys and payloads preserved byte-for-byte
    expect(mediaEnvelope.images[key1]).toBe(payload1);
    expect(mediaEnvelope.images[key2]).toBe(payload2);
  });

  it('Media Validation: accepts valid Media Backup and rejects malformed payloads', () => {
    const validMedia = {
      manifest: {
        backupId: 'fsos_backup_valid_456',
        backupVersion: '1.0.0',
        appVersion: 'v1.5.9',
        createdAt: new Date().toISOString(),
        environment: 'FSOS_WEB_CLIENT',
        includesImages: true,
        imageCount: 1
      },
      images: {
        'idb:MHC-001_photo': 'data:image/png;base64,ABC'
      }
    };

    // 1. Valid Media Backup accepted
    const validRes = validateMediaBackup(JSON.stringify(validMedia));
    expect(validRes.valid).toBe(true);
    expect(validRes.errors).toHaveLength(0);
    expect(validRes.imageCount).toBe(1);

    // 2. Malformed JSON rejected
    const malformedRes = validateMediaBackup('{not valid json}');
    expect(malformedRes.valid).toBe(false);
    expect(malformedRes.errors[0]).toContain('Invalid Media JSON formatting');

    // 3. Missing backupId rejected
    const noBackupId = JSON.parse(JSON.stringify(validMedia));
    delete noBackupId.manifest.backupId;
    const noBackupIdRes = validateMediaBackup(JSON.stringify(noBackupId));
    expect(noBackupIdRes.valid).toBe(false);
    expect(noBackupIdRes.errors.some(e => e.includes('missing a valid "backupId"'))).toBe(true);

    // 4. Invalid includesImages rejected
    const badIncludesImages = JSON.parse(JSON.stringify(validMedia));
    badIncludesImages.manifest.includesImages = false;
    const badIncludesImagesRes = validateMediaBackup(JSON.stringify(badIncludesImages));
    expect(badIncludesImagesRes.valid).toBe(false);
    expect(badIncludesImagesRes.errors.some(e => e.includes('"includesImages" flag must be true'))).toBe(true);

    // 5. imageCount mismatch rejected
    const countMismatch = JSON.parse(JSON.stringify(validMedia));
    countMismatch.manifest.imageCount = 99; // Actual is 1
    const countMismatchRes = validateMediaBackup(JSON.stringify(countMismatch));
    expect(countMismatchRes.valid).toBe(false);
    expect(countMismatchRes.errors.some(e => e.includes('does not match actual image count'))).toBe(true);

    // 6. Invalid images dictionary rejected
    const invalidDict = JSON.parse(JSON.stringify(validMedia));
    invalidDict.images = 'not-an-object';
    const invalidDictRes = validateMediaBackup(JSON.stringify(invalidDict));
    expect(invalidDictRes.valid).toBe(false);
    expect(invalidDictRes.errors.some(e => e.includes('Missing or invalid "images" dictionary'))).toBe(true);
  });

  it('Media Restore: non-destructively upserts images using original keys, preserves existing images, and invalidates cache', async () => {
    // 1. Existing image on device
    const existingKey = 'idb:EXISTING_UNTOUCHED_01';
    const existingPayload = 'data:image/png;base64,EXISTING_PAYLOAD';
    ImageStore.saveImage(existingKey, existingPayload);

    // 2. Images in backup envelope
    const backupKey = 'idb:RESTORED_IMG_01';
    const backupPayload = 'data:image/png;base64,RESTORED_PAYLOAD';

    const mediaResult = await ImageStore.restoreImages({
      [backupKey]: backupPayload
    });

    expect(mediaResult.restoredCount).toBe(1);
    expect(mediaResult.errors).toHaveLength(0);

    // 3. Verify restored image is now in ImageStore
    expect(ImageStore.getCachedImage(backupKey)).toBe(backupPayload);

    // 4. Verify existing image was NOT deleted (non-destructive upsert)
    expect(ImageStore.getCachedImage(existingKey)).toBe(existingPayload);
  });

  it('Complete Restore: accepts matching Core + Media backupIds, rejects mismatched backupIds, and preserves core restore functionality', async () => {
    const sharedBackupId = 'fsos_backup_matched_789';

    // 1. Matching Core and Media envelopes
    const coreEnvelope = generateFullBackupEnvelope(sharedBackupId);
    coreEnvelope.data.machines = [{
      id: 'M-COMPLETE-1',
      serialNumber: 'SN-COMP-1',
      model: 'WT-3000',
      equipmentStatus: 'Operational',
      operatingHours: 100,
      lasers: []
    } as any];

    const mediaEnvelope: FSOSMediaBackupEnvelope = {
      manifest: {
        backupId: sharedBackupId,
        backupVersion: '1.0.0',
        appVersion: 'v1.5.9',
        createdAt: new Date().toISOString(),
        environment: 'FSOS_WEB_CLIENT',
        includesImages: true,
        imageCount: 1
      },
      images: {
        'idb:M-COMPLETE-1_photo': 'data:image/png;base64,MATCHED_IMG'
      }
    };

    // 2. Validate paired complete backup
    const validComplete = validateCompleteBackup(
      JSON.stringify(coreEnvelope),
      JSON.stringify(mediaEnvelope)
    );
    expect(validComplete.valid).toBe(true);
    expect(validComplete.hasMedia).toBe(true);
    expect(validComplete.backupIdMatch).toBe(true);
    expect(validComplete.errors).toHaveLength(0);

    // 3. Mismatched backupId is rejected
    const mismatchedMedia = JSON.parse(JSON.stringify(mediaEnvelope));
    mismatchedMedia.manifest.backupId = 'fsos_backup_different_id_999';
    const mismatchedComplete = validateCompleteBackup(
      JSON.stringify(coreEnvelope),
      JSON.stringify(mismatchedMedia)
    );
    expect(mismatchedComplete.valid).toBe(false);
    expect(mismatchedComplete.backupIdMatch).toBe(false);
    expect(mismatchedComplete.errors.some(e => e.includes('Backup ID mismatch'))).toBe(true);

    // 4. Core-only restore without media remains functional
    const coreOnlyComplete = validateCompleteBackup(JSON.stringify(coreEnvelope));
    expect(coreOnlyComplete.valid).toBe(true);
    expect(coreOnlyComplete.hasMedia).toBe(false);
    expect(coreOnlyComplete.backupIdMatch).toBe(true);

    // 5. Execute Complete Restore with Media
    const restoreRes = await restoreCompleteBackup(coreEnvelope, mediaEnvelope, {
      skipReload: true,
      skipSafetyDownload: true
    });
    expect(restoreRes.success).toBe(true);
    expect(restoreRes.restoredImageCount).toBe(1);

    // Verify Core data restored
    const storedMachines = JSON.parse(localStorage.getItem(STORAGE_KEYS.MACHINES)!);
    expect(storedMachines).toHaveLength(1);
    expect(storedMachines[0].id).toBe('M-COMPLETE-1');

    // Verify Media image restored
    expect(ImageStore.getCachedImage('idb:M-COMPLETE-1_photo')).toBe('data:image/png;base64,MATCHED_IMG');
  });
});

