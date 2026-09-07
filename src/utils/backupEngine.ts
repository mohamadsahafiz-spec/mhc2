import { APP_VERSION } from '../constants/version';
import {
  FSOSBackupManifest,
  FSOSFullBackupData,
  FSOSFullBackupEnvelope,
  FSOSBackupValidationResult,
  FSOSMediaBackupManifest,
  FSOSMediaBackupEnvelope,
  FSOSMediaBackupValidationResult,
  FSOSCompleteBackupValidationResult,
  CURRENT_BACKUP_SCHEMA_VERSION,
  CURRENT_MEDIA_BACKUP_SCHEMA_VERSION
} from '../types/backup';
import { StorageService, STORAGE_KEYS, safeJsonStringify } from './persistence';
import { SyncEngine } from './syncEngine';
import { ImageStore } from './imageStore';
import { reconcileMhcSessionIdentities } from './mhcIdentityReconciler';

/**
 * Generate a unique deterministic backup ID.
 */
export function generateBackupId(): string {
  return `fsos_backup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate formatted filename for core backups or pre-restore safety snapshots.
 * Example: fsos-core-backup-2026-09-07-033000.json
 */
export function getBackupFilename(prefix = 'fsos-core-backup'): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timeStr = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${prefix}-${dateStr}-${timeStr}.json`;
}

/**
 * Generate formatted filename for media backups.
 * Example: fsos-media-backup-2026-09-07-033000.json
 */
export function getMediaBackupFilename(prefix = 'fsos-media-backup'): string {
  return getBackupFilename(prefix);
}

/**
 * Triggers a browser file download using a temporary anchor element.
 */
