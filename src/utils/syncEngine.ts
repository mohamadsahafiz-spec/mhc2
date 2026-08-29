import { SyncStatus, SyncQueueItem, SyncState, CloudRecord } from '../types/sync';
import { ImageStore } from './imageStore';

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
    return JSON.stringify(value, getCircularReplacer(), space);
  } catch (err) {
    console.warn('[SyncEngine] safeJsonStringify error:', err);
    return '{}';
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

type Listener = (state: SyncState) => void;

class SyncEngineManager {
  private queue: SyncQueueItem[] = [];
  private deviceId: string = 'HOME-PC';
  private lastSyncTime: string | null = null;
  private status: SyncStatus = 'synced';
  private online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private serverRecordCount: number = 0;
  private lastError: string | null = null;
  private listeners: Set<Listener> = new Set();
  private isProcessing: boolean = false;
  private syncInterval: any = null;
  private onRemoteDataUpdateCallback: ((table: string, data: any) => void) | null = null;
  private localDataProvider: (() => Record<string, any[]>) | null = null;
  private bootstrappedKeys: Set<string> = new Set();

  constructor() {
    this.init();
  }

  private init() {
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
    return {
      status: this.status,
      lastSyncTime: this.lastSyncTime,
      pendingCount: this.queue.length,
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

      this.status = this.queue.length > 0 ? 'pending' : 'synced';
    } catch (err: any) {
      console.warn('[SyncEngine] Sync iteration encounter:', err);
      this.lastError = err?.message || 'Network error';
      this.status = this.queue.length > 0 ? 'pending' : (this.checkOnline() ? 'synced' : 'offline');
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

  // Upload image references (`idb:...`) to cloud
  private async uploadPendingImages() {
    try {
      // Find all image references in current queue items
      for (const item of this.queue) {
        if (!item.data) continue;
        const imageRefs = this.extractImageRefs(item.data);
        for (const ref of imageRefs) {
          const cachedPayload = ImageStore.getCachedImage(ref) || await ImageStore.getImage(ref);
          if (cachedPayload && (cachedPayload.startsWith('data:') || cachedPayload.startsWith('<svg'))) {
            await fetch('/api/images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: safeJsonStringify({
                imageId: ref,
                dataUrl: cachedPayload,
                deviceId: this.deviceId
              })
            }).catch(e => console.warn('[SyncEngine] Image upload soft fail:', e));
          }
        }
      }
    } catch (e) {
      console.warn('[SyncEngine] Image upload check exception:', e);
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
        this.serverRecordCount = data.serverRecordCount ?? this.serverRecordCount;
        const changes: CloudRecord[] = data.changes || [];

        if (changes.length > 0) {
          // Record pulled keys in bootstrappedKeys so receiver does not push them back
          changes.forEach(change => {
            if (change.table && change.recordId) {
              this.bootstrappedKeys.add(`${change.table}:${change.recordId}`);
            }
          });
          this.saveBootstrappedKeys();

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
    safeStorageRemove(QUEUE_KEY);
    safeStorageRemove(LAST_SYNC_KEY);
    safeStorageRemove(MIGRATED_KEY);
    safeStorageRemove(SYNCED_KEYS_KEY);
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
