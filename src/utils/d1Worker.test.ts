/* =====================================================
   D1 WORKER AUTHORITATIVE PERSISTENCE TESTS (d1Worker.test.ts)
   ===================================================== */
import { describe, it, expect } from 'vitest';
import worker from '../worker';

describe('D1Worker', () => {
  it('passes all persistence tests', async () => {
    const res = await runD1WorkerTests();
    expect(res.success).toBe(true);
  });
});

interface MockD1Row {
  key: string;
  table_name: string;
  record_id: string;
  data: string | null;
  updated_at: string;
  device_id: string;
  version: number;
  is_deleted: number;
}

interface MockImageChunkRow {
  image_id: string;
  chunk_index: number;
  total_chunks: number;
  data: Uint8Array;
  mime_type: string;
  byte_size: number;
  created_at: string;
}

class MockD1Database {
  public rows = new Map<string, MockD1Row>();
  public imageChunks = new Map<string, MockImageChunkRow[]>();
  public shouldFail = false;

  async batch(statements: any[]) {
    for (const stmt of statements) {
      await stmt.run();
    }
    return { success: true };
  }

  prepare(sql: string) {
    const self = this;
    let boundArgs: any[] = [];

    const stmt = {
      bind(...args: any[]) {
        boundArgs = args;
        return stmt;
      },
      async run() {
        if (self.shouldFail) {
          throw new Error("D1 Database connection failed (Simulated outage)");
        }

        if (sql.includes("CREATE TABLE IF NOT EXISTS")) {
          return { success: true };
        }

        if (sql.includes("DELETE FROM image_chunks WHERE image_id = ? AND chunk_index >= ?")) {
          const [imageId, chunkIndex] = boundArgs;
          const chunks = self.imageChunks.get(imageId) || [];
          const remaining = chunks.filter(c => c.chunk_index < Number(chunkIndex));
          self.imageChunks.set(imageId, remaining);
          return { success: true };
        }

        if (sql.includes("DELETE FROM image_chunks WHERE image_id = ?")) {
          const [imageId] = boundArgs;
          self.imageChunks.delete(imageId);
          return { success: true };
        }

        if (sql.includes("DELETE FROM image_chunks")) {
          self.imageChunks.clear();
          return { success: true };
        }

        if (sql.includes("INSERT INTO image_chunks")) {
          const [image_id, chunk_index, total_chunks, data, mime_type, byte_size, created_at] = boundArgs;
          let chunks = self.imageChunks.get(image_id) || [];
          // Filter out matching chunk_index to emulate ON CONFLICT DO UPDATE
          chunks = chunks.filter(c => c.chunk_index !== Number(chunk_index));
          chunks.push({
            image_id,
            chunk_index: Number(chunk_index),
            total_chunks: Number(total_chunks),
            data,
            mime_type,
            byte_size: Number(byte_size),
            created_at
          });
          self.imageChunks.set(image_id, chunks);
          return { success: true };
        }

        if (sql.includes("INSERT INTO records")) {
          const [key, table_name, record_id, data, updated_at, device_id, version, is_deleted] = boundArgs;
          self.rows.set(key, {
            key,
            table_name,
            record_id,
            data,
            updated_at,
            device_id,
            version: Number(version),
            is_deleted: Number(is_deleted)
          });
          return { success: true };
        }

        return { success: true };
      },
      async first() {
        if (self.shouldFail) {
          throw new Error("D1 Database query failed (Simulated outage)");
        }

        if (sql.includes("COUNT(DISTINCT image_id)")) {
          return { total: self.imageChunks.size };
        }

        if (sql.includes("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0")) {
          let count = 0;
          for (const row of self.rows.values()) {
            if (row.is_deleted === 0) count++;
          }
          return { total: count };
        }

        if (sql.includes("SELECT version, updated_at FROM records WHERE key = ?")) {
          const [key] = boundArgs;
          const row = self.rows.get(key);
          if (!row) return null;
          return { version: row.version, updated_at: row.updated_at };
        }

        return null;
      },
      async all() {
        if (self.shouldFail) {
          throw new Error("D1 Database fetch failed (Simulated outage)");
        }

        if (sql.includes("FROM image_chunks WHERE image_id = ? AND chunk_index = ?")) {
          const [imageId, chunkIndex] = boundArgs;
          const chunks = self.imageChunks.get(imageId) || [];
          const match = chunks.filter(c => c.chunk_index === Number(chunkIndex));
          return { results: match };
        }

        if (sql.includes("FROM image_chunks WHERE image_id = ?")) {
          const [imageId] = boundArgs;
          const chunks = (self.imageChunks.get(imageId) || []).slice().sort((a, b) => a.chunk_index - b.chunk_index);
          return { results: chunks };
        }

        if (sql.includes("SELECT key, table_name as \"table\"")) {
          let rows = Array.from(self.rows.values());
          if (sql.includes("WHERE device_id != ? AND is_deleted = 0")) {
            const [devId] = boundArgs;
            rows = rows.filter(r => r.device_id !== devId && r.is_deleted === 0);
          } else if (sql.includes("WHERE is_deleted = 0")) {
            rows = rows.filter(r => r.is_deleted === 0);
          } else if (sql.includes("WHERE updated_at > ? AND device_id != ?")) {
            const [since, devId] = boundArgs;
            rows = rows.filter(r => r.updated_at > since && r.device_id !== devId);
          } else if (sql.includes("WHERE updated_at > ?")) {
            const [since] = boundArgs;
            rows = rows.filter(r => r.updated_at > since);
          }
          const results = rows.map(r => ({
            key: r.key,
            table: r.table_name,
            recordId: r.record_id,
            data: r.data,
            updatedAt: r.updated_at,
            deviceId: r.device_id,
            version: r.version,
            isDeleted: r.is_deleted === 1
          }));
          return { results };
        }

        return { results: [] };
      }
    };

    return stmt;
  }
}

