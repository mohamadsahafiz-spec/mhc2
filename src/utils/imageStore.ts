// src/utils/imageStore.ts

import { MediaDeduplicationResult, MediaDeduplicationGroupDetail } from '../types/mediaAudit';

const DB_NAME = 'fsos_evidence_db';
const DB_VERSION = 1;
const STORE_NAME = 'evidence_images';

let dbPromise: Promise<IDBDatabase> | null = null;
const imageMemoryCache = new Map<string, string>();
const persistedInIdbKeys = new Set<string>();
const MAX_MEMORY_CACHE_ITEMS = 128; // LRU cache limit sized to accommodate multi-head sequence inspections without thrashing

// Content-Addressable Deduplication Layer:
// Maps exact physical image payload (dataUrl/SVG string) -> Canonical image key (e.g. idb:MHC-...)
const payloadToCanonicalKey = new Map<string, string>();
// Maps image key -> raw stored value in IDB (either data URL or 'ref:<canonicalKey>')
const rawStoredValues = new Map<string, string>();

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

type RemoteImageFetcher = (imageId: string) => Promise<string | null>;
let remoteImageFetcher: RemoteImageFetcher | null = null;

export interface ImageContaminationAuditResult {
  total: number;
  malformed: number;
  legitimate: number;
  malformedKeys: string[];
}

export interface ImageCleanupResult {
  scanned: number;
  removed: number;
  skipped: number;
  removedKeys: string[];
}

/**
 * Safely determines if an object is a DOM Node, Window, Document, or Event
 * without throwing ReferenceError in environments where DOM constructors might be absent.
 */
export function isBlockedDomOrEventObject(val: unknown): boolean {
  if (!val || typeof val !== 'object') return false;
  if (val instanceof Date) return false;

  // Check standard DOM constructors if defined in global scope
  if (typeof Node !== 'undefined' && val instanceof Node) return true;
  if (typeof Element !== 'undefined' && val instanceof Element) return true;
  if (typeof Document !== 'undefined' && val instanceof Document) return true;
  if (typeof Window !== 'undefined' && val instanceof Window) return true;
  if (typeof Event !== 'undefined' && val instanceof Event) return true;
  if (typeof EventTarget !== 'undefined' && val instanceof EventTarget) return true;

  // Duck typing for mocked, synthesized, or cross-realm DOM / Event objects
  const obj = val as Record<string, any>;
  if (typeof obj.nodeType === 'number' && typeof obj.nodeName === 'string') return true;
  if (obj.ownerDocument !== undefined && obj.attributes !== undefined) return true;
  if (obj.defaultView !== undefined && obj.document !== undefined) return true;

  // React SyntheticEvent duck typing
  if ('_reactName' in obj || 'nativeEvent' in obj) return true;
  if ('isTrusted' in obj && typeof obj.preventDefault === 'function' && typeof obj.stopPropagation === 'function') return true;

  // React Fiber / Internal node duck typing
  if ('stateNode' in obj && ('memoizedProps' in obj || 'memoizedState' in obj || 'return' in obj)) return true;
  if ('tag' in obj && 'key' in obj && 'child' in obj && 'return' in obj) return true;

  return false;
}

/**
 * Checks if an object property key is a React internal or DOM event property that must never be traversed.
 */
