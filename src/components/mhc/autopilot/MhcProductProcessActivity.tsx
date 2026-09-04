import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Upload,
  Eye,
  Sparkles,
  Sliders,
  Layers,
  Info,
  ShieldCheck,
  Save,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Machine, MHCSession } from '../../../types';
import {
  ProductProcessRecord,
  ViaSpecification,
  ProcessPhaseParams,
  ViaQualityReading,
  TOP_VIA_SPEC,
  BOTTOM_VIA_SPEC
} from '../../../types/productProcess';
import { ProductProcessEngine } from '../../../utils/productProcessEngine';
import { ImageStore } from '../../../utils/imageStore';
import { getLocalDateString } from '../../../utils/timeUtils';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { advanceAutopilotActivity, flagDownstreamNeedsReview } from '../../../utils/mhcAutopilotBrain';

const DEFAULT_SPEC: ViaSpecification = {
  topTargetUm: 51,
  topToleranceUm: 10,
  bottomTargetUm: 23,
  bottomToleranceUm: 10,
  minTaperPercent: 40,
  taperSpecText: '≥ 40%'
};

export interface MhcProductProcessActivityProps {
  session: MHCSession;
  machine?: Machine | null;
  isReadOnly?: boolean;
  onUpdateSession: (updated: MHCSession) => void;
  onCompleteActivity: (
    latestSession?: MHCSession,
    targetCodeOverride?: string,
    statusOverride?: 'COMPLETED' | 'NEEDS_REVIEW'
  ) => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
  activeCode?: string;
}

