import React, { useState, useEffect, useMemo } from 'react';
import {
  Crosshair,
  CheckCircle2,
  Upload,
  Eye,
  Sparkles,
  Layers,
  Info,
  ShieldCheck,
  Save,
  Check,
  RotateCcw,
  Zap
} from 'lucide-react';
import { Machine, MHCSession } from '../../../types';
import {
  FOCUS_WAFER_POSITIONS,
  FocusOptimizationRecord,
  FocusWaferPosition,
  LaserFocusEvidence,
  WaferPositionEvidence
} from '../../../types/focusOptimization';
import { FocusOptimizationEngine } from '../../../utils/focusOptimizationEngine';
import { ImageStore } from '../../../utils/imageStore';
import { getLocalDateString } from '../../../utils/timeUtils';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { advanceAutopilotActivity, flagDownstreamNeedsReview } from '../../../utils/mhcAutopilotBrain';

export interface MhcFocusOptimizationActivityProps {
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

export const MhcFocusOptimizationActivity: React.FC<MhcFocusOptimizationActivityProps> = ({
  session,
  machine,
  isReadOnly = false,
  onUpdateSession,
  onCompleteActivity,
  isDark,
  showNotification,
  activeCode = '03_focus'
}) => {
  // Determine active initial record
  const initialRecord = useMemo<FocusOptimizationRecord>(() => {
    if (session.focusOptimizationRecord) {
      return ImageStore.hydrateImagesSync(session.focusOptimizationRecord);
    }
    if (session.focusOptimizationRecords && session.focusOptimizationRecords.length > 0) {
      return ImageStore.hydrateImagesSync(session.focusOptimizationRecords[0]);
    }
    if (machine?.focusOptimizationRecords && machine.focusOptimizationRecords.length > 0) {
      const cloned = { ...machine.focusOptimizationRecords[0], id: `FO-AUTOPILOT-${Date.now()}` };
      return ImageStore.hydrateImagesSync(cloned);
    }
    return FocusOptimizationEngine.createDefaultRecord(
      session.startDate || getLocalDateString(),
      session.engineerName || 'Lead Field Engineer'
    );
  }, [session, machine]);

  const [record, setRecord] = useState<FocusOptimizationRecord>(initialRecord);
  const [activeHead, setActiveHead] = useState<'laser1' | 'laser2'>('laser1');
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);
  const [engineerNotes, setEngineerNotes] = useState<string>(
    session.autopilotProgress?.activityNotes?.[activeCode] || ''
  );

  // Sync state if session prop updates from outside
  useEffect(() => {
    if (session.focusOptimizationRecord) {
      setRecord(ImageStore.hydrateImagesSync(session.focusOptimizationRecord));
    }
  }, [session.focusOptimizationRecord]);

  const activeEvidence: LaserFocusEvidence = useMemo(() => {
    return activeHead === 'laser1' ? record.laser1 : record.laser2;
  }, [record, activeHead]);

  // Handle Best Focus Selection
  const handleSelectBestFocus = (position: FocusWaferPosition) => {
    if (isReadOnly) return;
    setRecord(prev => {
      const updatedHead: LaserFocusEvidence = {
        ...prev[activeHead],
        selectedBestFocusPosition: position
      };
      return {
        ...prev,
        [activeHead]: updatedHead
      };
    });
  };

  // Handle Diameter change for a specific position
  const handleDiameterChange = (position: FocusWaferPosition, val: string) => {
    if (isReadOnly) return;
    const num = parseFloat(val);
    setRecord(prev => {
      const head = prev[activeHead];
      const posData: WaferPositionEvidence = head.positions[position] || { position };
      return {
        ...prev,
        [activeHead]: {
          ...head,
          positions: {
            ...head.positions,
            [position]: {
              ...posData,
              drillDiameterUm: isNaN(num) ? undefined : num
            }
          }
        }
      };
    });
  };

