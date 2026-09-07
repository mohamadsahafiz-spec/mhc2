import React, { useMemo, useState, useRef } from 'react';
import {
  RefreshCw,
  User,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Image as ImageIcon,
  Package,
  Layers,
  Search,
  Filter,
  Copy,
  FileText,
  Database,
  BarChart3,
  HardDrive,
  Trash2
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { getAuthoritativeChangelog } from '../../utils/changelogParser';
import {
  exportFullBackup,
  exportCompleteArchive,
  validateCompleteBackup,
  restoreCompleteBackup
} from '../../utils/backupEngine';
import {
  ImageStore,
  ImageContaminationAuditResult,
  ImageCleanupResult
} from '../../utils/imageStore';
import {
  auditMediaEvidence,
  formatBytes,
  ALL_MEDIA_CATEGORIES,
  cleanupOrphanedMedia
} from '../../utils/mediaEvidenceAudit';
import {
  MediaEvidenceAuditReport,
  MediaEvidenceCategory,
  OrphanedMediaCleanupResult
} from '../../types/mediaAudit';
import { FSOSCompleteBackupValidationResult } from '../../types/backup';

interface SettingsProps {
  onResetData: () => void;
}

export const SettingsModule: React.FC<SettingsProps> = ({ onResetData }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const changelog = useMemo(() => getAuthoritativeChangelog(), []);

  // Backup & Restore State
  const coreFileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [exportingCore, setExportingCore] = useState(false);
  const [exportingComplete, setExportingComplete] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const [coreFileText, setCoreFileText] = useState<string>('');
  const [mediaFileText, setMediaFileText] = useState<string>('');
  const [selectedCoreFileName, setSelectedCoreFileName] = useState<string>('');
  const [selectedMediaFileName, setSelectedMediaFileName] = useState<string>('');

  const [validating, setValidating] = useState(false);
  const [completeValidation, setCompleteValidation] = useState<FSOSCompleteBackupValidationResult | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // IndexedDB Contamination Audit & Safe Cleanup State
  const [auditing, setAuditing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [auditResult, setAuditResult] = useState<ImageContaminationAuditResult | null>(null);
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);

  // P1.3.5 Forensic Media Evidence Size & Provenance Audit State
  const [forensicReport, setForensicReport] = useState<MediaEvidenceAuditReport | null>(null);
  const [forensicSearch, setForensicSearch] = useState<string>('');
  const [forensicCategoryFilter, setForensicCategoryFilter] = useState<string>('ALL');
  const [forensicStatusFilter, setForensicStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ORPHANED' | 'DUPLICATE'>('ALL');
  const [activeForensicTab, setActiveForensicTab] = useState<'summary' | 'categories' | 'references' | 'duplicates' | 'consumers'>('summary');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // P1.3.7 Safe Orphaned Media Reconciliation & Cleanup State
  const [cleaningOrphans, setCleaningOrphans] = useState(false);
  const [orphansCleanupResult, setOrphansCleanupResult] = useState<OrphanedMediaCleanupResult | null>(null);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAuditImages = async () => {
    try {
      setAuditing(true);
      setCleanupStatus(null);
      const [malformedRes, forensicRes] = await Promise.all([
        ImageStore.auditMalformedImages(),
        auditMediaEvidence()
      ]);
      setAuditResult(malformedRes);
      setForensicReport(forensicRes);
    } catch (err: any) {
      console.error('[SettingsModule] Image audit error:', err);
    } finally {
      setAuditing(false);
    }
  };

  const handleCleanupOrphanedMedia = async () => {
    if (!forensicReport || forensicReport.summary.orphanedRecords === 0) return;

    const orphanedCount = forensicReport.summary.orphanedRecords;
    const reclaimableBytes = forensicReport.entries
      .filter((e) => e.isOrphaned)
      .reduce((acc, e) => acc + e.byteSize, 0);

    const confirmed = window.confirm(
      `Permanently remove ${orphanedCount} confirmed orphaned media entries (${formatBytes(reclaimableBytes)}) from IndexedDB?\n\n` +
      `Safety Guarantee:\n` +
      `• ONLY media not referenced by current FSOS Core Data will be removed.\n` +
      `• All active machine passports, MHC sessions (including completed historical sessions), beam profiles, reports, and templates are strictly preserved.\n\n` +
      `Proceed with safe orphaned media cleanup?`
    );
    if (!confirmed) return;

    try {
      setCleaningOrphans(true);
      setOrphansCleanupResult(null);
      const result = await cleanupOrphanedMedia();
      setOrphansCleanupResult(result);

      // Re-run audits automatically to refresh live UI
      const [malformedRes, forensicRes] = await Promise.all([
        ImageStore.auditMalformedImages(),
        auditMediaEvidence()
      ]);
      setAuditResult(malformedRes);
      setForensicReport(forensicRes);
    } catch (err: any) {
      console.error('[SettingsModule] Orphan cleanup error:', err);
      alert(`Orphan cleanup error: ${err?.message || err}`);
    } finally {
      setCleaningOrphans(false);
    }
  };

  const handleCleanupImages = async () => {
    if (!auditResult || auditResult.malformed === 0) return;
    const confirmed = window.confirm(
      `Remove ${auditResult.malformed} confirmed React-derived internal artifact entries from IndexedDB?\n\nThis strictly preserves all ${auditResult.legitimate} legitimate engineering photos, beam profiles, and evidence images.`
    );
    if (!confirmed) return;

    try {
      setCleaning(true);
      const res = await ImageStore.cleanupMalformedReactDerivedImages();
      setCleanupStatus(`Successfully removed ${res.removed} React-derived entries. ${res.skipped} legitimate images preserved.`);
      // Re-run audit to refresh stats
      const nextAudit = await ImageStore.auditMalformedImages();
      setAuditResult(nextAudit);
    } catch (err: any) {
      console.error('[SettingsModule] Image cleanup error:', err);
      alert(`Cleanup error: ${err?.message || err}`);
    } finally {
      setCleaning(false);
    }
  };

  // Re-run validation whenever core or media file text changes
  const runValidation = (coreText: string, mediaText: string) => {
    if (!coreText || coreText.trim() === '') {
      setCompleteValidation(null);
      return;
    }
    const result = validateCompleteBackup(coreText, mediaText || undefined);
    setCompleteValidation(result);
  };

  const handleExportCoreBackup = () => {
    try {
      setExportingCore(true);
      setExportSuccess(null);
      const { filename } = exportFullBackup();
      setExportSuccess(`Core Data Backup downloaded: ${filename}`);
      setTimeout(() => setExportSuccess(null), 7000);
    } catch (err: any) {
      console.error('[SettingsModule] Core export error:', err);
      alert(`Core export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setExportingCore(false);
    }
  };

  const handleExportCompleteArchive = async () => {
    try {
      setExportingComplete(true);
      setExportSuccess(null);
      const res = await exportCompleteArchive();
      setExportSuccess(
        `Complete Archive exported (${res.imageCount} images, Backup ID: ${res.backupId.slice(0, 18)}...): ${res.coreFilename} and ${res.mediaFilename}`
      );
      setTimeout(() => setExportSuccess(null), 8000);
    } catch (err: any) {
      console.error('[SettingsModule] Complete archive export error:', err);
      alert(`Complete archive export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setExportingComplete(false);
    }
  };

  const handleCoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedCoreFileName(file.name);
    setValidating(true);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setCoreFileText(text);
        runValidation(text, mediaFileText);
        setShowPreviewModal(true);
      } catch (err: any) {
        console.error('[SettingsModule] Core file load error:', err);
      } finally {
        setValidating(false);
        if (coreFileInputRef.current) {
          coreFileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setValidating(false);
      alert('Failed to read selected core backup file.');
      if (coreFileInputRef.current) {
        coreFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedMediaFileName(file.name);
    setValidating(true);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setMediaFileText(text);
        runValidation(coreFileText, text);
      } catch (err: any) {
        console.error('[SettingsModule] Media file load error:', err);
      } finally {
        setValidating(false);
        if (mediaFileInputRef.current) {
          mediaFileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setValidating(false);
      alert('Failed to read selected media backup file.');
      if (mediaFileInputRef.current) {
        mediaFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveMediaFile = () => {
    setMediaFileText('');
    setSelectedMediaFileName('');
    runValidation(coreFileText, '');
  };

  const handleConfirmRestore = async () => {
    if (!completeValidation?.coreValidation?.envelope) return;

    try {
      setRestoring(true);
      setRestoreError(null);

      const res = await restoreCompleteBackup(
        completeValidation.coreValidation.envelope,
        completeValidation.mediaValidation?.envelope
      );

      if (!res.success) {
        setRestoreError(res.error || 'Restore failed.');
        setRestoring(false);
      }
      // If successful, restoreCompleteBackup reloads window automatically
    } catch (err: any) {
      console.error('[SettingsModule] Complete restore error:', err);
      setRestoreError(`Restore failed: ${err?.message || 'Unknown error'}`);
      setRestoring(false);
    }
  };

  const renderFormattedLine = (line: string) => {
    const isSubItem = line.startsWith('  - ') || line.startsWith('    - ');
    const cleanLine = line.replace(/^\s*[-*]\s+/, '');
    const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

    return (
      <span className={`inline leading-relaxed ${isSubItem ? 'pl-2 block text-slate-400/90' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={i} className={`px-1 py-0.5 rounded font-mono text-[11px] ${isDark ? 'bg-slate-800 text-sky-300' : 'bg-slate-200 text-sky-800'}`}>
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={i} className={`italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {part.slice(1, -1)}
              </em>
            );
          }
          return part;
        })}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Full System Backup & Restore */}
      <Card
        title="Full System Backup & Complete Archive Restore"
        subtitle="Disaster recovery, media evidence preservation, and device migration for FSOS operational data"
      >
        <div className="space-y-4 text-xs">
          {/* Action Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
              isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-sky-400 mb-1">
                  <Package className="w-4 h-4" />
                  <span>Export Backup & Complete Archive</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Export FSOS core operational data or a Complete Archive containing both Core Data and Media Evidence (photos & attachments) sharing a verified paired Backup ID.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-sky-400/90 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Non-destructive, zero-mutation read-only export.</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/40 flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={exportingCore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  onClick={handleExportCoreBackup}
                  disabled={exportingCore || exportingComplete}
                >
                  {exportingCore ? 'Exporting...' : 'Export Core Backup'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={exportingComplete ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  onClick={handleExportCompleteArchive}
                  disabled={exportingCore || exportingComplete}
                >
                  {exportingComplete ? 'Exporting Archive...' : 'Export Complete Archive'}
                </Button>
              </div>
            </div>

            {/* Restore Card */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
              isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400 mb-1">
                  <Upload className="w-4 h-4" />
                  <span>Restore Backup & Complete Archive</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Restores an FSOS core backup or a paired Complete Archive. Validates schema, domain record counts, and media backup IDs before applying a non-destructive restore.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Automatic pre-restore safety snapshot included.</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <input
                  type="file"
                  ref={coreFileInputRef}
                  onChange={handleCoreFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={mediaFileInputRef}
                  onChange={handleMediaFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <span className="text-[11px] text-slate-500 font-mono">Safe Snapshot Replace</span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  onClick={() => coreFileInputRef.current?.click()}
                  disabled={validating}
                >
                  {validating ? 'Validating...' : 'Select Backup JSON'}
                </Button>
              </div>
            </div>
          </div>

          {/* Export Success Toast */}
          {exportSuccess && (
            <div className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-mono ${
              isDark ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{exportSuccess}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Restore Validation & Confirmation Modal */}
      {showPreviewModal && completeValidation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-6 space-y-5 my-8 ${
            isDark ? 'bg-[#181B1F] border-[#2E353F] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-700/60 pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-sky-400" />
                  <span>Restore Archive Preview</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Core File: <span className="font-mono font-semibold text-slate-300">{selectedCoreFileName}</span>
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                disabled={restoring}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Media Attachment Selector in Modal */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
              isDark ? 'bg-[#14171A] border-[#252B33]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Media Evidence Pack (Optional)</span>
                </span>
                {selectedMediaFileName ? (
                  <button
                    onClick={handleRemoveMediaFile}
                    className="text-[11px] text-rose-400 hover:underline font-mono"
                  >
                    Remove Media File
                  </button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Upload className="w-3 h-3" />}
                    onClick={() => mediaFileInputRef.current?.click()}
                  >
                    Attach Media JSON
                  </Button>
                )}
              </div>

              {selectedMediaFileName ? (
                <div className="flex items-center justify-between font-mono text-[11px] bg-sky-950/30 border border-sky-800/40 p-2 rounded-lg text-sky-300">
                  <span>Attached: {selectedMediaFileName}</span>
                  <span>{completeValidation.mediaValidation?.imageCount || 0} images</span>
                </div>
              ) : (
                <p className="text-slate-400 text-[11px]">
                  No media pack attached. Restoration will proceed with <strong>Core Data only</strong>. Existing images on this device will remain preserved.
                </p>
              )}
            </div>

            {/* Validation State Banner */}
            {completeValidation.valid ? (
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold">
                    {completeValidation.hasMedia ? 'Complete Archive Verification Passed' : 'Core Backup Verification Passed'}
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {completeValidation.hasMedia
                      ? `Core schema and media evidence dictionary are valid and share matching Backup ID (${completeValidation.coreValidation.manifest?.backupId}).`
                      : 'The envelope structure, schema version, and operational domain records are valid and ready for restoration.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-rose-950/40 border-rose-800/60 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <XCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold">Archive Verification Failed</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {completeValidation.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Manifest Metadata */}
            {completeValidation.coreValidation.manifest && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isDark ? 'bg-[#121417] border-[#252B33]' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Backup Metadata</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Backup Version:</span>
                    <span className="text-sky-400 font-bold">{completeValidation.coreValidation.manifest.backupVersion}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">App Version:</span>
                    <span className="text-slate-300 font-bold">{completeValidation.coreValidation.manifest.appVersion || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Media Attached:</span>
                    <span className={completeValidation.hasMedia ? 'text-emerald-400 font-bold' : 'text-slate-400 font-bold'}>
                      {completeValidation.hasMedia ? `Yes (${completeValidation.mediaValidation?.imageCount} imgs)` : 'No (Core Only)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Backup ID Match:</span>
                    <span className={completeValidation.backupIdMatch ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {completeValidation.backupIdMatch ? 'Verified ✓' : 'Mismatch ✕'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Created At (UTC):</span>
                    <span className="text-slate-300">{completeValidation.coreValidation.manifest.createdAt}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Shared Backup ID:</span>
                    <span className="text-slate-400 truncate block">{completeValidation.coreValidation.manifest.backupId}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Domain Counts Grid */}
            <div className="space-y-2">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-400">Domain Record Counts</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {Object.entries(completeValidation.coreValidation.domainCounts).map(([domain, count]) => (
                  <div
                    key={domain}
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      isDark ? 'bg-[#14171A] border-[#252B33]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-slate-400 capitalize text-[11px] truncate">{domain.replace(/_/g, ' ')}</span>
                    <span className={`font-bold ${(Number(count) || 0) > 0 ? 'text-sky-400' : 'text-slate-600'}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings & Notices */}
            <div className="space-y-2 text-xs">
              <div className={`p-3 rounded-lg border text-[11px] leading-relaxed space-y-1.5 ${
                isDark ? 'bg-[#14171A] border-[#252B33] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <p className="text-slate-300">
                  <strong className="text-sky-400">Media Policy:</strong>{' '}
                  {completeValidation.hasMedia
                    ? 'Media images will be non-destructively restored into IndexedDB using their exact original keys. Existing images on this device will not be deleted.'
                    : 'Core Data only. Existing IndexedDB images will remain untouched on this device.'}
                </p>
                <p className="text-amber-400/90 font-medium">
                  <strong className="text-amber-300">Replacement Notice:</strong> Restoring this backup will replace current core FSOS data on this device. An automatic safety snapshot of your current core data will be downloaded before restoration begins.
                </p>
              </div>

              {completeValidation.warnings.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-800/40 bg-amber-950/20 text-amber-300 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Non-Fatal Warnings:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 opacity-90">
                    {completeValidation.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {restoreError && (
                <div className="p-3 rounded-lg border border-rose-800/60 bg-rose-950/40 text-rose-300 text-xs">
                  <p className="font-bold">Restore Failed:</p>
                  <p className="mt-0.5">{restoreError}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/60">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
                disabled={restoring}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                onClick={handleConfirmRestore}
                disabled={!completeValidation.valid || restoring}
              >
                {restoring ? 'Restoring Archive...' : 'Confirm & Restore Archive'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Evidence Diagnostics & Contamination Purge */}
      <Card
        title="Media Evidence Diagnostics & Storage Guard"
        subtitle="Forensic size, provenance, active/orphaned reference audit and safe IndexedDB storage guard"
      >
        <div className="space-y-4 text-xs">
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-sky-400">
                <HardDrive className="w-4 h-4" />
                <span>IndexedDB Evidence Forensic Audit & Storage Guard</span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-xl">
                Executes a strict <strong>read-only</strong> forensic scan across all IndexedDB media evidence entries to analyze exact UTF-8 byte volumes, category provenance, active vs. orphaned Core Data references, and duplicate payload groups.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                icon={auditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                onClick={handleAuditImages}
                disabled={auditing || cleaning}
              >
                {auditing ? 'Running Forensic Scan...' : 'Audit Media Store'}
              </Button>
            </div>
          </div>

          {/* Post-Cleanup Status Banner */}
          {orphansCleanupResult && (
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isDark ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Orphaned Media Cleanup Completed Successfully</span>
                </div>
                <div className="text-slate-300 text-xs font-mono flex flex-wrap items-center gap-3 pt-0.5">
                  <span>Removed: <strong className="text-emerald-400">{orphansCleanupResult.removedCount}</strong> records</span>
                  <span>•</span>
                  <span>Reclaimed: <strong className="text-emerald-400">{formatBytes(orphansCleanupResult.reclaimedBytes)}</strong></span>
                  <span>•</span>
                  <span>Remaining Stored: <strong className="text-sky-400">{orphansCleanupResult.remainingIndexedDbEntries}</strong> records</span>
                  <span>•</span>
                  <span>Remaining Orphans: <strong className={orphansCleanupResult.remainingOrphanCount === 0 ? 'text-emerald-400' : 'text-amber-400'}>{orphansCleanupResult.remainingOrphanCount}</strong></span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOrphansCleanupResult(null)}
                className="self-end md:self-center text-slate-400 hover:text-slate-200"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Forensic Audit Report UI */}
          {forensicReport && (
            <div className="space-y-4">
              {/* Navigation Sub-Tabs */}
              <div className="flex items-center gap-1 border-b border-[#2B323A] pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveForensicTab('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeForensicTab === 'summary'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Media Store Summary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveForensicTab('categories')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeForensicTab === 'categories'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Category Breakdown ({forensicReport.categories.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveForensicTab('references')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeForensicTab === 'references'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Active vs Orphaned ({forensicReport.summary.orphanedRecords} orphans)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveForensicTab('duplicates')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeForensicTab === 'duplicates'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate Payloads ({forensicReport.duplicates.length} groups)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveForensicTab('consumers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeForensicTab === 'consumers'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Top Storage Consumers ({forensicReport.topConsumers.length})</span>
                </button>
              </div>

              {/* TAB 1: MEDIA STORE SUMMARY */}
              {activeForensicTab === 'summary' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-[11px]">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-[10px]">Total Stored Records</div>
                      <div className="font-bold text-sky-400 text-lg mt-0.5">{forensicReport.summary.totalRecords}</div>
                      <div className="text-slate-500 text-[9px] mt-0.5">Physical IndexedDB entries</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-[10px]">Total Storage Volume</div>
                      <div className="font-bold text-indigo-400 text-lg mt-0.5">{formatBytes(forensicReport.summary.totalStorageBytes)}</div>
                      <div className="text-slate-500 text-[9px] mt-0.5">{forensicReport.summary.totalStorageBytes.toLocaleString()} UTF-8 bytes</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-[10px]">Active Referenced</div>
                      <div className="font-bold text-emerald-400 text-lg mt-0.5">{forensicReport.summary.activeReferencedRecords}</div>
                      <div className="text-slate-500 text-[9px] mt-0.5">Linked to live Core Data</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-[10px]">Orphaned / Unreferenced</div>
                      <div className={`font-bold text-lg mt-0.5 ${forensicReport.summary.orphanedRecords > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {forensicReport.summary.orphanedRecords}
                      </div>
                      <div className="text-slate-500 text-[9px] mt-0.5">No active Core reference</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-[11px]">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-[10px]">Unique Payload Count</div>
                      <div className="font-bold text-sky-300 text-base mt-0.5">{forensicReport.summary.uniquePayloadCount}</div>
                      <div className="text-slate-500 text-[9px] mt-0.5">Distinct visual payloads</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-[10px]">Duplicate Payload Entries</div>
                      <div className={`font-bold text-base mt-0.5 ${forensicReport.summary.duplicateRecords > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                        {forensicReport.summary.duplicateRecords} ({forensicReport.summary.duplicateGroupsCount} groups)
                      </div>
                      <div className="text-slate-500 text-[9px] mt-0.5">Identical content under different keys</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-slate-400 text-[10px]">Duplicate Storage Overhead</div>
                      <div className={`font-bold text-base mt-0.5 ${forensicReport.summary.potentialDuplicateSavingsBytes > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {formatBytes(forensicReport.summary.potentialDuplicateSavingsBytes)}
                      </div>
                      <div className="text-slate-500 text-[9px] mt-0.5">Potential deduplication savings</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CATEGORY STORAGE BREAKDOWN */}
              {activeForensicTab === 'categories' && (
                <div className="space-y-3">
                  <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <div className="p-3 border-b border-[#2B323A]/60 flex items-center justify-between">
                      <span className="font-bold text-xs">Deterministic Category Storage Distribution</span>
                      <span className="font-mono text-[11px] text-slate-400">Total: {formatBytes(forensicReport.summary.totalStorageBytes)}</span>
                    </div>
                    <div className="divide-y divide-[#2B323A]/40 font-mono text-[11px]">
                      {forensicReport.categories.map((cat) => (
                        <div key={cat.category} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="space-y-1 min-w-[200px]">
                            <div className="font-sans font-bold text-xs text-slate-200 flex items-center gap-2">
                              <span>{cat.category}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                                {cat.count} {cat.count === 1 ? 'entry' : 'entries'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden max-w-xs">
                              <div
                                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(cat.percentageOfTotal, cat.count > 0 ? 1 : 0)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <div className="text-slate-200 font-bold">{formatBytes(cat.totalBytes)}</div>
                              <div className="text-slate-400 text-[10px]">{cat.percentageOfTotal.toFixed(1)}% of total</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIVE VS ORPHANED */}
              {activeForensicTab === 'references' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 font-sans">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Active Reachable References ({forensicReport.summary.activeReferencedRecords})</span>
                      </div>
                      <p className="text-slate-400 text-xs font-sans leading-relaxed">
                        These {forensicReport.summary.activeReferencedRecords} entries are physically referenced by existing Machines, MHC Sessions, Reports, Templates, or Engineer Profiles in active Core Data.
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl border space-y-2 ${
                      forensicReport.summary.orphanedRecords > 0
                        ? isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'
                        : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-xs text-amber-400 font-sans">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Orphaned Entries ({forensicReport.summary.orphanedRecords})</span>
                      </div>
                      <p className="text-slate-400 text-xs font-sans leading-relaxed">
                        These {forensicReport.summary.orphanedRecords} entries exist in IndexedDB but have no matching reference in current active Core Data.
                      </p>
                    </div>
                  </div>

                  {/* P1.3.7 Safe Orphaned Media Reconciliation & Cleanup Action Box */}
                  {forensicReport.summary.orphanedRecords > 0 && (
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      isDark ? 'bg-[#1C2026] border-amber-500/40' : 'bg-amber-50/80 border-amber-300'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-amber-400" />
                            <span className="font-bold text-xs text-amber-300">
                              Safe Orphaned Media Reconciliation & Cleanup
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed font-sans">
                            <strong>Explicit Rule:</strong> Only media not referenced by current FSOS Core Data will be removed.
                          </p>
                          <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
                            All active machine passports, MHC sessions (including completed historical sessions), beam profiles, reports, and templates are strictly protected.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={auditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            onClick={handleAuditImages}
                            disabled={auditing || cleaningOrphans}
                          >
                            Preview / Re-run Audit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={cleaningOrphans ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            onClick={handleCleanupOrphanedMedia}
                            disabled={cleaningOrphans || auditing}
                          >
                            {cleaningOrphans ? 'Purging Orphans...' : `Clean Orphaned Media (${forensicReport.summary.orphanedRecords})`}
                          </Button>
                        </div>
                      </div>

                      {/* Orphan Metrics & Category Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#2B323A]/60 font-mono text-[11px]">
                        <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="text-slate-400 text-[10px]">Orphan Candidates</div>
                          <div className="font-bold text-amber-400 text-sm mt-0.5">{forensicReport.summary.orphanedRecords} records</div>
                        </div>
                        <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="text-slate-400 text-[10px]">Reclaimable Storage</div>
                          <div className="font-bold text-amber-400 text-sm mt-0.5">
                            {formatBytes(
                              forensicReport.entries
                                .filter((e) => e.isOrphaned)
                                .reduce((acc, e) => acc + e.byteSize, 0)
                            )}
                          </div>
                        </div>
                        <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="text-slate-400 text-[10px]">Active Media Preserved</div>
                          <div className="font-bold text-emerald-400 text-sm mt-0.5">{forensicReport.summary.activeReferencedRecords} records</div>
                        </div>
                        <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="text-slate-400 text-[10px]">Total Stored Entries</div>
                          <div className="font-bold text-sky-400 text-sm mt-0.5">{forensicReport.summary.totalRecords} records</div>
                        </div>
                      </div>

                      {/* Orphan Candidates List */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] uppercase font-sans tracking-wider text-slate-400 font-bold">
                          Orphan Candidates Ready for Reconciliation:
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[10px] text-amber-300/90 divide-y divide-[#2B323A]/30">
                          {forensicReport.entries
                            .filter((e) => e.isOrphaned)
                            .map((e) => (
                              <div key={e.key} className="pt-1.5 pb-1 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 truncate min-w-0">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 text-[9px] shrink-0 font-sans">
                                    {e.category}
                                  </span>
                                  <span className="truncate text-slate-300">{e.key}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-slate-400">{formatBytes(e.byteSize)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyKey(e.key)}
                                    className="text-slate-500 hover:text-slate-300"
                                    title="Copy key"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Missing Referenced Keys Warning */}
                  {forensicReport.missingReferencedKeys.length > 0 && (
                    <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50 border-rose-200'}`}>
                      <div className="flex items-center gap-2 font-bold text-xs text-rose-400 font-sans">
                        <XCircle className="w-4 h-4" />
                        <span>Missing Referenced Keys Detected ({forensicReport.missingReferencedKeys.length})</span>
                      </div>
                      <p className="text-slate-400 text-xs font-sans">
                        Core Data references these `idb:` keys, but their payloads were not found in IndexedDB:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[10px] text-rose-300">
                        {forensicReport.missingReferencedKeys.map((k) => (
                          <div key={k} className="p-1.5 rounded bg-rose-950/40 border border-rose-900/50">
                            {k}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DUPLICATE PAYLOAD ANALYSIS */}
              {activeForensicTab === 'duplicates' && (
                <div className="space-y-3">
                  <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <div className="p-3 border-b border-[#2B323A]/60 flex items-center justify-between">
                      <span className="font-bold text-xs">Identical Payload Groups ({forensicReport.duplicates.length} groups)</span>
                      <span className="font-mono text-[11px] text-amber-400">
                        Total Wasted Storage: {formatBytes(forensicReport.summary.potentialDuplicateSavingsBytes)}
                      </span>
                    </div>

                    {forensicReport.duplicates.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                        <div>No duplicate payloads detected. All stored image contents are unique.</div>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#2B323A]/40 font-mono text-[11px] max-h-96 overflow-y-auto">
                        {forensicReport.duplicates.map((dup) => (
                          <div key={dup.groupId} className="p-3 space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                                  {dup.groupId}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                                  {dup.payloadType}
                                </span>
                                <span className="text-slate-300 font-bold">{dup.count} references</span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 text-[10px]">Single: {formatBytes(dup.byteSizePerEntry)} | </span>
                                <span className="text-slate-300 font-bold">Total: {formatBytes(dup.totalBytes)} | </span>
                                <span className="text-amber-400 font-bold">Duplicate Overhead: {formatBytes(dup.wastedBytes)}</span>
                              </div>
                            </div>
                            <div className="space-y-1 text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-[#2B323A]/40">
                              <div className="text-slate-500 font-sans text-[9px] uppercase tracking-wider">Referencing Keys:</div>
                              {dup.keys.map((k) => (
                                <div key={k} className="flex items-center justify-between gap-2 truncate">
                                  <span className="truncate text-slate-300">{k}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyKey(k)}
                                    className="text-slate-500 hover:text-slate-300 shrink-0"
                                    title="Copy key"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: TOP STORAGE CONSUMERS & INVENTORY */}
              {activeForensicTab === 'consumers' && (
                <div className="space-y-3">
                  {/* Search and Filters */}
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by key, record ID, or source..."
                        value={forensicSearch}
                        onChange={(e) => setForensicSearch(e.target.value)}
                        className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs ${
                          isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={forensicCategoryFilter}
                        onChange={(e) => setForensicCategoryFilter(e.target.value)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs ${
                          isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="ALL">All Categories</option>
                        {ALL_MEDIA_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <select
                        value={forensicStatusFilter}
                        onChange={(e) => setForensicStatusFilter(e.target.value as any)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs ${
                          isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="ORPHANED">Orphaned Only</option>
                        <option value="DUPLICATE">Duplicates Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Ranked Consumers List */}
                  <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <div className="p-3 border-b border-[#2B323A]/60 flex items-center justify-between">
                      <span className="font-bold text-xs">Media Storage Consumer Inventory</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        Showing filtered entries (Ranked by size descending)
                      </span>
                    </div>

                    <div className="divide-y divide-[#2B323A]/40 font-mono text-[11px] max-h-96 overflow-y-auto">
                      {forensicReport.topConsumers
                        .filter((entry) => {
                          if (forensicCategoryFilter !== 'ALL' && entry.category !== forensicCategoryFilter) return false;
                          if (forensicStatusFilter === 'ACTIVE' && !entry.isReferenced) return false;
                          if (forensicStatusFilter === 'ORPHANED' && !entry.isOrphaned) return false;
                          if (forensicStatusFilter === 'DUPLICATE' && !entry.isDuplicate) return false;
                          if (forensicSearch.trim()) {
                            const q = forensicSearch.toLowerCase();
                            return (
                              entry.key.toLowerCase().includes(q) ||
                              entry.category.toLowerCase().includes(q) ||
                              entry.sourceClassification.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        })
                        .map((entry, idx) => (
                          <div key={entry.key} className="p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-500 text-[10px]">#{idx + 1}</span>
                                <span className="font-semibold text-slate-200 truncate">{entry.key}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(entry.key)}
                                  className="text-slate-500 hover:text-slate-300"
                                  title="Copy key"
                                >
                                  {copiedKey === entry.key ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-sky-400">{entry.category}</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">{entry.payloadType}</span>
                                <span className="text-slate-500 truncate">{entry.sourceClassification}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {entry.isReferenced ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-medium font-sans">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-medium font-sans">
                                  Orphaned
                                </span>
                              )}
                              {entry.isDuplicate && (
                                <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 text-[10px] font-medium font-sans">
                                  Duplicate ({entry.duplicateCount}x)
                                </span>
                              )}
                              <div className="text-right min-w-[70px]">
                                <div className="font-bold text-slate-200">{formatBytes(entry.byteSize)}</div>
                                <div className="text-slate-500 text-[9px]">{entry.charLength.toLocaleString()} chars</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing P1.3.4 Contamination Audit & Safe Cleanup Guard */}
          {auditResult && auditResult.malformed > 0 && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300">
                    Contamination Detected: {auditResult.malformed} React-derived entries found
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">Total Records: {auditResult.total}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-mono text-[11px]">
                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-slate-400 text-[10px]">Legitimate Evidence</div>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">{auditResult.legitimate}</div>
                </div>
                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-slate-400 text-[10px]">React Fiber Artifacts</div>
                  <div className="font-bold text-sm mt-0.5 text-amber-400">
                    {auditResult.malformed}
                  </div>
                </div>
                <div className={`col-span-2 md:col-span-1 p-2.5 rounded-lg border flex items-center justify-center ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={cleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    onClick={handleCleanupImages}
                    disabled={cleaning}
                  >
                    {cleaning ? 'Purging Artifacts...' : 'Purge React Artifacts'}
                  </Button>
                </div>
              </div>

              {cleanupStatus && (
                <div className={`p-2.5 rounded-lg border flex items-center gap-2 text-[11px] font-mono ${
                  isDark ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>{cleanupStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Structured Changelog */}
      <Card
        title="Authoritative Engineering Milestone Changelog"
        subtitle={`Derived directly from single source of truth CHANGELOG.md (${changelog.length} milestone releases)`}
      >
        <div className="space-y-4">
          {changelog.map((entry) => (
            <div
              key={entry.version}
              className={`p-4 rounded-xl border text-xs space-y-3 ${
                isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#2B323A]/60 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#8B9DFF]">{entry.version}</span>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{entry.title}</span>
                </div>
                {entry.date && <span className="font-mono text-slate-400 whitespace-nowrap">{entry.date}</span>}
              </div>

              <div className="space-y-2.5">
                {entry.sections.map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-1.5">
                    {sec.heading && (
                      <h4 className="font-bold text-[11px] uppercase tracking-wider text-sky-400/90 pt-1">
                        {sec.heading}
                      </h4>
                    )}
                    <ul className="space-y-1 list-disc pl-4 text-slate-400">
                      {sec.items.map((item, iIdx) => (
                        <li key={iIdx}>
                          {renderFormattedLine(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* System Data & Workspace Management */}
      <Card title="System Data & Workspace Management">
        <div className="space-y-4 text-xs">
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <p className="font-bold text-sm text-[#E98A8A]">Reset Local Workspace State</p>
              <p className="text-slate-400 mt-0.5">Restores default contracts, machines, schedule, tasks, and MHC audit records.</p>
            </div>
            <Button variant="danger" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onResetData}>
              Reset State
            </Button>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#141618] border-[#2B323A] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs text-[#8B9DFF] mb-1">
              <User className="w-4 h-4" />
              <span>Engineer Profile Governance</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Personal identity details, avatar photo management, contact preferences, and certifications have been centralized under <strong>My Profile</strong> in accordance with FSOS Identity Standard v0.7.5.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