export const MhcProductProcessActivity: React.FC<MhcProductProcessActivityProps> = ({
  session,
  machine,
  isReadOnly = false,
  onUpdateSession,
  onCompleteActivity,
  isDark,
  showNotification,
  activeCode = '06_via'
}) => {
  // Determine initial authoritative record
  const initialRecord = useMemo<ProductProcessRecord>(() => {
    const passportRecord = machine?.productProcessRecords?.[0];
    const sessionRecordId = `PP-SESSION-${session.id || Date.now()}`;

    if (session.productProcessRecord) {
      // Guard against direct passport reference aliasing from legacy sessions
      const isDirectPassportRef = passportRecord && session.productProcessRecord.id === passportRecord.id;
      if (!isDirectPassportRef) {
        return ImageStore.hydrateImagesSync(session.productProcessRecord);
      }
      const cloned: ProductProcessRecord = JSON.parse(JSON.stringify(session.productProcessRecord));
      cloned.id = sessionRecordId;
      cloned.date = session.startDate || getLocalDateString();
      return ImageStore.hydrateImagesSync(ProductProcessEngine.evaluateRecord(cloned));
    }

    if (session.productProcessRecords && session.productProcessRecords.length > 0) {
      const isDirectPassportRef = passportRecord && session.productProcessRecords[0].id === passportRecord.id;
      if (!isDirectPassportRef) {
        return ImageStore.hydrateImagesSync(session.productProcessRecords[0]);
      }
      const cloned: ProductProcessRecord = JSON.parse(JSON.stringify(session.productProcessRecords[0]));
      cloned.id = sessionRecordId;
      cloned.date = session.startDate || getLocalDateString();
      return ImageStore.hydrateImagesSync(ProductProcessEngine.evaluateRecord(cloned));
    }

    if (passportRecord) {
      // Deep clone Machine Passport record to seed Product/Recipe/Process info without mutating Passport
      const cloned: ProductProcessRecord = JSON.parse(JSON.stringify(passportRecord));
      cloned.id = sessionRecordId;
      cloned.date = session.startDate || getLocalDateString();
      cloned.createdAt = new Date().toISOString();
      return ImageStore.hydrateImagesSync(ProductProcessEngine.evaluateRecord(cloned));
    }

    // Default baseline record with Standard 50µm specs
    const base: ProductProcessRecord = {
      id: sessionRecordId,
      date: session.startDate || getLocalDateString(),
      productName: session.stage02_laserProfile?.productName || machine?.model || 'STANDARD DUMMY WAFER',
      recipeName: session.stage02_laserProfile?.recipeProgram || 'MHC-VIA-RECIPE-01',
      lotPanel: 'LOT-MHC-01',
      engineerRemarks: '',
      laser1PowerOffsetPercent: 0,
      laser2PowerOffsetPercent: 0,
      viaSpec: { ...DEFAULT_SPEC },
      phase1: {
        powerWatts: 12.5,
        frequencyKhz: 80,
        shotCount: 15,
        maskMm: 1.2,
        defocusMm: 0
      },
      phase2: {
        powerWatts: 8.0,
        frequencyKhz: 100,
        shotCount: 5,
        maskMm: 1.2,
        defocusMm: 0
      },
      laser1Via: {
        topWidthUm: 50.8,
        bottomWidthUm: 23.2,
        topPass: true,
        bottomPass: true,
        overallPass: true
      },
      laser2Via: {
        topWidthUm: 51.2,
        bottomWidthUm: 22.8,
        topPass: true,
        bottomPass: true,
        overallPass: true
      },
      overallResult: 'PASS',
      createdAt: new Date().toISOString()
    };
    return ProductProcessEngine.evaluateRecord(base);
  }, [session, machine]);

  const [record, setRecord] = useState<ProductProcessRecord>(initialRecord);
  const [activeHead, setActiveHead] = useState<'lh1' | 'lh2'>('lh1');
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);

  // Sync state if session updates externally
  useEffect(() => {
    if (session.productProcessRecord) {
      setRecord(ImageStore.hydrateImagesSync(session.productProcessRecord));
    }
  }, [session.productProcessRecord]);

  // Recalculate evaluation when measurements or specs change
  const evaluatedRecord = useMemo<ProductProcessRecord>(() => {
    return ProductProcessEngine.evaluateRecord(record);
  }, [record]);

  // Apply Via Specification Preset
  const handleApplyPreset = (presetKey: 'std50' | 'hdi35' | 'fine25') => {
    if (isReadOnly) return;
    let newSpec: ViaSpecification;
    if (presetKey === 'std50') {
      newSpec = {
        topTargetUm: 51,
        topToleranceUm: 10,
        bottomTargetUm: 23,
        bottomToleranceUm: 10,
        minTaperPercent: 40,
        taperSpecText: '≥ 40%'
      };
    } else if (presetKey === 'hdi35') {
      newSpec = {
        topTargetUm: 35,
        topToleranceUm: 5,
        bottomTargetUm: 18,
        bottomToleranceUm: 5,
        minTaperPercent: 45,
        taperSpecText: '≥ 45%'
      };
    } else {
      newSpec = {
        topTargetUm: 25,
        topToleranceUm: 4,
        bottomTargetUm: 12,
        bottomToleranceUm: 3,
        minTaperPercent: 50,
        taperSpecText: '≥ 50%'
      };
    }

    setRecord(prev => ProductProcessEngine.evaluateRecord({
      ...prev,
      viaSpec: newSpec
    }));

    if (showNotification) {
      showNotification(`Applied ${presetKey.toUpperCase()} Via Specification preset.`);
    }
  };

  // Update Via Measurements
  const handleUpdateMeasurement = (
    head: 'lh1' | 'lh2',
    field: 'topWidthUm' | 'bottomWidthUm',
    val: string
  ) => {
    if (isReadOnly) return;
    const num = parseFloat(val);
    const key = head === 'lh1' ? 'laser1Via' : 'laser2Via';
    const currReading = record[key] || {
      topWidthUm: null,
      bottomWidthUm: null,
      topPass: false,
      bottomPass: false,
      overallPass: false
    };

    const updatedReading: ViaQualityReading = {
      ...currReading,
      [field]: isNaN(num) ? null : num
    };

    setRecord(prev => ProductProcessEngine.evaluateRecord({
      ...prev,
      [key]: updatedReading
    }));
  };

  // Micrograph Upload
  const handleImageUpload = (head: 'lh1' | 'lh2', e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const key = head === 'lh1' ? 'laser1Via' : 'laser2Via';
      setRecord(prev => ({
        ...prev,
        [key]: {
          ...(prev[key] || { topWidthUm: null, bottomWidthUm: null, topPass: false, bottomPass: false, overallPass: false }),
          viaImageDataUrl: result
        }
      }));
      if (showNotification) showNotification(`Uploaded via micrograph for ${head === 'lh1' ? 'Laser 1' : 'Laser 2'}`);
    };
    reader.readAsDataURL(file);
  };

  // Generate Synthetic Via Micrographs (Cross-section SEM simulation)
  const handleGenerateSyntheticViaImage = (head: 'lh1' | 'lh2') => {
    if (isReadOnly) return;
    const key = head === 'lh1' ? 'laser1Via' : 'laser2Via';
    const reading = record[key];
    const topW = reading?.topWidthUm ?? 51.0;
    const botW = reading?.bottomWidthUm ?? 23.0;

    // Build crisp cross-section SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
      <rect width="300" height="200" fill="#0f172a"/>
      <!-- Substrate layers -->
      <rect x="20" y="30" width="260" height="25" fill="#334155" opacity="0.8"/>
      <rect x="20" y="55" width="260" height="90" fill="#1e293b" opacity="0.9"/>
      <rect x="20" y="145" width="260" height="25" fill="#334155" opacity="0.8"/>
      <!-- Drilled Via Hole (Trapezoid) -->
      <polygon points="${150 - topW * 1.5},30 ${150 + topW * 1.5},30 ${150 + botW * 1.5},145 ${150 - botW * 1.5},145" fill="#020617"/>
      <!-- Laser recast & contour lines -->
      <path d="M ${150 - topW * 1.5} 30 L ${150 - botW * 1.5} 145" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3,2"/>
      <path d="M ${150 + topW * 1.5} 30 L ${150 + botW * 1.5} 145" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3,2"/>
      <!-- Copper bottom landing pad -->
      <rect x="${150 - botW * 2.2}" y="145" width="${botW * 4.4}" height="10" fill="#f59e0b" opacity="0.75"/>
      <!-- Measurement callouts -->
      <text x="150" y="24" fill="#38bdf8" font-family="monospace" font-size="11" text-anchor="middle" font-weight="bold">TOP: ${topW.toFixed(1)} µm</text>
      <text x="150" y="165" fill="#f59e0b" font-family="monospace" font-size="11" text-anchor="middle" font-weight="bold">BOTTOM: ${botW.toFixed(1)} µm</text>
      <text x="150" y="185" fill="#94a3b8" font-family="sans-serif" font-size="9" text-anchor="middle">SEM DRILL PROFILE • ${head.toUpperCase()}</text>
    </svg>`;

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    setRecord(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { topWidthUm: topW, bottomWidthUm: botW, topPass: true, bottomPass: true, overallPass: true }),
        viaImageDataUrl: dataUrl
      }
    }));

    if (showNotification) showNotification(`Generated synthetic via profile for ${head === 'lh1' ? 'Laser 1' : 'Laser 2'}`);
  };

  // Save Draft
  const handleSaveDraft = () => {
    const updated: MHCSession = {
      ...session,
      productProcessRecord: evaluatedRecord,
      productProcessRecords: [evaluatedRecord],
      stage02_laserProfile: {
        ...(session.stage02_laserProfile || { laserId: 'lh1', profileInfo: '', measurementInfo: '', supportingEvidence: '', images: [] }),
        productName: evaluatedRecord.productName || session.stage02_laserProfile?.productName || '',
        recipeProgram: evaluatedRecord.recipeName || session.stage02_laserProfile?.recipeProgram || ''
      },
      stage06_productQuality: {
        ...(session.stage06_productQuality || { sampleId: '', viaDiameterUm: 0, viaShape: 'CIRCULAR', viaOffsetUm: 0, padQuality: 'EXCELLENT', visualVerification: 'CLEAN', beforeInspectionNotes: '', afterInspectionNotes: '', beforeImages: [], afterImages: [], notes: '' }),
        sampleId: evaluatedRecord.lotPanel || session.stage06_productQuality?.sampleId || '',
        viaDiameterUm: evaluatedRecord.laser1Via?.topWidthUm ?? session.stage06_productQuality?.viaDiameterUm ?? 50,
        result: evaluatedRecord.overallResult,
        notes: evaluatedRecord.engineerRemarks || session.stage06_productQuality?.notes || ''
      }
    };
    onUpdateSession(updated);
    if (showNotification) showNotification('Product & Process / Via draft saved.');
  };

  // Complete Activity
  const handleComplete = () => {
    const isL1Measured = evaluatedRecord.laser1Via?.topWidthUm !== null && evaluatedRecord.laser1Via?.bottomWidthUm !== null;
    const isL2Measured = evaluatedRecord.laser2Via?.topWidthUm !== null && evaluatedRecord.laser2Via?.bottomWidthUm !== null;

    if (!isL1Measured || !isL2Measured) {
      if (showNotification) {
        showNotification('Please record Top and Bottom via dimensions for both Laser 1 and Laser 2.');
      }
      return;
    }

    const isFail = evaluatedRecord.overallResult === 'FAIL';
    const completionStatus = isFail ? 'NEEDS_REVIEW' : 'COMPLETED';

    let updatedSession: MHCSession = {
      ...session,
      productProcessRecord: evaluatedRecord,
      productProcessRecords: [evaluatedRecord],
      stage02_laserProfile: {
        ...(session.stage02_laserProfile || { laserId: 'lh1', profileInfo: '', measurementInfo: '', supportingEvidence: '', images: [] }),
        productName: evaluatedRecord.productName || session.stage02_laserProfile?.productName || '',
        recipeProgram: evaluatedRecord.recipeName || session.stage02_laserProfile?.recipeProgram || ''
      },
      stage06_productQuality: {
        ...(session.stage06_productQuality || { sampleId: '', viaDiameterUm: 0, viaShape: 'CIRCULAR', viaOffsetUm: 0, padQuality: 'EXCELLENT', visualVerification: 'CLEAN', beforeInspectionNotes: '', afterInspectionNotes: '', beforeImages: [], afterImages: [], notes: '' }),
        sampleId: evaluatedRecord.lotPanel || session.stage06_productQuality?.sampleId || '',
        viaDiameterUm: evaluatedRecord.laser1Via?.topWidthUm ?? session.stage06_productQuality?.viaDiameterUm ?? 50,
        result: evaluatedRecord.overallResult,
        notes: evaluatedRecord.engineerRemarks || session.stage06_productQuality?.notes || ''
      }
    };

    if (session.autopilotProgress?.activityStatuses?.[activeCode] === 'COMPLETED') {
      updatedSession = flagDownstreamNeedsReview(updatedSession, activeCode);
    }

    const note = evaluatedRecord.engineerRemarks || (
      isFail
        ? `Via quality flagged: L1=${evaluatedRecord.laser1Via?.overallPass ? 'PASS' : 'FAIL'}, L2=${evaluatedRecord.laser2Via?.overallPass ? 'PASS' : 'FAIL'}`
        : `Via quality verified: L1 Top=${evaluatedRecord.laser1Via?.topWidthUm}µm/Bot=${evaluatedRecord.laser1Via?.bottomWidthUm}µm, L2 Top=${evaluatedRecord.laser2Via?.topWidthUm}µm/Bot=${evaluatedRecord.laser2Via?.bottomWidthUm}µm`
    );

    updatedSession = advanceAutopilotActivity(
      updatedSession,
      activeCode,
      completionStatus,
      note
    );

    onUpdateSession(updatedSession);

    if (showNotification) {
      showNotification(
        isFail
          ? 'Activity Product & Process / Via FLAGGED FOR REVIEW ⚠ Advanced to Day 4 Recommendations.'
          : 'Activity Product & Process / Via COMPLETED ✓ Advanced to Day 4 Recommendations.'
      );
    }

    onCompleteActivity(updatedSession, activeCode, completionStatus);
  };

  const isCurrentCompleted = session.autopilotProgress?.activityStatuses?.[activeCode] === 'COMPLETED';
  const activeReading = activeHead === 'lh1' ? evaluatedRecord.laser1Via : evaluatedRecord.laser2Via;

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border space-y-6 ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              DAY 3 • ACTIVITY 06_VIA
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              PROCESS & DRILL VERIFICATION
            </Badge>
            {isCurrentCompleted && (
              <Badge variant="success" className="text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </Badge>
            )}
            {evaluatedRecord.overallResult === 'FAIL' && (
              <Badge variant="error" className="text-xs flex items-center gap-1">
                <XCircle className="w-3 h-3" /> OUT OF SPEC
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-500" />
            Product & Process / Via
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Machining parameters, power offsets, and via drill cross-section geometry check for Laser 1 and Laser 2.
          </p>
        </div>

        {/* Laser Head Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveHead('lh1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeHead === 'lh1'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Laser Head 1
            {evaluatedRecord.laser1Via && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
                evaluatedRecord.laser1Via.overallPass
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {evaluatedRecord.laser1Via.overallPass ? 'PASS' : 'FAIL'}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveHead('lh2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeHead === 'lh2'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Laser Head 2
            {evaluatedRecord.laser2Via && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
                evaluatedRecord.laser2Via.overallPass
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {evaluatedRecord.laser2Via.overallPass ? 'PASS' : 'FAIL'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Production Identification & Power Offsets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Product Name</label>
          <input
            type="text"
            value={record.productName}
            onChange={(e) => setRecord(prev => ({ ...prev, productName: e.target.value }))}
            disabled={isReadOnly}
            placeholder="e.g. Standard Dummy Wafer"
            className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Recipe Program</label>
          <input
            type="text"
            value={record.recipeName}
            onChange={(e) => setRecord(prev => ({ ...prev, recipeName: e.target.value }))}
            disabled={isReadOnly}
            placeholder="e.g. MHC-VIA-01"
            className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Lot / Panel ID</label>
          <input
            type="text"
            value={record.lotPanel}
            onChange={(e) => setRecord(prev => ({ ...prev, lotPanel: e.target.value }))}
            disabled={isReadOnly}
            placeholder="e.g. LOT-A01"
            className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Laser 1 Power Offset (%)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              value={record.laser1PowerOffsetPercent ?? ''}
              onChange={(e) => setRecord(prev => ({ ...prev, laser1PowerOffsetPercent: parseFloat(e.target.value) || 0 }))}
              disabled={isReadOnly}
              className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
            />
            <span className="text-xs text-slate-400">%</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Laser 2 Power Offset (%)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              value={record.laser2PowerOffsetPercent ?? ''}
              onChange={(e) => setRecord(prev => ({ ...prev, laser2PowerOffsetPercent: parseFloat(e.target.value) || 0 }))}
              disabled={isReadOnly}
              className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
            />
            <span className="text-xs text-slate-400">%</span>
          </div>
        </div>
      </div>

      {/* Authoritative Via Specification Bar */}
      <div className={`p-4 rounded-xl border space-y-3 ${
        isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Via Geometry Acceptance Specification
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('std50')}
              disabled={isReadOnly}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              STD 50µm
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('hdi35')}
              disabled={isReadOnly}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              HDI 35µm
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('fine25')}
              disabled={isReadOnly}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Fine 25µm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Top Target</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {record.viaSpec?.topTargetUm ?? 51} µm
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Top Tolerance</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              ±{record.viaSpec?.topToleranceUm ?? 10} µm
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Bottom Target</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {record.viaSpec?.bottomTargetUm ?? 23} µm
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Bottom Tolerance</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              ±{record.viaSpec?.bottomToleranceUm ?? 10} µm
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Min Taper Ratio</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              ≥ {record.viaSpec?.minTaperPercent ?? 40} %
            </span>
          </div>
        </div>
      </div>

      {/* Laser Via Quality Measurement & Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Measurements & Verdicts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              {activeHead === 'lh1' ? 'Laser Head 1' : 'Laser Head 2'} Via Dimensions
            </h3>
            {activeReading && (
              <Badge variant={activeReading.overallPass ? 'success' : 'error'} className="text-xs">
                {activeReading.overallPass ? 'HEAD PASS ✓' : 'HEAD OUT OF SPEC ⚠'}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top Hole Input */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              activeReading?.topPass
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : activeReading?.topWidthUm !== null
                ? 'border-rose-500/30 bg-rose-500/5'
                : 'border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Top Hole Width (D_top)
                </span>
                {activeReading?.topWidthUm !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    activeReading?.topPass ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {activeReading?.topPass ? 'PASS' : 'OUT OF SPEC'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={activeReading?.topWidthUm ?? ''}
                  onChange={(e) => handleUpdateMeasurement(activeHead, 'topWidthUm', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 51.0"
                  className="w-full text-base font-mono font-bold p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400 font-mono">µm</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Target: {record.viaSpec?.topTargetUm ?? 51} ± {record.viaSpec?.topToleranceUm ?? 10} µm
              </div>
            </div>

            {/* Bottom Hole Input */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              activeReading?.bottomPass
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : activeReading?.bottomWidthUm !== null
                ? 'border-rose-500/30 bg-rose-500/5'
                : 'border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Bottom Hole Width (D_bot)
                </span>
                {activeReading?.bottomWidthUm !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    activeReading?.bottomPass ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {activeReading?.bottomPass ? 'PASS' : 'OUT OF SPEC'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={activeReading?.bottomWidthUm ?? ''}
                  onChange={(e) => handleUpdateMeasurement(activeHead, 'bottomWidthUm', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 23.0"
                  className="w-full text-base font-mono font-bold p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400 font-mono">µm</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Target: {record.viaSpec?.bottomTargetUm ?? 23} ± {record.viaSpec?.bottomToleranceUm ?? 10} µm
              </div>
            </div>
          </div>

          {/* Calculated Taper Ratio */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Calculated Taper Ratio:
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                (D_bot / D_top) × 100
              </span>
            </div>
            <div className="text-right">
              {activeReading?.topWidthUm && activeReading?.bottomWidthUm ? (
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {((activeReading.bottomWidthUm / activeReading.topWidthUm) * 100).toFixed(1)} %
                </span>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Micrograph / SEM Cross-Section */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Via Micrograph / SEM Profile
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateSyntheticViaImage(activeHead)}
              disabled={isReadOnly}
              className="text-[11px] h-7 px-2 border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Generate SEM
            </Button>
          </div>

          <div className="w-full aspect-video rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 overflow-hidden relative group flex items-center justify-center">
            {activeReading?.viaImageDataUrl ? (
              <img
                src={ImageStore.resolveImage(activeReading.viaImageDataUrl)}
                alt="Via Profile"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center p-4 text-slate-500">
                <FileCheck className="w-8 h-8 mx-auto mb-1 stroke-1 opacity-50" />
                <span className="text-xs">No micrograph uploaded</span>
              </div>
            )}

            {activeReading?.viaImageDataUrl && (
              <button
                type="button"
                onClick={() => setPreviewImage({
                  title: `${activeHead === 'lh1' ? 'Laser 1' : 'Laser 2'} Via Micrograph`,
                  url: ImageStore.resolveImage(activeReading.viaImageDataUrl!)
                })}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-medium cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Enlarge
              </button>
            )}
          </div>

          <label className="block w-full text-center py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 cursor-pointer transition-colors">
            <Upload className="w-3 h-3 inline mr-1.5" />
            Upload Micrograph Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(activeHead, e)}
              disabled={isReadOnly}
            />
          </label>
        </div>
      </div>

      {/* Engineer Remarks */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Process & Via Inspection Remarks
        </label>
        <textarea
          rows={2}
          value={record.engineerRemarks}
          onChange={(e) => setRecord(prev => ({ ...prev, engineerRemarks: e.target.value }))}
          disabled={isReadOnly}
          placeholder="Note any copper landing pad damage, taper deviation, or recipe adjustments..."
          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>
            Overall Status: <strong className={`font-mono ${
              evaluatedRecord.overallResult === 'PASS'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>{evaluatedRecord.overallResult}</strong> (L1: {evaluatedRecord.laser1Via?.overallPass ? 'PASS' : 'FAIL'} • L2: {evaluatedRecord.laser2Via?.overallPass ? 'PASS' : 'FAIL'})
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isReadOnly}
            className="flex-1 sm:flex-none text-xs flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleComplete}
            disabled={isReadOnly}
            className="flex-1 sm:flex-none text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Complete Process Activity
          </Button>
        </div>
      </div>

      {/* Enlarge Micrograph Modal */}
      {previewImage && (
        <Modal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title={previewImage.title}
        >
          <div className="p-4 flex flex-col items-center justify-center">
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[70vh] rounded-lg shadow-lg object-contain border border-slate-200 dark:border-slate-700"
              referrerPolicy="no-referrer"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