export function triggerFileDownload(content: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates an in-memory FSOSFullBackupEnvelope snapshot of all current local operational data.
 * Pure read-only operation with zero mutations or sync triggers.
 */
export function generateFullBackupEnvelope(customBackupId?: string): FSOSFullBackupEnvelope {
  const localData = StorageService.getAllLocalData();
  const branding = StorageService.getBranding();
  const profile = StorageService.getProfile();

  const data: FSOSFullBackupData = {
    machines: localData.machines || [],
    customers: localData.customers || [],
    plants: localData.plants || [],
    lines: localData.lines || [],
    contracts: localData.contracts || [],
    schedule: localData.schedule || [],
    mhc_sessions: localData.mhc_sessions || [],
    reports: localData.reports || [],
    mhc_records: localData.mhc_records || [],
    tasks: localData.tasks || [],
    alerts: localData.alerts || [],
    baselines: localData.baselines || [],
    investigations: localData.investigations || [],
    templates: localData.templates || [],
    drafts: localData.drafts || [],
    mhc_report_drafts: localData.mhc_report_drafts || [],
    mhc_workspace_templates: localData.mhc_workspace_templates || [],
    mhc_workspace_drafts: localData.mhc_workspace_drafts || [],
    recommended_parts: localData.recommended_parts || [],
    branding,
    profile
  };

  const domainCounts: Record<string, number> = {
    machines: data.machines.length,
    customers: data.customers.length,
    plants: data.plants.length,
    lines: data.lines.length,
    contracts: data.contracts.length,
    schedule: data.schedule.length,
    mhc_sessions: data.mhc_sessions.length,
    reports: data.reports.length,
    mhc_records: data.mhc_records.length,
    tasks: data.tasks.length,
    alerts: data.alerts.length,
    baselines: data.baselines.length,
    investigations: data.investigations.length,
    templates: data.templates.length,
    drafts: data.drafts.length,
    mhc_report_drafts: data.mhc_report_drafts.length,
    mhc_workspace_templates: data.mhc_workspace_templates.length,
    mhc_workspace_drafts: data.mhc_workspace_drafts.length,
    recommended_parts: data.recommended_parts.length,
    branding: data.branding ? 1 : 0,
    profile: data.profile ? 1 : 0
  };

  const manifest: FSOSBackupManifest = {
    backupId: customBackupId || generateBackupId(),
    backupVersion: CURRENT_BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    createdAt: new Date().toISOString(),
    environment: 'FSOS_WEB_CLIENT',
    domainCounts,
    includesImages: false,
    includesRawTemperature: false
  };

  return {
    manifest,
    data
  };
}

/**
 * Generates an in-memory FSOSMediaBackupEnvelope containing all stored evidence images.
 */
export async function generateMediaBackupEnvelope(sharedBackupId?: string): Promise<FSOSMediaBackupEnvelope> {
  const images = await ImageStore.getAllImages();
  const imageCount = Object.keys(images).length;

  const manifest: FSOSMediaBackupManifest = {
    backupId: sharedBackupId || generateBackupId(),
    backupVersion: CURRENT_MEDIA_BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    createdAt: new Date().toISOString(),
    environment: 'FSOS_WEB_CLIENT',
    includesImages: true,
    imageCount
  };

  return {
    manifest,
    images
  };
}

/**
 * Assembles and exports a Full Core Data Backup JSON file, triggering immediate browser download.
 */
export function exportFullBackup(customFilename?: string): { envelope: FSOSFullBackupEnvelope; filename: string } {
  const envelope = generateFullBackupEnvelope();
  const filename = customFilename || getBackupFilename('fsos-core-backup');
  const jsonContent = safeJsonStringify(envelope, 2);
  triggerFileDownload(jsonContent, filename);
  return { envelope, filename };
}

/**
 * Assembles and exports a Media Evidence Backup JSON file.
 */
export async function exportMediaBackup(
  sharedBackupId?: string,
  customFilename?: string
): Promise<{ envelope: FSOSMediaBackupEnvelope; filename: string }> {
  const envelope = await generateMediaBackupEnvelope(sharedBackupId);
  const filename = customFilename || getMediaBackupFilename('fsos-media-backup');
  const jsonContent = safeJsonStringify(envelope, 2);
  triggerFileDownload(jsonContent, filename);
  return { envelope, filename };
}

/**
 * Exports a Complete Archive containing paired Core Data Backup and Media Evidence Backup files.
 * Both files share the exact same backupId.
 */
export async function exportCompleteArchive(): Promise<{
  coreFilename: string;
  mediaFilename: string;
  backupId: string;
  imageCount: number;
}> {
  const sharedBackupId = generateBackupId();

  // 1. Generate & trigger Core Backup download
  const coreEnvelope = generateFullBackupEnvelope(sharedBackupId);
  const coreFilename = getBackupFilename('fsos-core-backup');
  triggerFileDownload(safeJsonStringify(coreEnvelope, 2), coreFilename);

  // 2. Generate & trigger Media Backup download
  const mediaEnvelope = await generateMediaBackupEnvelope(sharedBackupId);
  const mediaFilename = getMediaBackupFilename('fsos-media-backup');

  // Small timeout to ensure browser handles dual file downloads cleanly
  await new Promise(resolve => setTimeout(resolve, 200));
  triggerFileDownload(safeJsonStringify(mediaEnvelope, 2), mediaFilename);

  return {
    coreFilename,
    mediaFilename,
    backupId: sharedBackupId,
    imageCount: mediaEnvelope.manifest.imageCount
  };
}

/**
 * Validates a potential backup JSON string without making ANY persistent mutations.
 * Returns structured validation metrics for UI preview.
 */
export function validateBackup(jsonString: string): FSOSBackupValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const domainCounts: Record<string, number> = {};

  if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') {
    return {
      valid: false,
      domainCounts: {},
      warnings: [],
      errors: ['The selected file is empty. Please provide a valid FSOS backup JSON file.']
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return {
      valid: false,
      domainCounts: {},
      warnings: [],
      errors: [`Invalid JSON formatting: ${err?.message || 'JSON Parse Error'}`]
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      domainCounts: {},
      warnings: [],
      errors: ['Invalid backup envelope: Root must be a valid JSON object.']
    };
  }

  if (!parsed.manifest || typeof parsed.manifest !== 'object') {
    errors.push('Missing or malformed "manifest" object in backup envelope.');
  } else {
    if (!parsed.manifest.backupId || typeof parsed.manifest.backupId !== 'string') {
      errors.push('Manifest is missing a valid "backupId" string.');
    }
    if (!parsed.manifest.backupVersion || typeof parsed.manifest.backupVersion !== 'string') {
      errors.push('Manifest is missing a valid "backupVersion" string.');
    } else if (!parsed.manifest.backupVersion.startsWith('1.')) {
      errors.push(`Unsupported backup version: ${parsed.manifest.backupVersion}. Expected version 1.x.`);
    }
  }

  if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    errors.push('Missing or invalid "data" object containing core FSOS domains.');
    return {
      valid: false,
      manifest: parsed.manifest,
      envelope: parsed,
      domainCounts,
      warnings,
      errors
    };
  }

  const d = parsed.data;
  const arrayDomains = [
    'machines',
    'customers',
    'plants',
    'lines',
    'contracts',
    'schedule',
    'mhc_sessions',
    'reports',
    'mhc_records',
    'tasks',
    'alerts',
    'baselines',
    'investigations',
    'templates',
    'drafts',
    'mhc_report_drafts',
    'mhc_workspace_templates',
    'mhc_workspace_drafts',
    'recommended_parts'
  ];

  for (const domain of arrayDomains) {
    if (domain in d) {
      if (!Array.isArray(d[domain])) {
        errors.push(`Domain "${domain}" must be an array, but received ${typeof d[domain]}.`);
        domainCounts[domain] = 0;
      } else {
        domainCounts[domain] = d[domain].length;
      }
    } else {
      domainCounts[domain] = 0;
    }
  }

  // Inspect machines domain if present
  if (Array.isArray(d.machines)) {
    const invalidMachines = d.machines.filter((m: any) => !m || typeof m !== 'object' || !m.id);
    if (invalidMachines.length > 0) {
      errors.push(`${invalidMachines.length} machine record(s) are missing valid "id" primary keys.`);
    }
  }

  // Singletons
  domainCounts.branding = d.branding && typeof d.branding === 'object' ? 1 : 0;
  domainCounts.profile = d.profile && typeof d.profile === 'object' ? 1 : 0;

  const valid = errors.length === 0;

  return {
    valid,
    manifest: parsed.manifest,
    envelope: parsed as FSOSFullBackupEnvelope,
    domainCounts,
    warnings,
    errors
  };
}

