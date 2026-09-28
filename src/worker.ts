import { APP_VERSION } from './constants/version';
import { LaserEngine } from './utils/laserEngine';

export interface Env {
  DB?: any;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  APP_VERSION?: string;
  LMS_SYNC_SECRET?: string;
  LMS_URL?: string;
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
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-LMS-Auth-Token",
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

/**
 * Ensures newly received LMS laser readings pair with the sync arrival timestamp
 * when baseLaserHour changes and LMS does not supply an explicit baseTimestamp.
 */
export function pairLmsSyncTimestamps(payloadText: string, existingMachines: any[], syncTimestamp: string): string {
  try {
    const parsed = JSON.parse(payloadText);
    let rawList: any[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.machines)) rawList = parsed.machines;
      else if (Array.isArray(parsed.fleet)) rawList = parsed.fleet;
      else if (Array.isArray(parsed.data)) rawList = parsed.data;
      else if (parsed.id || parsed.machineNo || parsed.machineNumber) rawList = [parsed];
    }

    if (!Array.isArray(rawList) || rawList.length === 0) return payloadText;

    for (const rawM of rawList) {
      if (!rawM || typeof rawM !== "object") continue;
      const rawId = (rawM.id || "").trim().toLowerCase();
      const rawNo = (rawM.machineNo || rawM.machineNumber || "").trim().toLowerCase();
      const rawSerial = (rawM.serialNo || rawM.serialNumber || "").trim().toLowerCase();

      // Find matching existing machine
      const exM = existingMachines.find((m) => {
        const exId = (m.id || "").trim().toLowerCase();
        const exNo = (m.machineNo || m.machineNumber || "").trim().toLowerCase();
        const exSerial = (m.serialNo || "").trim().toLowerCase();
        if (rawId && exId && rawId === exId) return true;
        if (rawNo && exNo && rawNo === exNo) return true;
        if (rawSerial && exSerial && rawSerial === exSerial) return true;
        return false;
      });

      if (!exM) continue;

      const rawLasers = Array.isArray(rawM.lasers) ? rawM.lasers : (Array.isArray(rawM.laserHeads) ? rawM.laserHeads : []);
      const exLasers = Array.isArray(exM.lasers) ? exM.lasers : (Array.isArray(exM.laserHeads) ? exM.laserHeads : []);

      for (const rawL of rawLasers) {
        if (!rawL || typeof rawL !== "object") continue;
        const rawLId = (rawL.id || "").trim().toLowerCase();
        const rawLSerial = (rawL.serialNo || rawL.serialNumber || "").trim().toLowerCase();

        const rawIdx = rawLasers.indexOf(rawL);
        const exL = exLasers.find((tl: any, tlIdx: number) => {
          const tlId = (tl.id || "").trim().toLowerCase();
          const tlSerial = (tl.serialNo || tl.serialNumber || "").trim().toLowerCase();
          if (rawLId && tlId && (rawLId === tlId || rawLId.endsWith(tlId) || tlId.endsWith(rawLId))) return true;
          if (rawLSerial && tlSerial && rawLSerial === tlSerial && rawLSerial !== "sn-0000-l1" && rawLSerial !== "sn-unknown-l1") return true;
          if (tlIdx === rawIdx) return true;
          return false;
        });

        const hasIncomingBaseHour = rawL.baseLaserHour !== null && rawL.baseLaserHour !== undefined && !isNaN(Number(rawL.baseLaserHour));
        if (hasIncomingBaseHour) {
          const incomingBaseHour = Number(rawL.baseLaserHour);
          const exBaseHour = (exL && exL.baseLaserHour !== null && exL.baseLaserHour !== undefined) ? Number(exL.baseLaserHour) : null;
          const isHourChanged = exBaseHour === null || incomingBaseHour !== exBaseHour;

          if (isHourChanged) {
            // If LMS did not supply baseTimestamp, pair with sync arrival timestamp
            if (!rawL.baseTimestamp || isNaN(new Date(rawL.baseTimestamp).getTime())) {
              rawL.baseTimestamp = syncTimestamp;
            }
          }
          // If hour is unchanged and LMS omitted timestamp, LaserEngine naturally preserves exL.baseTimestamp
        }
      }
    }

    return JSON.stringify(parsed);
  } catch {
    return payloadText;
  }
}

export interface LmsPullResult {
  success: boolean;
  source: string;
  matchedCount: number;
  updatedCount: number;
  updatedMachineIds: string[];
  skippedCount: number;
  unmatched?: Array<{ machine: string; laser: string; reason: string }>;
  error?: string;
  statusCode?: number;
  serverTimestamp: string;
}