export function isBlockedTraversalKey(key: string): boolean {
  if (key.startsWith('__react') || key.startsWith('_react')) return true;
  if (key === 'nativeEvent' || key === 'view' || key === 'target' || key === 'currentTarget') return true;
  return false;
}

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

    if (dataUrl.startsWith('ref:')) {
      // Explicit reference pointer saved
      const targetKey = dataUrl.substring(4);
      const targetVal = imageMemoryCache.get(targetKey) || rawStoredValues.get(targetKey);
      if (targetVal && !targetVal.startsWith('ref:')) {
        setMemoryCache(id, targetVal);
      }
      rawStoredValues.set(id, dataUrl);
      notFoundInIdbKeys.delete(id);
      pendingIdbWrites.set(id, dataUrl);
      scheduleBatchFlush();
      if (reconciliationDepth > 0) {
        deferredReconciliationKeys.add(id);
      } else {
        notifyListeners([id]);
      }
      return;
    }

    // Content-Addressable Deduplication Check:
    let canonKey = payloadToCanonicalKey.get(dataUrl);
    if (!canonKey) {
      for (const [k, v] of imageMemoryCache.entries()) {
        if (v === dataUrl && !v.startsWith('ref:')) {
          canonKey = k;
          payloadToCanonicalKey.set(dataUrl, k);
          break;
        }
      }
    }
    if (!canonKey) {
      for (const [k, v] of rawStoredValues.entries()) {
        if (v === dataUrl && !v.startsWith('ref:')) {
          canonKey = k;
          payloadToCanonicalKey.set(dataUrl, k);
          break;
        }
      }
    }

    if (canonKey && canonKey !== id) {
      // DEDUPLICATED WRITE: Store 'ref:<canonKey>' in IDB; keep full resolved payload in memory cache
      setMemoryCache(id, dataUrl);
      rawStoredValues.set(id, `ref:${canonKey}`);
      notFoundInIdbKeys.delete(id);
      persistedInIdbKeys.delete(id);

      if (reconciliationDepth > 0) {
        deferredReconciliationKeys.add(id);
      } else {
        notifyListeners([id]);
      }
      pendingIdbWrites.set(id, `ref:${canonKey}`);
      scheduleBatchFlush();
      return;
    }

    // CANONICAL WRITE: Store full payload in IDB
    payloadToCanonicalKey.set(dataUrl, id);
    rawStoredValues.set(id, dataUrl);
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

  async getImage(id: string, visited = new Set<string>()): Promise<string | null> {
    if (!id) return null;
    if (visited.has(id)) {
      console.warn('[ImageStore] Circular reference detected for key:', id);
      return null;
    }
    visited.add(id);

    if (imageMemoryCache.has(id)) {
      const cached = imageMemoryCache.get(id)!;
      if (cached.startsWith('ref:')) {
        const targetKey = cached.substring(4);
        const resolved = await this.getImage(targetKey, visited);
        if (resolved) {
          setMemoryCache(id, resolved);
        }
        return resolved;
      }
      return cached;
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
          req.onsuccess = async () => {
            const val = req.result || null;
            if (val) {
              persistedInIdbKeys.add(id);
              notFoundInIdbKeys.delete(id);
              rawStoredValues.set(id, val);

              if (typeof val === 'string' && val.startsWith('ref:')) {
                const targetKey = val.substring(4);
                const resolved = await this.getImage(targetKey, visited);
                if (resolved) {
                  setMemoryCache(id, resolved);
                  if (reconciliationDepth > 0) {
                    deferredReconciliationKeys.add(id);
                  } else {
                    notifyListeners([id]);
                  }
                  resolve(resolved);
                  return;
                }
              }

              if (typeof val === 'string' && !val.startsWith('ref:') && (val.startsWith('data:') || val.startsWith('<svg'))) {
                payloadToCanonicalKey.set(val, id);
              }

              setMemoryCache(id, val);
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
    const storedVal = rawStoredValues.get(id) || imageMemoryCache.get(id);
    imageMemoryCache.delete(id);
    persistedInIdbKeys.delete(id);
    pendingIdbWrites.delete(id);
    inFlightReads.delete(id);
    notFoundInIdbKeys.delete(id);
    rawStoredValues.delete(id);

    try {
      const db = await openDB();
      const allStored = await this.getAllRawStoredEntries();
      const dependentAliases = Object.entries(allStored).filter(
        ([k, v]) => k !== id && typeof v === 'string' && (v === `ref:${id}` || v.startsWith(`ref:${id}`))
      );

      if (dependentAliases.length > 0 && storedVal && !storedVal.startsWith('ref:')) {
        // Promote first alias to become new canonical key
        const [newCanonKey] = dependentAliases[0];
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(storedVal, newCanonKey);
          for (let i = 1; i < dependentAliases.length; i++) {
            store.put(`ref:${newCanonKey}`, dependentAliases[i][0]);
          }
          store.delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        payloadToCanonicalKey.set(storedVal, newCanonKey);
        return;
      }

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

  setRemoteFetcher(fetcher: RemoteImageFetcher | null) {
    remoteImageFetcher = fetcher;
  },

  hasLocalImage(id?: string | null): boolean {
    if (!id) return false;
    return imageMemoryCache.has(id) || persistedInIdbKeys.has(id);
  },

  getDirectMemoryImage(id?: string | null): string | undefined {
    if (!id) return undefined;
    return imageMemoryCache.get(id);
  },

  getCachedImage(id?: string | null): string | undefined {
    return this.resolveImage(id);
  },

  resolveImage(id?: string | null, visited = new Set<string>()): string | undefined {
    if (!id) return undefined;
    if (id.startsWith('data:') || id.startsWith('<svg') || id.startsWith('http:') || id.startsWith('https:') || id.startsWith('blob:')) return id;
    if (visited.has(id)) return undefined;
    visited.add(id);

    if (imageMemoryCache.has(id)) {
      const cached = imageMemoryCache.get(id)!;
      if (cached.startsWith('ref:')) {
        const targetKey = cached.substring(4);
        const targetVal = this.resolveImage(targetKey, visited);
        if (targetVal) {
          setMemoryCache(id, targetVal);
          return targetVal;
        }
      } else {
        return cached;
      }
    }

    if (id.startsWith('idb:')) {
      if (!notFoundInIdbKeys.has(id) && !inFlightReads.has(id)) {
        const promise = this.getImage(id)
          .then(async res => {
            if (!res) {
              if (remoteImageFetcher) {
                const fetched = await remoteImageFetcher(id);
                if (fetched) return fetched;
              }
              notFoundInIdbKeys.add(id);
            }
            return res;
          })
          .catch(async () => {
            if (remoteImageFetcher) {
              const fetched = await remoteImageFetcher(id).catch(() => null);
              if (fetched) return fetched;
            }
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
    if (imageMemoryCache.has(id)) {
      const cached = imageMemoryCache.get(id)!;
      if (!cached.startsWith('ref:')) return cached;
    }
    if (id.startsWith('idb:')) {
      let val = await this.getImage(id);
      if (!val && remoteImageFetcher) {
        val = await remoteImageFetcher(id).catch(() => null);
      }
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
        if (isGhostMediaKey(imageKey)) {
          return undefined as unknown as T;
        }
        this.saveImage(imageKey, data);
        notFoundInIdbKeys.delete(imageKey);
        return imageKey as unknown as T;
      }
      return data;
    }

    if (typeof data === 'object') {
      // Guard against DOM Elements, Windows, Events, and React Fiber/Internal structures
      if (isBlockedDomOrEventObject(data)) {
        return data;
      }

      if (activeAncestors.has(data as object)) {
        return undefined as unknown as T;
      }
      activeAncestors.add(data as object);

      try {
        if (Array.isArray(data)) {
          let hasChanges = false;
          const mapped = data.map((item, idx) => {
            if (isBlockedDomOrEventObject(item)) {
              return item;
            }
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
          // Block React internal properties and DOM nodes from recursive extraction
          if (isBlockedTraversalKey(key) && (isBlockedDomOrEventObject(val) || key.startsWith('__react') || key.startsWith('_react'))) {
            result[key] = val;
            continue;
          }
          if (isBlockedDomOrEventObject(val)) {
            result[key] = val;
            continue;
          }
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

  // Targeted startup hydration for active machines, MHC sessions, branding, and profiles
  async hydrateAppState(): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    try {
      const machinesRaw = localStorage.getItem('fso_v04_machines') || localStorage.getItem('fsos_machines');
      const sessionsRaw = localStorage.getItem('fso_v080_mhc_sessions') || localStorage.getItem('fsos_mhc_sessions');
      const brandingRaw = localStorage.getItem('fso_v04_branding');
      const profileRaw = localStorage.getItem('fso_v072_profile');

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
          keysToHydrate.push(...this.collectIdbKeys(sessionsArray));
        } catch {}
      }
      if (brandingRaw) {
        try {
          const parsedBranding = JSON.parse(brandingRaw);
          keysToHydrate.push(...this.collectIdbKeys(parsedBranding));
        } catch {}
      }
      if (profileRaw) {
        try {
          const parsedProfile = JSON.parse(profileRaw);
          keysToHydrate.push(...this.collectIdbKeys(parsedProfile));
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

  invalidateRuntimeCaches(): void {
    if (typeof indexedDB !== 'undefined') {
      imageMemoryCache.clear();
    }
    persistedInIdbKeys.clear();
    notFoundInIdbKeys.clear();
    inFlightReads.clear();
    deferredReconciliationKeys.clear();
    queuedNotificationKeys.clear();
  },

  async getAllRawStoredEntries(): Promise<Record<string, string>> {
    await flushPendingWrites();
    const entries: Record<string, string> = {};
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);

        if (typeof store.openCursor === 'function') {
          const cursorReq = store.openCursor();
          cursorReq.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              const key = String(cursor.key);
              const val = cursor.value;
              if (typeof val === 'string' && val.length > 0) {
                entries[key] = val;
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
          cursorReq.onerror = () => reject(cursorReq.error);
        } else {
          const keysReq = store.getAllKeys();
          keysReq.onsuccess = () => {
            const keys = keysReq.result;
            if (!keys || keys.length === 0) {
              resolve();
              return;
            }
            let completed = 0;
            for (const k of keys) {
              const getReq = store.get(k);
              getReq.onsuccess = () => {
                if (typeof getReq.result === 'string') {
                  entries[String(k)] = getReq.result;
                }
                completed++;
                if (completed === keys.length) resolve();
              };
              getReq.onerror = () => {
                completed++;
                if (completed === keys.length) resolve();
              };
            }
          };
          keysReq.onerror = () => reject(keysReq.error);
        }
      });
    } catch (err) {
      console.warn('[ImageStore] Error reading raw entries from IndexedDB:', err);
    }

    for (const [k, v] of rawStoredValues.entries()) {
      if (v && !entries[k]) {
        entries[k] = v;
      }
    }

    return entries;
  },

  async getAllImages(): Promise<Record<string, string>> {
    // Flush any pending memory writes first so IDB is authoritative
    await flushPendingWrites();
    const raw = await this.getAllRawStoredEntries();
    const resolved: Record<string, string> = {};

    // First populate canonicals
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string' && !v.startsWith('ref:')) {
        resolved[k] = v;
        payloadToCanonicalKey.set(v, k);
        setMemoryCache(k, v);
      }
    }

    // Now resolve pointers
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string' && v.startsWith('ref:')) {
        const targetKey = v.substring(4);
        const canonVal = resolved[targetKey] || imageMemoryCache.get(targetKey);
        if (canonVal && !canonVal.startsWith('ref:')) {
          resolved[k] = canonVal;
          setMemoryCache(k, canonVal);
        }
      }
    }

    // Also include any memory-cached images not yet in resolved map
    for (const [k, v] of imageMemoryCache.entries()) {
      if (v && !resolved[k] && !v.startsWith('ref:')) {
        resolved[k] = v;
      }
    }

    return resolved;
  },

  async consolidateDuplicatePayloads(): Promise<MediaDeduplicationResult> {
    await flushPendingWrites();
    const raw = await this.getAllRawStoredEntries();
    const errors: string[] = [];
    const details: MediaDeduplicationGroupDetail[] = [];

    // Group keys by exact physical payload
    const payloadToKeys = new Map<string, string[]>();
    for (const [key, val] of Object.entries(raw)) {
      if (typeof val === 'string' && !val.startsWith('ref:') && val.length > 0) {
        if (!payloadToKeys.has(val)) {
          payloadToKeys.set(val, []);
        }
        payloadToKeys.get(val)!.push(key);
      }
    }

    let consolidatedGroupsCount = 0;
    let deduplicatedEntriesCount = 0;
    let reclaimedBytes = 0;

    const updatesToPersist: Array<{ key: string; value: string }> = [];

    for (const [payload, keys] of payloadToKeys.entries()) {
      if (keys.length > 1) {
        // Sort keys to pick the best canonical key:
        // Priority: MHC session keys, then shortest key, then alphabetical
        const sortedKeys = [...keys].sort((a, b) => {
          const aMhc = a.includes('MHC');
          const bMhc = b.includes('MHC');
          if (aMhc && !bMhc) return -1;
          if (!aMhc && bMhc) return 1;
          if (a.length !== b.length) return a.length - b.length;
          return a.localeCompare(b);
        });

        const canonicalKey = sortedKeys[0];
        const aliasKeys = sortedKeys.slice(1);
        const payloadSize = payload.length;
        let groupReclaimed = 0;

        for (const alias of aliasKeys) {
          const refPointer = `ref:${canonicalKey}`;
          updatesToPersist.push({ key: alias, value: refPointer });
          rawStoredValues.set(alias, refPointer);
          // Keep the full payload in memory cache so UI accesses remain immediate
          setMemoryCache(alias, payload);
          groupReclaimed += Math.max(0, payloadSize - refPointer.length);
          deduplicatedEntriesCount++;
        }

        consolidatedGroupsCount++;
        reclaimedBytes += groupReclaimed;

        // Detect payload type
        let payloadType: any = 'unknown string';
        if (payload.startsWith('data:image/jpeg') || payload.startsWith('data:image/jpg')) payloadType = 'data:image/jpeg';
        else if (payload.startsWith('data:image/png')) payloadType = 'data:image/png';
        else if (payload.startsWith('data:image/webp')) payloadType = 'data:image/webp';
        else if (payload.startsWith('data:image/svg+xml')) payloadType = 'data:image/svg+xml';
        else if (payload.startsWith('<svg')) payloadType = 'raw SVG';
        else if (payload.startsWith('data:')) payloadType = 'other data URL';

        details.push({
          groupId: `group_${canonicalKey}`,
          canonicalKey,
          aliasKeys,
          payloadType,
          reclaimedBytesForGroup: groupReclaimed,
        });

        payloadToCanonicalKey.set(payload, canonicalKey);
      }
    }

    if (updatesToPersist.length > 0) {
      try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          for (const item of updatesToPersist) {
            store.put(item.value, item.key);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err: any) {
        console.warn('[ImageStore] Error persisting deduplication consolidation to IDB:', err);
        errors.push(`Failed persisting deduplication updates to IndexedDB: ${err?.message || err}`);
      }
    }

    const totalScanned = Object.keys(raw).length;
    const uniquePayloadsRemaining = payloadToKeys.size;
    const totalLogicalReferencesPreserved = totalScanned;

    return {
      totalScanned,
      consolidatedGroupsCount,
      deduplicatedEntriesCount,
      reclaimedBytes,
      uniquePayloadsRemaining,
      totalLogicalReferencesPreserved,
      details,
      errors,
    };
  },

  async restoreImages(images: Record<string, string>): Promise<{ restoredCount: number; errors: string[] }> {
    const errors: string[] = [];
    if (!images || typeof images !== 'object') {
      return { restoredCount: 0, errors: ['Invalid images dictionary payload.'] };
    }

    const rawEntries = Object.entries(images).filter(
      ([k, v]) => typeof k === 'string' && typeof v === 'string' && v.length > 0
    );

    if (rawEntries.length === 0) {
      return { restoredCount: 0, errors: [] };
    }

    // Deduplicate incoming entries so identical payloads are stored as canonical + ref: pointers
    const payloadToFirstKey = new Map<string, string>();
    const preparedEntries: Array<[string, string]> = [];

    for (const [key, val] of rawEntries) {
      if (val.startsWith('ref:')) {
        preparedEntries.push([key, val]);
        continue;
      }

      const existingCanonKey = payloadToFirstKey.get(val) || payloadToCanonicalKey.get(val);
      if (existingCanonKey && existingCanonKey !== key) {
        // Map as reference pointer to canonical
        const refVal = `ref:${existingCanonKey}`;
        preparedEntries.push([key, refVal]);
        rawStoredValues.set(key, refVal);
        setMemoryCache(key, val);
      } else {
        // First instance becomes canonical
        payloadToFirstKey.set(val, key);
        payloadToCanonicalKey.set(val, key);
        preparedEntries.push([key, val]);
        rawStoredValues.set(key, val);
        setMemoryCache(key, val);
      }
    }

    const BATCH_SIZE = 50;
    let restoredCount = 0;

    try {
      if (typeof indexedDB === 'undefined') {
        restoredCount = preparedEntries.length;
      } else {
        const db = await openDB();
        for (let i = 0; i < preparedEntries.length; i += BATCH_SIZE) {
          const batch = preparedEntries.slice(i, i + BATCH_SIZE);
          await new Promise<void>((resolve, reject) => {
            try {
              const tx = db.transaction(STORE_NAME, 'readwrite');
              const store = tx.objectStore(STORE_NAME);

              for (const [key, payload] of batch) {
                store.put(payload, key);
              }

              tx.oncomplete = () => {
                restoredCount += batch.length;
                resolve();
              };
              tx.onerror = () => reject(tx.error);
              tx.onabort = () => reject(new Error('IndexedDB transaction aborted'));
            } catch (err) {
              reject(err);
            }
          });
        }
      }
    } catch (err: any) {
      console.warn('[ImageStore] Error batch restoring images to IndexedDB:', err);
      errors.push(`Failed restoring images to IndexedDB: ${err?.message || err}`);
    }

    // Invalidate runtime caches so newly restored images resolve fresh from IDB
    this.invalidateRuntimeCaches();

    // Populate memory cache and notify reactive listeners
    const restoredKeys = rawEntries.map(([k, v]) => {
      setMemoryCache(k, v.startsWith('ref:') ? (images[v.substring(4)] || v) : v);
      persistedInIdbKeys.add(k);
      return k;
    });

    notifyListeners(restoredKeys);

    return { restoredCount, errors };
  },

  /**
   * Deterministically identifies whether an image key is a malformed React/DOM-derived artifact.
   * Targets only confirmed React Fiber/Event paths (e.g., idb:...__target___reactFiber$...)
   * and strictly avoids false positives on legitimate engineering keys.
   */
  isMalformedReactDerivedImageKey(key: string): boolean {
    if (!key || typeof key !== 'string' || !key.startsWith('idb:')) {
      return false;
    }

    // Direct React internal signatures
    if (key.includes('__reactFiber') || key.includes('__reactProps') || key.includes('__reactEvents') || key.includes('__reactInternal')) {
      return true;
    }

    // Event target traversal with React Fiber signatures
    if (key.includes('__target___react') || key.includes('__currentTarget___react')) {
      return true;
    }

    // Event target traversal with Fiber node navigation chains
    const hasTargetPrefix = key.includes('__target_') || key.includes('_target___') || key.includes('_currentTarget___');
    const hasFiberTraversals = key.includes('_return_') || key.includes('_child_') || key.includes('_memoizedProps_') || key.includes('_stateNode_') || key.includes('_alternate_') || key.includes('_sibling_') || key.includes('_memoizedState_');

    if (hasTargetPrefix && hasFiberTraversals) {
      return true;
    }

    // Event nativeEvent traversal with React internals
    if (key.includes('_nativeEvent_') && (key.includes('_target_') || key.includes('__react') || key.includes('_view_'))) {
      return true;
    }

    return false;
  },

  /**
   * Performs a non-destructive, read-only audit of evidence_images in IndexedDB and memory cache.
   * Identifies all keys and isolates confirmed malformed React-derived entries without any deletion.
   */
  async auditMalformedImages(): Promise<ImageContaminationAuditResult> {
    const allKeysSet = new Set<string>();

    // 1. Gather all keys from memory cache
    for (const k of imageMemoryCache.keys()) {
      allKeysSet.add(k);
    }

    // 2. Gather all keys from pending writes
    for (const k of pendingIdbWrites.keys()) {
      allKeysSet.add(k);
    }

    // 3. Gather all keys from IndexedDB (if supported)
    if (typeof indexedDB !== 'undefined') {
      try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAllKeys();
          req.onsuccess = () => {
            const keys = req.result;
            if (keys && Array.isArray(keys)) {
              for (const k of keys) {
                if (typeof k === 'string') {
                  allKeysSet.add(k);
                }
              }
            }
            resolve();
          };
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('[ImageStore] Error reading keys from IndexedDB during audit:', err);
      }
    }

    const malformedKeys: string[] = [];
    for (const key of allKeysSet) {
      if (this.isMalformedReactDerivedImageKey(key)) {
        malformedKeys.push(key);
      }
    }

    const total = allKeysSet.size;
    const malformed = malformedKeys.length;
    const legitimate = total - malformed;

    return {
      total,
      malformed,
      legitimate,
      malformedKeys
    };
  },

  /**
   * Safely purges ONLY confirmed malformed React-derived entries from IndexedDB and runtime memory caches.
   * Strictly preserves all legitimate engineering evidence, photos, and beam profile images.
   */
  async cleanupMalformedReactDerivedImages(): Promise<ImageCleanupResult> {
    const audit = await this.auditMalformedImages();
    if (audit.malformed === 0 || audit.malformedKeys.length === 0) {
      return {
        scanned: audit.total,
        removed: 0,
        skipped: audit.total,
        removedKeys: []
      };
    }

    const keysToRemove = audit.malformedKeys;

    // 1. Evict from memory caches and tracking sets
    for (const key of keysToRemove) {
      imageMemoryCache.delete(key);
      persistedInIdbKeys.delete(key);
      pendingIdbWrites.delete(key);
      inFlightReads.delete(key);
      notFoundInIdbKeys.add(key);
      deferredReconciliationKeys.delete(key);
      rawStoredValues.delete(key);
    }

    // 2. Delete from IndexedDB store (if supported)
    if (typeof indexedDB !== 'undefined') {
      try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          for (const key of keysToRemove) {
            store.delete(key);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('[ImageStore] Error deleting malformed keys from IndexedDB:', err);
      }
    }

    return {
      scanned: audit.total,
      removed: keysToRemove.length,
      skipped: audit.legitimate,
      removedKeys: keysToRemove
    };
  },

  /**
   * Safely deletes a specific list of image keys from IndexedDB and runtime memory caches in batches.
   * Strictly preserves all other keys; never calls clear() or wipes the store.
   */
  async deleteImageKeys(keys: string[]): Promise<{ deletedCount: number; errors: string[] }> {
    const errors: string[] = [];
    if (!keys || keys.length === 0) return { deletedCount: 0, errors: [] };

    // 1. Evict from memory caches and tracking sets
    for (const key of keys) {
      imageMemoryCache.delete(key);
      persistedInIdbKeys.delete(key);
      pendingIdbWrites.delete(key);
      inFlightReads.delete(key);
      notFoundInIdbKeys.add(key);
      deferredReconciliationKeys.delete(key);
      rawStoredValues.delete(key);
    }

    let deletedCount = 0;
    const BATCH_SIZE = 50;

    // 2. Delete from IndexedDB store (if supported) in safe batches
    if (typeof indexedDB !== 'undefined') {
      try {
        const db = await openDB();
        for (let i = 0; i < keys.length; i += BATCH_SIZE) {
          const batch = keys.slice(i, i + BATCH_SIZE);
          await new Promise<void>((resolve, reject) => {
            try {
              const tx = db.transaction(STORE_NAME, 'readwrite');
              const store = tx.objectStore(STORE_NAME);
              for (const k of batch) {
                store.delete(k);
              }
              tx.oncomplete = () => {
                deletedCount += batch.length;
                resolve();
              };
              tx.onerror = () => reject(tx.error);
              tx.onabort = () => reject(new Error('IndexedDB batch delete aborted'));
            } catch (err) {
              reject(err);
            }
          });
        }
      } catch (err: any) {
        console.warn('[ImageStore] Error batch deleting image keys from IndexedDB:', err);
        errors.push(err?.message || String(err));
      }
    } else {
      deletedCount = keys.length;
    }

    notifyListeners(keys);
    return { deletedCount, errors };
  },

  /**
   * Authoritative purge for unreferenced and unseen media entries in IndexedDB and memory caches.
   * "If I can't see it, delete it."
   * Strictly preserves all 16 Founder-visible images and active Core Data references.
   */
  async purgeUnseenMedia(activeReachableKeySet?: Set<string>): Promise<{
    scannedCount: number;
    deletedCount: number;
    remainingCount: number;
    deletedKeys: string[];
    errors: string[];
  }> {
    await flushPendingWrites();
    const raw = await this.getAllRawStoredEntries();
    const allImages = await this.getAllImages();
    const allStoredKeySet = new Set<string>([...Object.keys(raw), ...Object.keys(allImages), ...imageMemoryCache.keys()]);
    const allStoredKeys = Array.from(allStoredKeySet);

    // 1. Determine authoritative reachable keys
    let reachableKeys: Set<string>;
    if (activeReachableKeySet) {
      reachableKeys = new Set<string>(
        Array.from(activeReachableKeySet).filter(k => !isGhostMediaKey(k))
      );
    } else {
      const keysCollected: string[] = [];
      if (typeof localStorage !== 'undefined') {
        const storageKeys = [
          'fso_v04_machines',
          'fso_v080_mhc_sessions',
          'fso_v04_branding',
          'fso_v072_profile',
          'fso_v04_reports',
          'fso_v04_templates',
          'fso_v04_drafts',
          'fso_v080_mhc_report_drafts',
          'fso_v090_mhc_workspace_templates',
          'fso_v090_mhc_workspace_drafts',
          'fso_v04_investigations',
          'fso_v04_baselines',
          'fso_v04_tasks',
          'fso_v04_alerts',
          'fso_v04_mhc_records',
          'fso_v04_customers',
          'fso_v04_plants',
          'fso_v04_lines',
          'fso_v04_contracts',
          'fso_v04_schedule',
          'fso_v090_recommended_parts'
        ];
        for (const sk of storageKeys) {
          try {
            const rawVal = localStorage.getItem(sk);
            if (rawVal) {
              const parsed = JSON.parse(rawVal);
              const collected = this.collectIdbKeys(parsed);
              const validKeys = collected.filter(k => !isGhostMediaKey(k));
              keysCollected.push(...validKeys);
            }
          } catch {}
        }
      }
      reachableKeys = new Set<string>(keysCollected);
    }

    // 2. Identify all unreferenced/unseen keys (including all ghost media keys)
    const unseenKeys: string[] = [];
    for (const key of allStoredKeys) {
      if (!reachableKeys.has(key) || isGhostMediaKey(key)) {
        unseenKeys.push(key);
      }
    }

    // 3. For any reachable alias whose target key is being deleted (in unseenKeys), promote the alias to hold the full canonical payload
    const unseenSet = new Set<string>(unseenKeys);
    const updatesToPersist: Array<{ key: string; value: string }> = [];
    for (const key of reachableKeys) {
      const rawVal = raw[key];
      if (typeof rawVal === 'string' && rawVal.startsWith('ref:')) {
        const targetKey = rawVal.substring(4);
        if (unseenSet.has(targetKey)) {
          // Target canonical key is being deleted; promote this surviving alias so data is preserved
          const resolvedPayload = allImages[key] || imageMemoryCache.get(key);
          if (resolvedPayload && !resolvedPayload.startsWith('ref:')) {
            updatesToPersist.push({ key, value: resolvedPayload });
            rawStoredValues.set(key, resolvedPayload);
            setMemoryCache(key, resolvedPayload);
          }
        }
      }
    }

    // 4. Batch delete all unseen keys from IndexedDB and evict from all caches
    const { deletedCount, errors } = await this.deleteImageKeys(unseenKeys);

    // 5. If any remaining reachable keys needed payload re-canonicalization, persist them
    if (updatesToPersist.length > 0 && typeof indexedDB !== 'undefined') {
      try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          for (const item of updatesToPersist) {
            store.put(item.value, item.key);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err: any) {
        errors.push(err?.message || String(err));
      }
    }

    this.invalidateRuntimeCaches();

    const remaining = await this.getAllRawStoredEntries();
    const remainingCount = Object.keys(remaining).length;

    return {
      scannedCount: allStoredKeys.length,
      deletedCount,
      remainingCount,
      deletedKeys: unseenKeys,
      errors
    };
  },

  async clearAll(): Promise<void> {
    imageMemoryCache.clear();
    persistedInIdbKeys.clear();
    pendingIdbWrites.clear();
    inFlightReads.clear();
    notFoundInIdbKeys.clear();
    deferredReconciliationKeys.clear();
    queuedNotificationKeys.clear();
    rawStoredValues.clear();
    payloadToCanonicalKey.clear();
    if (typeof indexedDB !== 'undefined') {
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
  },

  isGhostMediaKey(key: string): boolean {
    return isGhostMediaKey(key);
  },

  isFounderVisibleBeamProfileKey(key: string): boolean {
    return isFounderVisibleBeamProfileKey(key);
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

/**
 * Determines if a media key is one of the Founder-visible Stage 02 Beam Profile images.
 */
export function isFounderVisibleBeamProfileKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const k = key.toLowerCase();
  if (k.includes('stage02') && (k.includes('beamprofile') || k.includes('laserprofile'))) return true;
  if (k.includes('mhc') && (k.includes('beamprofile') || k.includes('laserprofile'))) return true;
  if (k.includes('beamprofile') || k.includes('beam_profile') || k.includes('laserprofile')) return true;
  return false;
}

/**
 * Identifies unseen ghost media keys (such as agcData, inspectionFindings, focusOptimization, productProcess, stageCalibration)
 * that must be permanently deleted from IndexedDB and runtime memory caches.
 * Note: Valid Beam Profile media (Stage 02 and Machine records) is preserved and safe.
 */
export function isGhostMediaKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const k = key.toLowerCase();

  // Preserved: Legitimate Founder-visible Beam Profile keys
  if (isFounderVisibleBeamProfileKey(key)) return false;

  // Targeted ghost media patterns
  if (k.includes('agcdata') || k.includes('agc_data') || k.includes('agccalibration') || (k.includes('agc') && k.includes('evidence'))) return true;
  if (k.includes('inspectionfindings') || k.includes('inspection_findings') || k.includes('findings') || k.includes('laserinspection')) return true;
  if (k.includes('evidenceimage') || k.includes('evidence_image') || k.includes('evidenceimages')) return true;
  if (k.includes('focusoptimization') || k.includes('focus_optimization') || k.includes('focusrecord') || k.includes('focusmatrix')) return true;
  if (k.includes('productprocess') || k.includes('product_process') || k.includes('processrecord') || k.includes('microvia') || k.includes('topvia') || k.includes('bottomvia')) return true;
  if (k.includes('stagecalibration') || k.includes('stage_calibration')) return true;
  if (k.includes('temperatureevidence') || k.includes('temperature_result')) return true;

  return false;
}
