/* =====================================================
   D1 WORKER ORPHAN MEDIA CLEANUP TESTS (d1Worker.orphanCleanup.test.ts)
   ===================================================== */
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../worker';

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

class TestD1Database {
  public rows = new Map<string, MockD1Row>();
  public imageChunks = new Map<string, MockImageChunkRow[]>();

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
        if (sql.includes("CREATE TABLE IF NOT EXISTS")) {
          return { success: true };
        }

        if (sql.includes("DELETE FROM image_chunks WHERE image_id IN")) {
          let deletedCount = 0;
          for (const imgId of boundArgs) {
            if (self.imageChunks.has(imgId)) {
              deletedCount += (self.imageChunks.get(imgId)?.length || 1);
              self.imageChunks.delete(imgId);
            }
          }
          return { success: true, meta: { changes: deletedCount } };
        }

        if (sql.includes("DELETE FROM image_chunks WHERE image_id = ?")) {
          const [imageId] = boundArgs;
          const count = self.imageChunks.get(imageId)?.length || 0;
          self.imageChunks.delete(imageId);
          return { success: true, meta: { changes: count } };
        }

        if (sql.includes("INSERT INTO image_chunks")) {
          const [image_id, chunk_index, total_chunks, data, mime_type, byte_size, created_at] = boundArgs;
          let chunks = self.imageChunks.get(image_id) || [];
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
        if (sql.includes("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0")) {
          let count = 0;
          for (const row of self.rows.values()) {
            if (row.is_deleted === 0) count++;
          }
          return { total: count };
        }
        return null;
      },
      async all() {
        // SELECT data FROM records WHERE is_deleted = 0
        if (sql.includes("SELECT data FROM records WHERE is_deleted = 0")) {
          const results: { data: string | null }[] = [];
          for (const row of self.rows.values()) {
            if (row.is_deleted === 0) {
              results.push({ data: row.data });
            }
          }
          return { results };
        }

        // SELECT DISTINCT image_id, created_at FROM image_chunks WHERE created_at <= ?
        if (sql.includes("SELECT DISTINCT image_id, created_at FROM image_chunks WHERE created_at <= ?")) {
          const [cutoff] = boundArgs;
          const results: { image_id: string; created_at: string }[] = [];
          for (const [imgId, chunks] of self.imageChunks.entries()) {
            const earliest = chunks[0]?.created_at || new Date().toISOString();
            if (earliest <= cutoff) {
              results.push({ image_id: imgId, created_at: earliest });
            }
          }
          return { results };
        }

        return { results: [] };
      }
    };

    return stmt;
  }
}

