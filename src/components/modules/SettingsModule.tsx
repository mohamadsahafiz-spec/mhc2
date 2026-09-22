import React, { useMemo, useState, useRef } from 'react';
import {
  Palette,
  Globe,
  SlidersHorizontal,
  Database,
  HardDrive,
  Info,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  FileJson,
  Package,
  Layers,
  Search,
  Filter,
  Copy,
  FileText,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Clock,
  Cpu,
  History,
  Check,
  Zap,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ThemeThumbnail } from '../common/ThemeThumbnail';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { APP_VERSION, APP_BUILD_ID, APP_CODENAME } from '../../constants/version';
import { mechanicalPressConfig, motionTimings, motionEasings } from '../../theme/motion';
import { StorageService } from '../../utils/persistence';
import {
  exportFullBackup,
  exportCompleteArchive,
  exportPortableBackup,
  validateCompleteBackup,
  restoreCompleteBackup,
  validatePortableBackupArchive,
  restorePortableBackup
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
  MediaDeduplicationResult,
  OrphanedMediaCleanupResult
} from '../../types/mediaAudit';
import {
  FSOSCompleteBackupValidationResult,
  FSOSPortableBackupValidationResult
} from '../../types/backup';
import { NavigationTab, WorkspaceMode } from '../../types';

export type SettingsSection = 
  | 'appearance' 
  | 'regional' 
  | 'application' 
  | 'backup' 
  | 'maintenance' 
  | 'about';

