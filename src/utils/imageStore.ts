// src/utils/imageStore.ts

const DB_NAME = 'fsos_evidence_db';
const DB_VERSION = 1;
const STORE_NAME = 'evidence_images';

let dbPromise: Promise<IDBDatabase> | null = null;
const imageMemoryCache = new Map<string, string>();

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

export const ImageStore = {
  async saveImage(id: string, dataUrl: string): Promise<void> {
    if (!id || !dataUrl) return;
    imageMemoryCache.set(id, dataUrl);
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(dataUrl, id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[ImageStore] Error saving image to IndexedDB:', err);
    }
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
          if (val) imageMemoryCache.set(id, val);
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
    if (!id) return undefined;
    if (id.startsWith('data:') || id.startsWith('<svg')) return id;
    if (imageMemoryCache.has(id)) return imageMemoryCache.get(id);

    if (id.startsWith('idb:')) {
      this.getImage(id);
    }
    return undefined;
  },

  // Synchronously offload image payloads into memory cache & enqueue IDB persistence
  extractAndStoreImagesSync<T>(data: T, recordId: string, pathPrefix = '', activeAncestors = new Set<object>()): T {
    if (!data) return data;
    if (data instanceof Date) return data;

    if (typeof data === 'string') {
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
          return data.map((item, idx) =>
            this.extractAndStoreImagesSync(item, recordId, `${pathPrefix}_${idx}`, activeAncestors)
          ) as unknown as T;
        }

        const result: any = {};
        for (const key of Object.keys(data as any)) {
          result[key] = this.extractAndStoreImagesSync((data as any)[key], recordId, `${pathPrefix}_${key}`, activeAncestors);
        }
        return result as T;
      } finally {
        activeAncestors.delete(data as object);
      }
    }

    return data;
  },

  // Hydrate object replacing "idb:..." with actual base64/SVG strings
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
          return data.map(item => this.hydrateImagesSync(item, activeAncestors)) as unknown as T;
        }

        const result: any = {};
        for (const key of Object.keys(data as any)) {
          result[key] = this.hydrateImagesSync((data as any)[key], activeAncestors);
        }
        return result as T;
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
        const req = store.openCursor();
        req.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            imageMemoryCache.set(cursor.key as string, cursor.value as string);
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[ImageStore] Error preloading images from IndexedDB:', err);
    }
  },

  async clearAll(): Promise<void> {
    imageMemoryCache.clear();
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
