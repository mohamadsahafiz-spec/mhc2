export interface Env {
  DB?: any;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  APP_VERSION?: string;
  CF_VERSION_METADATA?: {
    id: string;
    tag: string;
    timestamp: string;
  };
}

interface D1Record {
  table: string;
  recordId: string;
  data: any;
  updatedAt: string;
  deviceId: string;
  version: number;
  isDeleted?: boolean;
}

const activeDevices = new Set<string>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

function parseDataUrl(dataUrl: string): { mimeType: string; binary: Uint8Array } {
  if (dataUrl.startsWith("data:")) {
    const commaIdx = dataUrl.indexOf(",");
    const meta = dataUrl.substring(5, commaIdx);
    const mimeType = meta.split(";")[0] || "application/octet-stream";
    const isBase64 = meta.includes("base64");
    const payload = dataUrl.substring(commaIdx + 1);
    if (isBase64) {
      const binaryStr = atob(payload);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return { mimeType, binary: bytes };
    } else {
      const decoded = decodeURIComponent(payload);
      const encoder = new TextEncoder();
      return { mimeType, binary: encoder.encode(decoded) };
    }
  } else if (dataUrl.startsWith("<svg")) {
    const encoder = new TextEncoder();
    return { mimeType: "image/svg+xml", binary: encoder.encode(dataUrl) };
  } else {
    const encoder = new TextEncoder();
    return { mimeType: "application/octet-stream", binary: encoder.encode(dataUrl) };
  }
}

async function getDb(env: Env) {
  if (!env || !env.DB) {
    throw new Error("[D1 Database Error]: Cloudflare D1 binding (env.DB) is not configured or unavailable.");
  }
  return env.DB;
}

