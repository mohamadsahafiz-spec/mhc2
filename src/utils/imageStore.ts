// src/utils/imageStore.ts

const DB_NAME = 'fsos_evidence_db';
const DB_VERSION = 1;
const STORE_NAME = 'evidence_images';

let dbPromise: Promise<IDBDatabase> | null = null;
const imageMemoryCache = new Map<string, string>();
const persistedInIdbKeys = new Set<string>();
const MAX_MEMORY_CACHE_ITEMS = 128; // LRU cache limit sized to accommodate multi-head sequence inspections without thrashing

// Tracking in-flight reads and keys missing from IndexedDB to guard against render loops
const inFlightReads = new Map<string, Promise<string | null>>();
const notFoundInIdbKeys = new Set<string>();

// Reconciliation tracking to prevent re-entrant merge/notification loops
let reconciliationDepth = 0;
const deferredReconciliationKeys = new Set<string>();

let isNotifying = false;
const queuedNotificationKeys = new Set<string>();

// Reactive listeners for asynchronous image hydration
type ImageStoreListener = (hydratedKeys: string[]) => void;
const listeners = new Set<ImageStoreListener>();

function notifyListeners(keys: string[]) {
  if (keys.length === 0 || listeners.size === 0) return;
  if (isNotifying) {
    keys.forEach(k => queuedNotificationKeys.add(k));
    return;
  }
  isNotifying = true;
  try {
    const uniqueKeys = Array.from(new Set(keys));
    listeners.forEach(fn => {
      try {
        fn(uniqueKeys);
      } catch (err) {
        console.warn('[ImageStore] Error in listener callback:', err);
      }
    });

    while (queuedNotificationKeys.size > 0) {
      const nextKeys = Array.from(queuedNotificationKeys);
      queuedNotificationKeys.clear();
      listeners.forEach(fn => {
        try {
          fn(nextKeys);
        } catch (err) {
          console.warn('[ImageStore] Error in listener callback:', err);
        }
      });
    }
  } finally {
    isNotifying = false;
  }
}

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
  reconcile<T>(fn: () => T): T {
    reconciliationDepth++;
    try {
      return fn();
    } finally {
      reconciliationDepth--;
      if (reconciliationDepth === 0 && deferredReconciliationKeys.size > 0) {
        const keysToNotify = Array.from(deferredReconciliationKeys);
        deferredReconciliationKeys.clear();
        queueMicrotask(() => {
          notifyListeners(keysToNotify);
        });
      }
    }
  },

  async saveImage(id: string, dataUrl: string): Promise<void> {
    if (!id || !dataUrl) return;

    const existing = imageMemoryCache.get(id);
    if (existing === dataUrl && persistedInIdbKeys.has(id)) {
      return; // Identical image payload already persisted in IDB
    }

    setMemoryCache(id, dataUrl);
    notFoundInIdbKeys.delete(id);
    if (existing !== dataUrl) {
      persistedInIdbKeys.delete(id);
    }

    if (reconciliationDepth > 0) {
      deferredReconciliationKeys.add(id);
    } else {
      notifyListeners([id]);
    }
    pendingIdbWrites.set(id, dataUrl);
    scheduleBatchFlush();
  },

  saveImageInMemoryOnly(id: string, dataUrl: string): void {
    if (!id || !dataUrl) return;
    if (imageMemoryCache.get(id) === dataUrl) {
      return; // Already present in memory cache with exact payload
    }
    setMemoryCache(id, dataUrl);
    notFoundInIdbKeys.delete(id);

    if (reconciliationDepth > 0) {
      deferredReconciliationKeys.add(id);
    } else {
      notifyListeners([id]);
    }
  },

  subscribe(listener: ImageStoreListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async getImage(id: string): Promise<string | null> {
    if (!id) return null;
    if (imageMemoryCache.has(id)) {
      return imageMemoryCache.get(id)!;
    }
    if (notFoundInIdbKeys.has(id)) {
      return null;
    }
    const inFlight = inFlightReads.get(id);
    if (inFlight) {
      return inFlight;
    }

    const promise = (async () => {
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
              notFoundInIdbKeys.delete(id);
              if (reconciliationDepth > 0) {
                deferredReconciliationKeys.add(id);
              } else {
                notifyListeners([id]);
              }
            } else {
              notFoundInIdbKeys.add(id);
            }
            resolve(val);
          };
          req.onerror = () => {
            notFoundInIdbKeys.add(id);
            reject(req.error);
          };
        });
      } catch (err) {
        notFoundInIdbKeys.add(id);
        console.warn('[ImageStore] Error reading image from IndexedDB:', err);
        return null;
      } finally {
        inFlightReads.delete(id);
      }
    })();

    inFlightReads.set(id, promise);
    return promise;
  },

  async deleteImage(id: string): Promise<void> {
    if (!id) return;
    imageMemoryCache.delete(id);
    persistedInIdbKeys.delete(id);
    pendingIdbWrites.delete(id);
    inFlightReads.delete(id);
    notFoundInIdbKeys.delete(id);

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
          inFlightReads.delete(key);
          notFoundInIdbKeys.delete(key);
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
      if (!notFoundInIdbKeys.has(id) && !inFlightReads.has(id)) {
        const promise = this.getImage(id)
          .then(res => {
            if (!res) notFoundInIdbKeys.add(id);
            return res;
          })
          .catch(() => {
            notFoundInIdbKeys.add(id);
            return null;
          })
          .finally(() => {
            inFlightReads.delete(id);
          });
        inFlightReads.set(id, promise);
      }
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
        notFoundInIdbKeys.delete(imageKey);
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
        if (!notFoundInIdbKeys.has(data) && !inFlightReads.has(data)) {
          const promise = this.getImage(data)
            .then(res => {
              if (!res) notFoundInIdbKeys.add(data);
              return res;
            })
            .catch(() => {
              notFoundInIdbKeys.add(data);
              return null;
            })
            .finally(() => {
              inFlightReads.delete(data);
            });
          inFlightReads.set(data, promise);
        }
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

  // Collect all IDB image keys referenced within an object or tree
  collectIdbKeys(data: unknown, activeAncestors = new Set<object>()): string[] {
    const keys = new Set<string>();

    function scan(val: unknown) {
      if (!val) return;
      if (typeof val === 'string') {
        if (val.startsWith('idb:')) {
          keys.add(val);
        }
        return;
      }
      if (typeof val === 'object') {
        if (val instanceof Date) return;
        if (activeAncestors.has(val)) return;
        activeAncestors.add(val);
        try {
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
              scan(val[i]);
            }
          } else {
            const objKeys = Object.keys(val as Record<string, unknown>);
            for (let i = 0; i < objKeys.length; i++) {
              scan((val as any)[objKeys[i]]);
            }
          }
        } finally {
          activeAncestors.delete(val);
        }
      }
    }

    scan(data);
    return Array.from(keys);
  },

  // Batch hydrate an array of IDB keys into memory cache in a single IDB transaction
  async hydrateKeysAsync(keys: string[]): Promise<Map<string, string>> {
    const resolved = new Map<string, string>();
    const missingKeys: string[] = [];

    for (const key of keys) {
      if (!key || !key.startsWith('idb:')) continue;
      if (imageMemoryCache.has(key)) {
        resolved.set(key, imageMemoryCache.get(key)!);
      } else {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length === 0) {
      return resolved;
    }

    try {
      const db = await openDB();
      const newlyHydrated: string[] = [];

      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        let completed = 0;

        for (const key of missingKeys) {
          const req = store.get(key);
          req.onsuccess = () => {
            const val = req.result;
            if (val) {
              setMemoryCache(key, val);
              persistedInIdbKeys.add(key);
              notFoundInIdbKeys.delete(key);
              resolved.set(key, val);
              newlyHydrated.push(key);
            } else {
              notFoundInIdbKeys.add(key);
            }
            completed++;
            if (completed === missingKeys.length) resolve();
          };
          req.onerror = () => {
            notFoundInIdbKeys.add(key);
            completed++;
            if (completed === missingKeys.length) resolve();
          };
        }
      });

      if (newlyHydrated.length > 0) {
        if (reconciliationDepth > 0) {
          newlyHydrated.forEach(k => deferredReconciliationKeys.add(k));
        } else {
          notifyListeners(newlyHydrated);
        }
      }
    } catch (err) {
      console.warn('[ImageStore] Error batch hydrating keys from IndexedDB:', err);
    }

    return resolved;
  },

  // Targeted startup hydration for active machines and recent/draft MHC sessions
  async hydrateAppState(): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    try {
      const machinesRaw = localStorage.getItem('fsos_machines');
      const sessionsRaw = localStorage.getItem('fsos_mhc_sessions');

      const keysToHydrate: string[] = [];
      if (machinesRaw) {
        try {
          const parsedMachines = JSON.parse(machinesRaw);
          keysToHydrate.push(...this.collectIdbKeys(parsedMachines));
        } catch {}
      }
      if (sessionsRaw) {
        try {
          const parsedSessions = JSON.parse(sessionsRaw);
          const sessionsArray = Array.isArray(parsedSessions) ? parsedSessions : [];
          // Hydrate the 5 most recent sessions and any non-completed draft session
          const activeSessions = sessionsArray.filter((s: any, idx: number) =>
            s.completionStatus !== 'COMPLETED' || idx < 5
          );
          keysToHydrate.push(...this.collectIdbKeys(activeSessions));
        } catch {}
      }

      if (keysToHydrate.length > 0) {
        await this.hydrateKeysAsync(Array.from(new Set(keysToHydrate)));
      }
    } catch (err) {
      console.warn('[ImageStore] Error during hydrateAppState:', err);
    }
  },

  // Asynchronously hydrate object replacing "idb:..." with actual base64/SVG strings from IDB if missing from cache
  async hydrateImagesAsync<T>(data: T, activeAncestors = new Set<object>()): Promise<T> {
    if (!data) return data;
    if (data instanceof Date) return data;

    // Collect all IDB keys upfront and batch load them in a single transaction
    const keys = this.collectIdbKeys(data);
    if (keys.length > 0) {
      await this.hydrateKeysAsync(keys);
    }

    // Now run synchronous hydration since all keys are now in imageMemoryCache
    return this.hydrateImagesSync(data, activeAncestors);
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
      // Also perform targeted startup hydration for active app state
      await this.hydrateAppState();
    } catch (err) {
      console.warn('[ImageStore] Error preloading images from IndexedDB:', err);
    }
  },

  async clearAll(): Promise<void> {
    imageMemoryCache.clear();
    persistedInIdbKeys.clear();
    pendingIdbWrites.clear();
    inFlightReads.clear();
    notFoundInIdbKeys.clear();
    deferredReconciliationKeys.clear();
    queuedNotificationKeys.clear();
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

function preserveHydratedImagesInternal<T>(incoming: T, existing: T, activeAncestors = new Set<object>()): T {
  if (!incoming || !existing) return incoming;
  if (typeof incoming === 'string') {
    // If incoming is an idb: pointer, but existing already has a resolved data URL / URL, preserve the resolved URL!
    if (incoming.startsWith('idb:') && typeof existing === 'string' && (existing.startsWith('data:') || existing.startsWith('http:') || existing.startsWith('https:') || existing.startsWith('<svg') || existing.startsWith('blob:'))) {
      ImageStore.saveImageInMemoryOnly(incoming, existing);
      return existing as unknown as T;
    }
    return incoming;
  }
  if (typeof incoming === 'object' && typeof existing === 'object') {
    if (incoming instanceof Date || existing instanceof Date) return incoming;
    if (activeAncestors.has(incoming as object)) return incoming;
    activeAncestors.add(incoming as object);

    try {
      if (Array.isArray(incoming) && Array.isArray(existing)) {
        return incoming.map((item, idx) => {
          if (idx < existing.length) {
            return preserveHydratedImagesInternal(item, existing[idx], activeAncestors);
          }
          return item;
        }) as unknown as T;
      }

      const result: any = { ...incoming };
      for (const key of Object.keys(incoming as any)) {
        if (key in (existing as any)) {
          result[key] = preserveHydratedImagesInternal((incoming as any)[key], (existing as any)[key], activeAncestors);
        }
      }
      return result;
    } finally {
      activeAncestors.delete(incoming as object);
    }
  }
  return incoming;
}

/**
 * Universal helper that prevents subsequent sync / state updates from clobbering
 * already-hydrated base64 or external URLs with unresolved "idb:..." pointers.
 */
export function preserveHydratedImages<T>(incoming: T, existing: T, activeAncestors = new Set<object>()): T {
  if (reconciliationDepth === 0 && activeAncestors.size === 0) {
    return ImageStore.reconcile(() => preserveHydratedImagesInternal(incoming, existing, activeAncestors));
  }
  return preserveHydratedImagesInternal(incoming, existing, activeAncestors);
}

/**
 * Merges updated machine records while preserving already-hydrated image payloads.
 */
export function mergeMachinesPreservingImages<M extends { id: string }>(incoming: M[], existing: M[]): M[] {
  if (!existing || existing.length === 0) return incoming;
  return ImageStore.reconcile(() => {
    const existingMap = new Map(existing.map(m => [m.id, m]));
    return incoming.map(inc => {
      const prev = existingMap.get(inc.id);
      if (!prev) return inc;
      return preserveHydratedImagesInternal(inc, prev);
    });
  });
}

/**
 * Merges updated MHC sessions while preserving already-hydrated image payloads.
 */
export function mergeSessionsPreservingImages<S extends { id: string }>(incoming: S[], existing: S[]): S[] {
  if (!existing || existing.length === 0) return incoming;
  return ImageStore.reconcile(() => {
    const existingMap = new Map(existing.map(s => [s.id, s]));
    return incoming.map(inc => {
      const prev = existingMap.get(inc.id);
      if (!prev) return inc;
      return preserveHydratedImagesInternal(inc, prev);
    });
  });
}