/**
 * Shared, reusable LMS Laser Hours Pull Operation
 * Invoked by both manual POST/GET /api/lms/pull and automated 5-minute scheduled cron trigger.
 */
export async function pullLmsLaserHours(env: Env, customLmsUrl?: string): Promise<LmsPullResult> {
  const lmsBaseUrl = customLmsUrl || env?.LMS_URL || "https://lms-worker.mohamadsahafiz.workers.dev";
  const lmsEndpoint = lmsBaseUrl.replace(/\/+$/, "") + "/api/lms/laser-hours";
  const secret = env?.LMS_SYNC_SECRET;
  const nowIso = new Date().toISOString();

  if (!secret) {
    return {
      success: false,
      source: "LMS_PULL",
      error: "Unauthorized / Configuration Error: LMS_SYNC_SECRET is not configured in FSOS Worker environment.",
      matchedCount: 0,
      updatedCount: 0,
      updatedMachineIds: [],
      skippedCount: 0,
      statusCode: 401,
      serverTimestamp: nowIso
    };
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
    return {
      success: false,
      source: "LMS_PULL",
      error: `LMS API Read Failure: Failed to reach LMS at ${lmsEndpoint} (${fetchErr?.message || String(fetchErr)})`,
      matchedCount: 0,
      updatedCount: 0,
      updatedMachineIds: [],
      skippedCount: 0,
      statusCode: 502,
      serverTimestamp: nowIso
    };
  }

  if (!lmsRes.ok) {
    const errBody = await lmsRes.text().catch(() => "");
    if (lmsRes.status === 401 || lmsRes.status === 403) {
      return {
        success: false,
        source: "LMS_PULL",
        error: `LMS Authentication Failure: LMS rejected authentication token (HTTP ${lmsRes.status}).`,
        matchedCount: 0,
        updatedCount: 0,
        updatedMachineIds: [],
        skippedCount: 0,
        statusCode: 401,
        serverTimestamp: nowIso
      };
    }
    return {
      success: false,
      source: "LMS_PULL",
      error: `LMS API Read Failure: Upstream returned HTTP ${lmsRes.status}: ${errBody || "Unknown Error"}`,
      matchedCount: 0,
      updatedCount: 0,
      updatedMachineIds: [],
      skippedCount: 0,
      statusCode: 502,
      serverTimestamp: nowIso
    };
  }

  let lmsPayload: any;
  try {
    lmsPayload = await lmsRes.json();
  } catch (jsonErr: any) {
    return {
      success: false,
      source: "LMS_PULL",
      error: `LMS API Read Failure: Invalid JSON returned from LMS (${jsonErr?.message || String(jsonErr)})`,
      matchedCount: 0,
      updatedCount: 0,
      updatedMachineIds: [],
      skippedCount: 0,
      statusCode: 502,
      serverTimestamp: nowIso
    };
  }

  // Flatten and normalize LMS records
  const rawRecords: Array<{
    machineKey: string;
    laserKey: string;
    hours: number;
    timestamp?: string;
  }> = [];

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

  const db = await getDb(env);
  await ensureD1Table(db);

  const existingRows = await db.prepare(
    "SELECT data FROM records WHERE table_name = 'machines' AND is_deleted = 0"
  ).all();

  const existingMachines: any[] = [];
  if (Array.isArray(existingRows?.results)) {
    for (const row of existingRows.results) {
      if (row?.data) {
        try {
          const parsedM = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          if (parsedM && parsedM.id) {
            existingMachines.push(parsedM);
          }
        } catch (_) {}
      }
    }
  }

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
      // Check LH1 / L1 / head index
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

    // Sync laserHeads if present
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
  const updatedMachineIds = updatedMachines.map((m: any) => m.id);

  if (updatedMachines.length > 0) {
    try {
      for (const m of updatedMachines) {
        const key = `machines:${m.id}`;
        const dataStr = JSON.stringify(m);
        await db.prepare(
          `INSERT INTO records (key, table_name, record_id, data, updated_at, device_id, version, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET
             data = excluded.data,
             updated_at = excluded.updated_at,
             device_id = excluded.device_id,
             version = excluded.version,
             is_deleted = excluded.is_deleted`
        ).bind(key, "machines", m.id, dataStr, nowIso, "LMS-PULL", version, 0).run();
      }
    } catch (d1Err: any) {
      return {
        success: false,
        source: "LMS_PULL",
        error: `D1 write failed: ${d1Err?.message || "Database persistence error"}`,
        matchedCount,
        updatedCount: 0,
        updatedMachineIds: [],
        skippedCount,
        statusCode: 500,
        serverTimestamp: nowIso
      };
    }
  }

  return {
    success: true,
    source: "LMS_PULL",
    matchedCount,
    updatedCount: updatedMachines.length,
    updatedMachineIds,
    skippedCount,
    unmatched,
    serverTimestamp: nowIso
  };
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
          const version = APP_VERSION;
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
            const version = APP_VERSION;
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

        // Endpoint: POST /api/lms/sync (LMS v2 Ingestion Receiver)
        if (path === "/api/lms/sync" || path === "/api/lms/sync/") {
          if (request.method !== "POST") {
            return json({ error: "Method not allowed. POST required." }, 405);
          }

          // 1. Authenticate with LMS Shared Secret (Requires configured LMS_SYNC_SECRET)
          const authHeader = request.headers.get("Authorization") || "";
          const lmsHeaderToken = request.headers.get("X-LMS-Auth-Token") || "";
          const expectedSecret = env?.LMS_SYNC_SECRET;

          const tokenFromBearer = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : "";
          const suppliedToken = lmsHeaderToken.trim() || tokenFromBearer;

          if (!expectedSecret || !suppliedToken || suppliedToken !== expectedSecret) {
            return json({ error: "Unauthorized: Invalid or missing LMS authentication token." }, 401);
          }

          // 2. Parse request payload
          const bodyText = await request.text().catch(() => "");
          if (!bodyText || bodyText.trim().length === 0) {
            return json({ error: "Bad Request: Empty payload received." }, 400);
          }

          const db = await getDb(env);
          await ensureD1Table(db);

          // 3. Query existing active FSOS machines from D1
          const existingRows = await db.prepare(
            "SELECT data FROM records WHERE table_name = 'machines' AND is_deleted = 0"
          ).all();

          const existingMachines: any[] = [];
          if (Array.isArray(existingRows?.results)) {
            for (const row of existingRows.results) {
              if (row?.data) {
                try {
                  const parsedM = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
                  if (parsedM && parsedM.id) {
                    existingMachines.push(parsedM);
                  }
                } catch (_) {}
              }
            }
          }

          // 4. Resolve baseline timestamps for changed readings without explicit timestamp
          const nowIso = new Date().toISOString();
          const preparedPayload = pairLmsSyncTimestamps(bodyText, existingMachines, nowIso);

          // 5. Map & Merge using LaserEngine
          let mergeResult: any;
          try {
            mergeResult = LaserEngine.parseAndMapLaserMonitorJson(preparedPayload, existingMachines, []);
          } catch (err: any) {
            return json({
              error: `Failed to process LMS payload: ${err.message || String(err)}`
            }, 400);
          }

          // 6. Update only matched machines in D1 records table
          const updatedMachines = mergeResult.importedMachineList || [];
          const version = Date.now();
          const updatedMachineIds = updatedMachines.map((m: any) => m.id);

          if (updatedMachines.length > 0) {
            try {
              for (const m of updatedMachines) {
                const key = `machines:${m.id}`;
                const dataStr = JSON.stringify(m);
                await db.prepare(
                  `INSERT INTO records (key, table_name, record_id, data, updated_at, device_id, version, is_deleted)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(key) DO UPDATE SET
                     data = excluded.data,
                     updated_at = excluded.updated_at,
                     device_id = excluded.device_id,
                     version = excluded.version,
                     is_deleted = excluded.is_deleted`
                ).bind(key, "machines", m.id, dataStr, nowIso, "LMS-SYNC", version, 0).run();
              }
            } catch (d1Err: any) {
              console.error("[Worker /api/lms/sync D1 Write Error]:", d1Err);
              return json({
                success: false,
                error: `D1 write failed: ${d1Err?.message || "Database persistence error"}`,
                matchedCount: mergeResult.existingMatched,
                updatedCount: 0,
                updatedMachineIds: [],
                serverTimestamp: nowIso
              }, 500);
            }
          }

          const hasUpdated = updatedMachines.length > 0;

          return json({
            success: true,
            updated: hasUpdated,
            source: "LMS_v2_SYNC",
            machinesFound: mergeResult.machinesFound,
            laserHeadsFound: mergeResult.laserHeadsFound,
            matchedCount: mergeResult.existingMatched,
            updatedCount: updatedMachines.length,
            skippedUnmatched: mergeResult.skippedUnmatched,
            updatedMachineIds,
            warnings: mergeResult.warnings,
            message: hasUpdated
              ? `Successfully updated ${updatedMachines.length} FSOS machine(s).`
              : "No matching FSOS machines found to update.",
            serverTimestamp: nowIso
          });
        }

        // Endpoint: POST/GET /api/lms/pull (FSOS Inbound Pull from LMS GET /api/lms/laser-hours)
        if (path === "/api/lms/pull" || path === "/api/lms/pull/") {
          const customUrl = url.searchParams.get("lmsUrl") || undefined;
          const result = await pullLmsLaserHours(env, customUrl);
          return json(result, result.statusCode || (result.success ? 200 : 500));
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

        if (path === "/api/images/cleanup-orphans" && request.method === "POST") {
          const db = await getDb(env);
          await ensureD1Table(db);

          const body: any = await request.json().catch(() => ({}));
          const gracePeriodHours = typeof body.gracePeriodHours === "number" && body.gracePeriodHours >= 0
            ? body.gracePeriodHours
            : 24;

          // 1. Query active records only: SELECT data FROM records WHERE is_deleted = 0
          let activeRows: any[] = [];
          try {
            const res = await db.prepare("SELECT data FROM records WHERE is_deleted = 0").all();
            activeRows = res?.results || [];
          } catch (e) {
            console.warn("[Worker] Error fetching active records for image cleanup:", e);
          }

          // 2. Parse active record JSON and extract all reachable idb: references
          const reachableImageIds = new Set<string>();
          for (const row of activeRows) {
            if (!row || typeof row.data !== "string" || !row.data) continue;
            const matches = row.data.match(/idb:[a-zA-Z0-9_\-.:/]+/g);
            if (matches) {
              for (const match of matches) {
                const cleanId = match.startsWith("ref:") ? match.slice(4) : match;
                reachableImageIds.add(cleanId);
              }
            }
          }

          // 3. Find candidate image IDs from image_chunks older than grace period
          const cutoffDate = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000).toISOString();
          let candidateRows: any[] = [];
          try {
            const candRes = await db.prepare(
              "SELECT DISTINCT image_id, created_at FROM image_chunks WHERE created_at <= ?"
            ).bind(cutoffDate).all();
            candidateRows = candRes?.results || [];
          } catch (e) {
            console.warn("[Worker] Error fetching candidate image chunks for cleanup:", e);
          }

          // 4. Identify orphan image IDs: in image_chunks, older than grace period, NOT in reachableImageIds
          const orphanIds: string[] = [];
          for (const row of candidateRows) {
            if (row && row.image_id && !reachableImageIds.has(row.image_id)) {
              orphanIds.push(row.image_id);
            }
          }

          // 5. Delete orphan image chunks safely in batches (50 per batch)
          const BATCH_SIZE = 50;
          let deletedChunksCount = 0;
          for (let i = 0; i < orphanIds.length; i += BATCH_SIZE) {
            const batch = orphanIds.slice(i, i + BATCH_SIZE);
            const placeholders = batch.map(() => "?").join(", ");
            const deleteStmt = db.prepare(`DELETE FROM image_chunks WHERE image_id IN (${placeholders})`).bind(...batch);
            const res = await deleteStmt.run();
            deletedChunksCount += Number(res?.meta?.changes ?? batch.length);
          }

          return json({
            success: true,
            scannedRecords: activeRows.length,
            reachableImagesCount: reachableImageIds.size,
            candidateImagesCount: candidateRows.length,
            deletedOrphanImagesCount: orphanIds.length,
            deletedChunksCount,
            gracePeriodHours,
            cutoffTimestamp: cutoffDate,
            serverTimestamp: new Date().toISOString()
          });
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
  },

  /**
   * Automated Scheduled Cron Handler
   * Configured trigger: `triggers.crons = ["* / 5 * * * *"]` (Every 5 minutes)
   * Automatically polls LMS laser operating hours without calling external HTTP or duplicating logic.
   */
  async scheduled(event: any, env: Env, ctx?: any): Promise<void> {
    try {
      console.log("[Worker Scheduled LMS Pull]: Triggered automated 5-minute LMS laser hours sync...");
      const result = await pullLmsLaserHours(env);
      if (result.success) {
        console.log(`[Worker Scheduled LMS Pull Success]: Matched: ${result.matchedCount}, Updated: ${result.updatedCount}, Machines: [${result.updatedMachineIds.join(", ")}], Skipped: ${result.skippedCount}`);
      } else {
        console.warn(`[Worker Scheduled LMS Pull Warning]: ${result.error || "Non-successful result"}`);
      }
    } catch (scheduledErr: any) {
      // Ensure LMS/API/D1 failure never causes an unhandled rejection breaking Worker execution
      console.error("[Worker Scheduled LMS Pull Uncaught Error]:", scheduledErr?.message || String(scheduledErr));
    }
  }
};
