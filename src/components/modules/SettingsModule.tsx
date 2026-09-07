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
  Layers
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