/**
 * Validates a potential Media Backup JSON string.
 */
export function validateMediaBackup(jsonString: string): FSOSMediaBackupValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') {
    return {
      valid: false,
      imageCount: 0,
      warnings: [],
      errors: ['The selected media file is empty. Please provide a valid FSOS media backup JSON file.']
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    return {
      valid: false,
      imageCount: 0,
      warnings: [],
      errors: [`Invalid Media JSON formatting: ${err?.message || 'JSON Parse Error'}`]
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      imageCount: 0,
      warnings: [],
      errors: ['Invalid Media backup envelope: Root must be a valid JSON object.']
    };
  }

  if (!parsed.manifest || typeof parsed.manifest !== 'object') {
    errors.push('Missing or malformed "manifest" object in media backup envelope.');
  } else {
    if (!parsed.manifest.backupId || typeof parsed.manifest.backupId !== 'string') {
      errors.push('Media manifest is missing a valid "backupId" string.');
    }
    if (parsed.manifest.includesImages !== true) {
      errors.push('Media manifest "includesImages" flag must be true.');
    }
    if (typeof parsed.manifest.imageCount !== 'number') {
      errors.push('Media manifest is missing a numeric "imageCount".');
    }
  }

  if (!parsed.images || typeof parsed.images !== 'object' || Array.isArray(parsed.images)) {
    errors.push('Missing or invalid "images" dictionary in media backup envelope.');
  }

  const actualImageCount = parsed.images && typeof parsed.images === 'object' && !Array.isArray(parsed.images)
    ? Object.keys(parsed.images).length
    : 0;

  if (parsed.manifest && typeof parsed.manifest.imageCount === 'number' && parsed.manifest.imageCount !== actualImageCount) {
    errors.push(`Media manifest imageCount (${parsed.manifest.imageCount}) does not match actual image count in payload (${actualImageCount}).`);
  }

  const valid = errors.length === 0;

  return {
    valid,
    manifest: parsed.manifest,
    envelope: parsed as FSOSMediaBackupEnvelope,
    imageCount: actualImageCount,
    warnings,
    errors
  };
}

