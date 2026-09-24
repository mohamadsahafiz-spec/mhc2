import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Upload, 
  Trash2, 
  ArrowRight, 
  Info, 
  Layers, 
  Check, 
  RefreshCw,
  Clock,
  Sliders
} from 'lucide-react';
import { Machine, MHCSession, MHCAgcResult, MHCAgcIndexItem } from '../../../types';
import { advanceAutopilotActivity, flagDownstreamNeedsReview, dispositionAutopilotActivity } from '../../../utils/mhcAutopilotBrain';
import { ImageStore } from '../../../utils/imageStore';

export interface MhcAgcActivityProps {
  session: MHCSession;
  machine: Machine;
  isReadOnly: boolean;
  onUpdateSession: (updatedSession: MHCSession) => void;
  onCompleteActivity: (latestSession?: MHCSession) => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
  activeCode?: string; // '05_agc1' | '05_agc2' | '05'
}

const SPEC_TOLERANCE_UM = 3.0;
const INDEX_COUNT = 6; // Indices 0 through 5

export const MhcAgcActivity: React.FC<MhcAgcActivityProps> = ({
  session,
  isReadOnly,
  onUpdateSession,
  onCompleteActivity,
  isDark: _isDark,
  showNotification,
  activeCode = '05_agc1'
}) => {
  // Active AGC tab: 'agc1' or 'agc2'
  const initialAgcId = activeCode === '05_agc2' ? 'agc2' : 'agc1';
  const [activeAgcId, setActiveAgcId] = useState<'agc1' | 'agc2'>(initialAgcId);

  useEffect(() => {
    if (activeCode === '05_agc2') {
      setActiveAgcId('agc2');
    } else if (activeCode === '05_agc1') {
      setActiveAgcId('agc1');
    }
  }, [activeCode]);

  const agcData = useMemo(() => {
    return session.agcData || {};
  }, [session.agcData]);

  // Form State for Selected Indices and Min/Max values (Indices 0 through 5)
  // For new calibrations, none are selected by default
  const [selectedIndices, setSelectedIndices] = useState<boolean[]>(Array(INDEX_COUNT).fill(false));
  const [indexXMinInputs, setIndexXMinInputs] = useState<string[]>(Array(INDEX_COUNT).fill(''));
  const [indexXMaxInputs, setIndexXMaxInputs] = useState<string[]>(Array(INDEX_COUNT).fill(''));
  const [indexYMinInputs, setIndexYMinInputs] = useState<string[]>(Array(INDEX_COUNT).fill(''));
  const [indexYMaxInputs, setIndexYMaxInputs] = useState<string[]>(Array(INDEX_COUNT).fill(''));
  const [indexNotes, setIndexNotes] = useState<string[]>(Array(INDEX_COUNT).fill(''));
  const [overallNote, setOverallNote] = useState<string>('');
  const [evidenceImage, setEvidenceImage] = useState<string>('');
  const [selectedDisposition, setSelectedDisposition] = useState<'PASS' | 'ACCEPTED_DEVIATION' | 'CONDITIONAL_PASS' | 'WARNING' | 'FAIL'>('PASS');

  // Hydrate state when activeAgcId or session changes
  useEffect(() => {
    const rec = agcData[activeAgcId];
    if (rec && rec.indices && rec.indices.length === INDEX_COUNT) {
      const hasExplicitSelection = rec.indices.some(idx => idx.isSelected !== undefined);
      if (hasExplicitSelection) {
        setSelectedIndices(rec.indices.map(idx => !!idx.isSelected));
      } else {
        // Legacy fallback: selected if any coordinate was populated
        setSelectedIndices(rec.indices.map(idx => 
          (idx.xMinUm !== null && idx.xMinUm !== undefined) ||
          (idx.xMaxUm !== null && idx.xMaxUm !== undefined) ||
          (idx.xUm !== null && idx.xUm !== undefined) ||
          (idx.yMinUm !== null && idx.yMinUm !== undefined) ||
          (idx.yMaxUm !== null && idx.yMaxUm !== undefined) ||
          (idx.yUm !== null && idx.yUm !== undefined)
        ));
      }

      setIndexXMinInputs(rec.indices.map(idx => {
        if (idx.xMinUm !== null && idx.xMinUm !== undefined) return String(idx.xMinUm);
        if (idx.xUm !== null && idx.xUm !== undefined) return String(idx.xUm);
        return '';
      }));

      setIndexXMaxInputs(rec.indices.map(idx => {
        if (idx.xMaxUm !== null && idx.xMaxUm !== undefined) return String(idx.xMaxUm);
        if (idx.xUm !== null && idx.xUm !== undefined) return String(idx.xUm);
        return '';
      }));

      setIndexYMinInputs(rec.indices.map(idx => {
        if (idx.yMinUm !== null && idx.yMinUm !== undefined) return String(idx.yMinUm);
        if (idx.yUm !== null && idx.yUm !== undefined) return String(idx.yUm);
        return '';
      }));

      setIndexYMaxInputs(rec.indices.map(idx => {
        if (idx.yMaxUm !== null && idx.yMaxUm !== undefined) return String(idx.yMaxUm);
        if (idx.yUm !== null && idx.yUm !== undefined) return String(idx.yUm);
        return '';
      }));

      setIndexNotes(rec.indices.map(idx => idx.engineerNote || ''));
      setOverallNote(rec.engineerNote || '');
      const rawImg = rec.evidenceImage || '';
      const resolvedImg = ImageStore.resolveImage(rawImg) || (rawImg.startsWith('idb:') ? '' : rawImg);
      setEvidenceImage(resolvedImg);
      if (rec.engineerDisposition) {
        setSelectedDisposition(rec.engineerDisposition);
      } else if (rec.verdict === 'PASS') {
        setSelectedDisposition('PASS');
      } else if (rec.verdict === 'OUT_OF_SPEC') {
        setSelectedDisposition('ACCEPTED_DEVIATION');
      }
    } else {
      setSelectedIndices(Array(INDEX_COUNT).fill(false));
      setIndexXMinInputs(Array(INDEX_COUNT).fill(''));
      setIndexXMaxInputs(Array(INDEX_COUNT).fill(''));
      setIndexYMinInputs(Array(INDEX_COUNT).fill(''));
      setIndexYMaxInputs(Array(INDEX_COUNT).fill(''));
      setIndexNotes(Array(INDEX_COUNT).fill(''));
      setOverallNote('');
      setEvidenceImage('');
      setSelectedDisposition('PASS');
    }
  }, [activeAgcId, agcData]);

  const parseNum = (val: string): number | null => {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  // Compute parsed numeric indices
  const parsedIndices = useMemo(() => {
    return Array.from({ length: INDEX_COUNT }, (_, i) => {
      const isSelected = selectedIndices[i];
      const xMin = parseNum(indexXMinInputs[i]);
      const xMax = parseNum(indexXMaxInputs[i]);
      const yMin = parseNum(indexYMinInputs[i]);
      const yMax = parseNum(indexYMaxInputs[i]);

      if (!isSelected) {
        return {
          indexNum: i,
          isSelected: false,
          xMinUm: null,
          xMaxUm: null,
          yMinUm: null,
          yMaxUm: null,
          maxAbsX: null,
          maxAbsY: null,
          maxDev: null,
          isComplete: false,
          isOut: false,
          verdict: 'UNANSWERED' as const,
          note: indexNotes[i]
        };
      }

      const isComplete = xMin !== null && xMax !== null && yMin !== null && yMax !== null;
      const maxAbsX = (xMin !== null && xMax !== null) ? Math.max(Math.abs(xMin), Math.abs(xMax)) : null;
      const maxAbsY = (yMin !== null && yMax !== null) ? Math.max(Math.abs(yMin), Math.abs(yMax)) : null;
      const maxDev = (maxAbsX !== null && maxAbsY !== null) ? Math.max(maxAbsX, maxAbsY) : null;
      const isOut = maxDev !== null && maxDev > SPEC_TOLERANCE_UM;

      let verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED' = 'UNANSWERED';
      if (isComplete) {
        verdict = isOut ? 'OUT_OF_SPEC' : 'PASS';
      }

      return {
        indexNum: i,
        isSelected: true,
        xMinUm: xMin,
        xMaxUm: xMax,
        yMinUm: yMin,
        yMaxUm: yMax,
        maxAbsX,
        maxAbsY,
        maxDev,
        isComplete,
        isOut,
        verdict,
        note: indexNotes[i]
      };
    });
  }, [selectedIndices, indexXMinInputs, indexXMaxInputs, indexYMinInputs, indexYMaxInputs, indexNotes]);

  // Selected Active Indices
  const selectedParsedIndices = useMemo(() => {
    return parsedIndices.filter(idx => idx.isSelected);
  }, [parsedIndices]);

  const hasSelectedIndices = selectedParsedIndices.length > 0;
  const hasAllValues = hasSelectedIndices && selectedParsedIndices.every(idx => idx.isComplete);
  const isAnyOutOfSpec = selectedParsedIndices.some(idx => idx.isOut);

  const xMin = useMemo(() => {
    const xs = selectedParsedIndices.filter(i => i.xMinUm !== null).map(i => i.xMinUm!);
    return xs.length > 0 ? Math.min(...xs) : null;
  }, [selectedParsedIndices]);

  const xMax = useMemo(() => {
    const xs = selectedParsedIndices.filter(i => i.xMaxUm !== null).map(i => i.xMaxUm!);
    return xs.length > 0 ? Math.max(...xs) : null;
  }, [selectedParsedIndices]);

  const yMin = useMemo(() => {
    const ys = selectedParsedIndices.filter(i => i.yMinUm !== null).map(i => i.yMinUm!);
    return ys.length > 0 ? Math.min(...ys) : null;
  }, [selectedParsedIndices]);

  const yMax = useMemo(() => {
    const ys = selectedParsedIndices.filter(i => i.yMaxUm !== null).map(i => i.yMaxUm!);
    return ys.length > 0 ? Math.max(...ys) : null;
  }, [selectedParsedIndices]);

  const maxAbsX = useMemo(() => {
    const vals = selectedParsedIndices.filter(i => i.maxAbsX !== null).map(i => i.maxAbsX!);
    return vals.length > 0 ? Math.max(...vals) : null;
  }, [selectedParsedIndices]);

  const maxAbsY = useMemo(() => {
    const vals = selectedParsedIndices.filter(i => i.maxAbsY !== null).map(i => i.maxAbsY!);
    return vals.length > 0 ? Math.max(...vals) : null;
  }, [selectedParsedIndices]);

  const overallMaxDev = useMemo(() => {
    if (maxAbsX === null && maxAbsY === null) return null;
    return Math.max(maxAbsX || 0, maxAbsY || 0);
  }, [maxAbsX, maxAbsY]);

  const liveVerdict = useMemo(() => {
    if (!hasAllValues) return 'UNANSWERED';
    return isAnyOutOfSpec ? 'OUT_OF_SPEC' : 'PASS';
  }, [hasAllValues, isAnyOutOfSpec]);

  // Selection Handlers
  const toggleIndexSelection = (index: number) => {
    if (isReadOnly) return;
    setSelectedIndices(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const applyPresetSelection = (preset: '0_and_3' | '1_and_3' | 'all' | 'none') => {
    if (isReadOnly) return;
    if (preset === '0_and_3') {
      setSelectedIndices([true, false, false, true, false, false]);
    } else if (preset === '1_and_3') {
      setSelectedIndices([false, true, false, true, false, false]);
    } else if (preset === 'all') {
      setSelectedIndices([true, true, true, true, true, true]);
    } else if (preset === 'none') {
      setSelectedIndices([false, false, false, false, false, false]);
    }
  };

  // Input Handlers
  const handleXMinChange = (index: number, val: string) => {
    setIndexXMinInputs(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleXMaxChange = (index: number, val: string) => {
    setIndexXMaxInputs(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleYMinChange = (index: number, val: string) => {
    setIndexYMinInputs(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleYMaxChange = (index: number, val: string) => {
    setIndexYMaxInputs(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showNotification) showNotification('File size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidenceImage(reader.result as string);
      if (showNotification) showNotification('AGC evidence image attached successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setSelectedIndices(Array(INDEX_COUNT).fill(false));
    setIndexXMinInputs(Array(INDEX_COUNT).fill(''));
    setIndexXMaxInputs(Array(INDEX_COUNT).fill(''));
    setIndexYMinInputs(Array(INDEX_COUNT).fill(''));
    setIndexYMaxInputs(Array(INDEX_COUNT).fill(''));
    setIndexNotes(Array(INDEX_COUNT).fill(''));
    setOverallNote('');
    setEvidenceImage('');
    if (showNotification) showNotification(`${activeAgcId === 'agc1' ? 'AGC 1' : 'AGC 2'} inputs cleared for re-run.`);
  };

  // Save Result Handler
  const saveAgcResult = (
    disposition: 'PASS' | 'ACCEPTED_DEVIATION' | 'CONDITIONAL_PASS' | 'WARNING' | 'FAIL'
  ) => {
    if (!hasAllValues || !hasSelectedIndices) {
      if (showNotification) showNotification('Please select active indices and enter complete readings to save.');
      return;
    }

    const agcCode = activeAgcId === 'agc1' ? '05_agc1' : '05_agc2';
    const agcName = activeAgcId === 'agc1' ? 'AGC 1' : 'AGC 2';

    const indexItems: MHCAgcIndexItem[] = parsedIndices.map(idx => ({
      indexNum: idx.indexNum,
      isSelected: idx.isSelected,
      xMinUm: idx.xMinUm,
      xMaxUm: idx.xMaxUm,
      yMinUm: idx.yMinUm,
      yMaxUm: idx.yMaxUm,
      maxAbsXUm: idx.maxAbsX ?? undefined,
      maxAbsYUm: idx.maxAbsY ?? undefined,
      maxDevUm: idx.maxDev ?? undefined,
      xUm: idx.xMaxUm ?? idx.xMinUm,
      yUm: idx.yMaxUm ?? idx.yMinUm,
      specToleranceUm: SPEC_TOLERANCE_UM,
      verdict: idx.verdict,
      engineerNote: idx.note || undefined
    }));

    const systemVerdict: 'PASS' | 'OUT_OF_SPEC' = isAnyOutOfSpec ? 'OUT_OF_SPEC' : 'PASS';
    const finalVerdict: 'PASS' | 'OUT_OF_SPEC' = (disposition === 'PASS' || disposition === 'ACCEPTED_DEVIATION' || disposition === 'CONDITIONAL_PASS') ? 'PASS' : 'OUT_OF_SPEC';
    const status: 'COMPLETED' | 'NEEDS_REVIEW' = (disposition === 'PASS' || disposition === 'ACCEPTED_DEVIATION' || disposition === 'CONDITIONAL_PASS') ? 'COMPLETED' : 'NEEDS_REVIEW';

    const updatedAgcResult: MHCAgcResult = {
      agcId: activeAgcId,
      agcName,
      indices: indexItems,
      xMinUm: xMin ?? undefined,
      xMaxUm: xMax ?? undefined,
      yMinUm: yMin ?? undefined,
      yMaxUm: yMax ?? undefined,
      maxAbsXUm: maxAbsX ?? undefined,
      maxAbsYUm: maxAbsY ?? undefined,
      overallMaxDevUm: overallMaxDev ?? undefined,
      specToleranceUm: SPEC_TOLERANCE_UM,
      systemVerdict,
      engineerDisposition: disposition,
      verdict: finalVerdict,
      status,
      scannerConditionFlag: isAnyOutOfSpec,
      evidenceImage: evidenceImage || undefined,
      engineerNote: overallNote || undefined,
      updatedAt: new Date().toISOString()
    };

    const newAgcData = {
      ...agcData,
      [activeAgcId]: updatedAgcResult
    };

    let updatedSession: MHCSession = {
      ...session,
      agcData: newAgcData
    };

    // Flag downstream if editing previously completed activity
    if (session.autopilotProgress?.activityStatuses?.[agcCode] === 'COMPLETED') {
      updatedSession = flagDownstreamNeedsReview(updatedSession, agcCode);
    }

    // Advance autopilot state for this AGC activity
    updatedSession = advanceAutopilotActivity(
      updatedSession,
      agcCode,
      status,
      overallNote
    );

    // If accepted deviation or conditional pass, record explicit engineer disposition in autopilot progress
    if (disposition === 'ACCEPTED_DEVIATION' || disposition === 'CONDITIONAL_PASS' || disposition === 'WARNING') {
      updatedSession = dispositionAutopilotActivity(
        updatedSession,
        agcCode,
        overallNote || `Accepted by engineer: ${disposition}. Scanner max deviation ${overallMaxDev?.toFixed(2)} µm across ${selectedParsedIndices.length} active indices.`,
        session.engineerName || 'Lead Field Engineer',
        `Engineer Disposition: ${disposition}`,
        disposition
      );
    }

    const otherAgcId = activeAgcId === 'agc1' ? 'agc2' : 'agc1';
    const otherRecord = newAgcData[otherAgcId];
    const isOtherAddressed = otherRecord?.verdict === 'PASS' || otherRecord?.verdict === 'OUT_OF_SPEC';
    const isBothPass = finalVerdict === 'PASS' && otherRecord?.verdict === 'PASS';

    onUpdateSession(updatedSession);

    if (isOtherAddressed) {
      if (showNotification) {
        if (isBothPass) {
          showNotification(`AGC 1 & AGC 2 saved with Engineer Disposition (${disposition}). Advanced to Day 3 Temperature & Evidence.`);
        } else {
          showNotification(`AGC calibration saved with Engineer Disposition (${disposition}). Review flagged items.`);
        }
      }
      onCompleteActivity(updatedSession);
    } else {
      if (showNotification) {
        showNotification(`${agcName} calibrated (${disposition}). Please calibrate ${otherAgcId === 'agc1' ? 'AGC 1' : 'AGC 2'} scanner.`);
      }
      setActiveAgcId(otherAgcId);
    }
  };

  const getAgcTabStatus = (id: 'agc1' | 'agc2') => {
    const rec = agcData[id];
    if (!rec || rec.status === 'NOT_STARTED' || rec.verdict === 'UNANSWERED') {
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raised text-theme-muted border border-theme-default">
          NOT CALIBRATED
        </span>
      );
    }
    if (rec.verdict === 'PASS') {
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          PASS ({rec.overallMaxDevUm ? `${rec.overallMaxDevUm.toFixed(2)}µm` : 'OK'})
        </span>
      );
    }
    if (rec.verdict === 'OUT_OF_SPEC') {
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1">
          <XCircle className="w-3 h-3 text-rose-500" />
          OUT OF SPEC ({rec.overallMaxDevUm ? `${rec.overallMaxDevUm.toFixed(2)}µm` : 'FAIL'})
        </span>
      );
    }
    return null;
  };

  const formatSignedUm = (val: number | null): string => {
    if (val === null || val === undefined) return '—';
    return val > 0 ? `+${val.toFixed(2)} µm` : `${val.toFixed(2)} µm`;
  };

  return (
    <div className="space-y-6">
      {/* Activity Header Banner */}
      <div className="p-4 rounded-card border border-theme-default bg-surface space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-default pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">§10 · AUTOPILOT ACTIVITY 05</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-raised text-theme-muted border border-theme-default">
                  DAY 2 CALIBRATION
                </span>
              </div>
              <h2 className="text-lg font-bold text-theme-primary">
                AGC / Scanner Calibration (Active Indices Min/Max)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-theme-muted">TOLERANCE:</span>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
              ±{SPEC_TOLERANCE_UM.toFixed(1)} µm
            </span>
          </div>
        </div>

        <p className="text-xs text-theme-secondary leading-relaxed">
          Galvo scanner &amp; Automatic Grid Calibration (AGC) positional verification. Select only the indices calibrated (e.g. Index 0 + 3, Index 1 + 3, or all active indices). Record signed X Min/Max and Y Min/Max deviations. Unselected indices require no readings and are excluded from evaluation and report output.
        </p>
      </div>

      {/* Scanner Head Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['agc1', 'agc2'] as const).map((agcIdKey) => {
          const isActive = activeAgcId === agcIdKey;
          const label = agcIdKey === 'agc1' ? 'AGC 1 — Head 1 Scanner' : 'AGC 2 — Head 2 Scanner';
          const code = agcIdKey === 'agc1' ? '05_agc1' : '05_agc2';

          return (
            <button
              key={agcIdKey}
              type="button"
              onClick={() => setActiveAgcId(agcIdKey)}
              className={`p-3.5 rounded-card border text-left flex items-center justify-between transition-all cursor-pointer ${
                isActive
                  ? 'bg-surface border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                  : 'bg-raised border-theme-default hover:border-theme-strong text-theme-secondary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className={`w-4 h-4 ${isActive ? 'text-cyan-500' : 'text-theme-muted'}`} />
                <div>
                  <div className="text-xs font-mono font-bold text-theme-muted">{code}</div>
                  <div className="text-sm font-bold text-theme-primary">{label}</div>
                </div>
              </div>
              <div>{getAgcTabStatus(agcIdKey)}</div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace for Active AGC Head */}
      <div className="p-5 rounded-card border space-y-6 bg-raised border-theme-default">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-theme-primary flex items-center gap-2">
              <span>{activeAgcId === 'agc1' ? 'AGC 1 (Head 1 Scanner)' : 'AGC 2 (Head 2 Scanner)'} Active Calibrated Indices</span>
              {agcData[activeAgcId]?.status === 'COMPLETED' && agcData[activeAgcId]?.verdict === 'PASS' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Authoritative Record
                </span>
              )}
            </h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Select only indices that were physically calibrated. Unselected indices are excluded from validation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isReadOnly}
              className="text-xs font-semibold text-theme-muted hover:text-theme-primary flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-enter Readings
            </button>
          </div>
        </div>

        {/* Index Quick Selection Toolbar */}
        <div className="p-3 rounded-lg border border-theme-default bg-workspace flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-theme-secondary font-mono">ACTIVE INDICES:</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              {selectedParsedIndices.length} of 6 selected
            </span>
          </div>

          {!isReadOnly && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-theme-muted uppercase font-mono mr-1">Quick Select:</span>
              <button
                type="button"
                onClick={() => applyPresetSelection('0_and_3')}
                className="px-2 py-1 rounded text-xs font-mono font-semibold bg-raised hover:bg-surface border border-theme-default text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
              >
                Indices 0 &amp; 3
              </button>
              <button
                type="button"
                onClick={() => applyPresetSelection('1_and_3')}
                className="px-2 py-1 rounded text-xs font-mono font-semibold bg-raised hover:bg-surface border border-theme-default text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
              >
                Indices 1 &amp; 3
              </button>
              <button
                type="button"
                onClick={() => applyPresetSelection('all')}
                className="px-2 py-1 rounded text-xs font-mono font-semibold bg-raised hover:bg-surface border border-theme-default text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
              >
                All 0–5
              </button>
              <button
                type="button"
                onClick={() => applyPresetSelection('none')}
                className="px-2 py-1 rounded text-xs font-mono font-semibold bg-raised hover:bg-surface border border-theme-default text-theme-muted hover:text-rose-500 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Index 0–5 Input Table Grid (Min/Max signed inputs) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-theme-muted font-semibold uppercase tracking-wider border-theme-default bg-workspace">
                <th className="py-2.5 px-3">Calibrate? / Index</th>
                <th className="py-2.5 px-3">X Deviation Range (µm)</th>
                <th className="py-2.5 px-3">Y Deviation Range (µm)</th>
                <th className="py-2.5 px-3">Max Dev</th>
                <th className="py-2.5 px-3">Tolerance</th>
                <th className="py-2.5 px-3">Index Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y border-theme-default divide-theme-default">
              {parsedIndices.map((idxItem) => {
                const i = idxItem.indexNum;
                const isSelected = idxItem.isSelected;

                return (
                  <tr 
                    key={i} 
                    className={`transition-colors ${
                      isSelected 
                        ? 'hover:bg-workspace/50 bg-workspace/20' 
                        : 'opacity-40 bg-workspace/5 hover:opacity-60'
                    }`}
                  >
                    {/* Index Selection & Label */}
                    <td className="py-3 px-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleIndexSelection(i)}
                          disabled={isReadOnly}
                          className="w-4 h-4 rounded border-theme-default text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                        <span className={`font-mono font-bold text-xs ${isSelected ? 'text-theme-primary' : 'text-theme-muted'}`}>
                          Index {i}
                        </span>
                      </label>
                    </td>

                    {/* X Range Min / Max Inputs */}
                    <td className="py-2 px-3">
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="X Min"
                              value={indexXMinInputs[i]}
                              onChange={(e) => handleXMinChange(i, e.target.value)}
                              disabled={isReadOnly}
                              className={`w-full px-2 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                                idxItem.xMinUm !== null && Math.abs(idxItem.xMinUm) > SPEC_TOLERANCE_UM
                                  ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 focus:ring-rose-500'
                                  : 'bg-workspace border-theme-default text-theme-primary focus:border-cyan-500'
                              }`}
                            />
                            <span className="absolute right-1.5 top-1.5 text-[9px] text-theme-muted font-mono pointer-events-none">µm</span>
                          </div>
                          <span className="text-theme-muted font-mono text-[11px] shrink-0">to</span>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="X Max"
                              value={indexXMaxInputs[i]}
                              onChange={(e) => handleXMaxChange(i, e.target.value)}
                              disabled={isReadOnly}
                              className={`w-full px-2 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                                idxItem.xMaxUm !== null && Math.abs(idxItem.xMaxUm) > SPEC_TOLERANCE_UM
                                  ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 focus:ring-rose-500'
                                  : 'bg-workspace border-theme-default text-theme-primary focus:border-cyan-500'
                              }`}
                            />
                            <span className="absolute right-1.5 top-1.5 text-[9px] text-theme-muted font-mono pointer-events-none">µm</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-theme-muted font-mono text-xs italic">Excluded</span>
                      )}
                    </td>

                    {/* Y Range Min / Max Inputs */}
                    <td className="py-2 px-3">
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Y Min"
                              value={indexYMinInputs[i]}
                              onChange={(e) => handleYMinChange(i, e.target.value)}
                              disabled={isReadOnly}
                              className={`w-full px-2 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                                idxItem.yMinUm !== null && Math.abs(idxItem.yMinUm) > SPEC_TOLERANCE_UM
                                  ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 focus:ring-rose-500'
                                  : 'bg-workspace border-theme-default text-theme-primary focus:border-cyan-500'
                              }`}
                            />
                            <span className="absolute right-1.5 top-1.5 text-[9px] text-theme-muted font-mono pointer-events-none">µm</span>
                          </div>
                          <span className="text-theme-muted font-mono text-[11px] shrink-0">to</span>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Y Max"
                              value={indexYMaxInputs[i]}
                              onChange={(e) => handleYMaxChange(i, e.target.value)}
                              disabled={isReadOnly}
                              className={`w-full px-2 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                                idxItem.yMaxUm !== null && Math.abs(idxItem.yMaxUm) > SPEC_TOLERANCE_UM
                                  ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 focus:ring-rose-500'
                                  : 'bg-workspace border-theme-default text-theme-primary focus:border-cyan-500'
                              }`}
                            />
                            <span className="absolute right-1.5 top-1.5 text-[9px] text-theme-muted font-mono pointer-events-none">µm</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-theme-muted font-mono text-xs italic">Excluded</span>
                      )}
                    </td>

                    {/* Max Dev */}
                    <td className="py-3 px-3 font-mono">
                      {isSelected ? (
                        idxItem.maxDev !== null ? (
                          <span className={`font-bold ${idxItem.maxDev > SPEC_TOLERANCE_UM ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                            {idxItem.maxDev.toFixed(2)} µm
                          </span>
                        ) : (
                          <span className="text-theme-muted">—</span>
                        )
                      ) : (
                        <span className="text-theme-muted">—</span>
                      )}
                    </td>

                    {/* Spec Limit */}
                    <td className="py-3 px-3 font-mono text-theme-muted">
                      ±3.0 µm
                    </td>

                    {/* Index Verdict */}
                    <td className="py-3 px-3">
                      {!isSelected ? (
                        <span className="text-[11px] text-theme-muted italic">Not Calibrated</span>
                      ) : idxItem.verdict === 'PASS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> PASS
                        </span>
                      ) : idxItem.verdict === 'OUT_OF_SPEC' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] border border-rose-500/30">
                          <XCircle className="w-3 h-3 text-rose-500" /> OUT OF SPEC
                        </span>
                      ) : (
                        <span className="text-[11px] text-theme-muted italic">Enter readings</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Real-time Summary Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Max Abs X */}
          <div className={`p-3.5 rounded-card border ${
            maxAbsX === null
              ? 'bg-workspace border-theme-default'
              : maxAbsX > SPEC_TOLERANCE_UM
                ? 'bg-rose-500/10 border-rose-500/40'
                : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="text-[11px] text-theme-muted font-medium">Max Abs X Deviation</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              maxAbsX === null
                ? 'text-theme-muted'
                : maxAbsX > SPEC_TOLERANCE_UM
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {maxAbsX !== null ? `${maxAbsX.toFixed(2)} µm` : '—'}
            </div>
            <div className="text-[10px] text-theme-muted mt-1 font-mono flex items-center justify-between">
              <span>{maxAbsX !== null ? (maxAbsX <= SPEC_TOLERANCE_UM ? '✓ ≤ 3.0 µm' : '⚠ Exceeds Limit') : 'Awaiting inputs'}</span>
              {xMin !== null && xMax !== null && (
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400">[{formatSignedUm(xMin)}, {formatSignedUm(xMax)}]</span>
              )}
            </div>
          </div>

          {/* Max Abs Y */}
          <div className={`p-3.5 rounded-card border ${
            maxAbsY === null
              ? 'bg-workspace border-theme-default'
              : maxAbsY > SPEC_TOLERANCE_UM
                ? 'bg-rose-500/10 border-rose-500/40'
                : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="text-[11px] text-theme-muted font-medium">Max Abs Y Deviation</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              maxAbsY === null
                ? 'text-theme-muted'
                : maxAbsY > SPEC_TOLERANCE_UM
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {maxAbsY !== null ? `${maxAbsY.toFixed(2)} µm` : '—'}
            </div>
            <div className="text-[10px] text-theme-muted mt-1 font-mono flex items-center justify-between">
              <span>{maxAbsY !== null ? (maxAbsY <= SPEC_TOLERANCE_UM ? '✓ ≤ 3.0 µm' : '⚠ Exceeds Limit') : 'Awaiting inputs'}</span>
              {yMin !== null && yMax !== null && (
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400">[{formatSignedUm(yMin)}, {formatSignedUm(yMax)}]</span>
              )}
            </div>
          </div>

          {/* Overall Max Dev */}
          <div className={`p-3.5 rounded-card border ${
            overallMaxDev === null
              ? 'bg-workspace border-theme-default'
              : overallMaxDev > SPEC_TOLERANCE_UM
                ? 'bg-rose-500/10 border-rose-500/40'
                : 'bg-cyan-500/10 border-cyan-500/30'
          }`}>
            <div className="text-[11px] text-theme-muted font-medium">Overall Max Deviation</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              overallMaxDev === null
                ? 'text-theme-muted'
                : overallMaxDev > SPEC_TOLERANCE_UM
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-cyan-600 dark:text-cyan-400'
            }`}>
              {overallMaxDev !== null ? `${overallMaxDev.toFixed(2)} µm` : '—'}
            </div>
            <div className="text-[10px] text-theme-muted mt-1 font-mono">
              {hasSelectedIndices ? `Across ${selectedParsedIndices.length} Active Indices (±3.0 µm Limit)` : 'Select indices to calibrate'}
            </div>
          </div>

          {/* Overall AGC Verdict Badge */}
          <div className={`p-3.5 rounded-card border flex flex-col justify-between ${
            liveVerdict === 'PASS'
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : liveVerdict === 'OUT_OF_SPEC'
                ? 'bg-rose-500/10 border-rose-500/50'
                : 'bg-workspace border-theme-default'
          }`}>
            <div className="text-[11px] text-theme-muted font-medium">Overall AGC Status</div>
            <div className="mt-1">
              {liveVerdict === 'PASS' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>PASS (Within Spec)</span>
                </div>
              )}
              {liveVerdict === 'OUT_OF_SPEC' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-500/40">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>OUT OF SPEC</span>
                </div>
              )}
              {liveVerdict === 'UNANSWERED' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-raised text-theme-muted font-bold text-xs border border-theme-default">
                  <Info className="w-4 h-4 text-theme-muted" />
                  <span>{!hasSelectedIndices ? 'NO INDICES SELECTED' : 'INCOMPLETE'}</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-theme-muted mt-1">
              {!hasSelectedIndices 
                ? 'Select calibrated indices above' 
                : liveVerdict === 'PASS' 
                  ? 'Ready to confirm' 
                  : liveVerdict === 'OUT_OF_SPEC' 
                    ? 'Scanner issue flagged' 
                    : 'Enter all active index values'}
            </div>
          </div>
        </div>

        {/* Signed Engineering Telemetry Matrix */}
        <div className="p-3 rounded-card border border-theme-default grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-workspace">
          <div>
            <span className="text-[10px] text-theme-muted block uppercase font-sans">X Min (Signed)</span>
            <strong className={`text-sm ${xMin !== null && Math.abs(xMin) > SPEC_TOLERANCE_UM ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
              {formatSignedUm(xMin)}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-theme-muted block uppercase font-sans">X Max (Signed)</span>
            <strong className={`text-sm ${xMax !== null && Math.abs(xMax) > SPEC_TOLERANCE_UM ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
              {formatSignedUm(xMax)}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-theme-muted block uppercase font-sans">Y Min (Signed)</span>
            <strong className={`text-sm ${yMin !== null && Math.abs(yMin) > SPEC_TOLERANCE_UM ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
              {formatSignedUm(yMin)}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-theme-muted block uppercase font-sans">Y Max (Signed)</span>
            <strong className={`text-sm ${yMax !== null && Math.abs(yMax) > SPEC_TOLERANCE_UM ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
              {formatSignedUm(yMax)}
            </strong>
          </div>
        </div>

        {/* SCANNER CONDITION WARNING (if OUT_OF_SPEC) */}
        {hasAllValues && isAnyOutOfSpec && (
          <div className="p-4 rounded-card bg-rose-500/10 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>Scanner calibration outside specification — scanner condition requires engineering attention.</span>
            </div>
            <p className="text-rose-600/90 dark:text-rose-300/90 pl-7 leading-relaxed">
              One or more active AGC index deviation readings exceed the ±3.0 µm limit ({overallMaxDev?.toFixed(2)} µm max deviation). Pass cannot be granted without physical scanner calibration correction.
            </p>
            <div className="ml-7 pt-1 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Engineering Planning Datum:</strong> Scanner service or replacement is typically considered around a 2-year operational interval. The service engineer must determine the final corrective action.
              </span>
            </div>
          </div>
        )}

        {hasAllValues && !isAnyOutOfSpec && (
          <div className="p-4 rounded-card bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold text-emerald-600 dark:text-emerald-300">
                PASS — All {selectedParsedIndices.length} Calibrated AGC Indices Within Specification
              </span>
              <p className="text-emerald-600/80 dark:text-emerald-300/80 mt-0.5">
                Maximum scanner index deviation is {overallMaxDev?.toFixed(2)} µm (Tolerance benchmark: ±3.0 µm). Ready to record authoritative result.
              </p>
            </div>
          </div>
        )}

        {/* Optional Attachments & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Optional Engineer Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-secondary flex items-center justify-between">
              <span>Optional Engineer Note</span>
              <span className="text-[10px] text-theme-muted">Calibration observation or re-run log</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. AGC gain table re-loaded on run 2. Selected indices 0 & 3 verified."
              value={overallNote}
              onChange={e => setOverallNote(e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 rounded-lg border text-xs transition-all bg-workspace border-theme-default text-theme-primary focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Optional Evidence Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-secondary flex items-center justify-between">
              <span>Optional AGC Report / Evidence Image</span>
              <span className="text-[10px] text-theme-muted">Attach external AGC printout or plot</span>
            </label>

            {evidenceImage ? (
              <div className="relative p-2 rounded-card border border-theme-default bg-workspace flex items-center gap-3">
                <img
                  src={evidenceImage}
                  alt="AGC Calibration Evidence"
                  className="w-14 h-14 object-cover rounded-lg border border-theme-default"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <div className="font-semibold text-theme-primary truncate">AGC Evidence Attached</div>
                  <div className="text-[10px] text-theme-muted">Optional evidence ready</div>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setEvidenceImage('')}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <label className="p-3 rounded-card border border-dashed text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-workspace border-theme-default hover:border-theme-strong">
                <div className="flex items-center gap-2 text-xs text-theme-muted font-medium">
                  <Upload className="w-4 h-4 text-cyan-500" />
                  <span>Click to attach AGC plot / report image</span>
                </div>
                <span className="text-[10px] text-theme-muted">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isReadOnly}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Engineer Disposition Selection & Control Block */}
        {hasAllValues && (
          <div className="p-4 rounded-card border border-cyan-500/30 bg-cyan-500/5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-default pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                  Engineer Activity Disposition
                </span>
                <span className="text-[10px] text-theme-muted font-sans">
                  (System Result: <strong className={isAnyOutOfSpec ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>{isAnyOutOfSpec ? 'OUT OF SPEC' : 'PASS'}</strong>)
                </span>
              </div>
              <span className="text-[10px] font-mono text-theme-muted">
                Independent Field Engineer Review
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDisposition('PASS')}
                disabled={isReadOnly}
                className={`p-2.5 rounded-card border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedDisposition === 'PASS'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm'
                    : 'bg-surface border-theme-default text-theme-secondary hover:border-theme-strong'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">PASS</span>
                  {selectedDisposition === 'PASS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
                <span className="text-[10px] text-theme-muted mt-1">Within Spec / Verified</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDisposition('ACCEPTED_DEVIATION')}
                disabled={isReadOnly}
                className={`p-2.5 rounded-card border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedDisposition === 'ACCEPTED_DEVIATION'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-600 dark:text-cyan-300 ring-1 ring-cyan-500/50 shadow-sm'
                    : 'bg-surface border-theme-default text-theme-secondary hover:border-theme-strong'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">ACCEPTED DEVIATION</span>
                  {selectedDisposition === 'ACCEPTED_DEVIATION' && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                </div>
                <span className="text-[10px] text-theme-muted mt-1">Accept Drift &amp; Proceed</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDisposition('CONDITIONAL_PASS')}
                disabled={isReadOnly}
                className={`p-2.5 rounded-card border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedDisposition === 'CONDITIONAL_PASS'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/50 shadow-sm'
                    : 'bg-surface border-theme-default text-theme-secondary hover:border-theme-strong'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">CONDITIONAL PASS</span>
                  {selectedDisposition === 'CONDITIONAL_PASS' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                </div>
                <span className="text-[10px] text-theme-muted mt-1">Monitor next interval</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDisposition('FAIL')}
                disabled={isReadOnly}
                className={`p-2.5 rounded-card border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  selectedDisposition === 'FAIL'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-300 ring-1 ring-rose-500/50 shadow-sm'
                    : 'bg-surface border-theme-default text-theme-secondary hover:border-theme-strong'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">FAIL</span>
                  {selectedDisposition === 'FAIL' && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                </div>
                <span className="text-[10px] text-theme-muted mt-1">Scanner fix required</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-theme-default">
          <div className="text-xs text-theme-secondary font-mono">
            Active Scanner: <span className="font-bold text-theme-primary">{activeAgcId === 'agc1' ? 'AGC 1 (Head 1 Scanner)' : 'AGC 2 (Head 2 Scanner)'}</span>
            {hasAllValues && (
              <span className="ml-2 text-cyan-600 dark:text-cyan-400 font-semibold">
                • Disposition: {selectedDisposition} ({selectedParsedIndices.length} indices)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {hasAllValues && !isReadOnly && (
              <button
                type="button"
                onClick={() => saveAgcResult(selectedDisposition)}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  selectedDisposition === 'FAIL'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : selectedDisposition === 'ACCEPTED_DEVIATION'
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : selectedDisposition === 'CONDITIONAL_PASS'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Save {activeAgcId === 'agc1' ? 'AGC 1' : 'AGC 2'} ({selectedDisposition})</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}

            {(!hasAllValues || isReadOnly) && (
              <button
                type="button"
                disabled
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-raised text-theme-muted font-bold text-xs border border-theme-default cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>
                  {!hasSelectedIndices 
                    ? 'Select at Least 1 Calibrated Index to Save' 
                    : `Enter All Readings for ${selectedParsedIndices.length} Selected Indices to Save`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
