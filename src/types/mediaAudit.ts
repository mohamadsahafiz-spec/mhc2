export type MediaEvidenceCategory =
  | 'Beam Profile'
  | 'MHC Session'
  | 'Focus Optimization'
  | 'Product & Process'
  | 'Laser Power'
  | 'Machine Passport'
  | 'Signatures'
  | 'Findings / Evidence'
  | 'Reports / Drafts / Templates'
  | 'Other / Unknown';

export type MediaPayloadType =
  | 'data:image/png'
  | 'data:image/jpeg'
  | 'data:image/webp'
  | 'data:image/svg+xml'
  | 'raw SVG'
  | 'other data URL'
  | 'unknown string';

export interface MediaEvidenceEntryAudit {
  key: string;
  category: MediaEvidenceCategory;
  sourceClassification: string;
  payloadType: MediaPayloadType;
  byteSize: number;
  charLength: number;
  isReferenced: boolean;
  isOrphaned: boolean;
  isDuplicate: boolean;
  duplicateGroupId?: string;
  duplicateCount: number;
}

export interface CategoryStorageSummary {
  category: MediaEvidenceCategory;
  count: number;
  totalBytes: number;
  percentageOfTotal: number;
}

export interface DuplicateGroupSummary {
  groupId: string;
  payloadType: MediaPayloadType;
  byteSizePerEntry: number;
  count: number;
  totalBytes: number;
  wastedBytes: number;
  sampleKey: string;
  keys: string[];
}

export interface MediaEvidenceAuditSummary {
  totalRecords: number;
  totalStorageBytes: number;
  activeReferencedRecords: number;
  orphanedRecords: number;
  missingReferencedRecords: number;
  duplicateRecords: number;
  uniquePayloadCount: number;
  duplicateGroupsCount: number;
  potentialDuplicateSavingsBytes: number;
}

export interface MediaEvidenceAuditReport {
  timestamp: string;
  summary: MediaEvidenceAuditSummary;
  categories: CategoryStorageSummary[];
  topConsumers: MediaEvidenceEntryAudit[];
  duplicates: DuplicateGroupSummary[];
  missingReferencedKeys: string[];
  entries: MediaEvidenceEntryAudit[];
}

export interface OrphanedMediaReconciliationPreview {
  totalIndexedDbEntries: number;
  totalActiveReferencedKeys: number;
  referencedIndexedDbEntries: number;
  orphanedIndexedDbEntries: number;
  missingReferencedKeys: string[];
  reclaimableBytes: number;
  orphanCountByCategory: Record<MediaEvidenceCategory, { count: number; bytes: number }>;
  orphanKeys: string[];
}

export interface OrphanedMediaCleanupResult {
  scannedIndexedDb: number;
  removedCount: number;
  reclaimedBytes: number;
  remainingIndexedDbEntries: number;
  remainingOrphanCount: number;
  deletedKeys: string[];
  errors: string[];
}