/**
 * Validates a paired Complete Backup (Core Backup + Optional Media Backup).
 */
export function validateCompleteBackup(
  coreJsonString: string,
  mediaJsonString?: string
): FSOSCompleteBackupValidationResult {
  const coreRes = validateBackup(coreJsonString);
  const warnings = [...coreRes.warnings];
  const errors = [...coreRes.errors];

  if (!mediaJsonString || mediaJsonString.trim() === '') {
    return {
      valid: coreRes.valid,
      coreValidation: coreRes,
      hasMedia: false,
      backupIdMatch: true,
      warnings,
      errors
    };
  }

  const mediaRes = validateMediaBackup(mediaJsonString);
  warnings.push(...mediaRes.warnings);
  errors.push(...mediaRes.errors);

  let backupIdMatch = false;
  if (coreRes.manifest?.backupId && mediaRes.manifest?.backupId) {
    if (coreRes.manifest.backupId === mediaRes.manifest.backupId) {
      backupIdMatch = true;
    } else {
      backupIdMatch = false;
      errors.push(
        `Backup ID mismatch: Core Backup ID (${coreRes.manifest.backupId}) does not match Media Backup ID (${mediaRes.manifest.backupId}). Both files must originate from the same Complete Archive.`
      );
    }
  }

  const valid = coreRes.valid && mediaRes.valid && backupIdMatch;

  return {
    valid,
    coreValidation: coreRes,
    mediaValidation: mediaRes,
    hasMedia: true,
    backupIdMatch,
    warnings,
    errors
  };
}

/**
 * Restores a full core data backup snapshot to local storage.
 *
 * Execution flow:
 * 1. Immediate pre-mutation validation
 * 2. Automatic pre-restore safety snapshot download (unless skipSafetyDownload)
 * 3. Direct localStorage atomic replace (bypassing sync enqueue save wrappers)
 * 4. SyncEngine state reset (clearing stale sync queues and device hashes)
 * 5. Deterministic identity reconciliation (customers and MHC sessions)
 * 6. Clean application reload (unless skipReload)
 */
