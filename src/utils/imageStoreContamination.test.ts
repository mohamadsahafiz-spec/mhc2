import { describe, it, expect, beforeEach } from 'vitest';
import {
  ImageStore,
  isBlockedDomOrEventObject,
  isBlockedTraversalKey
} from './imageStore';

describe('P1.3.4 Image Contamination Guard & Safe IndexedDB Cleanup', () => {
  beforeEach(async () => {
    await ImageStore.clearAll();
  });

  const SAMPLE_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>';

  it('1. Extracts legitimate image data URLs into idb pointers normally', () => {
    const rawData = {
      recordId: 'REC-001',
      profilePhoto: SAMPLE_PNG,
      details: {
        nestedSvg: SAMPLE_SVG
      }
    };

    const extracted = ImageStore.extractAndStoreImagesSync(rawData, 'REC-001');

    expect(extracted.profilePhoto).toBe('idb:REC-001__profilePhoto');
    expect(extracted.details.nestedSvg).toBe('idb:REC-001__details_nestedSvg');

    // Cached image payloads must be available
    expect(ImageStore.getCachedImage('idb:REC-001__profilePhoto')).toBe(SAMPLE_PNG);
    expect(ImageStore.getCachedImage('idb:REC-001__details_nestedSvg')).toBe(SAMPLE_SVG);
  });

  it('2. Guards mixed legitimate data and blocks DOM / Event / target property traversal', () => {
    const mockDomButton = {
      nodeType: 1,
      nodeName: 'BUTTON',
      ownerDocument: {},
      attributes: [],
      // Simulated React internal fiber attached to DOM node
      __reactFiber$test123: {
        return: {
          child: {
            memoizedProps: {
              iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="50" height="50"/></svg>'
            }
          }
        }
      }
    };

    const payload = {
      sessionId: 'MHC-SESSION-001',
      validEvidence: SAMPLE_PNG,
      target: mockDomButton
    };

    const extracted = ImageStore.extractAndStoreImagesSync(payload, 'MHC-SESSION-001');

    // Legitimate field must be extracted
    expect(extracted.validEvidence).toBe('idb:MHC-SESSION-001__validEvidence');
    expect(ImageStore.getCachedImage('idb:MHC-SESSION-001__validEvidence')).toBe(SAMPLE_PNG);

    // Blocked DOM / target object must remain in-place without descending into React Fiber
    expect(extracted.target).toBe(mockDomButton);

    // No React Fiber keys should have been saved
    const cachedKeys = Array.from((ImageStore as any).getAllImages ? [] : []);
    const audit = ImageStore.isMalformedReactDerivedImageKey('idb:MHC-SESSION-001__validEvidence');
    expect(audit).toBe(false);
  });

  it('3. Blocks React internal properties starting with __reactFiber or __reactProps', () => {
    const objectWithFiber = {
      id: 'MHC-TEST-FIBER',
      legitimateName: 'Laser Head 1',
      __reactFiber$12345: {
        return: {
          memoizedProps: {
            svgIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><path d="M0 0h10v10H0z"/></svg>'
          }
        }
      },
      __reactProps$12345: {
        children: 'Some label'
      }
    };

    const extracted = ImageStore.extractAndStoreImagesSync(objectWithFiber, 'MHC-TEST-FIBER');

    expect(extracted.id).toBe('MHC-TEST-FIBER');
    expect(extracted.legitimateName).toBe('Laser Head 1');
    // Traversal should not descend into __reactFiber
    expect((extracted as any).__reactFiber$12345.return.memoizedProps.svgIcon).toContain('<svg');
    expect((extracted as any).__reactFiber$12345.return.memoizedProps.svgIcon.startsWith('idb:')).toBe(false);
  });

  it('4. Correctly extracts nested legitimate arrays and objects', () => {
    const multiRecord = {
      id: 'M-100',
      beamProfileRecords: [
        {
          id: 'bp-1',
          readings: {
            '6A': { imageDataUrl: SAMPLE_PNG },
            '6B': { imageDataUrl: SAMPLE_SVG }
          }
        }
      ]
    };

    const extracted = ImageStore.extractAndStoreImagesSync(multiRecord, 'M-100');

    expect(extracted.beamProfileRecords[0].readings['6A'].imageDataUrl).toBe('idb:M-100__beamProfileRecords_0_readings_6A_imageDataUrl');
    expect(extracted.beamProfileRecords[0].readings['6B'].imageDataUrl).toBe('idb:M-100__beamProfileRecords_0_readings_6B_imageDataUrl');
  });

  it('5. Maintains active ancestor cycle protection', () => {
    const cyclicNode: any = { name: 'Root', img: SAMPLE_PNG };
    cyclicNode.self = cyclicNode;

    const extracted = ImageStore.extractAndStoreImagesSync(cyclicNode, 'M-CYCLE');
    expect(extracted.img).toBe('idb:M-CYCLE__img');
    expect(extracted.self).toBeUndefined();
  });

  it('6. Deterministic Malformed Key Classifier identifies only proven React-derived signatures', () => {
    // Malformed signatures
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:MHC-1786806493596__target___reactFiber$abc123_return_return')).toBe(true);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:MHC-1786806493596__target___reactProps$abc123_children')).toBe(true);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:MHC-1786806493596__target___reactEvents$abc123')).toBe(true);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:MHC-1786806493596__target__memoizedProps_svg')).toBe(true);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:MHC-1786806493596__currentTarget___reactFiber$xyz_child')).toBe(true);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:MHC-1786806493596_nativeEvent__target__reactFiber')).toBe(true);

    // Legitimate FSOS engineering keys (MUST NOT be classified as malformed)
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:M-1725__beamProfileRecords_0_readings_6A_imageDataUrl')).toBe(false);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:M-1725__focusOptimizationRecords_0_evaluations_0_positions_center_imageDataUrl')).toBe(false);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:M-1725__productProcessRecords_0_topViaSvg')).toBe(false);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:M-1725__laserPowerRecords_0_powerEvidencePhoto')).toBe(false);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:MHC-1786806493596_stage02_laserProfile_readings_6A_imageDataUrl')).toBe(false);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:MHC-1786806493596_findings_lh1_findings_0_evidenceImage')).toBe(false);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:M-101_photoRef')).toBe(false);
    expect(ImageStore.isMalformedReactDerivedImageKey('idb:MHC-101_engineerSignature')).toBe(false);
  });

  it('7. Safely audits and cleans up only malformed React-derived entries in IndexedDB', async () => {
    // Seed controlled IndexedDB state
    const legitKeyA = 'idb:M-101__beamProfileRecords_0_readings_6A_imageDataUrl';
    const legitKeyB = 'idb:MHC-101_findings_0_evidenceImage';
    const malformedKeyA = 'idb:MHC-1786806493596__target___reactFiber$abc_return_memoizedProps';
    const malformedKeyB = 'idb:MHC-1786806493596__target___reactProps$xyz_child';

    await ImageStore.saveImage(legitKeyA, SAMPLE_PNG);
    await ImageStore.saveImage(legitKeyB, SAMPLE_SVG);
    await ImageStore.saveImage(malformedKeyA, SAMPLE_SVG);
    await ImageStore.saveImage(malformedKeyB, SAMPLE_PNG);

    // 1. Audit (Read-Only)
    const auditBefore = await ImageStore.auditMalformedImages();
    expect(auditBefore.total).toBe(4);
    expect(auditBefore.malformed).toBe(2);
    expect(auditBefore.legitimate).toBe(2);
    expect(auditBefore.malformedKeys).toContain(malformedKeyA);
    expect(auditBefore.malformedKeys).toContain(malformedKeyB);

    // 2. Safe Cleanup
    const cleanupResult = await ImageStore.cleanupMalformedReactDerivedImages();
    expect(cleanupResult.scanned).toBe(4);
    expect(cleanupResult.removed).toBe(2);
    expect(cleanupResult.skipped).toBe(2);
    expect(cleanupResult.removedKeys).toEqual(expect.arrayContaining([malformedKeyA, malformedKeyB]));

    // 3. Post-cleanup Audit
    const auditAfter = await ImageStore.auditMalformedImages();
    expect(auditAfter.total).toBe(2);
    expect(auditAfter.malformed).toBe(0);
    expect(auditAfter.legitimate).toBe(2);

    // 4. Memory cache and IDB must retain legitimate keys
    const storedA = await ImageStore.getImage(legitKeyA);
    const storedB = await ImageStore.getImage(legitKeyB);
    expect(storedA).toBe(SAMPLE_PNG);
    expect(storedB).toBe(SAMPLE_SVG);

    // 5. Malformed keys must be gone
    const storedMalformedA = await ImageStore.getImage(malformedKeyA);
    const storedMalformedB = await ImageStore.getImage(malformedKeyB);
    expect(storedMalformedA).toBeNull();
    expect(storedMalformedB).toBeNull();

    // 6. getAllImages export must contain only legitimate entries
    const allExported = await ImageStore.getAllImages();
    expect(Object.keys(allExported)).toHaveLength(2);
    expect(allExported[legitKeyA]).toBe(SAMPLE_PNG);
    expect(allExported[legitKeyB]).toBe(SAMPLE_SVG);
    expect(allExported[malformedKeyA]).toBeUndefined();
    expect(allExported[malformedKeyB]).toBeUndefined();
  });
});