export async function runD1WorkerTests(): Promise<{ success: boolean; log: string[] }> {
  const log: string[] = [];
  let passed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      log.push(`✅ PASS: ${message}`);
    } else {
      log.push(`❌ FAIL: ${message}`);
      passed = false;
    }
  }

  const mockDb = new MockD1Database();
  const env = { DB: mockDb };

  try {
    // A. Create record: Client -> Worker -> D1 -> successful response
    const createReq = new Request("https://worker.dev/api/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "machines",
        recordId: "M-101",
        deviceId: "DEV-A",
        data: { machineNo: "TRUMPF-3030", powerKw: 6 }
      })
    });
    const createRes = await worker.fetch(createReq, env);
    const createJson = await createRes.json();
    assert(createRes.status === 200 && createJson.success === true, "A. Create record returned HTTP 200 and success: true");
    assert(mockDb.rows.has("machines:M-101"), "A. Record persisted directly in D1 storage");

    // B. Update record: Client -> Worker -> D1 -> updated value retrievable
    const updateReq = new Request("https://worker.dev/api/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "machines",
        recordId: "M-101",
        deviceId: "DEV-A",
        data: { machineNo: "TRUMPF-3030-UPDATED", powerKw: 10 }
      })
    });
    const updateRes = await worker.fetch(updateReq, env);
    assert(updateRes.status === 200, "B. Update record returned HTTP 200");
    const d1RecordB = mockDb.rows.get("machines:M-101");
    assert(d1RecordB && d1RecordB.data?.includes("TRUMPF-3030-UPDATED"), "B. D1 contains updated record values");

    // C. Read records: Worker reads from D1
    const readSyncReq = new Request("https://worker.dev/api/sync", { method: "GET" });
    const readSyncRes = await worker.fetch(readSyncReq, env);
    const readSyncJson = await readSyncRes.json();
    assert(readSyncJson.serverRecordCount === 1, "C. Worker reads record count directly from D1");

    // D. Changes endpoint: /api/changes obtains authoritative state from D1
    const changesReq = new Request("https://worker.dev/api/changes?since=0&deviceId=DEV-B", { method: "GET" });
    const changesRes = await worker.fetch(changesReq, env);
    const changesJson = await changesRes.json();
    assert(changesJson.success === true, "D. /api/changes returned HTTP 200 success");
    assert(changesJson.changes.length === 1 && changesJson.changes[0].data.machineNo === "TRUMPF-3030-UPDATED", "D. /api/changes pulled authoritative D1 state");

    // E. Persistence after worker instance reset:
    // Create new mock env instance referencing same D1 database
    const newWorkerInstanceEnv = { DB: mockDb };
    const persistReq = new Request("https://worker.dev/api/changes?since=0", { method: "GET" });
    const persistRes = await worker.fetch(persistReq, newWorkerInstanceEnv);
    const persistJson = await persistRes.json();
    assert(persistJson.changes.length === 1, "E. Record remains retrievable from D1 after fresh Worker request environment");

    // F. D1 Failure: A failed D1 operation must NOT return false success
    mockDb.shouldFail = true;
    const failReq = new Request("https://worker.dev/api/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "machines", recordId: "M-999", data: {} })
    });
    const failRes = await worker.fetch(failReq, env);
    const failJson = await failRes.json();
    assert(failRes.status === 500, "F. Failed D1 operation returned HTTP 500 status");
    assert(failJson.error && failJson.error.includes("D1 Database"), "F. Error details returned instead of false success");

    // G. Cross-device Deletion Sync: Tombstone generation, D1 store, and propagation via /api/changes
    mockDb.shouldFail = false;
    const beforeDelTime = new Date(Date.now() - 1000).toISOString();
    const deleteSyncReq = new Request("https://worker.dev/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: "DEV-A",
        items: [{
          id: "sync_del_101",
          table: "machines",
          recordId: "M-101",
          action: "delete",
          data: null,
          updatedAt: new Date().toISOString(),
          deviceId: "DEV-A",
          version: Date.now()
        }]
      })
    });
    const deleteSyncRes = await worker.fetch(deleteSyncReq, env);
    const deleteSyncJson = await deleteSyncRes.json();
    assert(deleteSyncRes.status === 200 && deleteSyncJson.success === true, "G. Delete tombstone sync returned HTTP 200 success");
    
    const d1RecordG = mockDb.rows.get("machines:M-101");
    assert(d1RecordG !== undefined && d1RecordG.is_deleted === 1, "G. Record in D1 marked as is_deleted = 1");

    const readSyncDelReq = new Request("https://worker.dev/api/sync", { method: "GET" });
    const readSyncDelRes = await worker.fetch(readSyncDelReq, env);
    const readSyncDelJson = await readSyncDelRes.json();
    assert(readSyncDelJson.serverRecordCount === 0, "G. Server active record count decreased to 0");

    const devBChangesReq = new Request(`https://worker.dev/api/changes?since=${encodeURIComponent(beforeDelTime)}&deviceId=DEV-B`, { method: "GET" });
    const devBChangesRes = await worker.fetch(devBChangesReq, env);
    const devBChangesJson = await devBChangesRes.json();
    const delRecordInChanges = devBChangesJson.changes.find((c: any) => c.recordId === "M-101");
    assert(delRecordInChanges !== undefined && delRecordInChanges.isDeleted === true, "G. /api/changes delivered deletion tombstone to Device B");

    // H. Cross-Device Image Sync: Durable Image Chunking & Persistence via D1
    const testDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const imgUploadReq = new Request("https://worker.dev/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageId: "idb:test-img-001",
        dataUrl: testDataUrl,
        deviceId: "DEV-A"
      })
    });
    const imgUploadRes = await worker.fetch(imgUploadReq, env);
    const imgUploadJson = await imgUploadRes.json();
    assert(imgUploadRes.status === 200 && imgUploadJson.success === true, "H. Image upload returned HTTP 200 success");
    assert(mockDb.imageChunks.has("idb:test-img-001"), "H. Image chunk persisted directly into D1 image_chunks table");

    // Retrieve image metadata info from fresh worker environment
    const imgInfoReq = new Request("https://worker.dev/api/images/idb%3Atest-img-001/info", { method: "GET" });
    const imgInfoRes = await worker.fetch(imgInfoReq, newWorkerInstanceEnv);
    const imgInfoJson = await imgInfoRes.json();
    assert(imgInfoRes.status === 200 && imgInfoJson.success === true, "H. Image metadata retrieved via /api/images/:imageId/info");
    assert(imgInfoJson.totalChunks === 1, "H. Image info reports 1 chunk");
    assert(imgInfoJson.mimeType === "image/png", "H. Image info reports correct mimeType");

    // Retrieve single chunk 0
    const imgChunkReq = new Request("https://worker.dev/api/images/idb%3Atest-img-001/chunk/0", { method: "GET" });
    const imgChunkRes = await worker.fetch(imgChunkReq, newWorkerInstanceEnv);
    assert(imgChunkRes.status === 200, "H. Single image chunk retrieved via /api/images/:imageId/chunk/0");
    const imgChunkBytes = new Uint8Array(await imgChunkRes.arrayBuffer());
    assert(imgChunkBytes.length > 0, "H. Retrieved chunk contains non-empty binary data");

    // I. Client-Side Binary Chunk Transport (POST /api/images/chunk)
    // Simulate a multi-chunk binary upload (3 sequential chunks)
    const chunk1Bytes = new Uint8Array([10, 20, 30, 40, 50]);
    const chunk2Bytes = new Uint8Array([60, 70, 80, 90, 100]);
    const chunk3Bytes = new Uint8Array([110, 120, 130]);
    const totalBinaryBytes = chunk1Bytes.length + chunk2Bytes.length + chunk3Bytes.length;

    // Upload Chunk 0
    const chunk0Req = new Request("https://worker.dev/api/images/chunk", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Image-Id": encodeURIComponent("idb:chunked-img-002"),
        "X-Chunk-Index": "0",
        "X-Total-Chunks": "3",
        "X-Mime-Type": "image/jpeg",
        "X-Byte-Size": String(totalBinaryBytes),
        "X-Device-Id": "DEV-A"
      },
      body: chunk1Bytes
    });
    const chunk0Res = await worker.fetch(chunk0Req, env);
    const chunk0Json = await chunk0Res.json();
    assert(chunk0Res.status === 200 && chunk0Json.success === true, "I. Binary chunk 0 upload returned HTTP 200 success");
    assert(typeof chunk0Json.reqId === "string" && chunk0Json.stage === "COMPLETE", "I. Chunk 0 returned structured reqId and stage COMPLETE");
    assert(chunk0Res.headers.get("X-Request-Id") !== null, "I. Chunk 0 response includes X-Request-Id header");
    assert(chunk0Res.headers.get("X-Stage") === "COMPLETE", "I. Chunk 0 response includes X-Stage header");

    // Test invalid header diagnostics
    const badChunkReq = new Request("https://worker.dev/api/images/chunk", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Image-Id": "",
        "X-Chunk-Index": "0",
        "X-Total-Chunks": "0"
      },
      body: new Uint8Array([1, 2, 3])
    });
    const badChunkRes = await worker.fetch(badChunkReq, env);
    const badChunkJson = await badChunkRes.json();
    assert(badChunkRes.status === 400, "I. Invalid chunk headers returned HTTP 400");
    assert(badChunkJson.stage === "VALIDATION_ERROR", "I. Invalid chunk headers returned stage VALIDATION_ERROR");
    assert(badChunkRes.headers.get("X-Stage") === "VALIDATION_ERROR", "I. Invalid chunk headers returned X-Stage header VALIDATION_ERROR");

    // Upload Chunk 1
    const chunk1Req = new Request("https://worker.dev/api/images/chunk", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Image-Id": encodeURIComponent("idb:chunked-img-002"),
        "X-Chunk-Index": "1",
        "X-Total-Chunks": "3",
        "X-Mime-Type": "image/jpeg",
        "X-Byte-Size": String(totalBinaryBytes),
        "X-Device-Id": "DEV-A"
      },
      body: chunk2Bytes
    });
    const chunk1Res = await worker.fetch(chunk1Req, env);
    const chunk1Json = await chunk1Res.json();
    assert(chunk1Res.status === 200 && chunk1Json.success === true, "I. Binary chunk 1 upload returned HTTP 200 success");

    // Upload Chunk 2
    const chunk2Req = new Request("https://worker.dev/api/images/chunk", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Image-Id": encodeURIComponent("idb:chunked-img-002"),
        "X-Chunk-Index": "2",
        "X-Total-Chunks": "3",
        "X-Mime-Type": "image/jpeg",
        "X-Byte-Size": String(totalBinaryBytes),
        "X-Device-Id": "DEV-A"
      },
      body: chunk3Bytes
    });
    const chunk2Res = await worker.fetch(chunk2Req, env);
    const chunk2Json = await chunk2Res.json();
    assert(chunk2Res.status === 200 && chunk2Json.success === true, "I. Binary chunk 2 upload returned HTTP 200 success");

    const savedChunks = mockDb.imageChunks.get("idb:chunked-img-002");
    assert(savedChunks !== undefined && savedChunks.length === 3, "I. D1 contains all 3 sequential binary chunks");

    // Retrieve metadata info
    const chunkInfoReq = new Request("https://worker.dev/api/images/idb%3Achunked-img-002/info", { method: "GET" });
    const chunkInfoRes = await worker.fetch(chunkInfoReq, newWorkerInstanceEnv);
    const chunkInfoJson = await chunkInfoRes.json();
    assert(chunkInfoRes.status === 200 && chunkInfoJson.success === true, "I. Multi-chunk image info retrieved from D1 on fresh worker instance");
    assert(chunkInfoJson.mimeType === "image/jpeg", "I. Chunked image mimeType is image/jpeg");
    assert(chunkInfoJson.byteSize === totalBinaryBytes, "I. Chunked image byteSize matches expected total");
    assert(chunkInfoJson.totalChunks === 3, "I. Chunked image totalChunks is 3");

    // Download chunks individually without monolithic worker assembly
    const downloadedChunks: Uint8Array[] = [];
    for (let c = 0; c < chunkInfoJson.totalChunks; c++) {
      const getCReq = new Request(`https://worker.dev/api/images/idb%3Achunked-img-002/chunk/${c}`, { method: "GET" });
      const getCRes = await worker.fetch(getCReq, newWorkerInstanceEnv);
      assert(getCRes.status === 200, `I. Chunk ${c} downloaded successfully`);
      downloadedChunks.push(new Uint8Array(await getCRes.arrayBuffer()));
    }
    assert(downloadedChunks.length === 3, "I. All 3 chunks downloaded separately");

    // Client-side reassembly verification
    const assembledClientBytes = new Uint8Array(totalBinaryBytes);
    let offset = 0;
    for (const chunk of downloadedChunks) {
      assembledClientBytes.set(chunk, offset);
      offset += chunk.length;
    }
    let assembledStr = "";
    for (let i = 0; i < assembledClientBytes.length; i++) {
      assembledStr += String.fromCharCode(assembledClientBytes[i]);
    }
    const clientDataUrl = `data:image/jpeg;base64,${btoa(assembledStr)}`;

    const fullExpectedBinary = new Uint8Array([...chunk1Bytes, ...chunk2Bytes, ...chunk3Bytes]);
    let binaryStr = "";
    for (let i = 0; i < fullExpectedBinary.length; i++) {
      binaryStr += String.fromCharCode(fullExpectedBinary[i]);
    }
    const expectedDataUrl = `data:image/jpeg;base64,${btoa(binaryStr)}`;
    assert(clientDataUrl === expectedDataUrl, "I. Client-side reassembled chunked dataUrl matches expected binary payload exactly");

  } catch (err: any) {
    log.push(`❌ EXCEPTION DURING D1 TESTS: ${err?.message || String(err)}`);
    passed = false;
  }

  log.push(`\nD1 Worker Tests Result: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  return { success: passed, log };
}