let tableInitialized = false;
async function ensureD1Table(db: any) {
  if (tableInitialized) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS records (
      key TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT,
      updated_at TEXT NOT NULL,
      device_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS image_chunks (
      image_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      total_chunks INTEGER NOT NULL,
      data BLOB NOT NULL,
      mime_type TEXT NOT NULL,
      byte_size INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (image_id, chunk_index)
    )
  `).run();

  tableInitialized = true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data: any, status = 200, extraHeaders: Record<string, string> = {}) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          ...extraHeaders,
        },
      });
    };

    // Worker API Routes
    if (path.startsWith("/api/")) {
      try {
        if (path === "/api/health") {
          const version = env?.APP_VERSION || "1.1.1";
          const cfMeta = env?.CF_VERSION_METADATA;
          return json({
            status: "ok",
            version,
            runtime: "cloudflare-workers",
            cfVersionId: cfMeta?.id || null,
            cfVersionTag: cfMeta?.tag || null,
            cfVersionTimestamp: cfMeta?.timestamp || null,
            timestamp: new Date().toISOString()
          });
        }

        if (path === "/api/purge-all" || path === "/api/purge-all/") {
          const db = await getDb(env);
          await ensureD1Table(db);
          await db.prepare("DELETE FROM records").run();
          await db.prepare("DELETE FROM image_chunks").run();
          activeDevices.clear();
          return json({
            success: true,
            purged: true,
            serverTimestamp: new Date().toISOString()
          });
        }

        if (path === "/api/sync" || path === "/api/sync/" || path === "/api/sync/status") {
          const db = await getDb(env);
          await ensureD1Table(db);

          if (request.method === "GET") {
            const countRes = await db.prepare("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0").first();
            const serverRecordCount = Number(countRes?.total ?? 0);
            const version = env?.APP_VERSION || "1.1.1";
            const cfMeta = env?.CF_VERSION_METADATA;
            return json({
              status: "online",
              version,
              endpoint: path,
              runtime: "cloudflare-workers",
              serverRecordCount,
              serverTimestamp: new Date().toISOString(),
              cfVersionId: cfMeta?.id || null,
              cfVersionTag: cfMeta?.tag || null,
              cfVersionTimestamp: cfMeta?.timestamp || null
            });
          }

          if (request.method === "POST") {
            const body: any = await request.json().catch(() => ({}));
            const { deviceId, items } = body;
            if (!Array.isArray(items)) {
              return json({ error: "Invalid sync request format: items array required" }, 400);
            }

            if (deviceId) activeDevices.add(deviceId);

            let processedCount = 0;
            const nowIso = new Date().toISOString();

            for (const item of items) {
              if (!item.table || !item.recordId) continue;
              const key = `${item.table}:${item.recordId}`;
              const isDeleted = item.action === "delete" ? 1 : 0;
              const itemData = item.action === "delete" ? null : (typeof item.data === "string" ? item.data : JSON.stringify(item.data ?? null));
              const updatedAt = item.updatedAt || nowIso;
              const devId = item.deviceId || deviceId || "UNKNOWN";
              const version = item.version || Date.now();

              // Query existing record to check version/timestamp conflict
              const existing = await db.prepare("SELECT version, updated_at FROM records WHERE key = ?").bind(key).first();

              let shouldUpdate = true;
              if (existing) {
                const existingVer = Number(existing.version) || 0;
                const existingUpdated = String(existing.updated_at || "");
                if (version < existingVer && updatedAt < existingUpdated) {
                  shouldUpdate = false;
                }
              }

              if (shouldUpdate) {
                await db.prepare(
                  `INSERT INTO records (key, table_name, record_id, data, updated_at, device_id, version, is_deleted)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(key) DO UPDATE SET
                     data = excluded.data,
                     updated_at = excluded.updated_at,
                     device_id = excluded.device_id,
                     version = excluded.version,
                     is_deleted = excluded.is_deleted`
                ).bind(key, item.table, item.recordId, itemData, updatedAt, devId, version, isDeleted).run();
                processedCount++;
              }
            }

            const totalRes = await db.prepare("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0").first();
            const totalServerRecords = Number(totalRes?.total ?? 0);

            return json({
              success: true,
              processedCount,
              serverTimestamp: nowIso,
              totalServerRecords
            });
          }
        }

        if (path === "/api/changes") {
          const db = await getDb(env);
          await ensureD1Table(db);

          const sinceParam = url.searchParams.get("since") || "0";
          const deviceIdParam = url.searchParams.get("deviceId") || "";

          if (deviceIdParam) activeDevices.add(deviceIdParam);

          const isInitialSync = sinceParam === "0" || !sinceParam;

          let querySql = "";
          let queryParams: any[] = [];

          if (isInitialSync) {
            if (deviceIdParam) {
              querySql = `SELECT key, table_name as "table", record_id as recordId, data, updated_at as updatedAt, device_id as deviceId, version, is_deleted as isDeleted
                          FROM records
                          WHERE device_id != ?
                          ORDER BY updated_at ASC
                          LIMIT 500`;
              queryParams = [deviceIdParam];
            } else {
              querySql = `SELECT key, table_name as "table", record_id as recordId, data, updated_at as updatedAt, device_id as deviceId, version, is_deleted as isDeleted
                          FROM records
                          ORDER BY updated_at ASC
                          LIMIT 500`;
              queryParams = [];
            }
          } else {
            if (deviceIdParam) {
              querySql = `SELECT key, table_name as "table", record_id as recordId, data, updated_at as updatedAt, device_id as deviceId, version, is_deleted as isDeleted
                          FROM records
                          WHERE updated_at > ? AND device_id != ?
                          ORDER BY updated_at ASC
                          LIMIT 500`;
              queryParams = [sinceParam, deviceIdParam];
            } else {
              querySql = `SELECT key, table_name as "table", record_id as recordId, data, updated_at as updatedAt, device_id as deviceId, version, is_deleted as isDeleted
                          FROM records
                          WHERE updated_at > ?
                          ORDER BY updated_at ASC
                          LIMIT 500`;
              queryParams = [sinceParam];
            }
          }

          const stmt = queryParams.length > 0 ? db.prepare(querySql).bind(...queryParams) : db.prepare(querySql);
          const { results } = await stmt.all();

          const changes: D1Record[] = [];
          for (const row of (results || [])) {
            let parsedData = null;
            if (row.data) {
              try {
                parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
              } catch {
                parsedData = row.data;
              }
            }

            changes.push({
              table: row.table as string,
              recordId: row.recordId as string,
              data: parsedData,
              updatedAt: row.updatedAt as string,
              deviceId: row.deviceId as string,
              version: Number(row.version),
              isDeleted: Boolean(row.isDeleted)
            });
          }

          const countRes = await db.prepare("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0").first();
          const serverRecordCount = Number(countRes?.total ?? 0);

          return json({
            success: true,
            serverTimestamp: new Date().toISOString(),
            serverRecordCount,
            changes
          });
        }

        if (path === "/api/images/chunk") {
          if (request.method === "POST") {
            const reqStart = Date.now();
            const reqId = `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
            let stage = "INIT";
            let imageId = "";
            let chunkIndex = 0;
            let totalChunks = 1;
            let chunkByteLength = 0;

            try {
              stage = "PARSE_HEADERS";
              const rawImageIdHeader = request.headers.get("X-Image-Id") || "";
              imageId = decodeURIComponent(rawImageIdHeader);
              chunkIndex = parseInt(request.headers.get("X-Chunk-Index") || "0", 10);
              totalChunks = parseInt(request.headers.get("X-Total-Chunks") || "1", 10);
              const mimeType = request.headers.get("X-Mime-Type") || "application/octet-stream";
              const byteSize = parseInt(request.headers.get("X-Byte-Size") || "0", 10);
              const deviceId = request.headers.get("X-Device-Id");

              if (!imageId || isNaN(chunkIndex) || isNaN(totalChunks) || totalChunks < 1 || chunkIndex < 0 || chunkIndex >= totalChunks) {
                const durationMs = Date.now() - reqStart;
                return json({
                  error: "Invalid chunk metadata headers (X-Image-Id, X-Chunk-Index, X-Total-Chunks)",
                  reqId,
                  stage: "VALIDATION_ERROR",
                  durationMs,
                  imageId,
                  chunkIndex,
                  totalChunks
                }, 400, {
                  "X-Request-Id": reqId,
                  "X-Stage": "VALIDATION_ERROR",
                  "X-Duration-Ms": String(durationMs)
                });
              }

              if (deviceId) activeDevices.add(deviceId);

              stage = "READ_BODY";
              const chunkBuffer = await request.arrayBuffer();
              const chunkBytes = new Uint8Array(chunkBuffer);
              chunkByteLength = chunkBytes.byteLength;
              const nowIso = new Date().toISOString();

              stage = "D1_CONNECT";
              const d1Start = Date.now();
              const db = await getDb(env);
              await ensureD1Table(db);

              // If uploading chunk 0, clean up any previous/orphaned higher chunks from older versions
              if (chunkIndex === 0) {
                stage = "D1_CLEANUP_ORPHANS";
                await db.prepare("DELETE FROM image_chunks WHERE image_id = ? AND chunk_index >= ?").bind(imageId, totalChunks).run();
              }

              // Upsert single chunk
              stage = "D1_UPSERT";
              await db.prepare(`
                INSERT INTO image_chunks (image_id, chunk_index, total_chunks, data, mime_type, byte_size, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(image_id, chunk_index) DO UPDATE SET
                  total_chunks = excluded.total_chunks,
                  data = excluded.data,
                  mime_type = excluded.mime_type,
                  byte_size = excluded.byte_size,
                  created_at = excluded.created_at
              `).bind(
                imageId,
                chunkIndex,
                totalChunks,
                chunkBytes,
                mimeType,
                byteSize > 0 ? byteSize : chunkByteLength,
                nowIso
              ).run();

              const d1DurationMs = Date.now() - d1Start;
              const totalDurationMs = Date.now() - reqStart;

              return json({
                success: true,
                reqId,
                stage: "COMPLETE",
                imageId,
                chunkIndex,
                totalChunks,
                bytesReceived: chunkByteLength,
                serverTimestamp: nowIso,
                durationMs: totalDurationMs,
                d1DurationMs
              }, 200, {
                "X-Request-Id": reqId,
                "X-Stage": "COMPLETE",
                "X-Duration-Ms": String(totalDurationMs),
                "X-D1-Duration-Ms": String(d1DurationMs)
              });
            } catch (chunkErr: any) {
              const totalDurationMs = Date.now() - reqStart;
              console.error(`[Worker ImageChunk Error] [${reqId}] stage=${stage} img=${imageId} chunk=${chunkIndex}/${totalChunks} size=${chunkByteLength} err=${chunkErr?.message || String(chunkErr)} durationMs=${totalDurationMs}`);
              return json({
                error: chunkErr?.message || "Internal Worker Image Chunk Error",
                errorName: chunkErr?.name,
                reqId,
                stage,
                imageId,
                chunkIndex,
                totalChunks,
                bytesReceived: chunkByteLength,
                durationMs: totalDurationMs,
                timestamp: new Date().toISOString()
              }, 500, {
                "X-Request-Id": reqId,
                "X-Stage": stage,
                "X-Duration-Ms": String(totalDurationMs)
              });
            }
          }
        }

        // Endpoint: GET /api/images/:imageId/info (Image Chunk Metadata)
        if (path.startsWith("/api/images/") && path.endsWith("/info")) {
          const db = await getDb(env);
          await ensureD1Table(db);

          const rawImageId = decodeURIComponent(path.slice("/api/images/".length, -"/info".length));
          const { results } = await db.prepare(
            "SELECT chunk_index, total_chunks, mime_type, byte_size, created_at FROM image_chunks WHERE image_id = ? ORDER BY chunk_index ASC LIMIT 1"
          ).bind(rawImageId).all();

          if (!results || results.length === 0) {
            return json({ error: "Image not found in Cloud D1 replica" }, 404);
          }

          const row = results[0];
          return json({
            success: true,
            imageId: rawImageId,
            totalChunks: Number(row.total_chunks),
            byteSize: Number(row.byte_size),
            mimeType: String(row.mime_type || "application/octet-stream"),
            createdAt: String(row.created_at)
          });
        }

        // Endpoint: GET /api/images/:imageId/chunk/:index (Single Raw Binary Chunk)
        if (path.startsWith("/api/images/") && path.includes("/chunk/")) {
          const db = await getDb(env);
          await ensureD1Table(db);

          const chunkMatch = path.match(/^\/api\/images\/(.+)\/chunk\/(\d+)$/);
          if (!chunkMatch) {
            return json({ error: "Invalid image chunk path format" }, 400);
          }

          const rawImageId = decodeURIComponent(chunkMatch[1]);
          const chunkIndex = parseInt(chunkMatch[2], 10);

          const { results } = await db.prepare(
            "SELECT data, total_chunks, mime_type, byte_size FROM image_chunks WHERE image_id = ? AND chunk_index = ?"
          ).bind(rawImageId, chunkIndex).all();

          if (!results || results.length === 0) {
            return json({ error: `Chunk ${chunkIndex} not found for image ${rawImageId}` }, 404);
          }

          const row = results[0];
          let chunkBytes: Uint8Array;
          if (row.data instanceof Uint8Array) {
            chunkBytes = row.data;
          } else if (row.data instanceof ArrayBuffer) {
            chunkBytes = new Uint8Array(row.data);
          } else if (Array.isArray(row.data)) {
            chunkBytes = new Uint8Array(row.data);
          } else if (typeof row.data === "string") {
            chunkBytes = new TextEncoder().encode(row.data);
          } else {
            chunkBytes = new Uint8Array(0);
          }

          return new Response(chunkBytes, {
            status: 200,
            headers: {
              "Content-Type": "application/octet-stream",
              "X-Image-Id": encodeURIComponent(rawImageId),
              "X-Chunk-Index": String(chunkIndex),
              "X-Total-Chunks": String(row.total_chunks),
              "X-Mime-Type": String(row.mime_type || "application/octet-stream"),
              "X-Byte-Size": String(row.byte_size || chunkBytes.byteLength),
              "Cache-Control": "public, max-age=31536000, immutable",
              ...corsHeaders
            }
          });
        }

        if (path === "/api/images") {
          if (request.method === "POST") {
            const db = await getDb(env);
            await ensureD1Table(db);

            const body: any = await request.json().catch(() => ({}));
            const { imageId, dataUrl, deviceId } = body;
            if (!imageId || !dataUrl) {
              return json({ error: "imageId and dataUrl required" }, 400);
            }

            if (deviceId) activeDevices.add(deviceId);

            const { mimeType, binary } = parseDataUrl(dataUrl);
            const byteSize = binary.byteLength;
            const SINGLE_CHUNK_MAX = 1500000;
            const MULTI_CHUNK_SIZE = 1000000;

            const chunks: { index: number; total: number; data: Uint8Array }[] = [];
            if (byteSize <= SINGLE_CHUNK_MAX) {
              chunks.push({ index: 0, total: 1, data: binary });
            } else {
              const total = Math.ceil(byteSize / MULTI_CHUNK_SIZE);
              for (let i = 0; i < total; i++) {
                const slice = binary.subarray(i * MULTI_CHUNK_SIZE, Math.min((i + 1) * MULTI_CHUNK_SIZE, byteSize));
                chunks.push({ index: i, total, data: slice });
              }
            }

            const nowIso = new Date().toISOString();

            // Prepare batch: remove previous chunks, then insert current chunks
            const deleteStmt = db.prepare("DELETE FROM image_chunks WHERE image_id = ?").bind(imageId);
            const insertStmts = chunks.map(chunk =>
              db.prepare(
                `INSERT INTO image_chunks (image_id, chunk_index, total_chunks, data, mime_type, byte_size, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
              ).bind(imageId, chunk.index, chunk.total, chunk.data, mimeType, byteSize, nowIso)
            );

            if (typeof db.batch === "function") {
              await db.batch([deleteStmt, ...insertStmts]);
            } else {
              await deleteStmt.run();
              for (const stmt of insertStmts) {
                await stmt.run();
              }
            }

            return json({
              success: true,
              imageId,
              byteSize,
              totalChunks: chunks.length,
              serverTimestamp: nowIso
            });
          }
        }

        if (path === "/api/record") {
          const db = await getDb(env);
          await ensureD1Table(db);

          const body: any = await request.json().catch(() => ({}));
          const { table, recordId, deviceId, action } = body;
          if (!table || !recordId) {
            return json({ error: "table and recordId required" }, 400);
          }

          const key = `${table}:${recordId}`;
          const isDeleted = action === "delete" || request.method === "DELETE" ? 1 : 0;
          const updatedAt = new Date().toISOString();
          const devId = deviceId || "UNKNOWN";
          const version = Date.now();
          const recordData = isDeleted ? null : (typeof body.data === "string" ? body.data : JSON.stringify(body.data ?? null));

          await db.prepare(
            `INSERT INTO records (key, table_name, record_id, data, updated_at, device_id, version, is_deleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET
               data = excluded.data,
               updated_at = excluded.updated_at,
               device_id = excluded.device_id,
               version = excluded.version,
               is_deleted = excluded.is_deleted`
          ).bind(key, table, recordId, recordData, updatedAt, devId, version, isDeleted).run();

          return json({ success: true, table, recordId, isDeleted: Boolean(isDeleted) });
        }

        if (path === "/api/sync/status") {
          const db = await getDb(env);
          await ensureD1Table(db);

          const countRes = await db.prepare("SELECT COUNT(*) as total FROM records WHERE is_deleted = 0").first();
          const serverRecordCount = Number(countRes?.total ?? 0);

          let totalStoredImages = 0;
          try {
            const imgCountRes = await db.prepare("SELECT COUNT(DISTINCT image_id) as total FROM image_chunks").first();
            totalStoredImages = Number(imgCountRes?.total ?? 0);
          } catch {
            totalStoredImages = 0;
          }

          return json({
            status: "online",
            runtime: "cloudflare-workers",
            serverRecordCount,
            totalStoredImages,
            activeDevices: Array.from(activeDevices),
            serverTimestamp: new Date().toISOString()
          });
        }

        return json({ error: `API route not found: ${request.method} ${path}` }, 404);
      } catch (err: any) {
        console.error("[Worker API Unhandled Error]:", err);
        return json({
          error: err?.message || "Internal Worker D1 Error",
          errorName: err?.name,
          timestamp: new Date().toISOString()
        }, 500);
      }
    }

    // Serve static frontend assets via env.ASSETS if available
    if (env && env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }

    return new Response("FSOS Cloudflare Worker Application Active", {
      headers: { "Content-Type": "text/html", ...corsHeaders }
    });
  }
};
