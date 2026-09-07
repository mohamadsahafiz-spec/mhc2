import { describe, it, expect, vi } from 'vitest';
import {
  previewOrphanedMediaCleanup,
  cleanupOrphanedMedia,
  collectAllReachableCoreIdbKeys,
  auditMediaEvidence
} from './mediaEvidenceAudit';
import { ImageStore } from './imageStore';

describe('P1.3.7 Safe Orphaned Media Reconciliation & Cleanup', () => {
  const SAMPLE_BEAM_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const SAMPLE_SIG_IMAGE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10,10 L90,90"/></svg>';
  const SAMPLE_PHOTO_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
  const SHARED_DUPLICATE_PAYLOAD = 'data:image/png;base64,DUPLICATE_SHARED_PAYLOAD_BYTES_XYZ1234567890';

  // 1. Referenced IndexedDB key → KEEP
  // 2. Unreferenced IndexedDB key → ORPHAN
  it('1 & 2: accurately distinguishes referenced keys (KEEP) from unreferenced keys (ORPHAN)', async () => {
    const mockCoreData = {
      machines: [
        {
          id: 'M-1725',
          name: 'Micro-Drill',
          beamProfileRecords: [
            { readings: { '6A': { imageDataUrl: 'idb:M-1725__beamProfile_6A' } } }
          ]
        }
      ],
      mhc_sessions: []
    };

    const mockImagesMap: Record<string, string> = {
      'idb:M-1725__beamProfile_6A': SAMPLE_BEAM_IMAGE,
      'idb:GHOST_OLD_SESSION_photo_123': SAMPLE_PHOTO_IMAGE
    };

    const preview = await previewOrphanedMediaCleanup(mockImagesMap, mockCoreData);

    expect(preview.totalIndexedDbEntries).toBe(2);
    expect(preview.totalActiveReferencedKeys).toBe(1);
    expect(preview.referencedIndexedDbEntries).toBe(1);
    expect(preview.orphanedIndexedDbEntries).toBe(1);
    expect(preview.orphanKeys).toEqual(['idb:GHOST_OLD_SESSION_photo_123']);
    expect(preview.reclaimableBytes).toBe(SAMPLE_PHOTO_IMAGE.length);
    expect(preview.orphanCountByCategory['Findings / Evidence'].count + preview.orphanCountByCategory['Other / Unknown'].count + preview.orphanCountByCategory['MHC Session'].count).toBeGreaterThanOrEqual(1);
  });

  // 3. Core reference missing from IndexedDB → MISSING, NO DELETE
  it('3: correctly flags missing referenced keys as diagnostics without triggering unauthorized deletion', async () => {
    const mockCoreData = {
      machines: [],
      mhc_sessions: [
        {
          id: 'MHC-2026',
          engineerSignature: 'idb:MHC-2026__engineerSignature',
          customerSignature: 'idb:MHC-2026__missingCustomerSignature'
        }
      ]
    };

    const mockImagesMap: Record<string, string> = {
      'idb:MHC-2026__engineerSignature': SAMPLE_SIG_IMAGE
    };

    const preview = await previewOrphanedMediaCleanup(mockImagesMap, mockCoreData);

    expect(preview.totalIndexedDbEntries).toBe(1);
    expect(preview.totalActiveReferencedKeys).toBe(2);
    expect(preview.referencedIndexedDbEntries).toBe(1);
    expect(preview.orphanedIndexedDbEntries).toBe(0);
    expect(preview.missingReferencedKeys).toEqual(['idb:MHC-2026__missingCustomerSignature']);
    expect(preview.orphanKeys).toHaveLength(0);

    const cleanupRes = await cleanupOrphanedMedia(mockImagesMap, mockCoreData);
    expect(cleanupRes.removedCount).toBe(0);
    expect(cleanupRes.deletedKeys).toHaveLength(0);
    expect(mockImagesMap['idb:MHC-2026__engineerSignature']).toBe(SAMPLE_SIG_IMAGE);
  });

  // 4. Duplicate payload under two referenced keys → BOTH KEEP
  it('4: preserves identical payloads under multiple active referenced keys (NO deduplication / NO deletion)', async () => {
    const mockCoreData = {
      machines: [
        {
          id: 'M-01',
          beamProfileRecords: [{ readings: { '6A': { imageDataUrl: 'idb:M-01__beamProfile' } } }]
        },
        {
          id: 'M-02',
          beamProfileRecords: [{ readings: { '6A': { imageDataUrl: 'idb:M-02__beamProfile' } } }]
        }
      ],
      mhc_sessions: []
    };

    const mockImagesMap: Record<string, string> = {
      'idb:M-01__beamProfile': SHARED_DUPLICATE_PAYLOAD,
      'idb:M-02__beamProfile': SHARED_DUPLICATE_PAYLOAD
    };

    const preview = await previewOrphanedMediaCleanup(mockImagesMap, mockCoreData);

    expect(preview.totalIndexedDbEntries).toBe(2);
    expect(preview.orphanedIndexedDbEntries).toBe(0);
    expect(preview.referencedIndexedDbEntries).toBe(2);

    const cleanupRes = await cleanupOrphanedMedia(mockImagesMap, mockCoreData);
    expect(cleanupRes.removedCount).toBe(0);
    expect(mockImagesMap['idb:M-01__beamProfile']).toBe(SHARED_DUPLICATE_PAYLOAD);
    expect(mockImagesMap['idb:M-02__beamProfile']).toBe(SHARED_DUPLICATE_PAYLOAD);
  });

  // 5. Duplicate payload where one key is orphaned → ONLY orphan key eligible for deletion
  it('5: removes ONLY the orphaned key when duplicate payload is shared with an active key', async () => {
    const mockCoreData = {
      machines: [
        {
          id: 'M-01',
          beamProfileRecords: [{ readings: { '6A': { imageDataUrl: 'idb:ACTIVE_REF_KEY' } } }]
        }
      ],
      mhc_sessions: []
    };

    const mockImagesMap: Record<string, string> = {
      'idb:ACTIVE_REF_KEY': SHARED_DUPLICATE_PAYLOAD,
      'idb:ORPHAN_DUPLICATE_KEY': SHARED_DUPLICATE_PAYLOAD
    };

    const preview = await previewOrphanedMediaCleanup(mockImagesMap, mockCoreData);
    expect(preview.orphanedIndexedDbEntries).toBe(1);
    expect(preview.orphanKeys).toEqual(['idb:ORPHAN_DUPLICATE_KEY']);

    const cleanupRes = await cleanupOrphanedMedia(mockImagesMap, mockCoreData);
    expect(cleanupRes.removedCount).toBe(1);
    expect(cleanupRes.deletedKeys).toEqual(['idb:ORPHAN_DUPLICATE_KEY']);

    // Active reference is STRICTLY preserved with its original payload intact
    expect(mockImagesMap['idb:ACTIVE_REF_KEY']).toBe(SHARED_DUPLICATE_PAYLOAD);
    expect(mockImagesMap['idb:ORPHAN_DUPLICATE_KEY']).toBeUndefined();
  });

  // 6. Completed historical MHC session with referenced image → KEEP
  it('6: strictly preserves images referenced by completed historical MHC sessions', async () => {
    const mockCoreData = {
      machines: [],
      mhc_sessions: [
        {
          id: 'MHC-HISTORICAL-COMPLETED-001',
          machineId: 'M-101',
          completionStatus: 'COMPLETED',
          engineerSignature: 'idb:MHC-HISTORICAL__sig',
          focusOptimizationRecords: [
            { evaluations: [{ positions: { center: { imageDataUrl: 'idb:MHC-HISTORICAL__focus_center' } } }] }
          ]
        }
      ]
    };

    const mockImagesMap: Record<string, string> = {
      'idb:MHC-HISTORICAL__sig': SAMPLE_SIG_IMAGE,
      'idb:MHC-HISTORICAL__focus_center': SAMPLE_BEAM_IMAGE,
      'idb:UNREFERENCED_STALE_RECORD': SAMPLE_PHOTO_IMAGE
    };

    const preview = await previewOrphanedMediaCleanup(mockImagesMap, mockCoreData);
    expect(preview.totalIndexedDbEntries).toBe(3);
    expect(preview.referencedIndexedDbEntries).toBe(2);
    expect(preview.orphanedIndexedDbEntries).toBe(1);
    expect(preview.orphanKeys).toEqual(['idb:UNREFERENCED_STALE_RECORD']);

    const cleanupRes = await cleanupOrphanedMedia(mockImagesMap, mockCoreData);
    expect(cleanupRes.removedCount).toBe(1);
    expect(cleanupRes.deletedKeys).toEqual(['idb:UNREFERENCED_STALE_RECORD']);

    expect(mockImagesMap['idb:MHC-HISTORICAL__sig']).toBe(SAMPLE_SIG_IMAGE);
    expect(mockImagesMap['idb:MHC-HISTORICAL__focus_center']).toBe(SAMPLE_BEAM_IMAGE);
    expect(mockImagesMap['idb:UNREFERENCED_STALE_RECORD']).toBeUndefined();
  });

  // 7. Empty IndexedDB → safe
  it('7: safely handles empty IndexedDB without errors', async () => {
    const mockCoreData = {
      machines: [{ id: 'M-01', photoRef: 'idb:M-01__photo' }]
    };
    const mockImagesMap: Record<string, string> = {};

    const preview = await previewOrphanedMediaCleanup(mockImagesMap, mockCoreData);
    expect(preview.totalIndexedDbEntries).toBe(0);
    expect(preview.orphanedIndexedDbEntries).toBe(0);
    expect(preview.referencedIndexedDbEntries).toBe(0);
    expect(preview.missingReferencedKeys).toEqual(['idb:M-01__photo']);

    const cleanupRes = await cleanupOrphanedMedia(mockImagesMap, mockCoreData);
    expect(cleanupRes.removedCount).toBe(0);
    expect(cleanupRes.reclaimedBytes).toBe(0);
    expect(cleanupRes.remainingIndexedDbEntries).toBe(0);
  });

  // 8. Empty Core references → all existing IndexedDB keys reported as orphan candidates
  it('8: reports all keys as orphan candidates when Core Data is empty, but requires explicit cleanup', async () => {
    const mockCoreData = {
      machines: [],
      mhc_sessions: [],
      reports: [],
      templates: []
    };

    const mockImagesMap: Record<string, string> = {
      'idb:PHOTO_1': SAMPLE_PHOTO_IMAGE,
      'idb:PHOTO_2': SAMPLE_BEAM_IMAGE
    };

    // Read-only preview MUST NOT delete anything
    const preview = await previewOrphanedMediaCleanup(mockImagesMap, mockCoreData);
    expect(preview.totalIndexedDbEntries).toBe(2);
    expect(preview.orphanedIndexedDbEntries).toBe(2);
    expect(preview.referencedIndexedDbEntries).toBe(0);
    expect(mockImagesMap['idb:PHOTO_1']).toBe(SAMPLE_PHOTO_IMAGE);
    expect(mockImagesMap['idb:PHOTO_2']).toBe(SAMPLE_BEAM_IMAGE);

    // Explicit cleanup removes orphans
    const cleanupRes = await cleanupOrphanedMedia(mockImagesMap, mockCoreData);
    expect(cleanupRes.removedCount).toBe(2);
    expect(cleanupRes.remainingIndexedDbEntries).toBe(0);
    expect(mockImagesMap['idb:PHOTO_1']).toBeUndefined();
    expect(mockImagesMap['idb:PHOTO_2']).toBeUndefined();
  });

  // 9. Cleanup recalculates current references before deletion
  it('9: re-evaluates active references dynamically to protect newly referenced media', async () => {
    let currentCoreData: any = {
      machines: [],
      mhc_sessions: []
    };

    const mockImagesMap: Record<string, string> = {
      'idb:NEWLY_ATTACHED_KEY': SAMPLE_BEAM_IMAGE,
      'idb:TRULY_ORPHANED_KEY': SAMPLE_PHOTO_IMAGE
    };

    // Preview conducted while Core Data was empty
    const preview = await previewOrphanedMediaCleanup(mockImagesMap, currentCoreData);
    expect(preview.orphanedIndexedDbEntries).toBe(2);

    // Before cleanup execution, user saves a machine referencing 'idb:NEWLY_ATTACHED_KEY'
    currentCoreData = {
      machines: [
        {
          id: 'M-NEW',
          beamProfileRecords: [{ readings: { '6A': { imageDataUrl: 'idb:NEWLY_ATTACHED_KEY' } } }]
        }
      ],
      mhc_sessions: []
    };

    // Cleanup executes and dynamically re-checks active references
    const cleanupRes = await cleanupOrphanedMedia(mockImagesMap, currentCoreData);
    expect(cleanupRes.removedCount).toBe(1);
    expect(cleanupRes.deletedKeys).toEqual(['idb:TRULY_ORPHANED_KEY']);

    expect(mockImagesMap['idb:NEWLY_ATTACHED_KEY']).toBe(SAMPLE_BEAM_IMAGE);
    expect(mockImagesMap['idb:TRULY_ORPHANED_KEY']).toBeUndefined();
  });

  // 10. Cleanup never wipes the entire evidence_images store
  it('10: uses selective key deletion and never invokes clearAll or full store wipes', async () => {
    const deleteImageKeysSpy = vi.spyOn(ImageStore, 'deleteImageKeys');
    const clearAllSpy = vi.spyOn(ImageStore, 'clearAll');

    const mockCoreData = {
      machines: [{ id: 'M-01', photoRef: 'idb:M-01__photo' }],
      mhc_sessions: []
    };

    const mockImagesMap: Record<string, string> = {
      'idb:M-01__photo': SAMPLE_PHOTO_IMAGE,
      'idb:ORPHAN_1': SAMPLE_BEAM_IMAGE
    };

    const cleanupRes = await cleanupOrphanedMedia(mockImagesMap, mockCoreData);

    expect(deleteImageKeysSpy).toHaveBeenCalledWith(['idb:ORPHAN_1']);
    expect(clearAllSpy).not.toHaveBeenCalled();
    expect(cleanupRes.removedCount).toBe(1);
    expect(mockImagesMap['idb:M-01__photo']).toBe(SAMPLE_PHOTO_IMAGE);

    deleteImageKeysSpy.mockRestore();
    clearAllSpy.mockRestore();
  });
});