  // Handle Single Micrograph Image Upload
  const handleImageUpload = (position: FocusWaferPosition, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setRecord(prev => {
        const head = prev[activeHead];
        const posData: WaferPositionEvidence = head.positions[position] || { position };
        return {
          ...prev,
          [activeHead]: {
            ...head,
            positions: {
              ...head.positions,
              [position]: {
                ...posData,
                imageDataUrl: result
              }
            }
          }
        };
      });
      if (showNotification) showNotification(`Image uploaded for position ${position} (${activeHead.toUpperCase()})`);
    };
    reader.readAsDataURL(file);
  };

  // Generate crisp synthetic SVG micrographs for all 7 positions on the active head
  const handleGenerateSynthetic = () => {
    if (isReadOnly) return;
    setRecord(prev => {
      const head = prev[activeHead];
      const updatedPositions = { ...head.positions };

      FOCUS_WAFER_POSITIONS.forEach((pos) => {
        const svg = FocusOptimizationEngine.generateSyntheticWaferDrillSvg(
          head.laserLabel,
          pos,
          pos === head.selectedBestFocusPosition ? '#38bdf8' : '#94a3b8'
        );
        updatedPositions[pos] = {
          ...(updatedPositions[pos] || { position: pos }),
          imageDataUrl: svg,
          drillDiameterUm: pos === '0' ? 50.0 : Number((50 + Math.abs(parseInt(pos, 10)) * 2.5).toFixed(1))
        };
      });

      return {
        ...prev,
        [activeHead]: {
          ...head,
          positions: updatedPositions
        }
      };
    });

    if (showNotification) {
      showNotification(`Generated synthetic wafer micrographs for ${activeHead === 'laser1' ? 'Laser 1' : 'Laser 2'}`);
    }
  };

  // Save Record Draft to Session
  const handleSaveDraft = () => {
    const updated: MHCSession = {
      ...session,
      focusOptimizationRecord: record,
      focusOptimizationRecords: [record]
    };
    onUpdateSession(updated);
    if (showNotification) showNotification('Focus Optimization draft saved.');
  };

  // Complete Activity 03 Focus Optimization
  const handleComplete = () => {
    const l1Best = record.laser1?.selectedBestFocusPosition;
    const l2Best = record.laser2?.selectedBestFocusPosition;

    if (!l1Best || !l2Best) {
      if (showNotification) {
        showNotification('Please select optimal focus position for both Laser 1 and Laser 2 before completing.');
      }
      return;
    }

    const completedRecord: FocusOptimizationRecord = {
      ...record,
      overallResult: 'PASS'
    };

    let updatedSession: MHCSession = {
      ...session,
      focusOptimizationRecord: completedRecord,
      focusOptimizationRecords: [completedRecord]
    };

    if (session.autopilotProgress?.activityStatuses?.[activeCode] === 'COMPLETED') {
      updatedSession = flagDownstreamNeedsReview(updatedSession, activeCode);
    }

    const noteToPersist = engineerNotes || `Focus verified — L1: ${l1Best}, L2: ${l2Best} (Dummy Wafer Drill)`;

    updatedSession = advanceAutopilotActivity(
      updatedSession,
      activeCode,
      'COMPLETED',
      noteToPersist
    );

    onUpdateSession(updatedSession);

    if (showNotification) {
      showNotification('Activity 03 Focus Optimization COMPLETED ✓ Advanced to Day 3 AGC Calibration.');
    }

    onCompleteActivity(updatedSession, activeCode, 'COMPLETED');
  };

  const isCurrentCompleted = session.autopilotProgress?.activityStatuses?.[activeCode] === 'COMPLETED';

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border space-y-6 ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              DAY 2 • ACTIVITY 03
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              OPTICAL ALIGNMENT
            </Badge>
            {isCurrentCompleted && (
              <Badge variant="success" className="text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-sky-500" />
            Focus Optimization (Laser 1 & 2)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dummy wafer laser drill inspection across 7 defocus steps (-3 to +3). Select the optimal focal height for both heads.
          </p>
        </div>

        {/* Dual Laser Head Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveHead('laser1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeHead === 'laser1'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Laser Head 1
            {record.laser1?.selectedBestFocusPosition && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {record.laser1.selectedBestFocusPosition}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveHead('laser2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeHead === 'laser2'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Laser Head 2
            {record.laser2?.selectedBestFocusPosition && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {record.laser2.selectedBestFocusPosition}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Specification & Parameters Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
          <div className="text-xs space-y-0.5">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Machining Focus Calibration Procedure
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              Drill on dummy wafer across positions <span className="font-mono font-medium">+3, +2, +1, 0, -1, -2, -3</span>. Position <span className="font-mono font-medium">0</span> represents nominal focal plane.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSynthetic}
            disabled={isReadOnly}
            className="text-xs flex items-center gap-1.5 border-dashed border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Wafer Micrographs
          </Button>
        </div>
      </div>

      {/* Defocus Position Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            {activeHead === 'laser1' ? 'Laser Head 1' : 'Laser Head 2'} Defocus Wafer Grid
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Selected Optimal Focus: <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{activeEvidence.selectedBestFocusPosition || 'Not Set'}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {FOCUS_WAFER_POSITIONS.map((pos) => {
            const posData: WaferPositionEvidence = activeEvidence.positions[pos] || { position: pos };
            const isBest = activeEvidence.selectedBestFocusPosition === pos;
            const imgUrl = posData.imageDataUrl ? ImageStore.resolveImage(posData.imageDataUrl) : null;

            return (
              <div
                key={pos}
                className={`relative rounded-xl border p-3 flex flex-col items-center justify-between gap-2.5 transition-all ${
                  isBest
                    ? 'border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/30'
                    : isDark
                    ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Header Tag */}
                <div className="w-full flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    pos === '0'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {pos === '0' ? '0 (Nominal)' : pos}
                  </span>
                  {isBest && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500 text-white shadow-xs">
                      BEST
                    </span>
                  )}
                </div>

                {/* Micrograph Preview */}
                <div className="w-full aspect-square rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center relative group">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`Position ${pos}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <Crosshair className="w-6 h-6 mx-auto mb-1 stroke-1 opacity-50" />
                      <span className="text-[10px]">No image</span>
                    </div>
                  )}

                  {imgUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ title: `Position ${pos} (${activeHead.toUpperCase()})`, url: imgUrl })}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  )}
                </div>

                {/* Diameter & Actions */}
                <div className="w-full space-y-1.5">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ø µm"
                      value={posData.drillDiameterUm ?? ''}
                      onChange={(e) => handleDiameterChange(pos, e.target.value)}
                      disabled={isReadOnly}
                      className="w-full text-center text-xs font-mono py-1 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400">µm</span>
                  </div>

                  <div className="flex items-center gap-1 w-full">
                    <label className="flex-1 cursor-pointer py-1 px-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-center text-[10px] text-slate-600 dark:text-slate-300 transition-colors">
                      <Upload className="w-2.5 h-2.5 inline mr-1" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(pos, e)}
                        disabled={isReadOnly}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleSelectBestFocus(pos)}
                      disabled={isReadOnly}
                      className={`py-1 px-2 rounded text-[10px] font-semibold transition-all ${
                        isBest
                          ? 'bg-sky-500 text-white'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-500 hover:text-sky-500'
                      }`}
                      title="Set as optimal focus position"
                    >
                      <Check className="w-2.5 h-2.5 inline" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engineer Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Focus Optimization Engineer Notes
        </label>
        <textarea
          rows={2}
          value={engineerNotes}
          onChange={(e) => setEngineerNotes(e.target.value)}
          disabled={isReadOnly}
          placeholder="Document wafer batch, defocus observations, or optical adjustment notes..."
          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-sky-500" />
          <span>Status: L1 Best Focus = <strong className="font-mono text-slate-800 dark:text-slate-200">{record.laser1?.selectedBestFocusPosition || 'None'}</strong> • L2 Best Focus = <strong className="font-mono text-slate-800 dark:text-slate-200">{record.laser2?.selectedBestFocusPosition || 'None'}</strong></span>
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
            className="flex-1 sm:flex-none text-xs bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Complete Focus Activity
          </Button>
        </div>
      </div>

      {/* Full-size Image Preview Modal */}
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
