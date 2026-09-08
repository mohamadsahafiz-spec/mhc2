import { describe, it, expect } from 'vitest';
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
});
