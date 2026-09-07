import { ImageStore } from './imageStore';
import { StorageService } from './persistence';
import {
  MediaEvidenceCategory,
  MediaPayloadType,
  MediaEvidenceEntryAudit,
  CategoryStorageSummary,
  DuplicateGroupSummary,
  MediaEvidenceAuditSummary,
  MediaEvidenceAuditReport
} from '../types/mediaAudit';

export const ALL_MEDIA_CATEGORIES: MediaEvidenceCategory[] = [
  'Beam Profile',
  'MHC Session',
  'Focus Optimization',
  'Product & Process',
  'Laser Power',
  'Machine Passport',
  'Signatures',
  'Findings / Evidence',
  'Reports / Drafts / Templates',
  'Other / Unknown'
];

/**
 * Deterministically classifies a media key into an FSOS engineering category.
 * Strictly adheres to deterministic patterns; falls back to 'Other / Unknown' if not confidently matched.
 */
export function classifyMediaCategory(key: string): { category: MediaEvidenceCategory; sourceClassification: string } {
  if (!key || typeof key !== 'string') {
    return { category: 'Other / Unknown', sourceClassification: 'Invalid / Empty Key' };
  }

  const k = key.toLowerCase();

  // 1. Signatures
  if (k.includes('signature') || k.includes('sign_') || k.includes('engineersignature') || k.includes('customersignature')) {
    return { category: 'Signatures', sourceClassification: 'Engineer/Customer Authorization Signature' };
  }

  // 2. Beam Profile
  if (
    k.includes('beamprofile') ||
    k.includes('beam_profile') ||
    k.includes('laserprofile') ||
    k.includes('laser_profile') ||
    k.includes('profilephoto') ||
    k.includes('beamprofilerecords')
  ) {
    return { category: 'Beam Profile', sourceClassification: 'Beam Profile Measurement / Heatmap Image' };
  }

  // 3. Focus Optimization
  if (
    k.includes('focusoptimization') ||
    k.includes('focus_optimization') ||
    k.includes('focusrecord') ||
    k.includes('focus_record')
  ) {
    return { category: 'Focus Optimization', sourceClassification: 'Focus Optimization Matrix Evaluation' };
  }

  // 4. Product & Process
  if (
    k.includes('productprocess') ||
    k.includes('product_process') ||
    k.includes('topvia') ||
    k.includes('bottomvia') ||
    k.includes('crosssection') ||
    k.includes('via_top') ||
    k.includes('via_bottom') ||
    k.includes('processrecord')
  ) {
    return { category: 'Product & Process', sourceClassification: 'Product & Process Micro-Via / Cross-Section' };
  }

  // 5. Laser Power
  if (
    k.includes('laserpower') ||
    k.includes('laser_power') ||
    k.includes('powerevidence') ||
    k.includes('powerphoto') ||
    k.includes('power_evidence') ||
    k.includes('power_photo')
  ) {
    return { category: 'Laser Power', sourceClassification: 'Laser Power Meter Evidence Photo' };
  }

  // 6. Findings / Evidence
  if (
    k.includes('finding') ||
    k.includes('findings') ||
    k.includes('evidence') ||
    k.includes('evidenceimage') ||
    k.includes('photoref') ||
    k.includes('stage04_findings') ||
    k.includes('finding_image') ||
    k.includes('investigation')
  ) {
    return { category: 'Findings / Evidence', sourceClassification: 'Inspection Finding Evidence / Photo Attachment' };
  }

  // 7. Reports / Drafts / Templates
  if (
    k.includes('report') ||
    k.includes('draft') ||
    k.includes('template') ||
    k.includes('executivereport') ||
    k.includes('stationery') ||
    k.includes('mhc_report_draft') ||
    k.includes('mhc_workspace_template') ||
    k.includes('mhc_workspace_draft')
  ) {
    return { category: 'Reports / Drafts / Templates', sourceClassification: 'Report / Draft / Template Media Asset' };
  }

  // 8. MHC Session
  if (
    key.startsWith('idb:MHC-') ||
    k.includes('mhc_session') ||
    k.includes('stage01') ||
    k.includes('stage02') ||
    k.includes('stage03') ||
    k.includes('stage05') ||
    k.includes('mhcsession') ||
    k.includes('mhc_record')
  ) {
    return { category: 'MHC Session', sourceClassification: 'MHC Cleanroom Session Workflow Asset' };
  }

  // 9. Machine Passport
  if (
    key.startsWith('idb:M-') ||
    key.startsWith('idb:WD-') ||
    k.includes('machine_photo') ||
    k.includes('machine_passport') ||
    k.includes('passport_image') ||
    k.includes('machineimage') ||
    k.includes('assetphoto') ||
    k.includes('overviewphoto')
  ) {
    return { category: 'Machine Passport', sourceClassification: 'Machine Passport Physical Asset Photo' };
  }

  // 10. Other / Unknown
  return { category: 'Other / Unknown', sourceClassification: 'Unclassified Media Payload' };
}