describe('D1 Worker Orphan Media Cleanup', () => {
  let db: TestD1Database;
  const oldTimestamp = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago
  const recentTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago

  beforeEach(() => {
    db = new TestD1Database();
  });

  it('1. Active record protection: preserves images referenced by active records', async () => {
    // Insert active record with image reference
    db.rows.set('machines:M-001', {
      key: 'machines:M-001',
      table_name: 'machines',
      record_id: 'M-001',
      data: JSON.stringify({ id: 'M-001', name: 'Laser 1', photoUrl: 'idb:M-001_photo' }),
      updated_at: new Date().toISOString(),
      device_id: 'DEV-A',
      version: 1,
      is_deleted: 0
    });

    // Insert image chunk in D1 created 48h ago
    db.imageChunks.set('idb:M-001_photo', [{
      image_id: 'idb:M-001_photo',
      chunk_index: 0,
      total_chunks: 1,
      data: new Uint8Array([1, 2, 3]),
      mime_type: 'image/png',
      byte_size: 3,
      created_at: oldTimestamp
    }]);

    const req = new Request('https://worker.internal/api/images/cleanup-orphans', {
      method: 'POST',
      body: JSON.stringify({ gracePeriodHours: 24 }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await worker.fetch(req, { DB: db as any });
    expect(res.status).toBe(200);
    const body = await res.json();
    
    expect(body.success).toBe(true);
    expect(body.deletedOrphanImagesCount).toBe(0);
    expect(db.imageChunks.has('idb:M-001_photo')).toBe(true);
  });

  it('2. Tombstoned orphan cleanup: deletes unreferenced images older than 24h', async () => {
    // Record is deleted (is_deleted = 1)
    db.rows.set('mhc_sessions:MHC-OLD', {
      key: 'mhc_sessions:MHC-OLD',
      table_name: 'mhc_sessions',
      record_id: 'MHC-OLD',
      data: null,
      updated_at: oldTimestamp,
      device_id: 'DEV-A',
      version: 2,
      is_deleted: 1
    });

    // Orphaned image chunks in D1 created 48h ago
    db.imageChunks.set('idb:MHC-OLD_photo1', [{
      image_id: 'idb:MHC-OLD_photo1',
      chunk_index: 0,
      total_chunks: 1,
      data: new Uint8Array([10, 20]),
      mime_type: 'image/jpeg',
      byte_size: 2,
      created_at: oldTimestamp
    }]);

    const req = new Request('https://worker.internal/api/images/cleanup-orphans', {
      method: 'POST',
      body: JSON.stringify({ gracePeriodHours: 24 }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await worker.fetch(req, { DB: db as any });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.deletedOrphanImagesCount).toBe(1);
    expect(db.imageChunks.has('idb:MHC-OLD_photo1')).toBe(false);
  });

  it('3. Shared image protection: preserves image if ANY active record references it', async () => {
    // Record 1 (Original) is deleted
    db.rows.set('reports:REP-001', {
      key: 'reports:REP-001',
      table_name: 'reports',
      record_id: 'REP-001',
      data: null,
      updated_at: oldTimestamp,
      device_id: 'DEV-A',
      version: 2,
      is_deleted: 1
    });

    // Record 2 (Cloned/Draft) is ACTIVE and references the same image ID
    db.rows.set('reports:REP-002', {
      key: 'reports:REP-002',
      table_name: 'reports',
      record_id: 'REP-002',
      data: JSON.stringify({ id: 'REP-002', signature: 'idb:SHARED_SIG_01' }),
      updated_at: new Date().toISOString(),
      device_id: 'DEV-B',
      version: 1,
      is_deleted: 0
    });

    // Image chunks in D1 created 48h ago
    db.imageChunks.set('idb:SHARED_SIG_01', [{
      image_id: 'idb:SHARED_SIG_01',
      chunk_index: 0,
      total_chunks: 1,
      data: new Uint8Array([99]),
      mime_type: 'image/png',
      byte_size: 1,
      created_at: oldTimestamp
    }]);

    const req = new Request('https://worker.internal/api/images/cleanup-orphans', {
      method: 'POST',
      body: JSON.stringify({ gracePeriodHours: 24 }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await worker.fetch(req, { DB: db as any });
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.deletedOrphanImagesCount).toBe(0);
    expect(db.imageChunks.has('idb:SHARED_SIG_01')).toBe(true);
  });

  it('4. Grace period protection: preserves unreferenced images newer than 24h (in-flight uploads)', async () => {
    // Unreferenced image created only 2 hours ago (e.g., chunk upload in progress or recent draft)
    db.imageChunks.set('idb:IN_FLIGHT_CHUNK', [{
      image_id: 'idb:IN_FLIGHT_CHUNK',
      chunk_index: 0,
      total_chunks: 2,
      data: new Uint8Array([5, 5]),
      mime_type: 'image/png',
      byte_size: 2,
      created_at: recentTimestamp
    }]);

    const req = new Request('https://worker.internal/api/images/cleanup-orphans', {
      method: 'POST',
      body: JSON.stringify({ gracePeriodHours: 24 }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await worker.fetch(req, { DB: db as any });
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.deletedOrphanImagesCount).toBe(0);
    expect(db.imageChunks.has('idb:IN_FLIGHT_CHUNK')).toBe(true);
  });

  it('5. Batch cleanup: correctly deletes large orphan sets across multiple 50-item batches', async () => {
    // Create 120 orphaned images older than 48 hours
    for (let i = 1; i <= 120; i++) {
      const imgId = `idb:ORPHAN_${i.toString().padStart(3, '0')}`;
      db.imageChunks.set(imgId, [{
        image_id: imgId,
        chunk_index: 0,
        total_chunks: 1,
        data: new Uint8Array([i]),
        mime_type: 'image/png',
        byte_size: 1,
        created_at: oldTimestamp
      }]);
    }

    expect(db.imageChunks.size).toBe(120);

    const req = new Request('https://worker.internal/api/images/cleanup-orphans', {
      method: 'POST',
      body: JSON.stringify({ gracePeriodHours: 24 }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await worker.fetch(req, { DB: db as any });
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.deletedOrphanImagesCount).toBe(120);
    expect(db.imageChunks.size).toBe(0);
  });
});
