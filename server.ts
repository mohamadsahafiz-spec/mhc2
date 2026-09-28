import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { LaserEngine } from "./src/utils/laserEngine";
import { pairLmsSyncTimestamps } from "./src/worker";
import { APP_VERSION } from "./src/constants/version";

interface D1Record {
  table: string;
  recordId: string;
  data: any;
  updatedAt: string;
  deviceId: string;
  version: number;
  isDeleted?: boolean;
}

interface D1ImageChunk {
  imageId: string;
  chunkIndex: number;
  totalChunks: number;
  data: Uint8Array;
  mimeType: string;
  byteSize: number;
  createdAt: string;
}

// Simulated Cloudflare D1 replica storage
const d1Database = new Map<string, D1Record>();
const d1ImageChunks = new Map<string, D1ImageChunk[]>();
const activeDevices = new Set<string>();

function parseDataUrl(dataUrl: string): { mimeType: string; binary: Uint8Array } {
  if (dataUrl.startsWith("data:")) {
    const commaIdx = dataUrl.indexOf(",");
    const meta = dataUrl.substring(5, commaIdx);
    const mimeType = meta.split(";")[0] || "application/octet-stream";
    const isBase64 = meta.includes("base64");
    const payload = dataUrl.substring(commaIdx + 1);
    if (isBase64) {
      const buffer = Buffer.from(payload, "base64");
      return { mimeType, binary: new Uint8Array(buffer) };
    } else {
      const decoded = decodeURIComponent(payload);
      return { mimeType, binary: new TextEncoder().encode(decoded) };
    }
  } else if (dataUrl.startsWith("<svg")) {
    return { mimeType: "image/svg+xml", binary: new TextEncoder().encode(dataUrl) };
  } else {
    return { mimeType: "application/octet-stream", binary: new TextEncoder().encode(dataUrl) };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.raw({ type: "application/octet-stream", limit: "50mb" }));

  // Enable CORS & handle OPTIONS preflight to prevent 405 Method Not Allowed & cross-device errors
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: APP_VERSION, timestamp: new Date().toISOString() });
  });

  // 0. Worker API: Complete Operational Data Purge (ALL /api/purge-all)
  app.all(["/api/purge-all", "/api/purge-all/"], (req, res) => {
    try {
      const recordsPurged = d1Database.size;
      const imagesPurged = d1ImageChunks.size;
      d1Database.clear();
      d1ImageChunks.clear();
      activeDevices.clear();

      console.log(`[FSOS Server] Purged all operational data: ${recordsPurged} records, ${imagesPurged} images.`);
      return res.json({
        success: true,
        recordsPurged,
        imagesPurged,
        serverTimestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[Worker API /api/purge-all Error]:", err);
      return res.status(500).json({ error: err?.message || "Purge failed" });
    }
  });

  // 1. Worker API: Bulk Sync Upload & Status (POST & GET /api/sync)
  app.all(["/api/sync", "/api/sync/"], (req, res) => {
    try {
      if (req.method === "GET") {
        return res.json({
          status: "online",
          endpoint: "/api/sync",
          serverRecordCount: d1Database.size,
          serverTimestamp: new Date().toISOString()
        });
      }

      const { deviceId, items } = req.body || {};
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Invalid sync request format: items array required" });
      }

      if (deviceId) {
        activeDevices.add(deviceId);
      }

      let processedCount = 0;
      const nowIso = new Date().toISOString();

      items.forEach((item: any) => {
        if (!item.table || !item.recordId) return;

        const key = `${item.table}:${item.recordId}`;
        const existing = d1Database.get(key);

        // Conflict handling: Latest timestamp / version wins
        if (!existing || (item.version && item.version >= existing.version) || item.updatedAt >= existing.updatedAt) {
          d1Database.set(key, {
            table: item.table,
            recordId: item.recordId,
            data: item.action === "delete" ? null : item.data,
            updatedAt: item.updatedAt || nowIso,
            deviceId: item.deviceId || deviceId || "UNKNOWN",
            version: item.version || Date.now(),
            isDeleted: item.action === "delete"
          });
          processedCount++;
        }
      });

      return res.json({
        success: true,
        processedCount,
        serverTimestamp: nowIso,
        totalServerRecords: d1Database.size
      });
    } catch (err: any) {
      console.error("[Worker API /api/sync Error]:", err);
      return res.status(500).json({ error: err?.message || "Sync execution failed" });
    }
  });

  // 1b. Worker API: Inbound LMS Automated Sync (POST /api/lms/sync)
  app.post(["/api/lms/sync", "/api/lms/sync/"], (req, res) => {
    try {
      // 1. Authenticate with LMS Shared Secret (Requires configured LMS_SYNC_SECRET)
      const authHeader = req.headers["authorization"] || "";
      const lmsHeaderToken = (req.headers["x-lms-auth-token"] as string) || "";
      const expectedSecret = process.env.LMS_SYNC_SECRET;

      const tokenFromBearer = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7).trim()
        : "";
      const suppliedToken = lmsHeaderToken.trim() || tokenFromBearer;

      if (!expectedSecret || !suppliedToken || suppliedToken !== expectedSecret) {
        return res.status(401).json({ error: "Unauthorized: Invalid or missing LMS authentication token." });
      }

      // 2. Parse request payload
      const payload = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
      if (!payload || payload.trim() === "{}" || payload.trim().length === 0) {
        return res.status(400).json({ error: "Bad Request: Empty payload received." });
      }

      // 3. Query existing active FSOS machines from simulated D1
      const existingMachines: any[] = [];
      d1Database.forEach((rec) => {
        if (rec.table === "machines" && !rec.isDeleted && rec.data) {
          try {
            const parsedM = typeof rec.data === "string" ? JSON.parse(rec.data) : rec.data;
            if (parsedM && parsedM.id) {
              existingMachines.push(parsedM);
            }
          } catch (_) {}
        }
      });

      // 4. Resolve baseline timestamps for changed readings without explicit timestamp
      const nowIso = new Date().toISOString();
      const preparedPayload = pairLmsSyncTimestamps(payload, existingMachines, nowIso);

      // 5. Map & Merge using LaserEngine
      const mergeResult = LaserEngine.parseAndMapLaserMonitorJson(preparedPayload, existingMachines, []);
      const updatedMachines = mergeResult.importedMachineList || [];
      const version = Date.now();

      // 5. Update only matched machines in D1 records table
      if (updatedMachines.length > 0) {
        for (const m of updatedMachines) {
          const key = `machines:${m.id}`;
          d1Database.set(key, {
            table: "machines",
            recordId: m.id,
            data: m,
            updatedAt: nowIso,
            deviceId: "LMS-SYNC",
            version,
            isDeleted: false
          });
        }
      }

      const hasUpdated = updatedMachines.length > 0;
      return res.json({
        success: true,
        updated: hasUpdated,
        source: "LMS_v2_SYNC",
        machinesFound: mergeResult.machinesFound,
        laserHeadsFound: mergeResult.laserHeadsFound,
        matchedCount: mergeResult.existingMatched,
        updatedCount: updatedMachines.length,
        skippedUnmatched: mergeResult.skippedUnmatched,
        updatedMachineIds: updatedMachines.map((m: any) => m.id),
        warnings: mergeResult.warnings,
        message: hasUpdated
          ? `Successfully updated ${updatedMachines.length} FSOS machine(s).`
          : "No matching FSOS machines found to update.",
        serverTimestamp: nowIso
      });
    } catch (err: any) {
      console.error("[Worker API /api/lms/sync Error]:", err);
      return res.status(400).json({ error: `Failed to process LMS payload: ${err?.message || String(err)}` });
    }
  });

  // 1c. Worker API: Inbound LMS Pull (POST/GET /api/lms/pull)
  const handleLmsPull = async (req: any, res: any) => {
    try {
      const lmsBaseUrl = (req.query.lmsUrl as string) || process.env.LMS_URL || "https://lms-worker.mohamadsahafiz.workers.dev";
      const lmsEndpoint = lmsBaseUrl.replace(/\/+$/, "") + "/api/lms/laser-hours";
      const secret = process.env.LMS_SYNC_SECRET;

      if (!secret) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized / Configuration Error: LMS_SYNC_SECRET is not configured in environment."
        });
      }

      let lmsRes: Response;
      try {
        lmsRes = await fetch(lmsEndpoint, {
          method: "GET",
          headers: {
            "X-LMS-Auth-Token": secret,
            "Authorization": `Bearer ${secret}`,
            "Accept": "application/json"
          }
        });
      } catch (fetchErr: any) {
        return res.status(502).json({
          success: false,
          error: `LMS API Read Failure: Failed to reach LMS at ${lmsEndpoint} (${fetchErr?.message || String(fetchErr)})`
        });
      }

      if (!lmsRes.ok) {
        const errBody = await lmsRes.text().catch(() => "");
        if (lmsRes.status === 401 || lmsRes.status === 403) {
          return res.status(401).json({
            success: false,
            error: `LMS Authentication Failure: LMS rejected authentication token (HTTP ${lmsRes.status}).`
          });
        }
        return res.status(502).json({
          success: false,
          error: `LMS API Read Failure: Upstream returned HTTP ${lmsRes.status}: ${errBody || "Unknown Error"}`
        });
      }

      const lmsPayload = await lmsRes.json();
      const rawRecords: Array<{ machineKey: string; laserKey: string; hours: number; timestamp?: string }> = [];

      if (Array.isArray(lmsPayload)) {
        for (const item of lmsPayload) {
          const mKey = String(item.machineNumber || item.machine || item.machineNo || item.machineId || item.serialNo || item.id || "").trim();
          const lKey = String(item.laserHead || item.laser || item.laserId || item.head || item.name || item.id || item.serialNo || "").trim();
          const hr = item.baseLaserHour ?? item.operatingHours ?? item.hours ?? item.currentHours ?? item.laserHours ?? item.hour;
          if (mKey && lKey && hr !== undefined && hr !== null && !isNaN(Number(hr))) {
            rawRecords.push({ machineKey: mKey, laserKey: lKey, hours: Number(hr), timestamp: item.baseTimestamp || item.timestamp });
          }
        }
      } else if (lmsPayload && typeof lmsPayload === "object") {
        const list = lmsPayload.records || lmsPayload.laserHours || lmsPayload.items || lmsPayload.data || [];
        if (Array.isArray(list) && list.length > 0) {
          for (const item of list) {
            const mKey = String(item.machineNumber || item.machine || item.machineNo || item.machineId || item.serialNo || item.id || "").trim();
            const lKey = String(item.laserHead || item.laser || item.laserId || item.head || item.name || item.id || item.serialNo || "").trim();
            const hr = item.baseLaserHour ?? item.operatingHours ?? item.hours ?? item.currentHours ?? item.laserHours ?? item.hour;
            if (mKey && lKey && hr !== undefined && hr !== null && !isNaN(Number(hr))) {
              rawRecords.push({ machineKey: mKey, laserKey: lKey, hours: Number(hr), timestamp: item.baseTimestamp || item.timestamp });
            }
          }
        } else if (Array.isArray(lmsPayload.machines)) {
          for (const m of lmsPayload.machines) {
            const mKey = String(m.machineNumber || m.machineNo || m.machine || m.id || m.serialNo || "").trim();
            const lasers = Array.isArray(m.lasers) ? m.lasers : (Array.isArray(m.laserHeads) ? m.laserHeads : []);
            for (const l of lasers) {
              const lKey = String(l.id || l.name || l.serialNo || "").trim();
              const hr = l.baseLaserHour ?? l.operatingHours ?? l.hours ?? l.currentHours ?? l.laserHours ?? l.hour;
              if (mKey && lKey && hr !== undefined && hr !== null && !isNaN(Number(hr))) {
                rawRecords.push({ machineKey: mKey, laserKey: lKey, hours: Number(hr), timestamp: l.baseTimestamp || l.timestamp });
              }
            }
          }
        }
      }

      const existingMachines: any[] = [];
      d1Database.forEach((rec, key) => {
        if (key.startsWith("machines:") && rec.table === "machines" && !rec.isDeleted && rec.data) {
          existingMachines.push(rec.data);
        }
      });

      const nowIso = new Date().toISOString();
      let matchedCount = 0;
      let skippedCount = 0;
      const unmatched: Array<{ machine: string; laser: string; reason: string }> = [];
      const updatedMachinesMap = new Map<string, any>();

      for (const item of rawRecords) {
        const normM = item.machineKey.toLowerCase();
        const targetMachine = existingMachines.find((m: any) => {
          const mId = (m.id || "").trim().toLowerCase();
          const mNum = (m.machineNumber || m.machineNo || "").trim().toLowerCase();
          const mSerial = (m.serialNo || m.serialNumber || "").trim().toLowerCase();
          return mId === normM || mNum === normM || mSerial === normM;
        });

        if (!targetMachine) {
          skippedCount++;
          unmatched.push({ machine: item.machineKey, laser: item.laserKey, reason: "Machine not found in FSOS" });
          continue;
        }

        const lasers = Array.isArray(targetMachine.lasers) ? targetMachine.lasers : [];
        const normL = item.laserKey.toLowerCase();
        const targetLaser = lasers.find((l: any, lIdx: number) => {
          const lId = (l.id || "").trim().toLowerCase();
          const lSerial = (l.serialNo || "").trim().toLowerCase();
          const lName = (l.name || "").trim().toLowerCase();
          if (lId === normL || lId.endsWith("-" + normL) || normL.endsWith(lId)) return true;
          if (lSerial && lSerial === normL && lSerial !== "sn-0000-l1" && lSerial !== "sn-unknown-l1") return true;
          if (lName && lName === normL) return true;
          const headNumMatch = normL.match(/(?:lh|l|head|laserhead|laser)[-_\s]*(\d+)/i) || normL.match(/^(\d+)$/);
          if (headNumMatch) {
            const headIdx = parseInt(headNumMatch[1], 10) - 1;
            if (headIdx === lIdx) return true;
          }
          return false;
        });

        if (!targetLaser) {
          skippedCount++;
          unmatched.push({ machine: item.machineKey, laser: item.laserKey, reason: "Laser head not found on matched FSOS machine" });
          continue;
        }

        matchedCount++;
        const hoursChanged = targetLaser.baseLaserHour !== item.hours;
        targetLaser.baseLaserHour = item.hours;
        if (item.timestamp) {
          targetLaser.baseTimestamp = item.timestamp;
        } else if (hoursChanged) {
          targetLaser.baseTimestamp = nowIso;
        }

        if (Array.isArray(targetMachine.laserHeads)) {
          const lhMatch = targetMachine.laserHeads.find((lh: any) => lh.id === targetLaser.id);
          if (lhMatch) {
            lhMatch.baseLaserHour = targetLaser.baseLaserHour;
            lhMatch.baseTimestamp = targetLaser.baseTimestamp;
          }
        }

        targetMachine.lastUpdated = nowIso;
        updatedMachinesMap.set(targetMachine.id, targetMachine);
      }

      const updatedMachines = Array.from(updatedMachinesMap.values());
      const version = Date.now();
      for (const m of updatedMachines) {
        const key = `machines:${m.id}`;
        d1Database.set(key, {
          table: "machines",
          recordId: m.id,
          data: m,
          updatedAt: nowIso,
          deviceId: "LMS-PULL",
          version,
          isDeleted: false
        });
      }

      return res.json({
        success: true,
        source: "LMS_PULL",
        matchedCount,
        updatedCount: updatedMachines.length,
        updatedMachineIds: updatedMachines.map((m: any) => m.id),
        skippedCount,
        unmatched,
        serverTimestamp: nowIso
      });
    } catch (err: any) {
      console.error("[Worker API /api/lms/pull Error]:", err);
      return res.status(500).json({ error: `Failed to pull LMS laser hours: ${err?.message || String(err)}` });
    }
  };

  app.post("/api/lms/pull", handleLmsPull);
  app.get("/api/lms/pull", handleLmsPull);

  // 2. Worker API: Cross-Device Changes Download (GET /api/changes)
  app.get("/api/changes", (req, res) => {
    try {
      const sinceParam = (req.query.since as string) || "0";
      const deviceIdParam = (req.query.deviceId as string) || "";

      if (deviceIdParam) {
        activeDevices.add(deviceIdParam);
      }

      const sinceTime = sinceParam === "0" ? 0 : (new Date(sinceParam).getTime() || 0);
      const changes: D1Record[] = [];

      d1Database.forEach((rec) => {
        const recordTime = new Date(rec.updatedAt).getTime() || rec.version || 0;
        // If since === 0, fetch active non-deleted records (excluding requesting device)
        if (sinceTime === 0) {
          if (!rec.isDeleted && (!deviceIdParam || rec.deviceId !== deviceIdParam)) {
            changes.push(rec);
          }
        } else {
          // Incremental updates: return records updated after sinceTime from OTHER devices
          if (recordTime > sinceTime && (!deviceIdParam || rec.deviceId !== deviceIdParam)) {
            changes.push(rec);
          }
        }
      });

      // Sort by updatedAt ascending and cap at 500 records
      changes.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      const boundedChanges = changes.slice(0, 500);

      res.json({
        success: true,
        serverTimestamp: new Date().toISOString(),
        serverRecordCount: d1Database.size,
        changes: boundedChanges
      });
    } catch (err: any) {
      console.error("[Worker API /api/changes Error]:", err);
      res.status(500).json({ error: err?.message || "Failed to fetch cloud changes" });
    }
  });

  // 3a. Worker API: Binary Image Chunk Persistence (POST /api/images/chunk)
  app.post("/api/images/chunk", (req, res) => {
    const reqStart = Date.now();
    const reqId = `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    let stage = "INIT";
    let imageId = "";
    let chunkIndex = 0;
    let totalChunks = 1;
    let chunkByteLength = 0;

    try {
      stage = "PARSE_HEADERS";
      const rawImageIdHeader = (req.headers["x-image-id"] as string) || "";
      imageId = decodeURIComponent(rawImageIdHeader);
      chunkIndex = parseInt((req.headers["x-chunk-index"] as string) || "0", 10);
      totalChunks = parseInt((req.headers["x-total-chunks"] as string) || "1", 10);
      const mimeType = (req.headers["x-mime-type"] as string) || "application/octet-stream";
      const byteSize = parseInt((req.headers["x-byte-size"] as string) || "0", 10);
      const deviceId = (req.headers["x-device-id"] as string) || "";

      if (!imageId || isNaN(chunkIndex) || isNaN(totalChunks) || totalChunks < 1 || chunkIndex < 0 || chunkIndex >= totalChunks) {
        const durationMs = Date.now() - reqStart;
        res.setHeader("X-Request-Id", reqId);
        res.setHeader("X-Stage", "VALIDATION_ERROR");
        res.setHeader("X-Duration-Ms", String(durationMs));
        return res.status(400).json({
          error: "Invalid chunk metadata headers (x-image-id, x-chunk-index, x-total-chunks)",
          reqId,
          stage: "VALIDATION_ERROR",
          durationMs,
          imageId,
          chunkIndex,
          totalChunks
        });
      }

      if (deviceId) {
        activeDevices.add(deviceId);
      }

      stage = "READ_BODY";
      let chunkBytes: Uint8Array;
      if (Buffer.isBuffer(req.body)) {
        chunkBytes = new Uint8Array(req.body.buffer, req.body.byteOffset, req.body.byteLength);
      } else if (req.body instanceof Uint8Array) {
        chunkBytes = req.body;
      } else {
        const durationMs = Date.now() - reqStart;
        res.setHeader("X-Request-Id", reqId);
        res.setHeader("X-Stage", "INVALID_BODY");
        res.setHeader("X-Duration-Ms", String(durationMs));
        return res.status(400).json({
          error: "Raw binary chunk body required",
          reqId,
          stage: "INVALID_BODY",
          durationMs,
          imageId,
          chunkIndex,
          totalChunks
        });
      }

      chunkByteLength = chunkBytes.byteLength;
      const nowIso = new Date().toISOString();

      stage = "D1_UPSERT";
      const d1Start = Date.now();
      const existingChunks = d1ImageChunks.get(imageId) || [];
      
      // If chunk 0 is uploaded, filter out any older chunks with index >= totalChunks
      let filteredChunks = chunkIndex === 0
        ? existingChunks.filter(c => c.chunkIndex < totalChunks)
        : existingChunks;

      // Filter out chunk with same chunkIndex if present (safe idempotent upsert)
      filteredChunks = filteredChunks.filter(c => c.chunkIndex !== chunkIndex);

      filteredChunks.push({
        imageId,
        chunkIndex,
        totalChunks,
        data: chunkBytes,
        mimeType,
        byteSize: byteSize > 0 ? byteSize : chunkByteLength,
        createdAt: nowIso
      });

      d1ImageChunks.set(imageId, filteredChunks);
      const d1DurationMs = Date.now() - d1Start;
      const totalDurationMs = Date.now() - reqStart;

      res.setHeader("X-Request-Id", reqId);
      res.setHeader("X-Stage", "COMPLETE");
      res.setHeader("X-Duration-Ms", String(totalDurationMs));
      res.setHeader("X-D1-Duration-Ms", String(d1DurationMs));

      res.json({
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
      });
    } catch (err: any) {
      const totalDurationMs = Date.now() - reqStart;
      console.error(`[Worker API /api/images/chunk Error] [${reqId}] stage=${stage} img=${imageId} chunk=${chunkIndex}/${totalChunks} size=${chunkByteLength} err=${err?.message || String(err)} durationMs=${totalDurationMs}`);
      res.setHeader("X-Request-Id", reqId);
      res.setHeader("X-Stage", stage);
      res.setHeader("X-Duration-Ms", String(totalDurationMs));
      res.status(500).json({
        error: err?.message || "Failed to persist image chunk",
        errorName: err?.name,
        reqId,
        stage,
        imageId,
        chunkIndex,
        totalChunks,
        bytesReceived: chunkByteLength,
        durationMs: totalDurationMs,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 3b. Worker API: Separate Image Persistence (POST /api/images)
  app.post("/api/images", (req, res) => {
    try {
      const { imageId, dataUrl, deviceId } = req.body || {};
      if (!imageId || !dataUrl) {
        return res.status(400).json({ error: "imageId and dataUrl required" });
      }

      if (deviceId) {
        activeDevices.add(deviceId);
      }

      const { mimeType, binary } = parseDataUrl(dataUrl);
      const byteSize = binary.byteLength;
      const SINGLE_CHUNK_MAX = 1500000;
      const MULTI_CHUNK_SIZE = 1000000;

      const chunks: D1ImageChunk[] = [];
      const nowIso = new Date().toISOString();

      if (byteSize <= SINGLE_CHUNK_MAX) {
        chunks.push({
          imageId,
          chunkIndex: 0,
          totalChunks: 1,
          data: binary,
          mimeType,
          byteSize,
          createdAt: nowIso
        });
      } else {
        const total = Math.ceil(byteSize / MULTI_CHUNK_SIZE);
        for (let i = 0; i < total; i++) {
          const slice = binary.subarray(i * MULTI_CHUNK_SIZE, Math.min((i + 1) * MULTI_CHUNK_SIZE, byteSize));
          chunks.push({
            imageId,
            chunkIndex: i,
            totalChunks: total,
            data: slice,
            mimeType,
            byteSize,
            createdAt: nowIso
          });
        }
      }

      d1ImageChunks.set(imageId, chunks);

      res.json({
        success: true,
        imageId,
        byteSize,
        totalChunks: chunks.length,
        serverTimestamp: nowIso
      });
    } catch (err: any) {
      console.error("[Worker API /api/images Error]:", err);
      res.status(500).json({ error: err?.message || "Failed to persist image" });
    }
  });

  // 3c. Worker API: Image Metadata Info (GET /api/images/:imageId/info)
  app.get("/api/images/:imageId/info", (req, res) => {
    try {
      const { imageId } = req.params;
      const chunks = d1ImageChunks.get(imageId);
      if (!chunks || chunks.length === 0) {
        return res.status(404).json({ error: "Image not found in Cloud D1 replica" });
      }

      const row = chunks[0];
      res.json({
        success: true,
        imageId,
        totalChunks: row.totalChunks,
        byteSize: row.byteSize,
        mimeType: row.mimeType,
        createdAt: row.createdAt
      });
    } catch (err: any) {
      console.error("[Worker API /api/images/:imageId/info Error]:", err);
      res.status(500).json({ error: err?.message || "Failed to retrieve image info" });
    }
  });

  // 3d. Worker API: Single Raw Binary Chunk (GET /api/images/:imageId/chunk/:index)
  app.get("/api/images/:imageId/chunk/:index", (req, res) => {
    try {
      const { imageId, index } = req.params;
      const chunkIndex = parseInt(index, 10);
      const chunks = d1ImageChunks.get(imageId);
      if (!chunks || chunks.length === 0) {
        return res.status(404).json({ error: "Image not found in Cloud D1 replica" });
      }

      const chunk = chunks.find(c => c.chunkIndex === chunkIndex);
      if (!chunk) {
        return res.status(404).json({ error: `Chunk ${chunkIndex} not found for image ${imageId}` });
      }

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("X-Image-Id", encodeURIComponent(imageId));
      res.setHeader("X-Chunk-Index", String(chunkIndex));
      res.setHeader("X-Total-Chunks", String(chunk.totalChunks));
      res.setHeader("X-Mime-Type", String(chunk.mimeType));
      res.setHeader("X-Byte-Size", String(chunk.byteSize));
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

      return res.send(Buffer.from(chunk.data));
    } catch (err: any) {
      console.error("[Worker API /api/images/:imageId/chunk/:index Error]:", err);
      res.status(500).json({ error: err?.message || "Failed to retrieve image chunk" });
    }
  });

  // 4. Worker API: Record Deletion / Mutation (Supports ALL methods: DELETE, POST, etc.)
  app.all("/api/record", (req, res) => {
    try {
      const { table, recordId, deviceId, action } = req.body || {};
      if (!table || !recordId) {
        return res.status(400).json({ error: "table and recordId required" });
      }

      const key = `${table}:${recordId}`;
      const isDeleted = action === "delete" || req.method === "DELETE";

      d1Database.set(key, {
        table,
        recordId,
        data: isDeleted ? null : req.body.data,
        updatedAt: new Date().toISOString(),
        deviceId: deviceId || "UNKNOWN",
        version: Date.now(),
        isDeleted
      });

      res.json({ success: true, table, recordId, isDeleted });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to process record" });
    }
  });

  // 6. Worker API: Status & Device Telemetry (GET /api/sync/status)
  app.get("/api/sync/status", (req, res) => {
    res.json({
      status: "online",
      serverRecordCount: d1Database.size,
      totalStoredImages: d1ImageChunks.size,
      activeDevices: Array.from(activeDevices),
      serverTimestamp: new Date().toISOString()
    });
  });

  // 7. AI Finding Assistance (POST /api/generate-finding)
  app.post("/api/generate-finding", express.json(), async (req, res) => {
    try {
      const { component, conditions, actionRecommendation, engineerNote } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Convert these optical/mechanical laser inspection facts into a professional technical report summary (1-2 clear sentences).
Facts:
- Component: ${component || 'Not specified'}
- Observed Damage/Conditions: ${Array.isArray(conditions) ? conditions.join(', ') : 'None'}
- Action / Recommendation: ${actionRecommendation || 'None'}
- Engineer Note: ${engineerNote || 'None'}

Rules:
1. Use ONLY the facts provided. Do NOT invent measurements, causes, or unrecorded damage.
2. Return ONLY the final professional report wording without commentary or bullet points.`;

        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = result?.text?.trim();
        if (text) {
          return res.json({ wording: text });
        }
      }

      // Local fallback if no API key or empty response
      const condStr = Array.isArray(conditions) && conditions.length > 0 ? conditions.join(', ').toLowerCase() : 'observed issue';
      const fallback = `Inspection of ${component || 'component'} revealed ${condStr}.${engineerNote ? ` Observation: ${engineerNote}.` : ''} Action taken/recommended: ${actionRecommendation || 'Review required'}.`;
      res.json({ wording: fallback });
    } catch (err: any) {
      console.warn('[AI Generate Finding Warning]:', err?.message);
      res.json({ 
        wording: `Inspection of ${req.body?.component || 'component'} revealed ${Array.isArray(req.body?.conditions) ? req.body.conditions.join(', ') : 'observed issue'}. Action: ${req.body?.actionRecommendation || 'Review required'}.`
      });
    }
  });

  // Catch-all 404 handler for unhandled /api/* requests to ensure JSON is always returned instead of HTML
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FSOS Cloudflare Worker API & Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
