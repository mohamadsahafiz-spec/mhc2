import { SyncStatus, SyncQueueItem, SyncState, CloudRecord } from '../types/sync';
import { ImageStore } from './imageStore';

export interface ImageChunkUploadDiagnostic {
  status: number;
  statusText: string;
  chunkIndex: number;
  totalChunks: number;
  chunkBytes: number;
  totalBytes: number;
  durationMs: number;
  reqId: string;
  stage: string;
  d1DurationMs?: number | string;
  errorSnippet: string;
  isNetworkError: boolean;
  timestamp: string;
}

export interface FailedImageUploadInfo {
  attempts: number;
  nextRetry: number;
  lastError?: ImageChunkUploadDiagnostic;
}

function getCircularReplacer() {
  const ancestors: any[] = [];
  return function(this: any, _key: string, value: any) {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return undefined;
    }
    ancestors.push(value);
    return value;
  };
}

function safeJsonStringify(value: any, space?: number): string {
  try {
    return JSON.stringify(value, null, space);
  } catch (err) {
    try {
      return JSON.stringify(value, getCircularReplacer(), space);
    } catch (innerErr) {
      console.warn('[SyncEngine] safeJsonStringify error:', innerErr);
      return '{}';
    }
  }
}

function safeStorageGet(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    // ignore
  }
}

function safeStorageRemove(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch (e) {
    // ignore
  }
}

const QUEUE_KEY = 'fsos_sync_queue';
const DEVICE_ID_KEY = 'fsos_device_id';
const LAST_SYNC_KEY = 'fsos_last_sync_time';
const MIGRATED_KEY = 'fsos_cloud_migrated_v1';
const SYNCED_KEYS_KEY = 'fsos_synced_keys_v1';
const LEGACY_SYNCED_IMAGES_KEY = 'fsos_synced_images_v1';
const CONFIRMED_CLOUD_IMAGES_KEY = 'fsos_confirmed_cloud_images_v2';
const SERVER_RECORD_COUNT_KEY = 'fsos_server_record_count_v1';

function parseDataUrlToBinary(dataUrl: string): { mimeType: string; binary: Uint8Array } {
  if (dataUrl.startsWith("data:")) {
    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) {
      return { mimeType: "application/octet-stream", binary: new Uint8Array() };
    }
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
      return { mimeType, binary: new TextEncoder().encode(decoded) };
    }
  } else if (dataUrl.startsWith("<svg")) {
    return { mimeType: "image/svg+xml", binary: new TextEncoder().encode(dataUrl) };
  } else {
    return { mimeType: "application/octet-stream", binary: new TextEncoder().encode(dataUrl) };
  }
}

