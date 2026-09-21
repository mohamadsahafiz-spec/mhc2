import React, { useState } from 'react';
import { Camera, Eye, X, Image as ImageIcon } from 'lucide-react';
import { MHCSession, MHCHeadInspectionState, MHCStageCalibrationResult, MHCAgcResult } from '../../../types';
import { ImageStore } from '../../../utils/imageStore';

interface MhcHistoryEvidenceTabProps {
  session: MHCSession;
  isDark: boolean;
}

interface EvidenceItem {
  id: string;
  source: string;
  title: string;
  description?: string;
  rawImage: string;
}

export const MhcHistoryEvidenceTab: React.FC<MhcHistoryEvidenceTabProps> = ({
  session,
  isDark
}) => {
  const [activePreview, setActivePreview] = useState<EvidenceItem | null>(null);

  // Harvest all actual evidence attachments from existing session data structures
  const evidenceItems: EvidenceItem[] = [];

  // 1. Head Inspection Findings photos
  if (session.inspectionFindings) {
    (Object.entries(session.inspectionFindings) as [string, MHCHeadInspectionState][]).forEach(([headKey, headState]) => {
      const headName = headState.headName || headKey;
      headState.findings?.forEach((f, idx) => {
        if (f.evidenceImage) {
          evidenceItems.push({
            id: `head-finding-${headKey}-${idx}`,
            source: `${headName} Optical Path`,
            title: f.component,
            description: f.engineerNote || f.customConditionDetail || f.actionRecommendation,
            rawImage: f.evidenceImage
          });
        }
      });
    });
  }

  // 2. Stage Calibration photos
  if (session.stageCalibrationData) {
    (Object.entries(session.stageCalibrationData) as [string, MHCStageCalibrationResult][]).forEach(([stageKey, stg]) => {
      if (stg.evidenceImage) {
        evidenceItems.push({
          id: `stage-${stageKey}`,
          source: 'Stage Calibration (04)',
          title: stg.stageName || stageKey,
          description: stg.engineerNote || `Tolerance: ±${stg.specToleranceUm} µm • Verdict: ${stg.verdict}`,
          rawImage: stg.evidenceImage
        });
      }
    });
  }

  // 3. AGC Calibration photos
  if (session.agcData) {
    (Object.entries(session.agcData) as [string, MHCAgcResult][]).forEach(([agcKey, agc]) => {
      if (agc.evidenceImage) {
        evidenceItems.push({
          id: `agc-${agcKey}`,
          source: 'AGC Alignment (04)',
          title: agc.agcName || agcKey,
          description: agc.engineerNote || `Verdict: ${agc.verdict}`,
          rawImage: agc.evidenceImage
        });
      }
    });
  }

  // 4. Temperature / Cooling evidence
  if (session.temperatureEvidenceData?.evidenceImage) {
    evidenceItems.push({
      id: 'temp-evidence',
      source: 'Cooling & Thermal (05)',
      title: 'Thermal / Chiller Telemetry Snapshot',
      description: session.temperatureEvidenceData.engineerNote || 'Chiller and ambient operating conditions',
      rawImage: session.temperatureEvidenceData.evidenceImage
    });
  }

  // 5. Optics / Beam path photos
  if (session.stage04_opticsBeam?.beamProfileImage) {
    evidenceItems.push({
      id: 'optics-beam-profile',
      source: 'Optics & Beam Path (04)',
      title: 'Laser Beam Profile Scan',
      description: session.stage04_opticsBeam.notes,
      rawImage: session.stage04_opticsBeam.beamProfileImage
    });
  }
  if (session.stage04_opticsBeam?.burnPatternImage) {
    evidenceItems.push({
      id: 'optics-burn-pattern',
      source: 'Optics & Beam Path (04)',
      title: 'Burn Pattern Test Card',
      description: session.stage04_opticsBeam.notes,
      rawImage: session.stage04_opticsBeam.burnPatternImage
    });
  }

  // 6. Laser Power Meter photos
  if (session.stage03_laserPower) {
    session.stage03_laserPower.forEach((pw: any, idx: number) => {
      if (pw.evidenceImage) {
        evidenceItems.push({
          id: `laser-power-${idx}`,
          source: 'Laser Power Meter (03)',
          title: pw.headName || `Laser Head ${idx + 1}`,
          description: `Power Reading: ${pw.measuredPowerWatts ?? '—'} W`,
          rawImage: pw.evidenceImage
        });
      }
    });
  }

  if (evidenceItems.length === 0) {
    return (
      <div
        id="mhc-history-evidence-empty"
        className="p-8 text-center rounded-card border bg-surface border-theme-default text-theme-muted"
      >
        <ImageIcon className="w-8 h-8 text-theme-muted mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold font-theme-heading text-theme-primary">
          No Media Evidence Attached
        </h3>
        <p className="text-xs text-theme-muted mt-1 max-w-sm mx-auto">
          No photo attachments or media logs were recorded during this inspection session.
        </p>
      </div>
    );
  }

  return (
    <div id="mhc-history-evidence-tab" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-theme-muted">
          <Camera className="w-3.5 h-3.5 text-theme-muted" />
          <span>Recorded Evidence Sheets: <strong className="text-theme-primary">{evidenceItems.length} attachments</strong></span>
        </div>
        <span className="text-[11px] font-mono text-theme-muted">
          Click any thumbnail to inspect high-resolution capture
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidenceItems.map((item) => {
          const resolvedSrc = ImageStore.resolveImage(item.rawImage) || item.rawImage;

          return (
            <div
              key={item.id}
              onClick={() => setActivePreview(item)}
              className="rounded-card border overflow-hidden cursor-pointer transition-all flex flex-col bg-surface border-theme-default hover:border-theme-hover hover:bg-surface-hover text-theme-primary shadow-theme-card"
            >
              {/* Image Thumbnail Container */}
              <div className="relative aspect-4/3 bg-black/60 overflow-hidden group">
                <img
                  src={resolvedSrc}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-black/70 px-2.5 py-1 rounded text-white text-xs font-mono flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </div>
                </div>
              </div>

              {/* Caption & Metadata */}
              <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider block">
                    {item.source}
                  </span>
                  <h4 className="text-xs font-bold font-theme-heading text-theme-primary truncate">
                    {item.title}
                  </h4>
                </div>

                {item.description && (
                  <p className="text-[11px] text-theme-muted line-clamp-2 pt-1 border-t border-theme-subtle">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enlarged Inspection Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="max-w-3xl w-full rounded-card border p-4 space-y-3 bg-surface border-theme-default text-theme-primary shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-theme-subtle pb-2">
              <div>
                <span className="text-[10px] font-mono text-theme-muted uppercase block">
                  {activePreview.source}
                </span>
                <span className="text-xs font-mono font-bold text-theme-primary">
                  {activePreview.title}
                </span>
              </div>
              <button
                onClick={() => setActivePreview(null)}
                className="text-theme-muted hover:text-theme-primary cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-hidden rounded-card flex items-center justify-center bg-black/80">
              <img
                src={ImageStore.resolveImage(activePreview.rawImage) || activePreview.rawImage}
                alt={activePreview.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            {activePreview.description && (
              <p className="text-xs text-theme-secondary font-mono pt-1">
                {activePreview.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