export async function restoreFullBackup(
  envelope: FSOSFullBackupEnvelope,
  options?: { skipReload?: boolean; skipSafetyDownload?: boolean }
): Promise<{ success: boolean; safetyBackupFilename?: string; error?: string }> {
  // STEP 1 — VALIDATION
  const validation = validateBackup(safeJsonStringify(envelope));
  if (!validation.valid || !validation.envelope) {
    const errMsg = `Backup validation failed: ${validation.errors.join('; ')}`;
    console.error('[BackupEngine] Restore aborted:', errMsg);
    return { success: false, error: errMsg };
  }

  // STEP 2 — AUTOMATIC SAFETY BACKUP (DOWNLOAD CURRENT STATE)
  let safetyFilename: string | undefined;
  if (!options?.skipSafetyDownload) {
    try {
      const safetyEnvelope = generateFullBackupEnvelope();
      safetyFilename = getBackupFilename('fsos-pre-restore-safety-snapshot');
      const safetyContent = safeJsonStringify(safetyEnvelope, 2);
      triggerFileDownload(safetyContent, safetyFilename);
    } catch (err: any) {
      const errMsg = `Safety pre-restore backup generation failed (${err?.message || err}). Restore aborted to prevent unrecoverable data loss.`;
      console.error('[BackupEngine] Restore aborted:', errMsg);
      return { success: false, error: errMsg };
    }
  }

  // STEP 3 — DIRECT STORAGE REPLACE
  try {
    if (typeof localStorage !== 'undefined') {
      const d = validation.envelope.data;

      if (Array.isArray(d.machines)) localStorage.setItem(STORAGE_KEYS.MACHINES, safeJsonStringify(d.machines));
      if (Array.isArray(d.customers)) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, safeJsonStringify(d.customers));
      if (Array.isArray(d.plants)) localStorage.setItem(STORAGE_KEYS.PLANTS, safeJsonStringify(d.plants));
      if (Array.isArray(d.lines)) localStorage.setItem(STORAGE_KEYS.LINES, safeJsonStringify(d.lines));
      if (Array.isArray(d.contracts)) localStorage.setItem(STORAGE_KEYS.CONTRACTS, safeJsonStringify(d.contracts));
      if (Array.isArray(d.schedule)) localStorage.setItem(STORAGE_KEYS.SCHEDULE, safeJsonStringify(d.schedule));
      if (Array.isArray(d.mhc_sessions)) localStorage.setItem(STORAGE_KEYS.MHC_SESSIONS, safeJsonStringify(d.mhc_sessions));
      if (Array.isArray(d.reports)) localStorage.setItem(STORAGE_KEYS.REPORTS, safeJsonStringify(d.reports));
      if (Array.isArray(d.mhc_records)) localStorage.setItem(STORAGE_KEYS.MHC_RECORDS, safeJsonStringify(d.mhc_records));
      if (Array.isArray(d.tasks)) localStorage.setItem(STORAGE_KEYS.TASKS, safeJsonStringify(d.tasks));
      if (Array.isArray(d.alerts)) localStorage.setItem(STORAGE_KEYS.ALERTS, safeJsonStringify(d.alerts));
      if (Array.isArray(d.baselines)) localStorage.setItem(STORAGE_KEYS.BASELINES, safeJsonStringify(d.baselines));
      if (Array.isArray(d.investigations)) localStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, safeJsonStringify(d.investigations));
      if (Array.isArray(d.templates)) localStorage.setItem(STORAGE_KEYS.TEMPLATES, safeJsonStringify(d.templates));
      if (Array.isArray(d.drafts)) localStorage.setItem(STORAGE_KEYS.DRAFTS, safeJsonStringify(d.drafts));
      if (Array.isArray(d.mhc_report_drafts)) localStorage.setItem(STORAGE_KEYS.MHC_REPORT_DRAFTS, safeJsonStringify(d.mhc_report_drafts));
      if (Array.isArray(d.mhc_workspace_templates)) localStorage.setItem(STORAGE_KEYS.MHC_WORKSPACE_TEMPLATES, safeJsonStringify(d.mhc_workspace_templates));
      if (Array.isArray(d.mhc_workspace_drafts)) localStorage.setItem(STORAGE_KEYS.MHC_WORKSPACE_DRAFTS, safeJsonStringify(d.mhc_workspace_drafts));
      if (Array.isArray(d.recommended_parts)) localStorage.setItem(STORAGE_KEYS.RECOMMENDED_PARTS, safeJsonStringify(d.recommended_parts));
      if (d.branding && typeof d.branding === 'object') localStorage.setItem(STORAGE_KEYS.BRANDING, safeJsonStringify(d.branding));
      if (d.profile && typeof d.profile === 'object') localStorage.setItem(STORAGE_KEYS.PROFILE, safeJsonStringify(d.profile));
    }
  } catch (err: any) {
    const errMsg = `Direct localStorage write failed: ${err?.message || err}`;
    console.error('[BackupEngine] Write failure during restore:', errMsg);
    return { success: false, error: errMsg };
  }

  // STEP 4 — RESET SYNC STATE
  try {
    SyncEngine.resetLocalSyncState();
  } catch (err: any) {
    console.warn('[BackupEngine] SyncEngine resetLocalSyncState warning:', err);
  }

  // STEP 5 — IDENTITY RECONCILIATION
  try {
    const rawMachines = StorageService.getMachines();
    const rawCustomers = StorageService.getCustomers();
    const recCust = StorageService.reconcileCustomerIdentities(rawMachines, rawCustomers);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MACHINES, safeJsonStringify(recCust.machines));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, safeJsonStringify(recCust.customers));
    }

    const rawSessions = StorageService.getMhcSessions(false);
    const recSessions = reconcileMhcSessionIdentities(rawSessions, recCust.machines);
    if (recSessions.modified && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MHC_SESSIONS, safeJsonStringify(recSessions.sessions));
    }
  } catch (err: any) {
    console.warn('[BackupEngine] Post-restore identity reconciliation warning:', err);
  }

  // STEP 6 — RELOAD
  if (!options?.skipReload && typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
    window.location.reload();
  }

  return {
    success: true,
    safetyBackupFilename: safetyFilename
  };
}

