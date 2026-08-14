export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline';

export interface SyncQueueItem {
  id: string;
  table: string;
  recordId: string;
  action: 'upsert' | 'delete';
  data?: any;
  updatedAt: string;
  deviceId: string;
  version: number;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: string | null;
  pendingCount: number;
  deviceId: string;
  online: boolean;
  serverRecordCount: number;
  lastError: string | null;
}

export interface CloudRecord {
  table: string;
  recordId: string;
  data: any;
  updatedAt: string;
  deviceId: string;
  version: number;
  isDeleted?: boolean;
}
