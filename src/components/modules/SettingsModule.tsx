import React, { useMemo, useState, useRef } from 'react';
import { RefreshCw, User, Download, Upload, ShieldCheck, AlertTriangle, FileJson, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { getAuthoritativeChangelog } from '../../utils/changelogParser';
import { exportFullBackup, validateBackup, restoreFullBackup } from '../../utils/backupEngine';
import { FSOSBackupValidationResult } from '../../types/backup';

interface SettingsProps {
  onResetData: () => void;
}

export const SettingsModule: React.FC<SettingsProps> = ({ onResetData }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const changelog = useMemo(() => getAuthoritativeChangelog(), []);

  // Backup & Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<FSOSBackupValidationResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleExportBackup = () => {
    try {
      setExporting(true);
      setExportSuccess(null);
      const { filename } = exportFullBackup();
      setExportSuccess(`Full backup downloaded: ${filename}`);
      setTimeout(() => setExportSuccess(null), 6000);
    } catch (err: any) {
      console.error('[SettingsModule] Export error:', err);
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setValidating(true);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = validateBackup(text);
        setValidationResult(result);
        setShowPreviewModal(true);
      } catch (err: any) {
        setValidationResult({
          valid: false,
          domainCounts: {},
          warnings: [],
          errors: [`Failed to parse file: ${err?.message || 'Unknown error'}`]
        });
        setShowPreviewModal(true);
      } finally {
        setValidating(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setValidationResult({
        valid: false,
        domainCounts: {},
        warnings: [],
        errors: ['Failed to read selected file.']
      });
      setValidating(false);
      setShowPreviewModal(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!validationResult?.envelope) return;

    try {
      setRestoring(true);
      setRestoreError(null);

      const res = await restoreFullBackup(validationResult.envelope);
      if (!res.success) {
        setRestoreError(res.error || 'Restore failed.');
        setRestoring(false);
      }
      // If successful, restoreFullBackup reloads window automatically
    } catch (err: any) {
      console.error('[SettingsModule] Restore error:', err);
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
        title="Full System Backup & Restore"
        subtitle="Disaster recovery and device migration for FSOS operational core data"
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
                  <Download className="w-4 h-4" />
                  <span>Full Core Data Backup</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Backs up FSOS core operational data including Machine Passport, engineering records, customers, contracts, schedules, MHC sessions, reports, and system configurations.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-400/90 font-mono">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Images and raw temperature data are not included yet.</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">Schema v1.0.0</span>
                <Button
                  variant="primary"
                  size="sm"
                  icon={exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  onClick={handleExportBackup}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting...' : 'Export Full Backup'}
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
                  <span>Restore Full Backup</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Restores a previously exported FSOS core backup via safe Snapshot Replace. Validates structure, shows a full domain preview, and takes an automatic safety snapshot before mutation.
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Automatic pre-restore safety snapshot included.</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <span className="text-[11px] text-slate-500 font-mono">Snapshot Replace</span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={validating}
                >
                  {validating ? 'Validating...' : 'Select JSON File'}
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
      {showPreviewModal && validationResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-6 space-y-5 my-8 ${
            isDark ? 'bg-[#181B1F] border-[#2E353F] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-700/60 pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-sky-400" />
                  <span>Restore Backup Preview</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspecting file: <span className="font-mono font-semibold text-slate-300">{selectedFileName}</span>
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

            {/* Validation State Banner */}
            {validationResult.valid ? (
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold">Backup Verification Passed</p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    The envelope structure, schema version, and operational domain records are valid and ready for restoration.
                  </p>
                </div>
              </div>
            ) : (
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-rose-950/40 border-rose-800/60 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <XCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold">Backup Verification Failed</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {validationResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Manifest Metadata */}
            {validationResult.manifest && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isDark ? 'bg-[#121417] border-[#252B33]' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Backup Metadata</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Backup Version:</span>
                    <span className="text-sky-400 font-bold">{validationResult.manifest.backupVersion}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">App Version:</span>
                    <span className="text-slate-300 font-bold">{validationResult.manifest.appVersion || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Images Included:</span>
                    <span className="text-amber-400 font-bold">No</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Raw Temp Included:</span>
                    <span className="text-amber-400 font-bold">No</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Created At (UTC):</span>
                    <span className="text-slate-300">{validationResult.manifest.createdAt}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Backup ID:</span>
                    <span className="text-slate-400 truncate block">{validationResult.manifest.backupId}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Domain Counts Grid */}
            <div className="space-y-2">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-400">Domain Record Counts</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {Object.entries(validationResult.domainCounts).map(([domain, count]) => (
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
                  <strong className="text-sky-400">Core Data Only:</strong> This backup restores core FSOS data only. Image evidence and raw temperature IndexedDB data are not included in this backup.
                </p>
                <p className="text-amber-400/90 font-medium">
                  <strong className="text-amber-300">Replacement Notice:</strong> Restoring this backup will replace the current core FSOS data on this device. An automatic safety snapshot of your current data will be downloaded before restoration begins.
                </p>
              </div>

              {validationResult.warnings.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-800/40 bg-amber-950/20 text-amber-300 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Non-Fatal Warnings:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 opacity-90">
                    {validationResult.warnings.map((w, idx) => (
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
                disabled={!validationResult.valid || restoring}
              >
                {restoring ? 'Restoring Snapshot...' : 'Confirm & Restore Snapshot'}
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

