import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Sliders, 
  Compass, 
  Layers, 
  X,
  FileSearch
} from 'lucide-react';
import { MHCSession, MHCHeadInspectionState, MHCStageCalibrationResult, MHCAgcResult } from '../../../types';
import { ImageStore } from '../../../utils/imageStore';

interface MhcHistoryFindingsTabProps {
  session: MHCSession;
  isDark: boolean;
}

export const MhcHistoryFindingsTab: React.FC<MhcHistoryFindingsTabProps> = ({
  session,
  isDark
}) => {
  const [selectedImage, setSelectedImage] = useState<{ src: string; caption: string } | null>(null);

  // Extract head inspection findings
  const headEntries: [string, MHCHeadInspectionState][] = session.inspectionFindings 
    ? (Object.entries(session.inspectionFindings) as [string, MHCHeadInspectionState][]) 
    : [];
  
  // Extract stage calibration checks
  const stageResults: MHCStageCalibrationResult[] = session.stageCalibrationData 
    ? (Object.values(session.stageCalibrationData) as MHCStageCalibrationResult[]) 
    : [];
  
  // Extract AGC calibration checks
  const agcResults: MHCAgcResult[] = session.agcData 
    ? (Object.values(session.agcData) as MHCAgcResult[]) 
    : [];

  const totalHeadFindings = headEntries.reduce((acc, [, h]) => acc + (h.findings?.length || 0), 0);
  const hasCalibrationData = stageResults.length > 0 || agcResults.length > 0;
  const hasAnyFindingsOrChecks = totalHeadFindings > 0 || hasCalibrationData || headEntries.length > 0;

  const getActionBadge = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'replacement required':
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            REPLACEMENT REQUIRED
          </span>
        );
      case 'recommended replacement':
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            REC. REPLACEMENT
          </span>
        );
      case 'clean':
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            CLEANING REQUIRED
          </span>
        );
      case 'monitor':
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            MONITOR CONDITION
          </span>
        );
      default:
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {action || 'INSPECT'}
          </span>
        );
    }
  };

  if (!hasAnyFindingsOrChecks) {
    return (
      <div
        id="mhc-history-findings-empty"
        className={`p-8 text-center rounded-md border ${
          isDark ? 'bg-[#15181C] border-[#242930] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <FileSearch className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold text-slate-200 dark:text-slate-100">
          No Inspection Findings Recorded
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No optical, mechanical, or stage calibration findings were logged during this service session.
        </p>
      </div>
    );
  }

  return (
    <div id="mhc-history-findings-tab" className="space-y-6">
      {/* Laser Head Inspection Findings */}
      {headEntries.map(([headKey, headState]) => {
        const hasIssue = headState.decision === 'ISSUE_FOUND';
        const findings = headState.findings || [];

        return (
          <div
            key={headKey}
            id={`mhc-history-head-finding-${headKey}`}
            className={`p-4 rounded-md border space-y-3 ${
              isDark ? 'bg-[#15181C] border-[#242930]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            {/* Head Header */}
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                  {headState.headName || headKey} Optical Path Inspection
                </span>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                hasIssue
                  ? isDark
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  : isDark
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {hasIssue ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>ISSUES IDENTIFIED ({findings.length})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>NO DEFECTS OBSERVED</span>
                  </>
                )}
              </span>
            </div>

            {/* Findings List */}
            {findings.length > 0 ? (
              <div className="space-y-3 pt-1">
                {findings.map((item, idx) => {
                  const resolvedImg = item.evidenceImage ? ImageStore.resolveImage(item.evidenceImage) || item.evidenceImage : null;

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded border flex flex-col md:flex-row items-start justify-between gap-3 ${
                        isDark ? 'bg-[#191D22] border-[#29303A]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-200 dark:text-slate-100">
                            {item.component}
                          </span>
                          {getActionBadge(item.actionRecommendation)}
                        </div>

                        {item.conditions && item.conditions.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {item.conditions.map((c, i) => (
                              <span
                                key={i}
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                  isDark ? 'bg-[#13161A] text-slate-400 border-[#262B33]' : 'bg-white text-slate-600 border-slate-300'
                                }`}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.customConditionDetail && (
                          <p className="text-xs text-slate-300">
                            {item.customConditionDetail}
                          </p>
                        )}

                        {item.engineerNote && (
                          <div className="text-xs text-slate-400 font-mono bg-black/20 p-2 rounded border border-white/5 mt-1">
                            <span className="text-[10px] text-slate-500 uppercase block">Engineer Note:</span>
                            {item.engineerNote}
                          </div>
                        )}
                      </div>

                      {/* Evidence thumbnail if attached */}
                      {resolvedImg && (
                        <div className="shrink-0">
                          <div
                            onClick={() => setSelectedImage({ src: resolvedImg, caption: `${item.component} - ${item.actionRecommendation}` })}
                            className="relative w-20 h-20 rounded border border-slate-700 overflow-hidden cursor-pointer group bg-black/40"
                          >
                            <img
                              src={resolvedImg}
                              alt={item.component}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 block text-center mt-1">
                            Evidence photo
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-1">
                Visual inspection completed. Optical elements verified clean with no corrective actions required.
              </p>
            )}
          </div>
        );
      })}

      {/* Stage Calibration Results */}
      {stageResults.length > 0 && (
        <div className={`p-4 rounded-md border space-y-3 ${
          isDark ? 'bg-[#15181C] border-[#242930]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>X/Y Stage Calibration Deviations</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Audit Record</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stageResults.map((stg) => {
              const isPass = stg.verdict === 'PASS';
              const maxDev = stg.overallMaxDevUm !== undefined 
                ? stg.overallMaxDevUm 
                : Math.max(Math.abs(stg.xMaxUm || 0), Math.abs(stg.xMinUm || 0), Math.abs(stg.yMaxUm || 0), Math.abs(stg.yMinUm || 0));

              return (
                <div
                  key={stg.stageId}
                  className={`p-3 rounded border text-xs font-mono space-y-2 ${
                    isDark ? 'bg-[#191D22] border-[#29303A]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{stg.stageName || stg.stageId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      isPass
                        ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {stg.verdict || 'RECORDED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                    <div>X Dev: <span className="text-slate-200 font-bold">{stg.xMinUm ?? '—'} / {stg.xMaxUm ?? '—'} µm</span></div>
                    <div>Y Dev: <span className="text-slate-200 font-bold">{stg.yMinUm ?? '—'} / {stg.yMaxUm ?? '—'} µm</span></div>
                    <div>Overall Max: <span className="text-slate-200 font-bold">{maxDev.toFixed(2)} µm</span></div>
                    <div>Spec Tol: <span className="text-slate-200 font-bold">±{stg.specToleranceUm} µm</span></div>
                  </div>

                  {stg.engineerNote && (
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase">Notes:</span>
                      {stg.engineerNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGC Calibration Results */}
      {agcResults.length > 0 && (
        <div className={`p-4 rounded-md border space-y-3 ${
          isDark ? 'bg-[#15181C] border-[#242930]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>AGC Dynamic Index Alignment</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Audit Record</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agcResults.map((agc) => (
              <div
                key={agc.agcId}
                className={`p-3 rounded border text-xs font-mono space-y-2 ${
                  isDark ? 'bg-[#191D22] border-[#29303A]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{agc.agcName || agc.agcId}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    agc.verdict === 'PASS'
                      ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {agc.verdict || 'RECORDED'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  <span>Tested Index Points: </span>
                  <strong className="text-slate-200">{agc.indices?.length || 0} locations</strong>
                </div>

                {agc.engineerNote && (
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase">Notes:</span>
                    {agc.engineerNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Image Zoom Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className={`max-w-2xl w-full rounded-md border p-4 space-y-3 ${
              isDark ? 'bg-[#15181C] border-[#2D333D]' : 'bg-white border-slate-300 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-mono font-bold text-slate-200 truncate">
                {selectedImage.caption}
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded flex items-center justify-center bg-black/60">
              <img
                src={selectedImage.src}
                alt={selectedImage.caption}
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
