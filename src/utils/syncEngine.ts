import { SyncStatus, SyncQueueItem, SyncState, CloudRecord } from '../types/sync';
import { ImageStore } from './imageStore';
import { safeJsonStringify } from './persistence';

const QUEUE_KEY = 'fsos_sync_queue';
const DEVICE_ID_KEY = 'fsos_device_id';
const LAST_SYNC_KEY = 'fsos_last_sync_time';
const MIGRATED_KEY = 'fsos_cloud_migrated_v1';

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

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load Device ID or set default
    const savedDeviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (savedDeviceId) {
      this.deviceId = savedDeviceId;
    } else {
      this.deviceId = 'HOME-PC';
      localStorage.setItem(DEVICE_ID_KEY, this.deviceId);
    }

    // Load Last Sync Time
    this.lastSyncTime = localStorage.getItem(LAST_SYNC_KEY);

    // Load Queue from localStorage
    try {
      const savedQueue = localStorage.getItem(QUEUE_KEY);
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
      }
    } catch (e) {
      console.warn('[SyncEngine] Failed to read saved queue', e);
    }

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

    // Initial state setup
    if (!this.online) {
      this.status = 'offline';
    } else if (this.queue.length > 0) {
      this.status = 'pending';
    }

    // Start background polling loop every 10 seconds
    this.syncInterval = setInterval(() => {
      if (this.online) {
        this.processQueue();
      }
    }, 10000);
  }

  public registerRemoteUpdateCallback(cb: (table: string, data: any) => void) {
    this.onRemoteDataUpdateCallback = cb;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public setDeviceId(id: string) {
    if (!id || id.trim() === '') return;
    this.deviceId = id.trim().toUpperCase();
    localStorage.setItem(DEVICE_ID_KEY, this.deviceId);
    this.notify();
    this.processQueue();
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
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
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

  private saveQueue() {
    try {
      const safeQueueStr = safeJsonStringify(this.queue);
      localStorage.setItem(QUEUE_KEY, safeQueueStr);
    } catch (e) {
      console.warn('[SyncEngine] Failed to save queue to localStorage', e);
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

  // Primary Sync Process Execution
  public async processQueue() {
    if (this.isProcessing) return;
    if (!navigator.onLine) {
      this.online = false;
      this.status = 'offline';
      this.notify();
      return;
    }

    this.isProcessing = true;
    if (this.queue.length > 0) {
      this.status = 'syncing';
    }
    this.notify();

    try {
      // 1. Process local image offloading to Cloud Image Store
      await this.uploadPendingImages();

      // 2. Upload pending queue items to Cloud API
      if (this.queue.length > 0) {
        const batchToUpload = [...this.queue];
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
          if (result.serverTimestamp) {
            this.lastSyncTime = result.serverTimestamp;
            localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
          }
          if (result.totalServerRecords !== undefined) {
            this.serverRecordCount = result.totalServerRecords;
          }
          this.lastError = null;
        } else {
          this.lastError = `Server returned HTTP ${res.status}`;
        }
      }

      // 3. Download cross-device cloud changes
      await this.pullCloudChanges();

      this.status = this.queue.length > 0 ? 'pending' : 'synced';
    } catch (err: any) {
      console.warn('[SyncEngine] Sync iteration encounter:', err);
      this.lastError = err?.message || 'Network error';
      this.status = this.queue.length > 0 ? 'pending' : 'offline';
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

        if (changes.length > 0 && this.onRemoteDataUpdateCallback) {
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

        if (data.serverTimestamp) {
          this.lastSyncTime = data.serverTimestamp;
        } else {
          this.lastSyncTime = new Date().toISOString();
        }
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
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
    localStorage.removeItem(QUEUE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    localStorage.removeItem(MIGRATED_KEY);
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
    localStorage.setItem(MIGRATED_KEY, 'true');
  }
}

export const SyncEngine = new SyncEngineManager();