interface SettingsModuleProps {
  onResetData: () => void;
  onNavigate?: (tab: NavigationTab) => void;
  initialSection?: SettingsSection;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ 
  onResetData, 
  onNavigate,
  initialSection = 'appearance' 
}) => {
  const { theme, setTheme, activeTheme, effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const prefersReducedMotion = Boolean(useReducedMotion());

  const THEME_OPTIONS = useMemo(() => [
    {
      id: 'precision' as const,
      name: 'Precision',
      category: 'Dark Baseline',
    },
    {
      id: 'lumen' as const,
      name: 'Lumen',
      category: 'Luminous Dark',
    },
    {
      id: 'aero' as const,
      name: 'Frutiger Aero',
      category: 'Aero Glass',
    },
  ], []);

  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  // Application Settings State
  const [workspaceMode, setWorkspaceModeState] = useState<WorkspaceMode>(() => {
    return StorageService.getWorkspaceMode() || 'MHC_MODE';
  });
  const [sidebarCollapsedDefault, setSidebarCollapsedDefault] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('fsos_sidebar_collapsed') === 'true';
    }
    return false;
  });

  // Backup & Restore State
  const coreFileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [exportingPortable, setExportingPortable] = useState(false);
  const [exportingCore, setExportingCore] = useState(false);
  const [exportingComplete, setExportingComplete] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [showLegacyExport, setShowLegacyExport] = useState(false);

  const [coreFileText, setCoreFileText] = useState<string>('');
  const [mediaFileText, setMediaFileText] = useState<string>('');
  const [selectedCoreFileName, setSelectedCoreFileName] = useState<string>('');
  const [selectedMediaFileName, setSelectedMediaFileName] = useState<string>('');

  const [selectedArchiveType, setSelectedArchiveType] = useState<'portable' | 'legacy'>('portable');
  const [portableZipBytes, setPortableZipBytes] = useState<Uint8Array | null>(null);
  const [portableValidation, setPortableValidation] = useState<FSOSPortableBackupValidationResult | null>(null);

  const [validating, setValidating] = useState(false);
  const [completeValidation, setCompleteValidation] = useState<FSOSCompleteBackupValidationResult | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Workspace Maintenance State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Advanced Storage Diagnostics State
  const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [auditResult, setAuditResult] = useState<ImageContaminationAuditResult | null>(null);
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);

  const [forensicReport, setForensicReport] = useState<MediaEvidenceAuditReport | null>(null);
  const [forensicSearch, setForensicSearch] = useState<string>('');
  const [forensicCategoryFilter, setForensicCategoryFilter] = useState<string>('ALL');
  const [forensicStatusFilter, setForensicStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ORPHANED' | 'DUPLICATE'>('ALL');
  const [activeForensicTab, setActiveForensicTab] = useState<'summary' | 'categories' | 'references' | 'duplicates' | 'consumers'>('summary');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [cleaningOrphans, setCleaningOrphans] = useState(false);
  const [orphansCleanupResult, setOrphansCleanupResult] = useState<OrphanedMediaCleanupResult | null>(null);

  const [deduplicating, setDeduplicating] = useState(false);
  const [deduplicationResult, setDeduplicationResult] = useState<MediaDeduplicationResult | null>(null);

  // Handlers for Application Settings
  const handleWorkspaceModeChange = (mode: WorkspaceMode) => {
    setWorkspaceModeState(mode);
    StorageService.saveWorkspaceMode(mode);
    const currentAuth = StorageService.getAuth();
    if (currentAuth) {
      StorageService.saveAuth({ ...currentAuth, workspaceMode: mode });
    }
  };

  const handleSidebarPrefToggle = () => {
    const next = !sidebarCollapsedDefault;
    setSidebarCollapsedDefault(next);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('fsos_sidebar_collapsed', String(next));
    }
  };

  // Handlers for Backup & Restore
  const runValidation = (coreText: string, mediaText: string) => {
    if (!coreText || coreText.trim() === '') {
      setCompleteValidation(null);
      return;
    }
    const result = validateCompleteBackup(coreText, mediaText || undefined);
    setCompleteValidation(result);
  };

  const handleExportPortableBackup = async () => {
    try {
      setExportingPortable(true);
      setExportSuccess(null);
      const res = await exportPortableBackup();
      setExportSuccess(
        `Portable Backup exported: ${res.filename} (${formatBytes(res.totalBytes)}, ${res.manifest.mediaSummary.canonicalMediaFiles} canonical media files, ${res.manifest.mediaSummary.aliasReferences} alias references)`
      );
      setTimeout(() => setExportSuccess(null), 8000);
    } catch (err: any) {
      console.error('[SettingsModule] Portable backup export error:', err);
      alert(`Portable backup export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setExportingPortable(false);
    }
  };

  const handleExportCoreBackup = () => {
    try {
      setExportingCore(true);
      setExportSuccess(null);
      const { filename } = exportFullBackup();
      setExportSuccess(`Core Data JSON downloaded: ${filename}`);
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
        `Complete Archive exported (${res.imageCount} images): ${res.coreFilename} & ${res.mediaFilename}`
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

    const isPortable = file.name.endsWith('.fsosbackup') || file.name.endsWith('.zip');

    if (isPortable) {
      setSelectedArchiveType('portable');
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const zipBytes = new Uint8Array(buffer);
          setPortableZipBytes(zipBytes);
          const valRes = await validatePortableBackupArchive(zipBytes);
          setPortableValidation(valRes);
          setCompleteValidation(null);
          setShowPreviewModal(true);
        } catch (err: any) {
          console.error('[SettingsModule] Portable archive load error:', err);
          alert(`Failed to parse portable backup archive: ${err?.message || err}`);
        } finally {
          setValidating(false);
          if (coreFileInputRef.current) {
            coreFileInputRef.current.value = '';
          }
        }
      };
      reader.onerror = () => {
        setValidating(false);
        alert('Failed to read selected .fsosbackup file.');
        if (coreFileInputRef.current) {
          coreFileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setSelectedArchiveType('legacy');
      setPortableZipBytes(null);
      setPortableValidation(null);
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
    }
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedMediaFileName(file.name);
    setValidating(true);
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
      alert('Failed to read selected media archive file.');
      if (mediaFileInputRef.current) {
        mediaFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleApplyRestore = async () => {
    if (selectedArchiveType === 'portable') {
      if (!portableZipBytes || !portableValidation || !portableValidation.valid) return;
      try {
        setRestoring(true);
        setRestoreError(null);
        const res = await restorePortableBackup(portableZipBytes);
        if (res.success) {
          alert(
            `Restore Complete!\n\n` +
            `• ${res.restoredImageCount ?? 0} media files restored to IndexedDB.\n` +
            `• Pre-restore safety snapshot saved to: ${res.safetyBackupFilename || 'safety snapshot'}\n\n` +
            `Click OK to reload the workspace.`
          );
          window.location.reload();
        } else {
          setRestoreError(`Restore failed: ${res.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        setRestoreError(`Restore execution error: ${err?.message || err}`);
      } finally {
        setRestoring(false);
      }
    } else {
      if (!completeValidation || !completeValidation.valid || !coreFileText) return;
      try {
        setRestoring(true);
        setRestoreError(null);
        const parsedCore = JSON.parse(coreFileText);
        const parsedMedia = mediaFileText ? JSON.parse(mediaFileText) : undefined;
        const res = await restoreCompleteBackup(parsedCore, parsedMedia);
        if (res.success) {
          alert(
            `Restore Complete!\n\n` +
            `• ${res.restoredImageCount ?? 0} media evidence images restored.\n` +
            `• Safety snapshot saved: ${res.safetyBackupFilename || 'safety snapshot'}\n\n` +
            `Click OK to reload the workspace.`
          );
          window.location.reload();
        } else {
          setRestoreError(`Restore failed: ${res.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        setRestoreError(`Restore execution error: ${err?.message || err}`);
      } finally {
        setRestoring(false);
      }
    }
  };

  // Handlers for Advanced Maintenance / Storage Diagnostics
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

  const handleDeduplicateMedia = async () => {
    try {
      setDeduplicating(true);
      setDeduplicationResult(null);
      const res = await ImageStore.consolidateDuplicatePayloads();
      setDeduplicationResult(res);

      const [malformedRes, forensicRes] = await Promise.all([
        ImageStore.auditMalformedImages(),
        auditMediaEvidence()
      ]);
      setAuditResult(malformedRes);
      setForensicReport(forensicRes);
    } catch (err: any) {
      console.error('[SettingsModule] Deduplication error:', err);
      alert(`Deduplication error: ${err?.message || err}`);
    } finally {
      setDeduplicating(false);
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
      `• All active machine passports, MHC sessions, beam profiles, reports, and templates are strictly preserved.\n\n` +
      `Proceed with safe orphaned media cleanup?`
    );
    if (!confirmed) return;

    try {
      setCleaningOrphans(true);
      setOrphansCleanupResult(null);
      const result = await cleanupOrphanedMedia();
      setOrphansCleanupResult(result);

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
      const nextAudit = await ImageStore.auditMalformedImages();
      setAuditResult(nextAudit);
    } catch (err: any) {
      console.error('[SettingsModule] Image cleanup error:', err);
      alert(`Cleanup error: ${err?.message || err}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleExecuteReset = async () => {
    try {
      setIsResetting(true);
      setShowResetConfirmModal(false);
      await onResetData();
    } catch (err: any) {
      console.error('[SettingsModule] Reset error:', err);
      setIsResetting(false);
      alert(`Failed to reset workspace: ${err?.message || err}`);
    }
  };

  // Nav Sections Config
  const sections: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'regional', label: 'Regional', icon: Globe },
    { id: 'application', label: 'Application', icon: SlidersHorizontal },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'maintenance', label: 'Workspace Maintenance', icon: HardDrive },
    { id: 'about', label: 'About FSOS', icon: Info },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Module Header */}
      <div className="p-5 sm:p-6 rounded-card border shadow-theme-card flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors bg-surface border-theme-default text-theme-primary">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-badge border bg-raised border-theme-default text-theme-primary">
              <Database className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-xl font-theme-heading tracking-tight text-theme-primary">
                System Settings & Storage
              </h1>
              <p className="text-xs text-theme-muted font-theme-label">
                Precision configuration, offline persistence, portable backup archive, and workspace maintenance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onNavigate && (
            <motion.button
              whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
              onClick={() => onNavigate('changelog')}
              className="px-3 py-1.5 rounded-button text-xs font-theme-label border flex items-center gap-1.5 transition-colors bg-raised border-theme-default text-theme-secondary hover:bg-surface hover:text-theme-primary"
            >
              <History className="w-3.5 h-3.5 text-theme-muted" />
              <span>Release History</span>
            </motion.button>
          )}
          <div className="px-3 py-1.5 rounded-badge border font-mono text-xs flex items-center gap-2 bg-raised border-theme-default text-theme-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{APP_VERSION}</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tab Bar */}
      <div className="p-1.5 rounded-card border flex items-center gap-1 overflow-x-auto transition-colors bg-surface border-theme-default text-theme-primary">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <motion.button
              key={sec.id}
              whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
              onClick={() => setActiveSection(sec.id)}
              className={`px-3.5 py-2 rounded-button text-xs sm:text-sm font-theme-label whitespace-nowrap flex items-center gap-2 transition-colors ${
                isActive
                  ? 'bg-raised text-theme-primary shadow-xs border border-theme-strong font-semibold'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-raised'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--color-primary)]' : 'text-theme-muted'}`} />
              <span>{sec.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* 3. Section Content */}
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* SECTION 1: APPEARANCE */}
        {/* ========================================================================= */}
        {activeSection === 'appearance' && (
          <div className="space-y-6">
            <div className="p-6 rounded-card shadow-theme-card border space-y-6 bg-surface border-theme-default text-theme-primary">
              <div>
                <h2 className="text-base font-theme-heading text-theme-primary">
                  Theme & Visual Identity
                </h2>
                <p className="text-xs mt-1 text-theme-muted font-theme-label">
                  Configure the interface palette and visual language for your operating environment.
                </p>
              </div>

              {/* Visual-First 3-Theme Identity Cards (Full-Bleed Presentation) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {THEME_OPTIONS.map((opt) => {
                  const isSelected = activeTheme === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      type="button"
                      whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
                      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                      onClick={() => setTheme(opt.id)}
                      className={`group relative h-48 sm:h-52 rounded-2xl overflow-hidden text-left flex flex-col justify-between p-3 transition-all select-none border ${
                        isSelected
                          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/50 shadow-md'
                          : 'border-white/10 hover:border-white/25 shadow-sm'
                      }`}
                    >
                      {/* Full-Bleed Artwork Background */}
                      <div className="absolute inset-0 pointer-events-none">
                        <ThemeThumbnail
                          theme={opt.id}
                          size="full"
                          isSelected={isSelected}
                          className="w-full h-full rounded-none border-0"
                        />
                      </div>

                      {/* Top-Left Category Badge (Frosted Translucent Chip) */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="inline-flex items-center text-[11px] font-mono px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-white/90 shadow-xs">
                          {opt.category}
                        </span>
                      </div>

                      {/* Bottom Overlaid Info Panel (Glass Floating Card) */}
                      <div className="relative z-10 bg-[#0B0F17]/85 backdrop-blur-md border border-white/15 rounded-xl p-3 shadow-lg flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight font-theme-heading">
                          {opt.name}
                        </h3>

                        {isSelected ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/50 text-[11px] font-mono font-semibold text-[var(--color-primary)] shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.3)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-white/10 group-hover:bg-white/20 border border-white/20 text-white/90 text-[11px] font-mono font-medium transition-colors">
                            Select
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Design Standards Note */}
              <div className="p-4 rounded-card border text-xs leading-relaxed space-y-1.5 bg-canvas border-theme-default text-theme-secondary">
                <div className="flex items-center gap-2 font-semibold text-[var(--color-primary)] font-theme-heading">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Calm Industrial & Precision Operations Standard</span>
                </div>
                <p className="font-theme-label">
                  FSOS enforces strict neutral-first typography and optical contrast. High-contrast Monospace is standard for machine metrics, calibration readings, and audit timestamps. Color accents are strictly reserved for genuine operational states (Pass / Warning / Defect).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: REGIONAL */}
        {/* ========================================================================= */}
        {activeSection === 'regional' && (
          <div className="space-y-6">
            <div className="p-6 rounded-card border space-y-6 bg-surface border-theme-default text-theme-primary shadow-theme-card">
              <div>
                <h2 className="text-base font-theme-heading text-theme-primary">
                  Regional & Engineering Measurement Standards
                </h2>
                <p className="text-xs mt-1 text-theme-muted font-theme-label">
                  FSOS enforces international precision standards across all inspection logs, machine passports, and executive export reports.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date & Time Standard */}
                <div className="p-4 rounded-card border space-y-3 bg-canvas border-theme-default text-theme-primary">
                  <div className="flex items-center gap-2 font-semibold text-xs text-theme-primary font-theme-heading">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Date & Timestamp Standard</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-theme-subtle">
                      <span className="text-theme-muted">Date Format</span>
                      <span className="font-mono font-medium text-theme-primary">ISO 8601 (YYYY-MM-DD)</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-theme-subtle">
                      <span className="text-theme-muted">Time Standard</span>
                      <span className="font-mono font-medium text-theme-primary">24-Hour Military Time</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-muted">Manifest Timestamps</span>
                      <span className="font-mono font-medium text-theme-primary">UTC / ISO 8601</span>
                    </div>
                  </div>
                </div>

                {/* Units of Measurement */}
                <div className="p-4 rounded-card border space-y-3 bg-canvas border-theme-default text-theme-primary">
                  <div className="flex items-center gap-2 font-semibold text-xs text-theme-primary font-theme-heading">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Industrial Units of Measurement (SI)</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-theme-subtle">
                      <span className="text-theme-muted">Laser Power</span>
                      <span className="font-mono font-medium text-theme-primary">Watts (W) / Joules (J)</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-theme-subtle">
                      <span className="text-theme-muted">Optical Dimensions</span>
                      <span className="font-mono font-medium text-theme-primary">Micrometers (μm) / mm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-theme-muted">Thermal / Pressure</span>
                      <span className="font-mono font-medium text-theme-primary">Celsius (°C) / bar</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-card border text-xs leading-relaxed bg-canvas border-theme-default text-theme-muted">
                All engineering exports and machine passport records strictly adhere to UTF-8 character encoding and international metrology conventions to guarantee deterministic parsing across automated equipment analyzers.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: APPLICATION */}
        {/* ========================================================================= */}
        {activeSection === 'application' && (
          <div className="space-y-6">
            <div className="p-6 rounded-card border space-y-6 bg-surface border-theme-default text-theme-primary shadow-theme-card">
              <div>
                <h2 className="text-base font-theme-heading text-theme-primary">
                  Application & Workspace Configuration
                </h2>
                <p className="text-xs mt-1 text-theme-muted font-theme-label">
                  Configure default operational behavior and active workspace modes.
                </p>
              </div>

              {/* Workspace Mode Setting */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-theme-muted font-theme-label">
                  Default Workspace Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleWorkspaceModeChange('MHC_MODE')}
                    className={`p-4 rounded-card border text-left flex flex-col justify-between gap-3 transition-all ${
                      workspaceMode === 'MHC_MODE'
                        ? 'border-emerald-500/50 bg-raised ring-1 ring-emerald-500/30'
                        : 'border-theme-default bg-canvas hover:border-theme-strong hover:bg-raised'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-400">MHC MODE</span>
                      {workspaceMode === 'MHC_MODE' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-theme-primary font-theme-heading">
                        Machine Health Check Focused
                      </h4>
                      <p className="text-xs mt-0.5 leading-relaxed text-theme-muted font-theme-label">
                        Streamlined layout optimized for field technicians performing cleanroom diagnostics, calibration logs, and MHC inspection sessions.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWorkspaceModeChange('FOUNDER_MODE')}
                    className={`p-4 rounded-card border text-left flex flex-col justify-between gap-3 transition-all ${
                      workspaceMode === 'FOUNDER_MODE'
                        ? 'border-emerald-500/50 bg-raised ring-1 ring-emerald-500/30'
                        : 'border-theme-default bg-canvas hover:border-theme-strong hover:bg-raised'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-400">OPERATIONS SUITE</span>
                      {workspaceMode === 'FOUNDER_MODE' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-theme-primary font-theme-heading">
                        Complete Operations Suite
                      </h4>
                      <p className="text-xs mt-0.5 leading-relaxed text-theme-muted font-theme-label">
                        Unlocks complete fleet hierarchies, customer and contract databases, engineer directory, and multi-facility operational analytics.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sidebar Display Preference */}
              <div className="pt-4 border-t border-theme-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-theme-primary font-theme-heading">
                      Sidebar Default State
                    </h4>
                    <p className="text-xs mt-0.5 text-theme-muted font-theme-label">
                      Choose whether the navigation sidebar starts in compact icon mode or expanded label mode.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSidebarPrefToggle}
                    className={`px-3 py-1.5 rounded-button text-xs font-medium border transition-colors ${
                      sidebarCollapsedDefault
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                        : 'bg-raised text-theme-secondary border-theme-default hover:text-theme-primary'
                    }`}
                  >
                    {sidebarCollapsedDefault ? 'Compact / Collapsed' : 'Expanded Default'}
                  </button>
                </div>
              </div>

              {/* Engine Status Summary */}
              <div className="pt-4 border-t border-theme-subtle space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-theme-muted font-theme-label">
                  Core Engine & Persistence Architecture
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-card border bg-canvas border-theme-default">
                    <div className="text-theme-muted font-medium">Local Web Storage</div>
                    <div className="text-theme-primary font-mono font-bold mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Active & Persistent
                    </div>
                  </div>
                  <div className="p-3 rounded-card border bg-canvas border-theme-default">
                    <div className="text-theme-muted font-medium">IndexedDB Media Store</div>
                    <div className="text-theme-primary font-mono font-bold mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Binary Chunk Storage
                    </div>
                  </div>
                  <div className="p-3 rounded-card border bg-canvas border-theme-default">
                    <div className="text-theme-muted font-medium">Sync Engine</div>
                    <div className="text-theme-primary font-mono font-bold mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Offline-First Replicating
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: BACKUP & RESTORE */}
        {/* ========================================================================= */}
        {activeSection === 'backup' && (
          <div className="space-y-6">
            {/* Feedback alert */}
            {exportSuccess && (
              <div className="p-4 rounded-card bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{exportSuccess}</span>
              </div>
            )}

            {/* 1. Primary Hero: Export Portable Backup */}
            <div className="p-6 rounded-card border space-y-5 bg-surface border-theme-default text-theme-primary shadow-theme-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      RECOMMENDED
                    </span>
                    <h2 className="text-base font-semibold text-theme-primary font-theme-heading">
                      Portable Complete Backup (.fsosbackup)
                    </h2>
                  </div>
                  <p className="text-xs text-theme-muted font-theme-label">
                    Exports all core operational databases, machine passports, contracts, MHC sessions, and high-resolution binary media into a self-contained archive.
                  </p>
                </div>

                <Button
                  onClick={handleExportPortableBackup}
                  disabled={exportingPortable}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs px-4 py-2.5 shrink-0 flex items-center gap-2"
                >
                  {exportingPortable ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Packaging Archive...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Portable Backup</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Sizing & Integrity Explanation */}
              <div className="p-4 rounded-card border text-xs leading-relaxed space-y-2 bg-canvas border-theme-default text-theme-secondary">
                <div className="flex items-center gap-2 font-semibold text-theme-primary font-theme-heading">
                  <Info className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Backup Storage Characteristics</span>
                </div>
                <p>
                  • <strong>Media Evidence Scale:</strong> Archive size is naturally determined by stored image evidence (beam profile scans, calibration photos, optical inspection snapshots).
                </p>
                <p>
                  • <strong>Deduplication & Alias References:</strong> Duplicate media entries share canonical payloads inside the archive to prevent unnecessary bloat.
                </p>
                <p>
                  • <strong>Zero Mutation:</strong> The backup export process is strictly read-only and non-destructive to active workspace state.
                </p>
              </div>

              {/* Subordinated Legacy Multi-File JSON Option */}
              <div className="pt-3 border-t border-theme-subtle">
                <button
                  type="button"
                  onClick={() => setShowLegacyExport(!showLegacyExport)}
                  className="text-xs text-theme-muted hover:text-theme-primary flex items-center gap-1.5 font-medium transition-colors"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showLegacyExport ? 'rotate-90' : ''}`} />
                  <span>Legacy Multi-File JSON Export (Subordinated)</span>
                </button>

                {showLegacyExport && (
                  <div className="mt-3 p-3.5 rounded-card border bg-canvas border-theme-default space-y-2.5">
                    <p className="text-xs text-theme-muted">
                      Legacy exports generate standalone raw JSON files without binary packaging. Used primarily for specialized script parsing.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleExportCoreBackup}
                        disabled={exportingCore}
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                      >
                        <FileJson className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Export Core Data JSON
                      </Button>
                      <Button
                        onClick={handleExportCompleteArchive}
                        disabled={exportingComplete}
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                      >
                        <Package className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Export Split JSON Set (Core + Media)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Restore Backup Archive */}
            <div className="p-6 rounded-card border space-y-5 bg-surface border-theme-default text-theme-primary shadow-theme-card">
              <div>
                <h2 className="text-base font-semibold text-theme-primary font-theme-heading">
                  Restore Workspace Archive
                </h2>
                <p className="text-xs mt-1 text-theme-muted font-theme-label">
                  Load an authoritative backup archive into this workstation. Supports modern portable archives (<span className="font-mono">.fsosbackup</span>) and legacy JSON backups.
                </p>
              </div>

              {/* Upload Dropzones / Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Portable Archive File Picker */}
                <div className="p-5 rounded-card border border-dashed text-center flex flex-col items-center justify-center gap-3 transition-colors bg-canvas border-theme-default hover:border-emerald-500/50">
                  <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-theme-primary font-theme-heading">
                      Select .fsosbackup Archive
                    </h3>
                    <p className="text-xs mt-0.5 text-theme-muted font-theme-label">
                      All-in-one archive containing both operational data and media
                    </p>
                  </div>

                  <input
                    ref={coreFileInputRef}
                    type="file"
                    accept=".fsosbackup,.zip,.json"
                    onChange={handleCoreFileChange}
                    className="hidden"
                  />

                  <Button
                    onClick={() => coreFileInputRef.current?.click()}
                    disabled={validating}
                    variant="secondary"
                    size="sm"
                    className="text-xs mt-1"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    {validating ? 'Inspecting File...' : 'Choose Backup File'}
                  </Button>
                </div>

                {/* Legacy Secondary Media File Picker (Optional) */}
                <div className="p-5 rounded-card border border-dashed text-center flex flex-col items-center justify-center gap-3 opacity-80 transition-colors bg-canvas border-theme-default">
                  <div className="p-3 rounded-full bg-surface text-theme-muted">
                    <FileJson className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-theme-primary font-theme-heading">
                      Legacy Media JSON (Optional)
                    </h3>
                    <p className="text-xs mt-0.5 text-theme-muted font-theme-label">
                      Only required if restoring split legacy multi-file backups
                    </p>
                  </div>

                  <input
                    ref={mediaFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleMediaFileChange}
                    className="hidden"
                  />

                  <Button
                    onClick={() => mediaFileInputRef.current?.click()}
                    disabled={validating}
                    variant="secondary"
                    size="sm"
                    className="text-xs mt-1"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Select Media JSON
                  </Button>
                </div>
              </div>

              {/* Safety Pre-Restore Banner */}
              <div className="p-3.5 rounded-card border text-xs flex items-center gap-2.5 bg-canvas border-theme-default text-theme-secondary">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Automatic Safety Snapshot:</strong> Before applying any restore, FSOS automatically generates and downloads an immutable safety snapshot of your current local state.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: WORKSPACE MAINTENANCE */}
        {/* ========================================================================= */}
        {activeSection === 'maintenance' && (
          <div className="space-y-6">
            {/* 1. Factory Reset Action */}
            <div className="p-6 rounded-card border space-y-5 bg-surface border-theme-default text-theme-primary shadow-theme-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h2 className="text-base font-semibold font-theme-heading">
                    Reset Local Workspace State
                  </h2>
                </div>
                <p className="text-xs text-theme-muted font-theme-label">
                  Clears all locally stored records and returns the workstation to a clean factory zero-state.
                </p>
              </div>

              <div className="p-4 rounded-card border text-xs leading-relaxed space-y-2.5 bg-rose-950/20 border-rose-900/40 text-rose-200">
                <div className="font-semibold text-rose-400">
                  Detailed Scope of Factory Reset:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Permanently removes all Customer, Plant, and Production Line records.</li>
                  <li>Permanently removes all Machine Passports, MHC inspection history, and saved drafts.</li>
                  <li>Permanently removes all Service Contracts, Scheduled Maintenance tasks, and Quality Alerts.</li>
                  <li>Completely purges all high-resolution images, beam profiles, and media evidence from IndexedDB.</li>
                  <li>Restores default cleanroom baseline operators and initial clean workspace state.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-theme-muted">
                  This action is permanent. Export a Portable Backup before proceeding if you wish to preserve your data.
                </span>
                <Button
                  onClick={() => {
                    setResetConfirmInput('');
                    setShowResetConfirmModal(true);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2 shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Workspace...</span>
                </Button>
              </div>
            </div>

            {/* 2. Advanced Storage Diagnostics & Optimization (Collapsible Boundary) */}
            <div className="rounded-card border transition-all bg-surface border-theme-default text-theme-primary shadow-theme-card">
              <button
                type="button"
                onClick={() => setShowAdvancedDiagnostics(!showAdvancedDiagnostics)}
                className="w-full p-5 flex items-center justify-between text-left gap-4 hover:opacity-95"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-badge border bg-raised border-theme-default text-theme-primary">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-theme-primary font-theme-heading">
                      Advanced Storage Diagnostics & Optimization
                    </h3>
                    <p className="text-xs mt-0.5 text-theme-muted font-theme-label">
                      Read-only forensic media audits, duplicate payload consolidation, and safe orphaned media cleanup
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-raised text-theme-muted border border-theme-default">
                    {showAdvancedDiagnostics ? 'Collapse' : 'Expand Tools'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-theme-muted transition-transform ${showAdvancedDiagnostics ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showAdvancedDiagnostics && (
                <div className="p-6 pt-0 space-y-6 border-t border-theme-subtle">
                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-4">
                    <Button
                      onClick={handleAuditImages}
                      disabled={auditing}
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                    >
                      {auditing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Running Audit...
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                          Run Forensic Audit
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleDeduplicateMedia}
                      disabled={deduplicating || !forensicReport}
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                    >
                      {deduplicating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Consolidating...
                        </>
                      ) : (
                        <>
                          <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                          Consolidate Duplicates
                        </>
                      )}
                    </Button>

                    {forensicReport && forensicReport.summary.orphanedRecords > 0 && (
                      <Button
                        onClick={handleCleanupOrphanedMedia}
                        disabled={cleaningOrphans}
                        variant="secondary"
                        size="sm"
                        className="text-xs text-amber-400 border-amber-500/30"
                      >
                        {cleaningOrphans ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Purging Orphans...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Safe Orphan Cleanup ({forensicReport.summary.orphanedRecords})
                          </>
                        )}
                      </Button>
                    )}

                    {auditResult && auditResult.malformed > 0 && (
                      <Button
                        onClick={handleCleanupImages}
                        disabled={cleaning}
                        variant="secondary"
                        size="sm"
                        className="text-xs text-rose-400 border-rose-500/30"
                      >
                        {cleaning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Purging Artifacts...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                            Purge React Artifacts ({auditResult.malformed})
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Feedback Status */}
                  {cleanupStatus && (
                    <div className="p-3 rounded-card bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                      {cleanupStatus}
                    </div>
                  )}

                  {deduplicationResult && (
                    <div className="p-3 rounded-card bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono">
                      Deduplication complete: {deduplicationResult.consolidatedAliasesCount} alias pointers consolidated. Reclaimed {formatBytes(deduplicationResult.reclaimedBytes)}.
                    </div>
                  )}

                  {/* Forensic Audit Report Display */}
                  {forensicReport ? (
                    <div className="space-y-4">
                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-card border bg-canvas border-theme-default">
                          <div className="text-theme-muted font-medium">Total Media Entries</div>
                          <div className="text-theme-primary font-mono font-bold text-sm mt-1">
                            {forensicReport.summary.totalRecords} ({formatBytes(forensicReport.summary.totalBytes)})
                          </div>
                        </div>

                        <div className="p-3 rounded-card border bg-canvas border-theme-default">
                          <div className="text-theme-muted font-medium">Active References</div>
                          <div className="text-emerald-400 font-mono font-bold text-sm mt-1">
                            {forensicReport.summary.referencedRecords} entries
                          </div>
                        </div>

                        <div className="p-3 rounded-card border bg-canvas border-theme-default">
                          <div className="text-theme-muted font-medium">Orphaned Records</div>
                          <div className={`font-mono font-bold text-sm mt-1 ${
                            forensicReport.summary.orphanedRecords > 0 ? 'text-amber-400' : 'text-theme-muted'
                          }`}>
                            {forensicReport.summary.orphanedRecords} entries
                          </div>
                        </div>

                        <div className="p-3 rounded-card border bg-canvas border-theme-default">
                          <div className="text-theme-muted font-medium">Duplicate Payloads</div>
                          <div className="text-blue-400 font-mono font-bold text-sm mt-1">
                            {forensicReport.summary.duplicateGroupsCount} groups
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic Tab Filter Bar */}
                      <div className="flex items-center gap-1.5 border-b border-theme-subtle pb-2 text-xs">
                        <button
                          onClick={() => setActiveForensicTab('summary')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            activeForensicTab === 'summary'
                              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                              : 'text-theme-muted hover:text-theme-primary'
                          }`}
                        >
                          Overview
                        </button>
                        <button
                          onClick={() => setActiveForensicTab('categories')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            activeForensicTab === 'categories'
                              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                              : 'text-theme-muted hover:text-theme-primary'
                          }`}
                        >
                          Category Breakdown
                        </button>
                        <button
                          onClick={() => setActiveForensicTab('references')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            activeForensicTab === 'references'
                              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                              : 'text-theme-muted hover:text-theme-primary'
                          }`}
                        >
                          All Key References ({forensicReport.entries.length})
                        </button>
                        <button
                          onClick={() => setActiveForensicTab('duplicates')}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            activeForensicTab === 'duplicates'
                              ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                              : 'text-theme-muted hover:text-theme-primary'
                          }`}
                        >
                          Duplicates ({forensicReport.duplicates.length})
                        </button>
                      </div>

                      {/* Tab 1: Summary Overview */}
                      {activeForensicTab === 'summary' && (
                        <div className="space-y-3 text-xs">
                          <div className="p-4 rounded-card border bg-canvas border-theme-default">
                            <h4 className="font-semibold text-theme-primary mb-2 font-theme-heading">Media Store Provenance</h4>
                            <p className="text-theme-muted leading-relaxed font-theme-label">
                              Media evidence is isolated in the local IndexedDB Object Store (<span className="font-mono">fsos_media_store</span>). Each image is indexed by canonical content keys to prevent bloating main operational local storage.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Category Breakdown */}
                      {activeForensicTab === 'categories' && (
                        <div className="space-y-2">
                          {forensicReport.categories.map((cat) => (
                            <div
                              key={cat.category}
                              className="p-3 rounded-card border flex items-center justify-between text-xs bg-canvas border-theme-default"
                            >
                              <span className="font-medium text-theme-primary">{cat.category}</span>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-theme-muted">{cat.count} files</span>
                                <span className="text-theme-primary font-semibold">{formatBytes(cat.totalBytes)}</span>
                                <span className="text-emerald-400">{cat.percentageOfTotal.toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tab 3: All Key References */}
                      {activeForensicTab === 'references' && (
                        <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[11px]">
                          {forensicReport.entries.map((entry) => (
                            <div
                              key={entry.key}
                              className="p-2 rounded border flex items-center justify-between gap-2 bg-canvas border-theme-default"
                            >
                              <div className="truncate flex items-center gap-1.5">
                                <button
                                  onClick={() => handleCopyKey(entry.key)}
                                  className="text-theme-muted hover:text-theme-primary"
                                  title="Copy key"
                                >
                                  {copiedKey === entry.key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                                <span className="text-theme-secondary truncate">{entry.key}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                                  entry.isOrphaned 
                                    ? 'bg-amber-500/20 text-amber-400' 
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {entry.isOrphaned ? 'ORPHAN' : 'ACTIVE'}
                                </span>
                                <span className="text-theme-muted">{formatBytes(entry.byteSize)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tab 4: Duplicates */}
                      {activeForensicTab === 'duplicates' && (
                        <div className="space-y-2 text-xs">
                          {forensicReport.duplicates.length === 0 ? (
                            <div className="p-4 text-center text-theme-muted font-mono">
                              Zero un-consolidated duplicate payloads detected.
                            </div>
                          ) : (
                            forensicReport.duplicates.map((dup) => (
                              <div
                                key={dup.groupId}
                                className="p-3 rounded-card border space-y-1.5 bg-canvas border-theme-default"
                              >
                                <div className="flex items-center justify-between font-mono text-[11px]">
                                  <span className="text-theme-secondary truncate max-w-xs">{dup.sampleKey}</span>
                                  <span className="text-blue-400">{dup.count} instances ({formatBytes(dup.totalBytes)})</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-theme-muted border border-dashed border-theme-default rounded-card">
                      Click "Run Forensic Audit" to inspect the live IndexedDB media evidence store.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: ABOUT FSOS */}
        {/* ========================================================================= */}
        {activeSection === 'about' && (
          <div className="space-y-6">
            <div className="p-6 rounded-card border space-y-6 bg-surface border-theme-default text-theme-primary shadow-theme-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-theme-primary font-theme-heading">
                    Field Service Operations System (FSOS)
                  </h2>
                  <p className="text-xs mt-1 text-theme-muted font-theme-label">
                    Precision Engineering & Optical Alignment Platform
                  </p>
                </div>
                {onNavigate && (
                  <Button
                    onClick={() => onNavigate('changelog')}
                    variant="secondary"
                    size="sm"
                    className="text-xs flex items-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5 text-theme-muted" />
                    <span>View Release History</span>
                  </Button>
                )}
              </div>

              {/* Version & Build Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 rounded-card border bg-canvas border-theme-default">
                  <div className="text-theme-muted font-medium">Version Release</div>
                  <div className="text-theme-primary font-mono font-bold text-sm mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {APP_VERSION}
                  </div>
                </div>

                <div className="p-3.5 rounded-card border bg-canvas border-theme-default">
                  <div className="text-theme-muted font-medium">Build Identifier</div>
                  <div className="text-theme-secondary font-mono text-xs mt-1">
                    {APP_BUILD_ID}
                  </div>
                </div>

                <div className="p-3.5 rounded-card border bg-canvas border-theme-default">
                  <div className="text-theme-muted font-medium">Milestone Architecture</div>
                  <div className="text-emerald-400 font-medium text-xs mt-1 truncate" title={APP_CODENAME}>
                    {APP_CODENAME}
                  </div>
                </div>
              </div>

              {/* Architecture Details */}
              <div className="p-4 rounded-card border space-y-2 text-xs leading-relaxed bg-canvas border-theme-default text-theme-secondary">
                <h4 className="font-semibold text-theme-primary flex items-center gap-1.5 font-theme-heading">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Offline-First Field Operations Architecture</span>
                </h4>
                <p>
                  FSOS is engineered for mission-critical cleanroom field operations. The application executes completely client-side with native HTML5 storage, IndexedDB binary media partitioning, and portable archive interchange. Real-time calibration analysis, beam profile calculations, and MHC inspection session state remain fully operational regardless of network connectivity.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RESTORE PREVIEW & CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-card border p-6 space-y-5 shadow-2xl transition-all bg-surface border-theme-default text-theme-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-theme-heading text-theme-primary">
                  {selectedArchiveType === 'portable' ? 'Validate & Restore Portable Backup' : 'Validate & Restore Legacy Backup'}
                </h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-theme-muted hover:text-theme-primary"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Details */}
            {selectedArchiveType === 'portable' && portableValidation ? (
              <div className="space-y-3 text-xs">
                {portableValidation.valid ? (
                  <div className="p-3 rounded-card bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Archive valid! Ready for safe restoration.</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-card bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>Archive validation errors detected.</span>
                  </div>
                )}

                <div className="p-4 rounded-card border space-y-2 font-mono bg-canvas border-theme-default">
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Archive Version:</span>
                    <span className="text-theme-primary font-bold">{portableValidation.manifest.backupVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Total Size:</span>
                    <span className="text-theme-primary">{formatBytes(portableValidation.totalArchiveBytes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Canonical Media Files:</span>
                    <span className="text-emerald-400">{portableValidation.manifest.mediaSummary.canonicalMediaFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Alias References:</span>
                    <span className="text-theme-secondary">{portableValidation.manifest.mediaSummary.aliasReferences}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Machine Passports:</span>
                    <span className="text-theme-primary">{portableValidation.manifest.domainCounts.machines || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">MHC Sessions:</span>
                    <span className="text-theme-primary">{portableValidation.manifest.domainCounts.mhc_sessions || 0}</span>
                  </div>
                </div>
              </div>
            ) : completeValidation ? (
              <div className="space-y-3 text-xs">
                {completeValidation.valid ? (
                  <div className="p-3 rounded-card bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Legacy JSON valid!</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-card bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>Errors: {completeValidation.errors.join(', ')}</span>
                  </div>
                )}
              </div>
            ) : null}

            {restoreError && (
              <div className="p-3 rounded-card bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {restoreError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-subtle">
              <Button
                onClick={() => setShowPreviewModal(false)}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyRestore}
                disabled={restoring || (selectedArchiveType === 'portable' ? !portableValidation?.valid : !completeValidation?.valid)}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs px-4"
              >
                {restoring ? 'Applying Safe Restore...' : 'Confirm & Apply Restore'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FACTORY RESET CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border p-6 space-y-5 shadow-2xl bg-surface border-rose-900/40 text-theme-primary">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold font-theme-heading">
                Confirm Factory Workspace Reset
              </h3>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-theme-secondary">
              <p>
                You are about to permanently purge all operational customer data, machine passports, inspection sessions, reports, and IndexedDB media evidence.
              </p>
              <p className="font-semibold text-rose-400">
                To confirm, type <span className="font-mono underline">RESET</span> in the box below:
              </p>

              <input
                type="text"
                placeholder="Type RESET to confirm"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                className="w-full px-3 py-2 rounded-button text-xs font-mono border outline-none bg-canvas border-rose-900/60 text-rose-200 placeholder-slate-600 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-subtle">
              <Button
                onClick={() => setShowResetConfirmModal(false)}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteReset}
                disabled={resetConfirmInput.trim() !== 'RESET' || isResetting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4"
              >
                {isResetting ? 'Resetting Workspace...' : 'Permanently Reset Workspace'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