function binaryToClientDataUrl(mimeType: string, bytes: Uint8Array): string {
  if (mimeType === 'image/svg+xml') {
    return new TextDecoder().decode(bytes);
  }
  let binaryStr = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binaryStr)}`;
}

// Maximum chunk size for raw binary transport over HTTP (512 KB)
const CLIENT_IMAGE_CHUNK_SIZE = 512 * 1024;

type Listener = (state: SyncState) => void;

class SyncEngineManager {
  private queue: SyncQueueItem[] = [];
  private deviceId: string = 'HOME-PC';
  private lastSyncTime: string | null = null;
  private status: SyncStatus = 'synced';
  private online: boolean = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
  private serverRecordCount: number = 0;
  private lastError: string | null = null;
  private listeners: Set<Listener> = new Set();
  private isProcessing: boolean = false;
  private syncInterval: any = null;
  private onRemoteDataUpdateCallback: ((table: string, data: any) => void) | null = null;
  private localDataProvider: (() => Record<string, any[]>) | null = null;
  private bootstrappedKeys: Set<string> = new Set();
  private confirmedCloudImages: Set<string> = new Set();
  private uploadingImages: Set<string> = new Set();
  private failedImageUploads: Map<string, FailedImageUploadInfo> = new Map();
  private lastImageUploadDiagnostic: ImageChunkUploadDiagnostic | null = null;
  private pendingImageDownloads: Set<string> = new Set();
  private activeDownloadingImage: string | null = null;
  private missingRemoteImages: Map<string, { attempts: number; nextRetry: number }> = new Map();
  private inFlightDownloadPromises: Map<string, Promise<string | null>> = new Map();
  private isProcessingDownloadQueue: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    // Register ImageStore remote fetch hook for seamless on-demand image hydration
    ImageStore.setRemoteFetcher((imgId) => this.fetchImageOnDemand(imgId));

    // Load Device ID or set default
    const savedDeviceId = safeStorageGet(DEVICE_ID_KEY);
    if (savedDeviceId) {
      this.deviceId = savedDeviceId;
    } else {
      this.deviceId = 'HOME-PC';
      safeStorageSet(DEVICE_ID_KEY, this.deviceId);
    }

    // Load Last Sync Time
    this.lastSyncTime = safeStorageGet(LAST_SYNC_KEY);

    // Load Synced Keys tracker
    try {
      const savedSyncedKeys = safeStorageGet(SYNCED_KEYS_KEY);
      if (savedSyncedKeys) {
        const arr = JSON.parse(savedSyncedKeys);
        if (Array.isArray(arr)) {
          this.bootstrappedKeys = new Set(arr);
        }
      }
    } catch (e) {
      console.warn('[SyncEngine] Failed to read synced keys tracker', e);
    }

    // Load Server Record Count tracker if saved
    const savedServerRecordCount = safeStorageGet(SERVER_RECORD_COUNT_KEY);
    if (savedServerRecordCount !== null) {
      const parsed = parseInt(savedServerRecordCount, 10);
      if (!isNaN(parsed)) {
        this.serverRecordCount = parsed;
      }
    }

    // Migration: Invalidate and purge stale unconfirmed v1 tracker
    safeStorageRemove(LEGACY_SYNCED_IMAGES_KEY);

    // Load Confirmed Cloud Images tracker
    try {
      const savedConfirmedImages = safeStorageGet(CONFIRMED_CLOUD_IMAGES_KEY);
      if (savedConfirmedImages) {
        const arr = JSON.parse(savedConfirmedImages);
        if (Array.isArray(arr)) {
          this.confirmedCloudImages = new Set(arr);
        }
      }
    } catch (e) {
      console.warn('[SyncEngine] Failed to read confirmed cloud images tracker', e);
    }

    // Load Queue from storage
    try {
      const savedQueue = safeStorageGet(QUEUE_KEY);
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
      }
    } catch (e) {
      console.warn('[SyncEngine] Failed to read saved queue', e);
    }

    if (typeof window !== 'undefined') {
      // Network listeners
      window.addEventListener('online', () => {
        this.online = true;
        this.notify();
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.online = false;
        this.status = 'offline';
        this.notify();
      });

      // Start background polling loop every 10 seconds
      this.syncInterval = setInterval(() => {
        if (this.online) {
          this.processQueue();
        }
      }, 10000);
    }

    // Initial state setup
    if (!this.online) {
      this.status = 'offline';
    } else if (this.queue.length > 0) {
      this.status = 'pending';
    }
  }

  public registerRemoteUpdateCallback(cb: (table: string, data: any) => void) {
    this.onRemoteDataUpdateCallback = cb;
  }

  public registerLocalDataProvider(provider: () => Record<string, any[]>) {
    this.localDataProvider = provider;
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        if (this.online) {
          this.processQueue();
        }
      }, 50);
    }
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public setDeviceId(id: string) {
    if (!id || id.trim() === '') return;
    this.deviceId = id.trim().toUpperCase();
    safeStorageSet(DEVICE_ID_KEY, this.deviceId);
    this.notify();
  }

  public getState(): SyncState {
    const isUploading = this.uploadingImages.size > 0;
    const isDownloading = this.activeDownloadingImage !== null;
    const hasPendingDownloads = this.pendingImageDownloads.size > 0;
    const hasFailedUploads = this.failedImageUploads.size > 0;
    const hasFailedDownloads = this.missingRemoteImages.size > 0;
    const hasPendingQueue = this.queue.length > 0;

    let computedStatus: SyncStatus = this.status;
    if (!this.online) {
      computedStatus = 'offline';
    } else if (this.isProcessing || isUploading || isDownloading) {
      computedStatus = 'syncing';
    } else if (hasPendingQueue || hasPendingDownloads || hasFailedUploads || hasFailedDownloads) {
      computedStatus = 'pending';
    } else {
      computedStatus = 'synced';
    }

    const downloadingImageCount = (this.activeDownloadingImage ? 1 : 0) + this.pendingImageDownloads.size + this.missingRemoteImages.size;
    const pendingImageCount = this.uploadingImages.size + this.failedImageUploads.size;
    const totalPendingCount = this.queue.length + pendingImageCount + downloadingImageCount;

    return {
      status: computedStatus,
      lastSyncTime: this.lastSyncTime,
      pendingCount: totalPendingCount,
      pendingImageCount,
      downloadingImageCount,
      deviceId: this.deviceId,
      online: this.online,
      serverRecordCount: this.serverRecordCount,
      lastError: this.lastError
    };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getLastImageUploadDiagnostic(): ImageChunkUploadDiagnostic | null {
    return this.lastImageUploadDiagnostic;
  }

  public getFailedImageUploads(): Map<string, FailedImageUploadInfo> {
    return new Map(this.failedImageUploads);
  }

  public getBootstrappedKeys(): Set<string> {
    return new Set(this.bootstrappedKeys);
  }

  public clearImageSyncStateForTesting() {
    this.confirmedCloudImages.clear();
    this.uploadingImages.clear();
    this.failedImageUploads.clear();
    this.pendingImageDownloads.clear();
    this.missingRemoteImages.clear();
    this.lastImageUploadDiagnostic = null;
    safeStorageRemove(CONFIRMED_CLOUD_IMAGES_KEY);
  }

  public notifyListeners() {
    this.notify();
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => {
      try {
        fn(state);
      } catch (err) {
        console.error('[SyncEngine] Listener error:', err);
      }
    });
  }

  private saveBootstrappedKeys() {
    try {
      const arr = Array.from(this.bootstrappedKeys);
      safeStorageSet(SYNCED_KEYS_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn('[SyncEngine] Failed to save synced keys tracker', e);
    }
  }

  private saveConfirmedCloudImages() {
    try {
      const arr = Array.from(this.confirmedCloudImages);
      safeStorageSet(CONFIRMED_CLOUD_IMAGES_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn('[SyncEngine] Failed to save confirmed cloud images tracker', e);
    }
  }

  private saveQueue() {
    try {
      const safeQueueStr = safeJsonStringify(this.queue);
      safeStorageSet(QUEUE_KEY, safeQueueStr);
    } catch (e) {
      console.warn('[SyncEngine] Failed to save queue to storage', e);
    }
  }

  // Safe idempotent local-to-cloud data reconciliation
  public async reconcileLocalData() {
    if (!this.localDataProvider) return;

    try {
      // If server is confirmed empty (serverRecordCount === 0) and we have local bootstrappedKeys,
      // invalidate them so that authoritative local records can be pushed to the empty server.
      if (this.serverRecordCount === 0 && this.bootstrappedKeys.size > 0) {
        console.warn('[SyncEngine] Reconcile detected serverRecordCount === 0 with stale bootstrappedKeys. Invalidating to allow parent record push.');
        this.bootstrappedKeys.clear();
        safeStorageRemove(SYNCED_KEYS_KEY);
      }

      const allData = this.localDataProvider();
      if (!allData || typeof allData !== 'object') return;

      let newlyQueuedCount = 0;
      const existingQueueKeys = new Set(this.queue.map(q => `${q.table}:${q.recordId}`));

      for (const [table, items] of Object.entries(allData)) {
        if (!Array.isArray(items) || items.length === 0) continue;

        items.forEach((item, idx) => {
          if (!item || typeof item !== 'object') return;
          const recordId = String(item.id || item.recordId || `${table}_${idx}`);
          const compositeKey = `${table}:${recordId}`;

          // If not already recorded as synced and not already pending in queue
          if (!this.bootstrappedKeys.has(compositeKey) && !existingQueueKeys.has(compositeKey)) {
            const updatedAt = item.updatedAt || item.createdAt || item.date || item.timestamp || new Date().toISOString();
            const version = typeof item.version === 'number' && !isNaN(item.version)
              ? item.version
              : (new Date(updatedAt).getTime() || Date.now());

            const queueItem: SyncQueueItem = {
              id: `sync_boot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              table,
              recordId,
              action: 'upsert',
              data: item,
              updatedAt: typeof updatedAt === 'string' ? updatedAt : new Date(updatedAt).toISOString(),
              deviceId: this.deviceId,
              version
            };

            this.queue.push(queueItem);
            existingQueueKeys.add(compositeKey);
            newlyQueuedCount++;
          }
        });
      }

      if (newlyQueuedCount > 0) {
        this.saveQueue();
        if (this.online) {
          this.status = 'syncing';
        } else {
          this.status = 'pending';
        }
        this.notify();
      }
    } catch (err) {
      console.warn('[SyncEngine] Local reconciliation check error:', err);
    }
  }

  // Enqueue a local record mutation (upsert or delete)
  public enqueueChange(table: string, recordId: string, action: 'upsert' | 'delete', data?: any) {
    if (!table || !recordId) return;

    // Filter out existing pending change for same table & recordId if new upsert replaces it
    this.queue = this.queue.filter(item => !(item.table === table && item.recordId === recordId));

    const newItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      table,
      recordId,
      action,
      data,
      updatedAt: new Date().toISOString(),
      deviceId: this.deviceId,
      version: Date.now()
    };

    this.queue.push(newItem);
    this.saveQueue();

    if (this.online) {
      this.status = 'syncing';
      this.notify();
      // Queue background processing without blocking caller
      setTimeout(() => this.processQueue(), 100);
    } else {
      this.status = 'pending';
      this.notify();
    }
  }

  private async safeParseJson(res: Response) {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 80)}`);
    }
    return await res.json();
  }

  private checkOnline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  }

  // Primary Sync Process Execution
  public async processQueue() {
    if (this.isProcessing) return;
    if (!this.checkOnline()) {
      this.online = false;
      this.status = 'offline';
      this.notify();
      return;
    }

    this.online = true;
    this.isProcessing = true;

    try {
      // 1. Reconcile any pre-existing unqueued local records first
      await this.reconcileLocalData();

      if (this.queue.length > 0) {
        this.status = 'syncing';
      }
      this.notify();

      // 2. Process local image offloading to Cloud Image Store
      await this.uploadPendingImages();

      // 3. Upload pending queue items to Cloud API in safe batches
      const BATCH_SIZE = 50;
      while (this.queue.length > 0) {
        const batchToUpload = this.queue.slice(0, BATCH_SIZE);
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: safeJsonStringify({
            deviceId: this.deviceId,
            items: batchToUpload
          })
        });

        if (res.ok) {
          const result = await this.safeParseJson(res);
          // Remove processed items from queue
          const processedIds = new Set(batchToUpload.map(i => i.id));
          this.queue = this.queue.filter(i => !processedIds.has(i.id));
          this.saveQueue();

          // Mark items as successfully synced in local tracker
          batchToUpload.forEach(item => {
            this.bootstrappedKeys.add(`${item.table}:${item.recordId}`);
          });
          this.saveBootstrappedKeys();

          if (result.serverTimestamp) {
            this.lastSyncTime = result.serverTimestamp;
            safeStorageSet(LAST_SYNC_KEY, this.lastSyncTime);
          }
          if (result.totalServerRecords !== undefined) {
            this.serverRecordCount = result.totalServerRecords;
            safeStorageSet(SERVER_RECORD_COUNT_KEY, String(this.serverRecordCount));
          }
          this.lastError = null;
          this.notify();
        } else {
          this.lastError = `Server returned HTTP ${res.status}`;
          break; // Stop batch loop on server failure
        }
      }

      // 4. Download cross-device cloud changes
      await this.pullCloudChanges();

      // Truthful sync status check: replication must be genuinely complete
      const hasPendingImages = this.uploadingImages.size > 0 ||
                               this.pendingImageDownloads.size > 0 ||
                               this.activeDownloadingImage !== null ||
                               this.failedImageUploads.size > 0 ||
                               this.missingRemoteImages.size > 0;

      if (this.queue.length > 0 || hasPendingImages) {
        this.status = 'pending';
      } else {
        this.status = 'synced';
      }
    } catch (err: any) {
      console.warn('[SyncEngine] Sync iteration encounter:', err);
      this.lastError = err?.message || 'Network error';
      this.status = this.checkOnline() ? 'pending' : 'offline';
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

  // Upload image references (`idb:...`) to cloud
  public async uploadPendingImages(explicitRefs?: Iterable<string>) {
    try {
      const candidateRefs = new Set<string>();

      // 0. Include explicitly requested image refs
      if (explicitRefs) {
        for (const ref of explicitRefs) {
          if (ref && typeof ref === 'string' && ref.startsWith('idb:')) {
            candidateRefs.add(ref);
          }
        }
      }

      // 1. Gather image refs from current queue items
      for (const item of this.queue) {
        if (!item.data) continue;
        const refs = this.extractImageRefs(item.data);
        refs.forEach(r => candidateRefs.add(r));
      }

      // 2. Gather image refs from local data provider if available
      if (this.localDataProvider) {
        try {
          const allData = this.localDataProvider();
          if (allData && typeof allData === 'object') {
            for (const items of Object.values(allData)) {
              if (Array.isArray(items)) {
                for (const item of items) {
                  const refs = this.extractImageRefs(item);
                  refs.forEach(r => candidateRefs.add(r));
                }
              }
            }
          }
        } catch (e) {
          console.warn('[SyncEngine] Local data scan exception for images:', e);
        }
      }

      const now = Date.now();
      for (const ref of candidateRefs) {
        if (this.confirmedCloudImages.has(ref)) continue;
        if (this.uploadingImages.has(ref)) continue;

        const failedInfo = this.failedImageUploads.get(ref);
        if (failedInfo && now < failedInfo.nextRetry) continue;

        const cachedPayload = ImageStore.getCachedImage(ref) || await ImageStore.getImage(ref);
        if (cachedPayload && (cachedPayload.startsWith('data:') || cachedPayload.startsWith('<svg') || cachedPayload.startsWith('blob:'))) {
          const { mimeType, binary } = parseDataUrlToBinary(cachedPayload);
          const byteSize = binary.byteLength;

          if (byteSize === 0) {
            continue;
          }

          const totalChunks = Math.max(1, Math.ceil(byteSize / CLIENT_IMAGE_CHUNK_SIZE));
          this.uploadingImages.add(ref);
          this.notify();

          try {
            let allChunksSucceeded = true;
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
              const chunkData = binary.subarray(
                chunkIndex * CLIENT_IMAGE_CHUNK_SIZE,
                Math.min((chunkIndex + 1) * CLIENT_IMAGE_CHUNK_SIZE, byteSize)
              );

              const chunkStart = Date.now();
              let res: Response | null = null;
              let networkError: any = null;

              try {
                res = await fetch('/api/images/chunk', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-Image-Id': encodeURIComponent(ref),
                    'X-Chunk-Index': String(chunkIndex),
                    'X-Total-Chunks': String(totalChunks),
                    'X-Mime-Type': mimeType,
                    'X-Byte-Size': String(byteSize),
                    'X-Device-Id': this.deviceId
                  },
                  body: chunkData
                });
              } catch (fetchErr) {
                networkError = fetchErr;
              }

              const durationMs = Date.now() - chunkStart;

              if (res && res.ok) {
                const serverReqId = res.headers.get('X-Request-Id') || '';
                const serverStage = res.headers.get('X-Stage') || 'COMPLETE';
                const d1Duration = res.headers.get('X-D1-Duration-Ms') || '';
                console.log(
                  `[SyncEngine] Image chunk ${chunkIndex + 1}/${totalChunks} uploaded for ${ref} (${chunkData.byteLength}B) in ${durationMs}ms | reqId: ${serverReqId || 'n/a'} | stage: ${serverStage} | d1: ${d1Duration ? d1Duration + 'ms' : 'n/a'}`
                );
              } else {
                allChunksSucceeded = false;
                const attempts = (failedInfo?.attempts || 0) + 1;
                const delay = Math.min(60000, Math.pow(2, attempts) * 1000);

                let reqId = '';
                let stage = 'UNKNOWN';
                let d1DurationMs: number | string | undefined;
                let errorSnippet = '';

                if (res) {
                  reqId = res.headers.get('X-Request-Id') || res.headers.get('cf-ray') || '';
                  stage = res.headers.get('X-Stage') || 'HTTP_RESPONSE';
                  d1DurationMs = res.headers.get('X-D1-Duration-Ms') || undefined;
                  try {
                    const text = await res.text();
                    try {
                      const parsed = JSON.parse(text);
                      reqId = parsed.reqId || reqId;
                      stage = parsed.stage || stage;
                      d1DurationMs = parsed.d1DurationMs || d1DurationMs;
                      errorSnippet = (parsed.error || parsed.message || text).slice(0, 300);
                    } catch {
                      errorSnippet = text.slice(0, 300);
                    }
                  } catch {
                    errorSnippet = `HTTP ${res.status} ${res.statusText}`;
                  }
                } else {
                  stage = 'CLIENT_FETCH_NETWORK_ERROR';
                  errorSnippet = networkError?.message || String(networkError);
                }

                const diagnostic: ImageChunkUploadDiagnostic = {
                  status: res ? res.status : 0,
                  statusText: res ? res.statusText : 'Network Error',
                  chunkIndex,
                  totalChunks,
                  chunkBytes: chunkData.byteLength,
                  totalBytes: byteSize,
                  durationMs,
                  reqId,
                  stage,
                  d1DurationMs,
                  errorSnippet,
                  isNetworkError: !res,
                  timestamp: new Date().toISOString()
                };

                this.lastImageUploadDiagnostic = diagnostic;
                this.failedImageUploads.set(ref, {
                  attempts,
                  nextRetry: Date.now() + delay,
                  lastError: diagnostic
                });

                console.warn(
                  `[SyncEngine] Image chunk ${chunkIndex + 1}/${totalChunks} upload failed for ${ref} (${chunkData.byteLength}B / total ${byteSize}B) | HTTP ${diagnostic.status} (${diagnostic.statusText}) | duration: ${durationMs}ms | reqId: ${reqId || 'n/a'} | stage: ${stage} | d1: ${d1DurationMs ? d1DurationMs + 'ms' : 'n/a'} | attempt: ${attempts} | nextRetry: ${(delay / 1000).toFixed(1)}s | snippet: ${errorSnippet}`
                );
                break;
              }
            }

            if (allChunksSucceeded) {
              this.confirmedCloudImages.add(ref);
              this.saveConfirmedCloudImages();
              this.failedImageUploads.delete(ref);
            }
          } catch (e: any) {
            const attempts = (failedInfo?.attempts || 0) + 1;
            const delay = Math.min(60000, Math.pow(2, attempts) * 1000);
            const diagnostic: ImageChunkUploadDiagnostic = {
              status: 0,
              statusText: 'Client Exception',
              chunkIndex: 0,
              totalChunks,
              chunkBytes: 0,
              totalBytes: byteSize,
              durationMs: 0,
              reqId: '',
              stage: 'CLIENT_EXCEPTION',
              errorSnippet: e?.message || String(e),
              isNetworkError: false,
              timestamp: new Date().toISOString()
            };
            this.lastImageUploadDiagnostic = diagnostic;
            this.failedImageUploads.set(ref, {
              attempts,
              nextRetry: Date.now() + delay,
              lastError: diagnostic
            });
            console.warn(`[SyncEngine] Image chunk upload exception for ${ref}:`, e);
          } finally {
            this.uploadingImages.delete(ref);
            this.notify();
          }
        }
      }
    } catch (e) {
      console.warn('[SyncEngine] Image upload check exception:', e);
    }
  }

  // Asynchronously download missing images from Cloud D1
  public downloadMissingImages(imageRefs: Iterable<string>) {
    for (const ref of imageRefs) {
      if (!ref || !ref.startsWith('idb:')) continue;
      if (this.pendingImageDownloads.has(ref) || this.activeDownloadingImage === ref) continue;
      if (ImageStore.hasLocalImage(ref)) continue;

      const failedInfo = this.missingRemoteImages.get(ref);
      if (failedInfo && Date.now() < failedInfo.nextRetry) continue;

      this.pendingImageDownloads.add(ref);
    }
    this.triggerDownloadQueueProcessing();
  }

  private triggerDownloadQueueProcessing() {
    if (this.isProcessingDownloadQueue || this.activeDownloadingImage !== null) {
      return;
    }
    this.processDownloadQueue().catch(e => console.warn('[SyncEngine] Download queue trigger error:', e));
  }

  // Fetch individual image on-demand and store in local IndexedDB
  public async fetchImageOnDemand(imageId: string): Promise<string | null> {
    if (!imageId || !imageId.startsWith('idb:')) return null;
    if (ImageStore.hasLocalImage(imageId)) {
      return ImageStore.getDirectMemoryImage(imageId) || await ImageStore.getImage(imageId);
    }

    // If already in flight, reuse promise
    const existingPromise = this.inFlightDownloadPromises.get(imageId);
    if (existingPromise) {
      return existingPromise;
    }

    if (!this.checkOnline()) return null;

    const downloadPromise = this.downloadImageDirectly(imageId);
    this.inFlightDownloadPromises.set(imageId, downloadPromise);
    try {
      return await downloadPromise;
    } finally {
      this.inFlightDownloadPromises.delete(imageId);
    }
  }

  private async downloadImageDirectly(imageId: string): Promise<string | null> {
    if (ImageStore.hasLocalImage(imageId)) {
      return ImageStore.getDirectMemoryImage(imageId) || await ImageStore.getImage(imageId);
    }

    const failedInfo = this.missingRemoteImages.get(imageId);
    const now = Date.now();
    if (failedInfo && now < failedInfo.nextRetry) {
      return null;
    }

    // Add to pending queue if not already active
    if (this.activeDownloadingImage !== imageId && !this.pendingImageDownloads.has(imageId)) {
      this.pendingImageDownloads.add(imageId);
    }

    this.triggerDownloadQueueProcessing();

    // Poll for completion (up to 30s)
    return new Promise<string | null>((resolve) => {
      const interval = setInterval(async () => {
        if (ImageStore.hasLocalImage(imageId)) {
          clearInterval(interval);
          const data = ImageStore.getDirectMemoryImage(imageId) || await ImageStore.getImage(imageId);
          resolve(data);
        } else if (!this.pendingImageDownloads.has(imageId) && this.activeDownloadingImage !== imageId) {
          clearInterval(interval);
          resolve(null);
        }
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        resolve(null);
      }, 30000);
    });
  }

  private async processDownloadQueue() {
    if (this.isProcessingDownloadQueue) return;
    this.isProcessingDownloadQueue = true;

    try {
      while (this.pendingImageDownloads.size > 0 && this.checkOnline()) {
        const imageId = this.pendingImageDownloads.values().next().value;
        if (!imageId) break;
        this.pendingImageDownloads.delete(imageId);

        const existingLocal = ImageStore.getDirectMemoryImage(imageId) || await ImageStore.getImage(imageId);
        if (existingLocal) {
          this.confirmedCloudImages.add(imageId);
          this.saveConfirmedCloudImages();
          continue;
        }

        const failedInfo = this.missingRemoteImages.get(imageId);
        const now = Date.now();
        if (failedInfo && now < failedInfo.nextRetry) {
          continue;
        }

        this.activeDownloadingImage = imageId;
        this.notify();

        try {
          // 1. Fetch metadata info
          const infoRes = await fetch(`/api/images/${encodeURIComponent(imageId)}/info`);
          if (!infoRes.ok) {
            const attempts = (failedInfo?.attempts || 0) + 1;
            const delay = Math.min(60000, Math.pow(2, attempts) * 1000);
            this.missingRemoteImages.set(imageId, { attempts, nextRetry: Date.now() + delay });
            continue;
          }

          const infoData = await this.safeParseJson(infoRes);
          const totalChunks = Number(infoData.totalChunks || 1);
          const totalByteSize = Number(infoData.byteSize || 0);
          const mimeType = String(infoData.mimeType || 'application/octet-stream');

          // 2. Fetch single chunks sequentially
          const chunkBuffers: Uint8Array[] = [];
          let totalAssembledSize = 0;
          let downloadOk = true;

          for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
            const chunkRes = await fetch(`/api/images/${encodeURIComponent(imageId)}/chunk/${chunkIdx}`);
            if (!chunkRes.ok) {
              downloadOk = false;
              console.warn(`[SyncEngine] Chunk ${chunkIdx + 1}/${totalChunks} download failed for ${imageId}: status ${chunkRes.status}`);
              break;
            }
            const arrayBuffer = await chunkRes.arrayBuffer();
            const chunkBytes = new Uint8Array(arrayBuffer);
            chunkBuffers.push(chunkBytes);
            totalAssembledSize += chunkBytes.byteLength;
          }

          if (downloadOk && chunkBuffers.length === totalChunks) {
            // 3. Reassemble on client
            const finalSize = totalByteSize > 0 ? totalByteSize : totalAssembledSize;
            const assembledBytes = new Uint8Array(finalSize);
            let offset = 0;
            for (const chunk of chunkBuffers) {
              assembledBytes.set(chunk, offset);
              offset += chunk.byteLength;
            }

            const dataUrl = binaryToClientDataUrl(mimeType, assembledBytes);
            await ImageStore.saveImage(imageId, dataUrl);
            this.confirmedCloudImages.add(imageId);
            this.saveConfirmedCloudImages();
            this.missingRemoteImages.delete(imageId);
          } else {
            const attempts = (failedInfo?.attempts || 0) + 1;
            const delay = Math.min(60000, Math.pow(2, attempts) * 1000);
            this.missingRemoteImages.set(imageId, { attempts, nextRetry: Date.now() + delay });
          }
        } catch (downloadErr) {
          const attempts = (failedInfo?.attempts || 0) + 1;
          const delay = Math.min(60000, Math.pow(2, attempts) * 1000);
          this.missingRemoteImages.set(imageId, { attempts, nextRetry: Date.now() + delay });
          console.warn(`[SyncEngine] Download error for ${imageId}:`, downloadErr);
        } finally {
          this.activeDownloadingImage = null;
          this.notify();
        }
      }
    } finally {
      this.isProcessingDownloadQueue = false;
      this.activeDownloadingImage = null;
      this.notify();
    }
  }

  private extractImageRefs(obj: any, refs: Set<string> = new Set(), seen: WeakSet<object> = new WeakSet()): string[] {
    if (!obj) return Array.from(refs);
    if (typeof obj === 'string') {
      if (obj.startsWith('idb:')) {
        refs.add(obj);
      }
    } else if (typeof obj === 'object') {
      if (seen.has(obj)) {
        return Array.from(refs);
      }
      seen.add(obj);

      if (Array.isArray(obj)) {
        obj.forEach(item => this.extractImageRefs(item, refs, seen));
      } else {
        Object.keys(obj).forEach(k => this.extractImageRefs(obj[k], refs, seen));
      }
    }
    return Array.from(refs);
  }

  // Pull changes made on other devices
  private async pullCloudChanges() {
    try {
      const sinceParam = this.lastSyncTime ? encodeURIComponent(this.lastSyncTime) : '0';
      const res = await fetch(`/api/changes?since=${sinceParam}&deviceId=${encodeURIComponent(this.deviceId)}`);
      if (res.ok) {
        const data = await this.safeParseJson(res);
        if (typeof data.serverRecordCount === 'number') {
          this.serverRecordCount = data.serverRecordCount;
          safeStorageSet(SERVER_RECORD_COUNT_KEY, String(this.serverRecordCount));
          if (this.serverRecordCount === 0 && this.bootstrappedKeys.size > 0) {
            console.warn('[SyncEngine] Server record count is 0 while local client has bootstrapped keys. Invalidating stale bootstrappedKeys.');
            this.bootstrappedKeys.clear();
            safeStorageRemove(SYNCED_KEYS_KEY);
          }
        }
        const changes: CloudRecord[] = data.changes || [];

        if (changes.length > 0) {
          // Record pulled keys in bootstrappedKeys so receiver does not push them back
          const incomingImageRefs = new Set<string>();

          changes.forEach(change => {
            if (change.table && change.recordId) {
              this.bootstrappedKeys.add(`${change.table}:${change.recordId}`);
            }
            if (change.data) {
              this.extractImageRefs(change.data, incomingImageRefs);
            }
          });
          this.saveBootstrappedKeys();

          // Trigger asynchronous background download of newly discovered image references
          if (incomingImageRefs.size > 0) {
            this.downloadMissingImages(incomingImageRefs);
          }

          if (this.onRemoteDataUpdateCallback) {
            // Group changes by table
            const groupedByTable: Record<string, CloudRecord[]> = {};
            changes.forEach(change => {
              if (!groupedByTable[change.table]) groupedByTable[change.table] = [];
              groupedByTable[change.table].push(change);
            });

            for (const [table, records] of Object.entries(groupedByTable)) {
              this.onRemoteDataUpdateCallback(table, records);
            }
          }
        }

        if (data.serverTimestamp) {
          this.lastSyncTime = data.serverTimestamp;
        } else {
          this.lastSyncTime = new Date().toISOString();
        }
        safeStorageSet(LAST_SYNC_KEY, this.lastSyncTime);
      } else {
        this.lastError = `Pull failed HTTP ${res.status}`;
      }
    } catch (e: any) {
      console.warn('[SyncEngine] Pull changes soft error:', e);
      this.lastError = e?.message || 'Pull error';
    }
  }

  // Reset local sync state and queue
  public resetLocalSyncState() {
    this.queue = [];
    this.lastSyncTime = null;
    this.serverRecordCount = 0;
    this.status = 'synced';
    this.lastError = null;
    this.bootstrappedKeys.clear();
    this.confirmedCloudImages.clear();
    this.uploadingImages.clear();
    this.pendingImageDownloads.clear();
    this.activeDownloadingImage = null;
    this.failedImageUploads.clear();
    this.missingRemoteImages.clear();
    this.inFlightDownloadPromises.clear();
    safeStorageRemove(QUEUE_KEY);
    safeStorageRemove(LAST_SYNC_KEY);
    safeStorageRemove(MIGRATED_KEY);
    safeStorageRemove(SYNCED_KEYS_KEY);
    safeStorageRemove(CONFIRMED_CLOUD_IMAGES_KEY);
    safeStorageRemove(LEGACY_SYNCED_IMAGES_KEY);
    safeStorageRemove(SERVER_RECORD_COUNT_KEY);
    this.notify();
  }

  // Purge all records on the server / D1 replica
  public async purgeRemoteData(): Promise<boolean> {
    try {
      this.resetLocalSyncState();
      const res = await fetch('/api/purge-all', { method: 'POST' });
      return res.ok;
    } catch (err) {
      console.warn('[SyncEngine] Remote purge warning:', err);
      return false;
    }
  }

  // Disabled in v1.0.31.4: Zero-state architecture ensures no automatic fixture injection
  public autoMigrateExistingData(_getAllLocalData?: () => Record<string, any[]>) {
    // Intentionally no-op to prevent auto-ingesting mock/fixture datasets
    safeStorageSet(MIGRATED_KEY, 'true');
  }
}

export const SyncEngine = new SyncEngineManager();
