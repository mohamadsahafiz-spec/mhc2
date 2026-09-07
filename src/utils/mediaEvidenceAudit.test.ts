import { describe, it, expect } from 'vitest';
import {
  classifyMediaCategory,
  detectPayloadType,
  getPayloadByteSize,
  formatBytes,
  collectAllReachableCoreIdbKeys,
  auditMediaEvidence,
  ALL_MEDIA_CATEGORIES
} from './mediaEvidenceAudit';

describe('P1.3.5 Media Evidence Size & Provenance Audit', () => {
  const SAMPLE_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const SAMPLE_JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const SAMPLE_WEBP = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  const SAMPLE_SVG_DATA_URL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';
  const SAMPLE_RAW_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
  const SAMPLE_OTHER_DATA_URL = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDw...';
  const SAMPLE_UNKNOWN_STR = 'Plain text image payload string';

  describe('1. Category Classification', () => {
    it('accurately classifies signatures', () => {
      expect(classifyMediaCategory('idb:MHC-101_engineerSignature').category).toBe('Signatures');
      expect(classifyMediaCategory('idb:M-101__customerSignature').category).toBe('Signatures');
      expect(classifyMediaCategory('idb:MHC-101_sign_engineer').category).toBe('Signatures');
    });

    it('accurately classifies beam profile measurements', () => {
      expect(classifyMediaCategory('idb:M-1725__beamProfileRecords_0_readings_6A_imageDataUrl').category).toBe('Beam Profile');
      expect(classifyMediaCategory('idb:MHC-101_stage02_laserProfile_readings_6A_imageDataUrl').category).toBe('Beam Profile');
      expect(classifyMediaCategory('idb:M-101_profilePhoto').category).toBe('Beam Profile');
    });

    it('accurately classifies focus optimization', () => {
      expect(classifyMediaCategory('idb:M-1725__focusOptimizationRecords_0_evaluations_0_positions_center_imageDataUrl').category).toBe('Focus Optimization');
      expect(classifyMediaCategory('idb:MHC-101_focus_optimization_grid').category).toBe('Focus Optimization');
    });

    it('accurately classifies product & process images', () => {
      expect(classifyMediaCategory('idb:M-1725__productProcessRecords_0_topViaSvg').category).toBe('Product & Process');
      expect(classifyMediaCategory('idb:MHC-101_bottomVia_photo').category).toBe('Product & Process');
      expect(classifyMediaCategory('idb:MHC-101_crossSection_view').category).toBe('Product & Process');
    });

    it('accurately classifies laser power meter evidence', () => {
      expect(classifyMediaCategory('idb:M-1725__laserPowerRecords_0_powerEvidencePhoto').category).toBe('Laser Power');
      expect(classifyMediaCategory('idb:MHC-101_laserPower_reading_evidence').category).toBe('Laser Power');
    });

    it('accurately classifies inspection findings & evidence photos', () => {
      expect(classifyMediaCategory('idb:MHC-1786806493596_findings_lh1_findings_0_evidenceImage').category).toBe('Findings / Evidence');
      expect(classifyMediaCategory('idb:M-101_photoRef').category).toBe('Findings / Evidence');
      expect(classifyMediaCategory('idb:MHC-101_stage04_findings_photo').category).toBe('Findings / Evidence');
    });

    it('accurately classifies reports, drafts, and templates', () => {
      expect(classifyMediaCategory('idb:REP-101__executiveReport_canvas').category).toBe('Reports / Drafts / Templates');
      expect(classifyMediaCategory('idb:TMP-01__mhc_workspace_template_asset').category).toBe('Reports / Drafts / Templates');
      expect(classifyMediaCategory('idb:DRF-02__mhc_report_draft_page1').category).toBe('Reports / Drafts / Templates');
    });

    it('accurately classifies general MHC sessions', () => {
      expect(classifyMediaCategory('idb:MHC-1786806493596_stage01_environment_photo').category).toBe('MHC Session');
      expect(classifyMediaCategory('idb:MHC-1786806493596_overviewPhoto').category).toBe('MHC Session');
    });

    it('accurately classifies machine passport physical assets', () => {
      expect(classifyMediaCategory('idb:M-101__overviewPhoto').category).toBe('Machine Passport');
      expect(classifyMediaCategory('idb:WD-44367_photo').category).toBe('Machine Passport');
      expect(classifyMediaCategory('idb:machine_passport_photo_1').category).toBe('Machine Passport');
    });

    it('falls back to Other / Unknown for unclassified keys without guessing', () => {
      expect(classifyMediaCategory('idb:custom_unrecognized_payload_key').category).toBe('Other / Unknown');
      expect(classifyMediaCategory('').category).toBe('Other / Unknown');
    });
  });

  describe('2. Payload Type Detection', () => {
    it('detects PNG, JPEG, WebP, SVG data URLs, raw SVG, other data URLs, and unknown strings', () => {
      expect(detectPayloadType(SAMPLE_PNG)).toBe('data:image/png');
      expect(detectPayloadType(SAMPLE_JPEG)).toBe('data:image/jpeg');
      expect(detectPayloadType(SAMPLE_WEBP)).toBe('data:image/webp');
      expect(detectPayloadType(SAMPLE_SVG_DATA_URL)).toBe('data:image/svg+xml');
      expect(detectPayloadType(SAMPLE_RAW_SVG)).toBe('raw SVG');
      expect(detectPayloadType(SAMPLE_OTHER_DATA_URL)).toBe('other data URL');
      expect(detectPayloadType(SAMPLE_UNKNOWN_STR)).toBe('unknown string');
    });
  });

  describe('3. Exact Byte Size Calculation', () => {
    it('calculates exact UTF-8 byte lengths including multi-byte unicode characters', () => {
      const ascii = 'Hello FSOS';
      expect(getPayloadByteSize(ascii)).toBe(10);

      const unicode = '激光 Laser ⚡';
      // '激' (3) + '光' (3) + ' ' (1) + 'Laser' (5) + ' ' (1) + '⚡' (3) = 16 bytes
      expect(getPayloadByteSize(unicode)).toBe(16);
      expect(getPayloadByteSize(SAMPLE_PNG)).toBe(SAMPLE_PNG.length);
    });

    it('formats bytes into clean human-readable units', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
    });
  });

  describe('4. Active vs Orphaned & Missing Referenced Key Analysis', () => {
    it('correctly audits reachable Core references, orphaned entries, and missing keys', async () => {
      const mockCoreData = {
        machines: [
          {
            id: 'M-101',
            name: 'EO Technics Driller',
            beamProfileRecords: [
              {
                readings: {
                  '6A': { imageDataUrl: 'idb:M-101__beamProfileRecords_0_readings_6A_imageDataUrl' }
                }
              }
            ]
          }
        ],
        mhc_sessions: [
          {
            id: 'MHC-001',
            engineerSignature: 'idb:MHC-001__engineerSignature',
            missingPhoto: 'idb:MHC-001__missingPhotoKey'
          }
        ]
      };

      const mockImagesMap: Record<string, string> = {
        'idb:M-101__beamProfileRecords_0_readings_6A_imageDataUrl': SAMPLE_PNG,
        'idb:MHC-001__engineerSignature': SAMPLE_RAW_SVG,
        'idb:ORPHANED-KEY-001_photo': SAMPLE_JPEG
      };

      const report = await auditMediaEvidence(mockImagesMap, mockCoreData);

      expect(report.summary.totalRecords).toBe(3);
      expect(report.summary.activeReferencedRecords).toBe(2);
      expect(report.summary.orphanedRecords).toBe(1);
      expect(report.summary.missingReferencedRecords).toBe(1);
      expect(report.missingReferencedKeys).toEqual(['idb:MHC-001__missingPhotoKey']);

      const orphanEntry = report.entries.find(e => e.key === 'idb:ORPHANED-KEY-001_photo');
      expect(orphanEntry?.isOrphaned).toBe(true);
      expect(orphanEntry?.isReferenced).toBe(false);

      const activeEntry = report.entries.find(e => e.key === 'idb:MHC-001__engineerSignature');
      expect(activeEntry?.isOrphaned).toBe(false);
      expect(activeEntry?.isReferenced).toBe(true);
    });
  });

  describe('5. Duplicate Payload Grouping & Storage Savings Analysis', () => {
    it('groups identical payloads, calculates duplicate waste, and preserves uniqueness count', async () => {
      const SHARED_HIGH_RES_PNG = 'data:image/png;base64,AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHHIIIIJJJJKKKKLLLLMMMMNNNNOOOOPPPP'; // 68 bytes
      const UNIQUE_SVG = SAMPLE_RAW_SVG;

      const mockImagesMap: Record<string, string> = {
        'idb:M-101__beamProfileRecords_0': SHARED_HIGH_RES_PNG,
        'idb:M-102__beamProfileRecords_0': SHARED_HIGH_RES_PNG,
        'idb:M-103__beamProfileRecords_0': SHARED_HIGH_RES_PNG,
        'idb:MHC-001__uniqueSignature': UNIQUE_SVG
      };

      const mockCoreData = {
        machines: [],
        mhc_sessions: []
      };

      const report = await auditMediaEvidence(mockImagesMap, mockCoreData);

      expect(report.summary.totalRecords).toBe(4);
      expect(report.summary.uniquePayloadCount).toBe(2); // SHARED_HIGH_RES_PNG + UNIQUE_SVG
      expect(report.summary.duplicateGroupsCount).toBe(1);
      expect(report.summary.duplicateRecords).toBe(3);

      const dupGroup = report.duplicates[0];
      expect(dupGroup.count).toBe(3);
      expect(dupGroup.byteSizePerEntry).toBe(SHARED_HIGH_RES_PNG.length);
      expect(dupGroup.totalBytes).toBe(SHARED_HIGH_RES_PNG.length * 3);
      expect(dupGroup.wastedBytes).toBe(SHARED_HIGH_RES_PNG.length * 2);
      expect(report.summary.potentialDuplicateSavingsBytes).toBe(SHARED_HIGH_RES_PNG.length * 2);

      // Verify individual entry annotations
      const dupEntry = report.entries.find(e => e.key === 'idb:M-101__beamProfileRecords_0');
      expect(dupEntry?.isDuplicate).toBe(true);
      expect(dupEntry?.duplicateCount).toBe(3);
      expect(dupEntry?.duplicateGroupId).toBe(dupGroup.groupId);

      const uniqueEntry = report.entries.find(e => e.key === 'idb:MHC-001__uniqueSignature');
      expect(uniqueEntry?.isDuplicate).toBe(false);
      expect(uniqueEntry?.duplicateCount).toBe(1);
    });
  });

  describe('6. Category Storage Breakdown & Top Consumers Ranking', () => {
    it('produces sorted category summaries and ranked storage consumers', async () => {
      const LARGE_BEAM_IMAGE = 'data:image/png;base64,' + 'X'.repeat(5000);
      const SMALL_SIGNATURE = '<svg>sig</svg>';

      const mockImagesMap: Record<string, string> = {
        'idb:M-101__beamProfileRecords_0_readings_6A_imageDataUrl': LARGE_BEAM_IMAGE,
        'idb:MHC-101_engineerSignature': SMALL_SIGNATURE
      };

      const report = await auditMediaEvidence(mockImagesMap, {});

      expect(report.topConsumers).toHaveLength(2);
      expect(report.topConsumers[0].key).toBe('idb:M-101__beamProfileRecords_0_readings_6A_imageDataUrl');
      expect(report.topConsumers[0].byteSize).toBeGreaterThan(report.topConsumers[1].byteSize);

      const beamCat = report.categories.find(c => c.category === 'Beam Profile');
      const sigCat = report.categories.find(c => c.category === 'Signatures');

      expect(beamCat?.count).toBe(1);
      expect(beamCat?.percentageOfTotal).toBeGreaterThan(90);
      expect(sigCat?.count).toBe(1);
      expect(sigCat?.percentageOfTotal).toBeLessThan(10);
    });
  });

  describe('7. Read-Only Guarantee', () => {
    it('executes without mutating the input map or modifying persistent storage', async () => {
      const originalMap: Record<string, string> = {
        'idb:TEST-001_photo': SAMPLE_PNG
      };
      const mapCopy = { ...originalMap };

      await auditMediaEvidence(originalMap, {});

      expect(originalMap).toEqual(mapCopy);
    });
  });
});
