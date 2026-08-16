import { describe, it, expect, beforeEach } from 'vitest';
import { ImageStore } from './imageStore';

describe('ImageStore & Batched Image Offloading', () => {
  beforeEach(async () => {
    await ImageStore.clearAll();
  });

  it('extracts base64 data URLs and replaces them with idb pointers', () => {
    const rawData = {
      sessionId: 'MHC-TEST-001',
      notes: 'Clean run',
      laserPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      metrics: {
        power: 120,
        beamSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>'
      }
    };

    const extracted = ImageStore.extractAndStoreImagesSync(rawData, 'MHC-TEST-001');

    expect(extracted.sessionId).toBe('MHC-TEST-001');
    expect(extracted.notes).toBe('Clean run');
    expect(extracted.laserPhoto).toBe('idb:MHC-TEST-001__laserPhoto');
    expect(extracted.metrics.power).toBe(120);
    expect(extracted.metrics.beamSvg).toBe('idb:MHC-TEST-001__metrics_beamSvg');

    // Cached retrieval
    expect(ImageStore.getCachedImage('idb:MHC-TEST-001__laserPhoto')).toContain('data:image/png;base64');
  });

  it('preserves structural object references when no images are present or modified', () => {
    const cleanObject = {
      activityCode: '01',
      day: 'DAY 1',
      readings: [100, 200, 300],
      meta: { verified: true, count: 3 }
    };

    const extracted = ImageStore.extractAndStoreImagesSync(cleanObject, 'MHC-TEST-002');
    // Reference identity must be identical (no re-allocation or cloning)
    expect(extracted).toBe(cleanObject);
    expect(extracted.readings).toBe(cleanObject.readings);
    expect(extracted.meta).toBe(cleanObject.meta);

    const hydrated = ImageStore.hydrateImagesSync(cleanObject);
    expect(hydrated).toBe(cleanObject);
  });

  it('hydrates idb pointers back to their cached base64 / SVG strings', () => {
    const payload = 'data:image/png;base64,AAABBBCCC';
    ImageStore.saveImage('idb:MHC-TEST-003_img', payload);

    const sessionWithPointers = {
      id: 'MHC-TEST-003',
      evidence: 'idb:MHC-TEST-003_img',
      status: 'VERIFIED'
    };

    const hydrated = ImageStore.hydrateImagesSync(sessionWithPointers);
    expect(hydrated.evidence).toBe(payload);
    expect(hydrated.status).toBe('VERIFIED');
  });

  it('handles deep recursive objects and active ancestor cycles safely', () => {
    const nodeA: any = { name: 'A', img: 'data:image/png;base64,TEST' };
    const nodeB: any = { name: 'B', parent: nodeA };
    nodeA.child = nodeB;

    const extracted = ImageStore.extractAndStoreImagesSync(nodeA, 'MHC-CYCLE-TEST');
    expect(extracted.img).toBe('idb:MHC-CYCLE-TEST__img');
    expect(extracted.child.name).toBe('B');
  });
});
