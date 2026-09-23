import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Upload,
  Eye,
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
import { ProductProcessViaGalleryModal } from '../../modules/ProductProcessViaGalleryModal';
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
    const passportRecords = machine?.productProcessRecords || [];
    const sortedPassportRecords = [...passportRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const passportRecord = sortedPassportRecords[0];
    const sessionRecordId = `PP-SESSION-${session.id || Date.now()}`;

    if (session.productProcessRecord) {
      // Guard against direct passport reference aliasing from legacy sessions
      const isDirectPassportRef = passportRecord && session.productProcessRecord.id === passportRecord.id;
      const baseRec = isDirectPassportRef
        ? JSON.parse(JSON.stringify(session.productProcessRecord))
        : session.productProcessRecord;

      const hydrated = ImageStore.hydrateImagesSync(baseRec);
      const merged: ProductProcessRecord = {
        ...hydrated,
        id: isDirectPassportRef ? sessionRecordId : hydrated.id,
        date: hydrated.date || session.startDate || getLocalDateString(),
        productName: hydrated.productName || passportRecord?.productName || session.stage02_laserProfile?.productName || '',
        recipeName: hydrated.recipeName || passportRecord?.recipeName || session.stage02_laserProfile?.recipeProgram || '',
        lotPanel: hydrated.lotPanel || passportRecord?.lotPanel || '',
        laser1PowerOffsetPercent: (hydrated.laser1PowerOffsetPercent !== undefined && hydrated.laser1PowerOffsetPercent !== null)
          ? hydrated.laser1PowerOffsetPercent
          : (passportRecord?.laser1PowerOffsetPercent !== undefined && passportRecord?.laser1PowerOffsetPercent !== null ? passportRecord.laser1PowerOffsetPercent : null),
        laser2PowerOffsetPercent: (hydrated.laser2PowerOffsetPercent !== undefined && hydrated.laser2PowerOffsetPercent !== null)
          ? hydrated.laser2PowerOffsetPercent
          : (passportRecord?.laser2PowerOffsetPercent !== undefined && passportRecord?.laser2PowerOffsetPercent !== null ? passportRecord.laser2PowerOffsetPercent : null),
        viaSpec: hydrated.viaSpec || passportRecord?.viaSpec || { ...DEFAULT_SPEC },
        phase1: hydrated.phase1 || passportRecord?.phase1 || { powerWatts: null, frequencyKhz: null, shotCount: null, maskMm: null, defocusMm: null },
        phase2: hydrated.phase2 || passportRecord?.phase2 || { powerWatts: null, frequencyKhz: null, shotCount: null, maskMm: null, defocusMm: null },
        laser1Via: hydrated.laser1Via || passportRecord?.laser1Via || { topWidthUm: null, bottomWidthUm: null, topPass: false, bottomPass: false, overallPass: false },
        laser2Via: hydrated.laser2Via || passportRecord?.laser2Via || { topWidthUm: null, bottomWidthUm: null, topPass: false, bottomPass: false, overallPass: false }
      };
      return ImageStore.hydrateImagesSync(ProductProcessEngine.evaluateRecord(merged));
    }

    if (passportRecord) {
      // Deep clone Machine Passport record to seed Product/Recipe/Process info without mutating Passport
      const cloned: ProductProcessRecord = JSON.parse(JSON.stringify(passportRecord));
      cloned.id = sessionRecordId;
      cloned.date = session.startDate || getLocalDateString();
      cloned.createdAt = new Date().toISOString();
      return ImageStore.hydrateImagesSync(ProductProcessEngine.evaluateRecord(cloned));
    }

    // Default baseline record when genuinely absent from Machine Passport
    const base: ProductProcessRecord = {
      id: sessionRecordId,
      date: session.startDate || getLocalDateString(),
      productName: session.stage02_laserProfile?.productName || '',
      recipeName: session.stage02_laserProfile?.recipeProgram || '',
      lotPanel: '',
      engineerRemarks: '',
      laser1PowerOffsetPercent: null,
      laser2PowerOffsetPercent: null,
      viaSpec: { ...DEFAULT_SPEC },
      phase1: {
        powerWatts: null,
        frequencyKhz: null,
        shotCount: null,
        maskMm: null,
        defocusMm: null
      },
      phase2: {
        powerWatts: null,
        frequencyKhz: null,
        shotCount: null,
        maskMm: null,
        defocusMm: null
      },
      laser1Via: {
        topWidthUm: null,
        bottomWidthUm: null,
        topPass: false,
        bottomPass: false,
        overallPass: false
      },
      laser2Via: {
        topWidthUm: null,
        bottomWidthUm: null,
        topPass: false,
        bottomPass: false,
        overallPass: false
      },
      overallResult: 'FAIL',
      createdAt: new Date().toISOString()
    };
    return ProductProcessEngine.evaluateRecord(base);
  }, [session, machine]);

  const [record, setRecord] = useState<ProductProcessRecord>(initialRecord);
  const [activeHead, setActiveHead] = useState<'lh1' | 'lh2'>('lh1');
  const [galleryModalState, setGalleryModalState] = useState<{
    isOpen: boolean;
    laser: 'laser1' | 'laser2';
    view: 'top' | 'bottom';
  }>({
    isOpen: false,
    laser: 'laser1',
    view: 'top'
  });

  // Reactive subscription to ImageStore to re-render when IndexedDB hydration finishes
  const [imageStoreVersion, setImageStoreVersion] = useState(0);
  useEffect(() => {
    const unsub = ImageStore.subscribe(() => {
      setImageStoreVersion(v => v + 1);
    });
    return unsub;
  }, []);

  // Sync state if session updates externally or ImageStore finishes IDB hydration
  useEffect(() => {
    if (session.productProcessRecord) {
      setRecord(ImageStore.hydrateImagesSync(session.productProcessRecord));
    }
  }, [session.productProcessRecord, imageStoreVersion]);

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

  // Dedicated Top / Bottom Via Image Upload
  const handleImageUpload = (
    head: 'lh1' | 'lh2',
    view: 'top' | 'bottom',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isReadOnly || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const key = head === 'lh1' ? 'laser1Via' : 'laser2Via';
      setRecord(prev => {
        const currentVia = prev[key] || {
          topWidthUm: null,
          bottomWidthUm: null,
          topPass: false,
          bottomPass: false,
          overallPass: false
        };
        const updatedVia: ViaQualityReading = {
          ...currentVia,
          ...(view === 'top'
            ? { topViaImageDataUrl: result, viaImageDataUrl: result }
            : { bottomViaImageDataUrl: result, viaImageDataUrl: currentVia.topViaImageDataUrl || result })
        };
        return {
          ...prev,
          [key]: updatedVia
        };
      });
      if (showNotification) {
        showNotification(`Uploaded ${view === 'top' ? 'Top' : 'Bottom'} Via image for ${head === 'lh1' ? 'Laser 1' : 'Laser 2'}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Dedicated Top / Bottom Via Image Remove
  const handleImageRemove = (head: 'lh1' | 'lh2', view: 'top' | 'bottom') => {
    if (isReadOnly) return;
    const key = head === 'lh1' ? 'laser1Via' : 'laser2Via';
    setRecord(prev => {
      const currentVia = prev[key];
      if (!currentVia) return prev;
      const updatedVia: ViaQualityReading = {
        ...currentVia,
        ...(view === 'top'
          ? { topViaImageDataUrl: undefined, viaImageDataUrl: currentVia.bottomViaImageDataUrl }
          : { bottomViaImageDataUrl: undefined })
      };
      return {
        ...prev,
        [key]: updatedVia
      };
    });
    if (showNotification) {
      showNotification(`Removed ${view === 'top' ? 'Top' : 'Bottom'} Via image for ${head === 'lh1' ? 'Laser 1' : 'Laser 2'}`);
    }
  };

  // Save Draft
  const handleSaveDraft = () => {
    const updated: MHCSession = {
      ...session,
      productProcessRecord: evaluatedRecord,
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
  };

  const isCurrentCompleted = session.autopilotProgress?.activityStatuses?.[activeCode] === 'COMPLETED';
  const activeReading = activeHead === 'lh1' ? evaluatedRecord.laser1Via : evaluatedRecord.laser2Via;

  const rawTopUrl = activeReading?.topViaImageDataUrl || activeReading?.viaImageDataUrl;
  const topImgUrl = rawTopUrl ? ImageStore.resolveImage(rawTopUrl) || rawTopUrl : undefined;

  const rawBottomUrl = activeReading?.bottomViaImageDataUrl;
  const bottomImgUrl = rawBottomUrl ? ImageStore.resolveImage(rawBottomUrl) || rawBottomUrl : undefined;

  return (
    <div className="p-4 sm:p-6 rounded-2xl border space-y-6 bg-[var(--surface-surface)] border-[var(--border-default)] shadow-xs">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              DAY 3 • 07
            </span>
            <Badge variant="outline" className="text-xs font-mono border-[var(--border-default)] text-[var(--text-secondary)]">
              PROCESS &amp; DRILL VERIFICATION
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
          <h2 className="text-xl font-bold tracking-tight mt-1 text-[var(--text-primary)] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-500" />
            Product &amp; Process / Via
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Machining parameters, power offsets, and via drill cross-section geometry check for Laser 1 and Laser 2.
          </p>
        </div>

        {/* Laser Head Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveHead('lh1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeHead === 'lh1'
                ? 'bg-[var(--surface-surface)] text-[var(--color-primary)] shadow-xs border border-[var(--border-subtle)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Laser Head 1
            {evaluatedRecord.laser1Via && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
                evaluatedRecord.laser1Via.overallPass
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
              }`}>
                {evaluatedRecord.laser1Via.overallPass ? 'PASS' : 'FAIL'}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveHead('lh2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeHead === 'lh2'
                ? 'bg-[var(--surface-surface)] text-[var(--color-primary)] shadow-xs border border-[var(--border-subtle)] font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Laser Head 2
            {evaluatedRecord.laser2Via && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
                evaluatedRecord.laser2Via.overallPass
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
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
          <label className="text-[11px] font-medium text-[var(--text-secondary)]">Product Name</label>
          <input
            type="text"
            value={record.productName}
            onChange={(e) => setRecord(prev => ({ ...prev, productName: e.target.value }))}
            disabled={isReadOnly}
            placeholder="e.g. Standard Dummy Wafer"
            className="w-full text-xs font-mono p-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-workspace)] text-[var(--text-primary)]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-secondary)]">Recipe Program</label>
          <input
            type="text"
            value={record.recipeName}
            onChange={(e) => setRecord(prev => ({ ...prev, recipeName: e.target.value }))}
            disabled={isReadOnly}
            placeholder="e.g. MHC-VIA-01"
            className="w-full text-xs font-mono p-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-workspace)] text-[var(--text-primary)]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-secondary)]">Lot / Panel ID</label>
          <input
            type="text"
            value={record.lotPanel}
            onChange={(e) => setRecord(prev => ({ ...prev, lotPanel: e.target.value }))}
            disabled={isReadOnly}
            placeholder="e.g. LOT-A01"
            className="w-full text-xs font-mono p-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-workspace)] text-[var(--text-primary)]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-secondary)]">Laser 1 Power Offset (%)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              value={record.laser1PowerOffsetPercent !== null && record.laser1PowerOffsetPercent !== undefined ? record.laser1PowerOffsetPercent : ''}
              onChange={(e) => setRecord(prev => ({ ...prev, laser1PowerOffsetPercent: e.target.value === '' ? null : (parseFloat(e.target.value) || 0) }))}
              disabled={isReadOnly}
              placeholder="e.g. 0.0"
              className="w-full text-xs font-mono p-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-workspace)] text-[var(--text-primary)]"
            />
            <span className="text-xs text-[var(--text-muted)]">%</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-secondary)]">Laser 2 Power Offset (%)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              value={record.laser2PowerOffsetPercent !== null && record.laser2PowerOffsetPercent !== undefined ? record.laser2PowerOffsetPercent : ''}
              onChange={(e) => setRecord(prev => ({ ...prev, laser2PowerOffsetPercent: e.target.value === '' ? null : (parseFloat(e.target.value) || 0) }))}
              disabled={isReadOnly}
              placeholder="e.g. 0.0"
              className="w-full text-xs font-mono p-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-workspace)] text-[var(--text-primary)]"
            />
            <span className="text-xs text-[var(--text-muted)]">%</span>
          </div>
        </div>
      </div>

      {/* Authoritative Via Specification Bar */}
      <div className="p-4 rounded-xl border space-y-3 bg-[var(--surface-workspace)] border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Via Geometry Acceptance Specification
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-muted)] mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('std50')}
              disabled={isReadOnly}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-[var(--border-default)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              STD 50µm
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('hdi35')}
              disabled={isReadOnly}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-[var(--border-default)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              HDI 35µm
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('fine25')}
              disabled={isReadOnly}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-[var(--border-default)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Fine 25µm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">Top Target</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {record.viaSpec?.topTargetUm ?? 51} µm
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">Top Tolerance</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              ±{record.viaSpec?.topToleranceUm ?? 10} µm
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">Bottom Target</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {record.viaSpec?.bottomTargetUm ?? 23} µm
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">Bottom Tolerance</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              ±{record.viaSpec?.bottomToleranceUm ?? 10} µm
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">Min Taper Ratio</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
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
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
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
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : activeReading?.topWidthUm !== null
                ? 'border-rose-500/30 bg-rose-500/10'
                : 'border-[var(--border-default)] bg-[var(--surface-workspace)]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
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
                  className="w-full text-base font-mono font-bold p-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-surface)] text-[var(--text-primary)]"
                />
                <span className="text-xs text-[var(--text-muted)] font-mono">µm</span>
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                Target: {record.viaSpec?.topTargetUm ?? 51} ± {record.viaSpec?.topToleranceUm ?? 10} µm
              </div>
            </div>

            {/* Bottom Hole Input */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              activeReading?.bottomPass
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : activeReading?.bottomWidthUm !== null
                ? 'border-rose-500/30 bg-rose-500/10'
                : 'border-[var(--border-default)] bg-[var(--surface-workspace)]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
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
                  className="w-full text-base font-mono font-bold p-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-surface)] text-[var(--text-primary)]"
                />
                <span className="text-xs text-[var(--text-muted)] font-mono">µm</span>
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                Target: {record.viaSpec?.bottomTargetUm ?? 23} ± {record.viaSpec?.bottomToleranceUm ?? 10} µm
              </div>
            </div>
          </div>

          {/* Calculated Taper Ratio */}
          <div className="p-3 rounded-xl border flex items-center justify-between bg-[var(--surface-workspace)] border-[var(--border-default)]">
            <div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Calculated Taper Ratio:
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] ml-1.5">
                (D_bot / D_top) × 100
              </span>
            </div>
            <div className="text-right">
              {activeReading?.topWidthUm && activeReading?.bottomWidthUm ? (
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {((activeReading.bottomWidthUm / activeReading.topWidthUm) * 100).toFixed(1)} %
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Dual Via Inspection Evidence (Top Via & Bottom Via) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              {activeHead === 'lh1' ? 'Laser 1 (Head A)' : 'Laser 2 (Head B)'} Via Evidence
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGalleryModalState({
                isOpen: true,
                laser: activeHead === 'lh1' ? 'laser1' : 'laser2',
                view: 'top'
              })}
              className="text-[11px] h-7 px-2.5 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-1 font-medium"
            >
              <Eye className="w-3 h-3" />
              Inspect Gallery
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Top Via Slot */}
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-emerald-500 dark:text-emerald-400">
                  Top Via
                </span>
                {topImgUrl && !isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleImageRemove(activeHead, 'top')}
                    className="text-[10px] text-rose-500 hover:text-rose-400 font-mono transition-colors cursor-pointer"
                    title="Remove Top Via Image"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div
                onClick={() => setGalleryModalState({
                  isOpen: true,
                  laser: activeHead === 'lh1' ? 'laser1' : 'laser2',
                  view: 'top'
                })}
                className="w-full aspect-square rounded-xl border border-[var(--border-default)] hover:border-emerald-500/60 bg-slate-900/90 overflow-hidden relative group flex items-center justify-center cursor-pointer transition-all shadow-inner"
                title="Click to inspect Top Via in animated gallery"
              >
                {topImgUrl ? (
                  <>
                    <img
                      src={topImgUrl}
                      alt={`${activeHead === 'lh1' ? 'Laser 1' : 'Laser 2'} Top Via`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] gap-1 font-medium">
                      <Eye className="w-4 h-4 text-emerald-300" />
                      <span>Inspect</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-500">
                    <FileCheck className="w-6 h-6 mx-auto mb-1 stroke-1 opacity-50" />
                    <span className="text-[10px] block">No image</span>
                  </div>
                )}
              </div>

              <label className="block w-full text-center py-1 px-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-raised)] text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
                <Upload className="w-2.5 h-2.5 inline mr-1 text-[var(--color-primary)]" />
                {topImgUrl ? 'Replace Top' : 'Upload Top'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(activeHead, 'top', e)}
                  disabled={isReadOnly}
                />
              </label>
            </div>

            {/* Bottom Via Slot */}
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-cyan-500 dark:text-cyan-400">
                  Bottom Via
                </span>
                {bottomImgUrl && !isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleImageRemove(activeHead, 'bottom')}
                    className="text-[10px] text-rose-500 hover:text-rose-400 font-mono transition-colors cursor-pointer"
                    title="Remove Bottom Via Image"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div
                onClick={() => setGalleryModalState({
                  isOpen: true,
                  laser: activeHead === 'lh1' ? 'laser1' : 'laser2',
                  view: 'bottom'
                })}
                className="w-full aspect-square rounded-xl border border-[var(--border-default)] hover:border-cyan-500/60 bg-slate-900/90 overflow-hidden relative group flex items-center justify-center cursor-pointer transition-all shadow-inner"
                title="Click to inspect Bottom Via in animated gallery"
              >
                {bottomImgUrl ? (
                  <>
                    <img
                      src={bottomImgUrl}
                      alt={`${activeHead === 'lh1' ? 'Laser 1' : 'Laser 2'} Bottom Via`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] gap-1 font-medium">
                      <Eye className="w-4 h-4 text-cyan-300" />
                      <span>Inspect</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-500">
                    <FileCheck className="w-6 h-6 mx-auto mb-1 stroke-1 opacity-50" />
                    <span className="text-[10px] block">No image</span>
                  </div>
                )}
              </div>

              <label className="block w-full text-center py-1 px-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-raised)] text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
                <Upload className="w-2.5 h-2.5 inline mr-1 text-[var(--color-primary)]" />
                {bottomImgUrl ? 'Replace Btm' : 'Upload Btm'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(activeHead, 'bottom', e)}
                  disabled={isReadOnly}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Engineer Remarks */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[var(--text-secondary)]">
          Process &amp; Via Inspection Remarks
        </label>
        <textarea
          rows={2}
          value={record.engineerRemarks}
          onChange={(e) => setRecord(prev => ({ ...prev, engineerRemarks: e.target.value }))}
          disabled={isReadOnly}
          placeholder="Note any copper landing pad damage, taper deviation, or recipe adjustments..."
          className="w-full text-xs p-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-workspace)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
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
            className="flex-1 sm:flex-none text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleComplete}
            disabled={isReadOnly}
            className="flex-1 sm:flex-none text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Complete Process Activity
          </Button>
        </div>
      </div>

      {/* Product & Process Via Quality Inspection Gallery Modal */}
      {galleryModalState.isOpen && evaluatedRecord && (
        <ProductProcessViaGalleryModal
          isOpen={galleryModalState.isOpen}
          onClose={() => setGalleryModalState(prev => ({ ...prev, isOpen: false }))}
          record={evaluatedRecord}
          initialLaser={galleryModalState.laser}
          initialView={galleryModalState.view}
          machineModel={machine?.model}
          machineNumber={machine?.machineNumber}
        />
      )}
    </div>
  );
};

