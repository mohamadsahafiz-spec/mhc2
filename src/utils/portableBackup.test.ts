import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import * as fflate from 'fflate';
import {
  createPortableBackupZip,
  validatePortableBackupArchive,
  restorePortableBackup,
  getPortableBackupFilename,
  dataUrlToBinary,
  binaryToDataUrl
} from './backupEngine';
import { STORAGE_KEYS, safeJsonStringify } from './persistence';
import { SyncEngine } from './syncEngine';
import { ImageStore } from './imageStore';
import { Machine, FSOSPortableMediaIndex } from '../types';

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

describe('FSOS v1.7.1 Portable Complete Backup v1 Engine (.fsosbackup)', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      (globalThis as any).localStorage = new MockLocalStorage();
    }
  });

  beforeEach(() => {
    localStorage.clear();
    SyncEngine.resetLocalSyncState();
    vi.restoreAllMocks();
  });

  it('correctly converts between Data URLs and raw binary Uint8Array', () => {
    const originalPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const dataUrl = `data:image/png;base64,${originalPngBase64}`;

    const { bytes, mimeType, extension } = dataUrlToBinary(dataUrl);
    expect(mimeType).toBe('image/png');
    expect(extension).toBe('png');
    expect(bytes.length).toBeGreaterThan(0);

    const reconstructed = binaryToDataUrl(bytes, mimeType);
    expect(reconstructed).toBe(dataUrl);
  });

  it('creates a standard .fsosbackup archive containing manifest.json, data/, and media/ files', async () => {
    const testMachine = {
      id: 'WD-PORT-001',
      serialNumber: 'SN-PORT-99',
      model: 'WT-3000',
      machineName: 'Portable Backup Test Rig',
      customerName: 'Global Semiconductor Corp',
      customerId: 'cust-glob-01',
      plantName: 'Fab 2',
      status: 'OPERATIONAL',
      lasers: []
    } as unknown as Machine;
    localStorage.setItem(STORAGE_KEYS.MACHINES, safeJsonStringify([testMachine]));

    const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // Mock ImageStore.getAllRawStoredEntries to return canonical and alias entries
    vi.spyOn(ImageStore, 'getAllRawStoredEntries').mockResolvedValue({
      'MHC-SESS-1__beamProfile': samplePng,
      'WD-PORT-001__beamProfileRecords_0': 'ref:MHC-SESS-1__beamProfile'
    });

    const { zipBytes, manifest } = await createPortableBackupZip();

    expect(zipBytes).toBeInstanceOf(Uint8Array);
    expect(zipBytes.length).toBeGreaterThan(0);

    // Verify manifest metadata
    expect(manifest.format).toBe('FSOS_PORTABLE_BACKUP');
    expect(manifest.formatVersion).toBe(1);
    expect(manifest.backupId).toBeDefined();
    expect(manifest.domainCounts.machines).toBe(1);
    expect(manifest.mediaSummary.totalLogicalKeys).toBe(2);
    expect(manifest.mediaSummary.canonicalMediaFiles).toBe(1);
    expect(manifest.mediaSummary.aliasReferences).toBe(1);

    // Verify unzipped archive structure
    const unzipped = fflate.unzipSync(zipBytes);
    const filenames = Object.keys(unzipped);

    expect(filenames).toContain('manifest.json');
    expect(filenames).toContain('data/core.json');
    expect(filenames).toContain('data/media_index.json');
    expect(filenames).toContain('media/MHC-SESS-1__beamProfile.png');
    // Ensure alias does NOT create duplicate binary file in media/
    expect(filenames).not.toContain('media/WD-PORT-001__beamProfileRecords_0.png');

    // Verify core.json content
    const coreJsonStr = fflate.strFromU8(unzipped['data/core.json']);
    const coreParsed = JSON.parse(coreJsonStr);
    expect(coreParsed.machines).toHaveLength(1);
    expect(coreParsed.machines[0].id).toBe('WD-PORT-001');

    // Verify media_index.json content
    const mediaIndexStr = fflate.strFromU8(unzipped['data/media_index.json']);
    const indexParsed: FSOSPortableMediaIndex = JSON.parse(mediaIndexStr);
    expect(indexParsed.entries['MHC-SESS-1__beamProfile'].type).toBe('canonical');
    expect(indexParsed.entries['WD-PORT-001__beamProfileRecords_0'].type).toBe('alias');
    expect(indexParsed.entries['WD-PORT-001__beamProfileRecords_0'].targetKey).toBe('MHC-SESS-1__beamProfile');
  });

  it('validates a well-formed portable backup archive successfully', async () => {
    const testMachine = {
      id: 'WD-PORT-002',
      serialNumber: 'SN-PORT-02',
      model: 'WT-3000',
      machineName: 'Validation Test Rig',
      customerName: 'Val Customer',
      customerId: 'cust-val-01',
      plantName: 'Fab 1',
      status: 'OPERATIONAL',
      lasers: []
    } as unknown as Machine;
    localStorage.setItem(STORAGE_KEYS.MACHINES, safeJsonStringify([testMachine]));
    vi.spyOn(ImageStore, 'getAllRawStoredEntries').mockResolvedValue({});

    const { zipBytes } = await createPortableBackupZip();
    const valResult = await validatePortableBackupArchive(zipBytes);

    expect(valResult.valid).toBe(true);
    expect(valResult.errors).toHaveLength(0);
    expect(valResult.manifest?.format).toBe('FSOS_PORTABLE_BACKUP');
    expect(valResult.canonicalCount).toBe(0);
  });

  it('fails non-destructive validation when archive is corrupt or missing required components', async () => {
    // 1. Invalid bytes
    const corruptBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const val1 = await validatePortableBackupArchive(corruptBytes);
    expect(val1.valid).toBe(false);
    expect(val1.errors[0]).toMatch(/Failed to unpack archive/);

    // 2. Missing manifest.json
    const invalidZip = fflate.zipSync({
      'data/core.json': fflate.strToU8(JSON.stringify({ machines: [] }))
    });
    const val2 = await validatePortableBackupArchive(invalidZip);
    expect(val2.valid).toBe(false);
    expect(val2.errors.some(e => e.includes('manifest.json'))).toBe(true);
  });

  it('executes full round-trip restore of core data, canonical media, and alias references', async () => {
    const testMachine = {
      id: 'WD-ROUNDTRIP-01',
      serialNumber: 'SN-RT-01',
      model: 'WT-3000',
      machineName: 'Roundtrip Test Rig',
      customerName: 'Roundtrip Fab',
      customerId: 'cust-rt-01',
      plantName: 'Fab 1',
      status: 'OPERATIONAL',
      lasers: []
    } as unknown as Machine;
    localStorage.setItem(STORAGE_KEYS.MACHINES, safeJsonStringify([testMachine]));

    const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    vi.spyOn(ImageStore, 'getAllRawStoredEntries').mockResolvedValue({
      'CANONICAL_IMG_KEY_1': samplePng,
      'ALIAS_REF_KEY_1': 'ref:CANONICAL_IMG_KEY_1'
    });

    const savedImagesMap: Record<string, string> = {};
    vi.spyOn(ImageStore, 'saveImage').mockImplementation(async (key, val) => {
      savedImagesMap[key] = val;
    });

    const { zipBytes } = await createPortableBackupZip();

    // Clear local state before restore
    localStorage.clear();

    const restoreRes = await restorePortableBackup(zipBytes, { skipReload: true, skipSafetyDownload: true });
    expect(restoreRes.success).toBe(true);
    expect(restoreRes.restoredImageCount).toBe(2);

    // Verify localStorage core data restored
    const storedMachinesRaw = localStorage.getItem(STORAGE_KEYS.MACHINES);
    expect(storedMachinesRaw).toBeDefined();
    const restoredMachines = JSON.parse(storedMachinesRaw!);
    expect(restoredMachines).toHaveLength(1);
    expect(restoredMachines[0].id).toBe('WD-ROUNDTRIP-01');

    // Verify ImageStore.saveImage was called with reconstructed data URLs
    expect(savedImagesMap['CANONICAL_IMG_KEY_1']).toBe(samplePng);
    expect(savedImagesMap['ALIAS_REF_KEY_1']).toBe('ref:CANONICAL_IMG_KEY_1');
  });

  it('generates proper filename for portable backup with timestamp', () => {
    const filename = getPortableBackupFilename();
    expect(filename).toMatch(/^fsos-portable-backup-.*\.fsosbackup$/);
  });
});