/**
 * Identifies the actual stored payload format from payload content string.
 */
export function detectPayloadType(payload: string): MediaPayloadType {
  if (typeof payload !== 'string') return 'unknown string';
  const trimmed = payload.trim();
  if (trimmed.startsWith('data:image/png')) return 'data:image/png';
  if (trimmed.startsWith('data:image/jpeg') || trimmed.startsWith('data:image/jpg')) return 'data:image/jpeg';
  if (trimmed.startsWith('data:image/webp')) return 'data:image/webp';
  if (trimmed.startsWith('data:image/svg+xml')) return 'data:image/svg+xml';
  if (trimmed.startsWith('data:')) return 'other data URL';
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<SVG') || trimmed.includes('xmlns="http://www.w3.org/2000/svg"')) return 'raw SVG';
  return 'unknown string';
}

/**
 * Calculates the exact UTF-8 byte length of a string payload.
 */
export function getPayloadByteSize(payload: string): number {
  if (typeof payload !== 'string') return 0;
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(payload).length;
  }
  // Standard fallback
  let bytes = 0;
  for (let i = 0; i < payload.length; i++) {
    const codePoint = payload.charCodeAt(i);
    if (codePoint <= 0x7f) {
      bytes += 1;
    } else if (codePoint <= 0x7ff) {
      bytes += 2;
    } else if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      bytes += 4;
      i++;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * Formats a byte number into human-readable metric string (B, KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Collects all reachable `idb:` keys from active Core Data structures.
 */
export function collectAllReachableCoreIdbKeys(activeCoreData?: any): Set<string> {
  const data = activeCoreData || {
    ...StorageService.getAllLocalData(),
    branding: StorageService.getBranding(),
    profile: StorageService.getProfile()
  };
  const keysList = ImageStore.collectIdbKeys(data);
  return new Set<string>(keysList);
}

/**
 * Executes a pure READ-ONLY forensic size, provenance, active/orphaned, and duplicate audit
 * on all IndexedDB media evidence entries.
 */
export async function auditMediaEvidence(
  imagesMap?: Record<string, string>,
  activeCoreData?: any
): Promise<MediaEvidenceAuditReport> {
  // 1. Retrieve all stored images (from passed map or IndexedDB + cache)
  const images: Record<string, string> = imagesMap || (await ImageStore.getAllImages());
  const allKeys = Object.keys(images);

  // 2. Collect all active reachable idb: keys from Core Data
  const reachableCoreKeys = collectAllReachableCoreIdbKeys(activeCoreData);

  // 3. Map payloads to detect duplicates
  const payloadToKeysMap = new Map<string, string[]>();
  for (const key of allKeys) {
    const payload = images[key];
    if (typeof payload === 'string') {
      const existing = payloadToKeysMap.get(payload);
      if (existing) {
        existing.push(key);
      } else {
        payloadToKeysMap.set(payload, [key]);
      }
    }
  }

  // 4. Build duplicate groups
  const duplicateGroups: DuplicateGroupSummary[] = [];
  const keyToDuplicateGroupMap = new Map<string, { groupId: string; count: number }>();
  let duplicateGroupCounter = 1;
  let totalDuplicateWastedBytes = 0;
  let totalDuplicateEntriesCount = 0;

  for (const [payload, keys] of payloadToKeysMap.entries()) {
    if (keys.length > 1) {
      const groupId = `DUP-GRP-${duplicateGroupCounter++}`;
      const payloadType = detectPayloadType(payload);
      const byteSizePerEntry = getPayloadByteSize(payload);
      const totalBytes = keys.length * byteSizePerEntry;
      const wastedBytes = (keys.length - 1) * byteSizePerEntry;

      totalDuplicateWastedBytes += wastedBytes;
      totalDuplicateEntriesCount += keys.length;

      duplicateGroups.push({
        groupId,
        payloadType,
        byteSizePerEntry,
        count: keys.length,
        totalBytes,
        wastedBytes,
        sampleKey: keys[0],
        keys
      });

      for (const k of keys) {
        keyToDuplicateGroupMap.set(k, { groupId, count: keys.length });
      }
    }
  }

  // Sort duplicate groups by wasted bytes descending
  duplicateGroups.sort((a, b) => b.wastedBytes - a.wastedBytes);

  // 5. Build individual entry audits
  const entries: MediaEvidenceEntryAudit[] = [];
  let totalStorageBytes = 0;
  let activeReferencedRecords = 0;
  let orphanedRecords = 0;

  const categoryBuckets = new Map<MediaEvidenceCategory, { count: number; totalBytes: number }>();
  for (const cat of ALL_MEDIA_CATEGORIES) {
    categoryBuckets.set(cat, { count: 0, totalBytes: 0 });
  }

  for (const key of allKeys) {
    const payload = images[key] || '';
    const byteSize = getPayloadByteSize(payload);
    const charLength = payload.length;
    const payloadType = detectPayloadType(payload);
    const { category, sourceClassification } = classifyMediaCategory(key);
    const isReferenced = reachableCoreKeys.has(key);
    const isOrphaned = !isReferenced;

    if (isReferenced) {
      activeReferencedRecords++;
    } else {
      orphanedRecords++;
    }

    totalStorageBytes += byteSize;

    const bucket = categoryBuckets.get(category)!;
    bucket.count += 1;
    bucket.totalBytes += byteSize;

    const dupInfo = keyToDuplicateGroupMap.get(key);
    const isDuplicate = !!dupInfo;

    entries.push({
      key,
      category,
      sourceClassification,
      payloadType,
      byteSize,
      charLength,
      isReferenced,
      isOrphaned,
      isDuplicate,
      duplicateGroupId: dupInfo?.groupId,
      duplicateCount: dupInfo ? dupInfo.count : 1
    });
  }

  // 6. Find missing referenced keys (referenced in Core Data, but not found in IndexedDB)
  const missingReferencedKeys: string[] = [];
  for (const coreKey of reachableCoreKeys) {
    if (!images[coreKey]) {
      missingReferencedKeys.push(coreKey);
    }
  }

  // 7. Calculate category summaries
  const categories: CategoryStorageSummary[] = ALL_MEDIA_CATEGORIES.map(cat => {
    const bucket = categoryBuckets.get(cat)!;
    const percentageOfTotal = totalStorageBytes > 0 ? (bucket.totalBytes / totalStorageBytes) * 100 : 0;
    return {
      category: cat,
      count: bucket.count,
      totalBytes: bucket.totalBytes,
      percentageOfTotal
    };
  }).sort((a, b) => b.totalBytes - a.totalBytes);

  // 8. Sort top storage consumers descending by byte size
  const topConsumers = [...entries].sort((a, b) => b.byteSize - a.byteSize);

  // 9. Build summary metrics
  const summary: MediaEvidenceAuditSummary = {
    totalRecords: allKeys.length,
    totalStorageBytes,
    activeReferencedRecords,
    orphanedRecords,
    missingReferencedRecords: missingReferencedKeys.length,
    duplicateRecords: totalDuplicateEntriesCount,
    uniquePayloadCount: payloadToKeysMap.size,
    duplicateGroupsCount: duplicateGroups.length,
    potentialDuplicateSavingsBytes: totalDuplicateWastedBytes
  };

  return {
    timestamp: new Date().toISOString(),
    summary,
    categories,
    topConsumers,
    duplicates: duplicateGroups,
    missingReferencedKeys,
    entries
  };
}
