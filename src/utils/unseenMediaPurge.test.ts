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

const mockStorage = new MockLocalStorage();
(globalThis as any).localStorage = mockStorage;
(global as any).localStorage = mockStorage;

import { describe, it, expect, vi } from 'vitest';
import { ImageStore } from './imageStore';
import { auditMediaEvidence, cleanupOrphanedMedia } from './mediaEvidenceAudit';

describe('v1.7.4 Delete Unseen Media from Existing Storage', () => {
  const SAMPLE_FOUNDER_IMAGE = 'data:image/png;base64,FOUNDER_VISIBLE_IMAGE_PAYLOAD_VALID_HEX';
  const SAMPLE_ORPHAN_IMAGE = 'data:image/png;base64,ORPHAN_UNSEEN_IMAGE_PAYLOAD_HEX';

  it('purges unseen media records and alias pointers while preserving all 16 Founder-visible records', async () => {
    // 16 Founder-visible keys in Core Data (e.g. 1 machine photo, 1 logo, 14 MHC session stage records)
    const activeCoreData: any = {
      machines: [
        {
          id: 'M-1725',
          name: 'Micro-Drill',
          photoUrl: 'idb:M-1725__photo',
          beamProfileRecords: [
            { readings: { '6A': { imageDataUrl: 'idb:M-1725__beamProfile_6A' } } }
          ]
        }
      ],
      mhc_sessions: [
        {
          id: 'MHC-2026-001',
          machineId: 'M-1725',
          laserBeamEvaluation: {
            beamProfiles: {
              '6A': 'idb:MHC-2026-001__beamProfile_6A',
              '7A': 'idb:MHC-2026-001__beamProfile_7A'
            }
          },
          focusOptimizationRecord: {
            matrixImageUrl: 'idb:MHC-2026-001__focusMatrix'
          },
          productProcessRecord: {
            microViaCrossSectionImageUrl: 'idb:MHC-2026-001__microVia'
          },
          engineerSignature: 'idb:MHC-2026-001__engineerSig',
          customerSignature: 'idb:MHC-2026-001__customerSig',
          findings: [
            { id: 'f1', photoUrl: 'idb:MHC-2026-001__finding_f1' },
            { id: 'f2', photoUrl: 'idb:MHC-2026-001__finding_f2' },
            { id: 'f3', photoUrl: 'idb:MHC-2026-001__finding_f3' },
            { id: 'f4', photoUrl: 'idb:MHC-2026-001__finding_f4' },
            { id: 'f5', photoUrl: 'idb:MHC-2026-001__finding_f5' },
            { id: 'f6', photoUrl: 'idb:MHC-2026-001__finding_f6' },
            { id: 'f7', photoUrl: 'idb:MHC-2026-001__finding_f7' }
          ]
        }
      ],
      branding: {
        logoUrl: 'idb:BRANDING__logo'
      },
      profile: {
        avatarUrl: ''
      }
    };

    // Simulate the pre-cleanup state:
    // 16 Active Core Keys + 57 Ghost/Orphan/Alias Keys = 73 total records
    const simulatedStore: Record<string, string> = {};

    // Populate the 16 active keys
    const activeKeys = ImageStore.collectIdbKeys(activeCoreData);
    expect(activeKeys.length).toBe(16);

    activeKeys.forEach((key, idx) => {
      simulatedStore[key] = `${SAMPLE_FOUNDER_IMAGE}_${idx}`;
    });

    // Populate 57 unseen / alias keys (32 alias pointers + 25 redundant copies)
    for (let i = 1; i <= 32; i++) {
      simulatedStore[`idb:GHOST_ALIAS_${i}`] = `ref:idb:MHC-2026-001__focusMatrix`;
    }
    for (let i = 1; i <= 25; i++) {
      simulatedStore[`idb:GHOST_UNSEEN_REDUNDANT_${i}`] = `${SAMPLE_ORPHAN_IMAGE}_${i}`;
    }

    expect(Object.keys(simulatedStore).length).toBe(73);

    // Initial audit before cleanup
    const preAudit = await auditMediaEvidence(simulatedStore, activeCoreData);
    expect(preAudit.summary.totalRecords).toBe(73);
    expect(preAudit.summary.activeReferencedRecords).toBe(16);
    expect(preAudit.summary.orphanedRecords).toBe(57);

    // Execute cleanup
    const cleanupResult = await cleanupOrphanedMedia(simulatedStore, activeCoreData);
    expect(cleanupResult.removedCount).toBe(57);
    expect(cleanupResult.remainingIndexedDbEntries).toBe(16);
    expect(cleanupResult.remainingOrphanCount).toBe(0);

    // Post-cleanup audit verification
    const postAudit = await auditMediaEvidence(simulatedStore, activeCoreData);
    expect(postAudit.summary.totalRecords).toBe(16);
    expect(postAudit.summary.activeReferencedRecords).toBe(16);
    expect(postAudit.summary.orphanedRecords).toBe(0);
    expect(postAudit.summary.consolidatedAliasesCount).toBe(0);

    // Verify all 16 Founder-visible images are preserved intact
    for (const key of activeKeys) {
      expect(simulatedStore[key]).toBeDefined();
      expect(simulatedStore[key]).toContain(SAMPLE_FOUNDER_IMAGE);
    }
  });

  it('guarantees surviving ref: alias pointers are NOT converted into full binary payloads by purgeUnseenMedia', async () => {
    const rawStore: Record<string, string> = {
      'CANONICAL_TARGET_1': 'data:image/png;base64,REAL_CANONICAL_PAYLOAD_DATA',
      'REACHABLE_ALIAS_1': 'ref:CANONICAL_TARGET_1',
      'ORPHAN_TO_PURGE': 'data:image/png;base64,UNREFERENCED_PAYLOAD'
    };

    const reachableSet = new Set(['CANONICAL_TARGET_1', 'REACHABLE_ALIAS_1']);

    vi.spyOn(ImageStore, 'getAllRawStoredEntries').mockResolvedValue(rawStore);
    vi.spyOn(ImageStore, 'getAllImages').mockResolvedValue({
      'CANONICAL_TARGET_1': 'data:image/png;base64,REAL_CANONICAL_PAYLOAD_DATA',
      'REACHABLE_ALIAS_1': 'data:image/png;base64,REAL_CANONICAL_PAYLOAD_DATA'
    });
    vi.spyOn(ImageStore, 'deleteImageKeys').mockImplementation(async (keys) => {
      for (const k of keys) delete rawStore[k];
      return { deletedCount: keys.length, errors: [] };
    });

    const result = await ImageStore.purgeUnseenMedia(reachableSet);

    expect(result.deletedCount).toBe(1);
    expect(result.deletedKeys).toContain('ORPHAN_TO_PURGE');

    // Crucial check: REACHABLE_ALIAS_1 must remain 'ref:CANONICAL_TARGET_1' and NOT be materialized into full binary!
    expect(rawStore['REACHABLE_ALIAS_1']).toBe('ref:CANONICAL_TARGET_1');
    expect(rawStore['CANONICAL_TARGET_1']).toBe('data:image/png;base64,REAL_CANONICAL_PAYLOAD_DATA');
  });

  it('FSOS v1.7.9: verifies ghost media keys are flagged and purged while all Beam Profile keys (Stage 02 & Machine) are preserved', () => {
    const ghostKeys = [
      'MHC-SESS-1786717133921__agcData_agc1_evidenceImage',
      'MHC-SESS-1786717133921__agcData_agc2_evidenceImage',
      'MHC-SESS-1786717133921__inspectionFindings_lh2_findings_0_evidenceImage',
      'MHC-SESS-1786879186339__agcData_agc1_evidenceImage',
      'MHC-SESS-1786879186339__agcData_agc2_evidenceImage'
    ];

    for (const key of ghostKeys) {
      expect(ImageStore.isGhostMediaKey(key)).toBe(true);
      expect(ImageStore.isFounderVisibleBeamProfileKey(key)).toBe(false);
    }

    const preservedBeamProfileKeys = [
      'WD-44367__beamProfileRecords_0_readings_6B_imageDataUrl',
      'MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6A_imageDataUrl',
      'MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6B_imageDataUrl',
      'MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_7A_imageDataUrl',
      'MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_7B_imageDataUrl',
      'MHC-SESS-1786879186339__stage02_laserProfile_beamProfileRecord_readings_6A_imageDataUrl',
      'MHC-SESS-1786879186339__stage02_laserProfile_beamProfileRecord_readings_6B_imageDataUrl',
      'MHC-SESS-1786879186339__stage02_laserProfile_beamProfileRecord_readings_7A_imageDataUrl',
      'MHC-SESS-1786879186339__stage02_laserProfile_beamProfileRecord_readings_7B_imageDataUrl',
      'MHC-SESS-1786900000001__stage02_laserProfile_beamProfileRecord_readings_6A_imageDataUrl',
      'MHC-SESS-1786900000001__stage02_laserProfile_beamProfileRecord_readings_6B_imageDataUrl',
      'MHC-SESS-1786900000001__stage02_laserProfile_beamProfileRecord_readings_7A_imageDataUrl',
      'MHC-SESS-1786900000001__stage02_laserProfile_beamProfileRecord_readings_7B_imageDataUrl',
      'MHC-SESS-1786900000002__stage02_laserProfile_beamProfileRecord_readings_6A_imageDataUrl',
      'MHC-SESS-1786900000002__stage02_laserProfile_beamProfileRecord_readings_6B_imageDataUrl',
      'MHC-SESS-1786900000002__stage02_laserProfile_beamProfileRecord_readings_7A_imageDataUrl',
      'MHC-SESS-1786900000002__stage02_laserProfile_beamProfileRecord_readings_7B_imageDataUrl'
    ];

    for (const key of preservedBeamProfileKeys) {
      expect(ImageStore.isFounderVisibleBeamProfileKey(key)).toBe(true);
      expect(ImageStore.isGhostMediaKey(key)).toBe(false);
      expect(ImageStore.isAuthoritativeDomainMediaKey(key)).toBe(true);
    }

    const preservedFocusAndProductKeys = [
      'idb:MHC-SESS-1786717133921__focusOptimizationRecord_laser1_positions_0_imageDataUrl',
      'idb:MHC-SESS-1786717133921__focusOptimizationRecord_laser2_positions_0_imageDataUrl',
      'idb:MHC-SESS-1786717133921__focusMatrix',
      'idb:WD-44367__focusOptimizationRecords_0_laser1_positions_0_imageDataUrl',
      'idb:MHC-SESS-1786717133921__productProcessRecord_laser1Via_viaImageDataUrl',
      'idb:MHC-SESS-1786717133921__productProcessRecord_laser2Via_viaImageDataUrl',
      'idb:MHC-SESS-1786717133921__microVia',
      'idb:WD-44367__productProcessRecords_0_laser1Via_viaImageDataUrl'
    ];

    for (const key of preservedFocusAndProductKeys) {
      expect(ImageStore.isAuthoritativeDomainMediaKey(key)).toBe(true);
      expect(ImageStore.isGhostMediaKey(key)).toBe(false);
    }
  });

  it('FSOS v1.8.0: startup purgeUnseenMedia preserves all active machine and session idb: media references', async () => {
    const rawStore: Record<string, string> = {
      'idb:MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6A_imageDataUrl': 'data:image/png;base64,BEAM_6A_DATA',
      'idb:MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6B_imageDataUrl': 'data:image/png;base64,BEAM_6B_DATA',
      'idb:WD-44367__photo': 'data:image/png;base64,MACHINE_PHOTO_DATA',
      'idb:GENUINE_ORPHAN_GHOST_1': 'data:image/png;base64,ORPHAN_DATA_1',
      'idb:GENUINE_ORPHAN_GHOST_2': 'data:image/png;base64,ORPHAN_DATA_2'
    };

    const activeCoreData: any = {
      machines: [
        {
          id: 'WD-44367',
          name: 'Machine WD-44367',
          photoUrl: 'idb:WD-44367__photo'
        }
      ],
      mhc_sessions: [
        {
          id: 'MHC-SESS-1786717133921',
          machineId: 'WD-44367',
          stage02_laserProfile: {
            beamProfileRecord: {
              readings: {
                '6A': { imageDataUrl: 'idb:MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6A_imageDataUrl' },
                '6B': { imageDataUrl: 'idb:MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6B_imageDataUrl' }
              }
            }
          }
        }
      ]
    };

    const reachableKeys = ImageStore.collectIdbKeys(activeCoreData);
    expect(reachableKeys).toContain('idb:WD-44367__photo');
    expect(reachableKeys).toContain('idb:MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6A_imageDataUrl');
    expect(reachableKeys).toContain('idb:MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6B_imageDataUrl');

    vi.spyOn(ImageStore, 'getAllRawStoredEntries').mockResolvedValue(rawStore);
    vi.spyOn(ImageStore, 'getAllImages').mockResolvedValue(rawStore);
    vi.spyOn(ImageStore, 'deleteImageKeys').mockImplementation(async (keys) => {
      for (const k of keys) delete rawStore[k];
      return { deletedCount: keys.length, errors: [] };
    });

    const purgeResult = await ImageStore.purgeUnseenMedia(new Set(reachableKeys));

    // Active records are preserved
    expect(rawStore['idb:MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6A_imageDataUrl']).toBe('data:image/png;base64,BEAM_6A_DATA');
    expect(rawStore['idb:MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6B_imageDataUrl']).toBe('data:image/png;base64,BEAM_6B_DATA');
    expect(rawStore['idb:WD-44367__photo']).toBe('data:image/png;base64,MACHINE_PHOTO_DATA');

    // Unreferenced ghosts are deleted
    expect(purgeResult.deletedKeys).toContain('idb:GENUINE_ORPHAN_GHOST_1');
    expect(purgeResult.deletedKeys).toContain('idb:GENUINE_ORPHAN_GHOST_2');
    expect(rawStore['idb:GENUINE_ORPHAN_GHOST_1']).toBeUndefined();
    expect(rawStore['idb:GENUINE_ORPHAN_GHOST_2']).toBeUndefined();
  });

  it('FSOS v1.8.1: persistence boundary converts hydrated base64 images back to canonical idb: references before writing to localStorage, preventing valid media deletion during purge', async () => {
    const { StorageService, STORAGE_KEYS } = await import('./persistence');

    const canonicalKey = 'idb:MHC-SESS-1786717133921__stage02_laserProfile_beamProfileRecord_readings_6A_imageDataUrl';
    const base64Data = 'data:image/png;base64,BEAM_6A_PAYLOAD_FOUNDER_VALID';

    // 1. Prime ImageStore with canonical key
    await ImageStore.saveImage(canonicalKey, base64Data);

    // 2. Simulate session loaded into memory and hydrated
    const hydratedSession: any = {
      id: 'MHC-SESS-1786717133921',
      machineId: 'WD-44367',
      stage02_laserProfile: {
        beamProfileRecord: {
          readings: {
            '6A': { imageDataUrl: base64Data } // In-memory hydrated base64
          }
        }
      }
    };

    // 3. Save via StorageService.saveMhcSessions
    StorageService.saveMhcSessions([hydratedSession]);

    // 4. Inspect raw localStorage content
    const rawSaved = mockStorage.getItem(STORAGE_KEYS.MHC_SESSIONS);
    expect(rawSaved).not.toBeNull();
    const parsedSessions = JSON.parse(rawSaved!);
    const savedSession = parsedSessions.find((s: any) => s.id === 'MHC-SESS-1786717133921');

    // Verify localStorage retains the canonical idb: reference instead of base64
    expect(savedSession.stage02_laserProfile.beamProfileRecord.readings['6A'].imageDataUrl).toBe(canonicalKey);

    // 5. Reachability scan discovers the canonical key from stored Core Data
    const coreData = StorageService.getAllLocalData();
    const reachableKeys = ImageStore.collectIdbKeys(coreData);
    expect(reachableKeys).toContain(canonicalKey);

    // 6. Purge preserves the key
    const rawStore: Record<string, string> = {
      [canonicalKey]: base64Data,
      'idb:GHOST_ORPHAN_KEY': 'data:image/png;base64,GHOST'
    };

    vi.spyOn(ImageStore, 'getAllRawStoredEntries').mockResolvedValue(rawStore);
    vi.spyOn(ImageStore, 'getAllImages').mockResolvedValue(rawStore);
    vi.spyOn(ImageStore, 'deleteImageKeys').mockImplementation(async (keys) => {
      for (const k of keys) delete rawStore[k];
      return { deletedCount: keys.length, errors: [] };
    });

    const purgeResult = await ImageStore.purgeUnseenMedia(new Set(reachableKeys));

    expect(rawStore[canonicalKey]).toBe(base64Data);
    expect(rawStore['idb:GHOST_ORPHAN_KEY']).toBeUndefined();
    expect(purgeResult.deletedKeys).toContain('idb:GHOST_ORPHAN_KEY');
    expect(purgeResult.deletedKeys).not.toContain(canonicalKey);
  });

  it('FSOS v1.8.1: saveMachines persistence boundary converts hydrated base64 images back to canonical idb: references before writing to localStorage', async () => {
    const { StorageService, STORAGE_KEYS } = await import('./persistence');

    const machinePhotoKey = 'idb:WD-44367__photoUrl';
    const photoBase64 = 'data:image/png;base64,WD44367_PHOTO_PAYLOAD';

    await ImageStore.saveImage(machinePhotoKey, photoBase64);

    const hydratedMachine: any = {
      id: 'WD-44367',
      name: 'Drill WD-44367',
      serialNumber: 'SN-44367',
      photoUrl: photoBase64
    };

    StorageService.saveMachines([hydratedMachine]);

    const rawSaved = mockStorage.getItem(STORAGE_KEYS.MACHINES);
    expect(rawSaved).not.toBeNull();
    const parsedMachines = JSON.parse(rawSaved!);
    const savedMachine = parsedMachines.find((m: any) => m.id === 'WD-44367');

    expect(savedMachine.photoUrl).toBe(machinePhotoKey);

    const coreData = StorageService.getAllLocalData();
    const reachableKeys = ImageStore.collectIdbKeys(coreData);
    expect(reachableKeys).toContain(machinePhotoKey);
  });
});