/**
 * Restores a Complete Archive snapshot (Core Data + Optional Media Evidence).
 */
export async function restoreCompleteBackup(
  coreEnvelope: FSOSFullBackupEnvelope,
  mediaEnvelope?: FSOSMediaBackupEnvelope,
  options?: { skipReload?: boolean; skipSafetyDownload?: boolean }
): Promise<{ success: boolean; safetyBackupFilename?: string; restoredImageCount?: number; error?: string }> {
  // 1. VALIDATION
  const validation = validateCompleteBackup(
    safeJsonStringify(coreEnvelope),
    mediaEnvelope ? safeJsonStringify(mediaEnvelope) : undefined
  );

  if (!validation.valid || !validation.coreValidation.envelope) {
    const errMsg = `Complete Archive validation failed: ${validation.errors.join('; ')}`;
    console.error('[BackupEngine] Complete restore aborted:', errMsg);
    return { success: false, error: errMsg };
  }

  // 2. AUTOMATIC CORE SAFETY BACKUP (DOWNLOAD CURRENT STATE)
  let safetyFilename: string | undefined;
  if (!options?.skipSafetyDownload) {
    try {
      const safetyEnvelope = generateFullBackupEnvelope();
      safetyFilename = getBackupFilename('fsos-pre-restore-safety-snapshot');
      const safetyContent = safeJsonStringify(safetyEnvelope, 2);
      triggerFileDownload(safetyContent, safetyFilename);
    } catch (err: any) {
      const errMsg = `Safety pre-restore backup generation failed (${err?.message || err}). Restore aborted to prevent unrecoverable data loss.`;
      console.error('[BackupEngine] Restore aborted:', errMsg);
      return { success: false, error: errMsg };
    }
  }

  // 3. RESTORE CORE DATA TO LOCAL STORAGE
  try {
    if (typeof localStorage !== 'undefined') {
      const d = validation.coreValidation.envelope.data;

      if (Array.isArray(d.machines)) localStorage.setItem(STORAGE_KEYS.MACHINES, safeJsonStringify(d.machines));
      if (Array.isArray(d.customers)) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, safeJsonStringify(d.customers));
      if (Array.isArray(d.plants)) localStorage.setItem(STORAGE_KEYS.PLANTS, safeJsonStringify(d.plants));
      if (Array.isArray(d.lines)) localStorage.setItem(STORAGE_KEYS.LINES, safeJsonStringify(d.lines));
      if (Array.isArray(d.contracts)) localStorage.setItem(STORAGE_KEYS.CONTRACTS, safeJsonStringify(d.contracts));
      if (Array.isArray(d.schedule)) localStorage.setItem(STORAGE_KEYS.SCHEDULE, safeJsonStringify(d.schedule));
      if (Array.isArray(d.mhc_sessions)) localStorage.setItem(STORAGE_KEYS.MHC_SESSIONS, safeJsonStringify(d.mhc_sessions));
      if (Array.isArray(d.reports)) localStorage.setItem(STORAGE_KEYS.REPORTS, safeJsonStringify(d.reports));
      if (Array.isArray(d.mhc_records)) localStorage.setItem(STORAGE_KEYS.MHC_RECORDS, safeJsonStringify(d.mhc_records));
      if (Array.isArray(d.tasks)) localStorage.setItem(STORAGE_KEYS.TASKS, safeJsonStringify(d.tasks));
      if (Array.isArray(d.alerts)) localStorage.setItem(STORAGE_KEYS.ALERTS, safeJsonStringify(d.alerts));
      if (Array.isArray(d.baselines)) localStorage.setItem(STORAGE_KEYS.BASELINES, safeJsonStringify(d.baselines));
      if (Array.isArray(d.investigations)) localStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, safeJsonStringify(d.investigations));
      if (Array.isArray(d.templates)) localStorage.setItem(STORAGE_KEYS.TEMPLATES, safeJsonStringify(d.templates));
      if (Array.isArray(d.drafts)) localStorage.setItem(STORAGE_KEYS.DRAFTS, safeJsonStringify(d.drafts));
      if (Array.isArray(d.mhc_report_drafts)) localStorage.setItem(STORAGE_KEYS.MHC_REPORT_DRAFTS, safeJsonStringify(d.mhc_report_drafts));
      if (Array.isArray(d.mhc_workspace_templates)) localStorage.setItem(STORAGE_KEYS.MHC_WORKSPACE_TEMPLATES, safeJsonStringify(d.mhc_workspace_templates));
      if (Array.isArray(d.mhc_workspace_drafts)) localStorage.setItem(STORAGE_KEYS.MHC_WORKSPACE_DRAFTS, safeJsonStringify(d.mhc_workspace_drafts));
      if (Array.isArray(d.recommended_parts)) localStorage.setItem(STORAGE_KEYS.RECOMMENDED_PARTS, safeJsonStringify(d.recommended_parts));
      if (d.branding && typeof d.branding === 'object') localStorage.setItem(STORAGE_KEYS.BRANDING, safeJsonStringify(d.branding));
      if (d.profile && typeof d.profile === 'object') localStorage.setItem(STORAGE_KEYS.PROFILE, safeJsonStringify(d.profile));
    }
  } catch (err: any) {
    const errMsg = `Direct localStorage write failed: ${err?.message || err}`;
    console.error('[BackupEngine] Write failure during restore:', errMsg);
    return { success: false, error: errMsg };
  }

  // 4. RESTORE MEDIA IMAGES NON-DESTRUCTIVELY INTO INDEXEDDB
  let restoredImageCount = 0;
  if (mediaEnvelope && mediaEnvelope.images && typeof mediaEnvelope.images === 'object') {
    try {
      const mediaResult = await ImageStore.restoreImages(mediaEnvelope.images);
      restoredImageCount = mediaResult.restoredCount;
      if (mediaResult.errors.length > 0) {
        console.warn('[BackupEngine] Some media images encountered restore errors:', mediaResult.errors);
      }
    } catch (err: any) {
      console.warn('[BackupEngine] Media restoration error:', err);
    }
  }

  // 5. RESET SYNC STATE
  try {
    SyncEngine.resetLocalSyncState();
  } catch (err: any) {
    console.warn('[BackupEngine] SyncEngine resetLocalSyncState warning:', err);
  }

  // 6. IDENTITY RECONCILIATION
  try {
    const rawMachines = StorageService.getMachines();
    const rawCustomers = StorageService.getCustomers();
    const recCust = StorageService.reconcileCustomerIdentities(rawMachines, rawCustomers);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MACHINES, safeJsonStringify(recCust.machines));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, safeJsonStringify(recCust.customers));
    }

    const rawSessions = StorageService.getMhcSessions(false);
    const recSessions = reconcileMhcSessionIdentities(rawSessions, recCust.machines);
    if (recSessions.modified && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MHC_SESSIONS, safeJsonStringify(recSessions.sessions));
    }
  } catch (err: any) {
    console.warn('[BackupEngine] Post-restore identity reconciliation warning:', err);
  }

  // 7. RELOAD APPLICATION
  if (!options?.skipReload && typeof window !== 'undefined' && typeof window.location?.reload === 'function') {
    window.location.reload();
  }

  return {
    success: true,
    safetyBackupFilename: safetyFilename,
    restoredImageCount
  };
}
