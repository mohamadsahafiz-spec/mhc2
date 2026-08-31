// src/utils/imageStore.ts

const DB_NAME = 'fsos_evidence_db';
const DB_VERSION = 1;
const STORE_NAME = 'evidence_images';

let dbPromise: Promise<IDBDatabase> | null = null;
const imageMemoryCache = new Map<string, string>();
const persistedInIdbKeys = new Set<string>();
const MAX_MEMORY_CACHE_ITEMS = 32; // Strict LRU cache limit to prevent browser memory exhaustion

function setMemoryCache(key: string, val: string) {
  if (imageMemoryCache.has(key)) {
    imageMemoryCache.delete(key);
  } else if (imageMemoryCache.size >= MAX_MEMORY_CACHE_ITEMS) {
    const firstKey = imageMemoryCache.keys().next().value;
    if (firstKey) imageMemoryCache.delete(firstKey);
  }
  imageMemoryCache.set(key, val);
}

// Batched asynchronous IndexedDB write queue
const pendingIdbWrites = new Map<string, string>();
let isBatchWriting = false;
let batchFlushTimer: any = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('[ImageStore] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

// Flush all enqueued writes in a single, batched IndexedDB transaction
async function flushPendingWrites(): Promise<void> {
  if (pendingIdbWrites.size === 0 || isBatchWriting) return;
  if (typeof indexedDB === 'undefined') {
    pendingIdbWrites.clear();
    return;
  }

  isBatchWriting = true;
  const currentBatch = Array.from(pendingIdbWrites.entries());
  pendingIdbWrites.clear();

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        currentBatch.forEach(([id, dataUrl]) => {
          store.put(dataUrl, id);
        });

        tx.oncomplete = () => {
          currentBatch.forEach(([id]) => persistedInIdbKeys.add(id));
          resolve();
        };
        tx.onerror = () => {
          console.warn('[ImageStore] Batched transaction error:', tx.error);
          reject(tx.error);
        };
        tx.onabort = () => {
          reject(new Error('IndexedDB transaction aborted'));
        };
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    console.warn('[ImageStore] Error executing batched IDB save:', err);
  } finally {
    isBatchWriting = false;
    // If more writes accumulated while this batch was running, flush again
    if (pendingIdbWrites.size > 0) {
      scheduleBatchFlush();
    }
  }
}

function scheduleBatchFlush() {
  if (batchFlushTimer) return;
  batchFlushTimer = setTimeout(() => {
    batchFlushTimer = null;
    flushPendingWrites().catch(() => {});
  }, 16);
}

