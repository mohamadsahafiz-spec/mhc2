import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncEngine, ImageChunkUploadDiagnostic } from './syncEngine';
import { ImageStore } from './imageStore';

describe('SyncEngine Image Upload Diagnostics', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    SyncEngine.clearImageSyncStateForTesting();
    await ImageStore.clearAll();
  });

  it('captures structured diagnostics when chunk upload receives HTTP error', async () => {
    // Mock image in ImageStore
    const fakeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const fakeImgRef = 'idb:test-img-diag-001';
    ImageStore.saveImageInMemoryOnly(fakeImgRef, fakeDataUrl);

    // Mock fetch returning HTTP 503 with structured body
    const mock503Response = {
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json',
        'X-Request-Id': 'req-test-503-abc',
        'X-Stage': 'D1_UPSERT',
        'X-Duration-Ms': '42',
        'X-D1-Duration-Ms': '39'
      }),
      text: async () => JSON.stringify({
        error: 'D1 operation timed out',
        reqId: 'req-test-503-abc',
        stage: 'D1_UPSERT',
        durationMs: 42,
        d1DurationMs: 39
      })
    };

    global.fetch = vi.fn().mockResolvedValue(mock503Response);

    await SyncEngine.uploadPendingImages([fakeImgRef]);

    const failedMap = SyncEngine.getFailedImageUploads();
    expect(failedMap.has(fakeImgRef)).toBe(true);

    const failedInfo = failedMap.get(fakeImgRef);
    expect(failedInfo?.attempts).toBe(1);
    expect(failedInfo?.lastError).toBeDefined();

    const lastDiag = SyncEngine.getLastImageUploadDiagnostic();
    expect(lastDiag).toBeDefined();
    expect(lastDiag?.status).toBe(503);
    expect(lastDiag?.reqId).toBe('req-test-503-abc');
    expect(lastDiag?.stage).toBe('D1_UPSERT');
    expect(lastDiag?.d1DurationMs).toBe(39);
    expect(lastDiag?.errorSnippet).toContain('D1 operation timed out');
    expect(lastDiag?.isNetworkError).toBe(false);
  });

  it('captures structured diagnostics when chunk upload encounters network error', async () => {
    const fakeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const fakeImgRef = 'idb:test-img-diag-002';
    ImageStore.saveImageInMemoryOnly(fakeImgRef, fakeDataUrl);

    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch: Connection reset'));

    await SyncEngine.uploadPendingImages([fakeImgRef]);

    const lastDiag = SyncEngine.getLastImageUploadDiagnostic();
    expect(lastDiag).toBeDefined();
    expect(lastDiag?.status).toBe(0);
    expect(lastDiag?.stage).toBe('CLIENT_FETCH_NETWORK_ERROR');
    expect(lastDiag?.isNetworkError).toBe(true);
    expect(lastDiag?.errorSnippet).toContain('Failed to fetch: Connection reset');
  });
});