export const ImageStore = {
  async saveImage(id: string, dataUrl: string): Promise<void> {
    if (!id || !dataUrl) return;

    const existing = imageMemoryCache.get(id);
    if (existing === dataUrl && persistedInIdbKeys.has(id)) {
      return; // Identical image payload already persisted in IDB
    }

    setMemoryCache(id, dataUrl);
    if (existing !== dataUrl) {
      persistedInIdbKeys.delete(id);
    }

    pendingIdbWrites.set(id, dataUrl);
    scheduleBatchFlush();
  },

  async getImage(id: string): Promise<string | null> {
    if (!id) return null;
    if (imageMemoryCache.has(id)) {
      return imageMemoryCache.get(id)!;
    }
    try {
      const db = await openDB();
      return await new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => {
          const val = req.result || null;
          if (val) {
            setMemoryCache(id, val);
            persistedInIdbKeys.add(id);
          }
          resolve(val);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[ImageStore] Error reading image from IndexedDB:', err);
      return null;
    }
  },

  async deleteImage(id: string): Promise<void> {
    if (!id) return;
    imageMemoryCache.delete(id);
    persistedInIdbKeys.delete(id);
    pendingIdbWrites.delete(id);

    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[ImageStore] Error deleting image from IndexedDB:', err);
    }
  },

  async deleteImagesForRecord(recordId: string): Promise<void> {
    if (!recordId) return;
    try {
      const prefix = `idb:${recordId}`;
      for (const key of Array.from(imageMemoryCache.keys())) {
        if (key.startsWith(prefix)) {
          imageMemoryCache.delete(key);
          persistedInIdbKeys.delete(key);
          pendingIdbWrites.delete(key);
        }
      }

      const db = await openDB();
      const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const keysToDelete = keys.filter(k => typeof k === 'string' && (k as string).startsWith(prefix));
      for (const k of keysToDelete) {
        await this.deleteImage(k as string);
      }
    } catch (err) {
      console.warn('[ImageStore] Error deleting images for record:', recordId, err);
    }
  },

  getCachedImage(id?: string | null): string | undefined {
    return this.resolveImage(id);
  },

  resolveImage(id?: string | null): string | undefined {
    if (!id) return undefined;
    if (id.startsWith('data:') || id.startsWith('<svg') || id.startsWith('http:') || id.startsWith('https:') || id.startsWith('blob:')) return id;
    if (imageMemoryCache.has(id)) return imageMemoryCache.get(id);

    if (id.startsWith('idb:')) {
      this.getImage(id);
    }
    return undefined;
  },

  async resolveImageAsync(id?: string | null): Promise<string | undefined> {
    if (!id) return undefined;
    if (id.startsWith('data:') || id.startsWith('<svg') || id.startsWith('http:') || id.startsWith('https:') || id.startsWith('blob:')) return id;
    if (imageMemoryCache.has(id)) return imageMemoryCache.get(id);
    if (id.startsWith('idb:')) {
      const val = await this.getImage(id);
      return val || undefined;
    }
    return id;
  },

  // Synchronously offload image payloads into memory cache & enqueue IDB persistence with structural sharing
  extractAndStoreImagesSync<T>(data: T, recordId: string, pathPrefix = '', activeAncestors = new Set<object>()): T {
    if (!data) return data;
    if (data instanceof Date) return data;

    if (typeof data === 'string') {
      if (data.startsWith('idb:')) {
        return data;
      }
      if (data.startsWith('data:image/') || data.startsWith('data:application/') || (data.startsWith('<svg') && data.length > 50)) {
        const imageKey = `idb:${recordId}_${pathPrefix || 'img'}`;
        this.saveImage(imageKey, data);
        return imageKey as unknown as T;
      }
      return data;
    }

    if (typeof data === 'object') {
      if (activeAncestors.has(data as object)) {
        return undefined as unknown as T;
      }
      activeAncestors.add(data as object);

      try {
        if (Array.isArray(data)) {
          let hasChanges = false;
          const mapped = data.map((item, idx) => {
            const res = this.extractAndStoreImagesSync(item, recordId, `${pathPrefix}_${idx}`, activeAncestors);
            if (res !== item) hasChanges = true;
            return res;
          });
          return (hasChanges ? mapped : data) as unknown as T;
        }

        let hasChanges = false;
        const result: any = {};
        const keys = Object.keys(data as any);
        for (const key of keys) {
          const val = (data as any)[key];
          const res = this.extractAndStoreImagesSync(val, recordId, `${pathPrefix}_${key}`, activeAncestors);
          if (res !== val) hasChanges = true;
          result[key] = res;
        }
        return (hasChanges ? result : data) as T;
      } finally {
        activeAncestors.delete(data as object);
      }
    }

    return data;
  },

  // Hydrate object replacing "idb:..." with actual base64/SVG strings with structural sharing
  hydrateImagesSync<T>(data: T, activeAncestors = new Set<object>()): T {
    if (!data) return data;
    if (data instanceof Date) return data;

    if (typeof data === 'string') {
      if (data.startsWith('idb:')) {
        const cached = imageMemoryCache.get(data);
        if (cached) return cached as unknown as T;
        this.getImage(data);
        return data as unknown as T;
      }
      return data;
    }

    if (typeof data === 'object') {
      if (activeAncestors.has(data as object)) {
        return undefined as unknown as T;
      }
      activeAncestors.add(data as object);

      try {
        if (Array.isArray(data)) {
          let hasChanges = false;
          const mapped = data.map(item => {
            const res = this.hydrateImagesSync(item, activeAncestors);
            if (res !== item) hasChanges = true;
            return res;
          });
          return (hasChanges ? mapped : data) as unknown as T;
        }

        let hasChanges = false;
        const result: any = {};
        const keys = Object.keys(data as any);
        for (const key of keys) {
          const val = (data as any)[key];
          const res = this.hydrateImagesSync(val, activeAncestors);
          if (res !== val) hasChanges = true;
          result[key] = res;
        }
        return (hasChanges ? result : data) as T;
      } finally {
        activeAncestors.delete(data as object);
      }
    }

    return data;
  },

  // Asynchronously hydrate object replacing "idb:..." with actual base64/SVG strings from IDB if missing from cache
  async hydrateImagesAsync<T>(data: T, activeAncestors = new Set<object>()): Promise<T> {
    if (!data) return data;
    if (data instanceof Date) return data;

    if (typeof data === 'string') {
      if (data.startsWith('idb:')) {
        const cached = imageMemoryCache.get(data);
        if (cached) return cached as unknown as T;
        const fetched = await this.getImage(data);
        return (fetched || data) as unknown as T;
      }
      return data;
    }

    if (typeof data === 'object') {
      if (activeAncestors.has(data as object)) {
        return undefined as unknown as T;
      }
      activeAncestors.add(data as object);

      try {
        if (Array.isArray(data)) {
          let hasChanges = false;
          const mapped = await Promise.all(
            data.map(async item => {
              const res = await this.hydrateImagesAsync(item, activeAncestors);
              if (res !== item) hasChanges = true;
              return res;
            })
          );
          return (hasChanges ? mapped : data) as unknown as T;
        }

        let hasChanges = false;
        const result: any = {};
        const keys = Object.keys(data as any);
        for (const key of keys) {
          const val = (data as any)[key];
          const res = await this.hydrateImagesAsync(val, activeAncestors);
          if (res !== val) hasChanges = true;
          result[key] = res;
        }
        return (hasChanges ? result : data) as T;
      } finally {
        activeAncestors.delete(data as object);
      }
    }

    return data;
  },

  async preloadAllImagesFromIDB(): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = (event) => {
          const keys = (event.target as IDBRequest<IDBValidKey[]>).result;
          if (Array.isArray(keys)) {
            keys.forEach(k => {
              if (typeof k === 'string') {
                persistedInIdbKeys.add(k);
              }
            });
          }
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[ImageStore] Error preloading images from IndexedDB:', err);
    }
  },

  async clearAll(): Promise<void> {
    imageMemoryCache.clear();
    persistedInIdbKeys.clear();
    pendingIdbWrites.clear();
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[ImageStore] Error clearing IndexedDB:', err);
    }
  }
};
