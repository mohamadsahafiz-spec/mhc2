import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Sliders, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { BeamProfileCheckRecord, CHECKPOINT_SPECS, CheckpointId } from '../../types/beamProfile';
import { ImageStore } from '../../utils/imageStore';
import { BeamProfileEngine } from '../../utils/beamProfileEngine';
import { AccordionGallery, AccordionGalleryItem } from '../common/AccordionGallery';

export interface BeamProfileGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BeamProfileCheckRecord;
  initialLaser?: 'Laser 1' | 'Laser 2';
  initialCheckpointId?: CheckpointId;
  machineModel?: string;
  machineNumber?: string;
}

export const BeamProfileGalleryModal: React.FC<BeamProfileGalleryModalProps> = ({
  isOpen,
  onClose,
  record,
  initialLaser = 'Laser 1',
  initialCheckpointId,
  machineModel,
  machineNumber
}) => {
  const [activeLaser, setActiveLaser] = useState<'Laser 1' | 'Laser 2'>(initialLaser);
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync laser and checkpoint when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveLaser(initialLaser);
      const specsForLaser = CHECKPOINT_SPECS.filter((s) => s.laser === initialLaser);
      if (initialCheckpointId) {
        const foundIdx = specsForLaser.findIndex((s) => s.id === initialCheckpointId);
        setActiveIndex(foundIdx >= 0 ? foundIdx : 0);
      } else {
        setActiveIndex(0);
      }
    }
  }, [isOpen, initialLaser, initialCheckpointId]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Specs for the selected laser head (8 checkpoints)
  const currentSpecs = useMemo(() => {
    return CHECKPOINT_SPECS.filter((s) => s.laser === activeLaser);
  }, [activeLaser]);

  // Generate gallery items with real resolved images
  const galleryItems = useMemo<AccordionGalleryItem[]>(() => {
    return currentSpecs.map((spec) => {
      const reading = record.readings[spec.id];
      const rawUrl = reading?.imageDataUrl;
      const resolved = rawUrl
        ? ImageStore.resolveImage(rawUrl) || (rawUrl.startsWith('idb:') ? undefined : rawUrl)
        : undefined;

      // Real image or synthetic fallback
      const fallbackColor = spec.id.includes('6A') || spec.id.includes('7A') ? '#f59e0b' : '#38bdf8';
      const imageSrc = resolved || BeamProfileEngine.generateSyntheticBeamSvg(spec.id, fallbackColor);

      const diameterText =
        reading?.measuredDiameterMm !== null && reading?.measuredDiameterMm !== undefined
          ? `${reading.measuredDiameterMm}mm`
          : '—';

      const statusBadge = reading?.pass ? 'PASS' : 'FAIL';

      return {
        image: imageSrc,
        label: `${spec.stageLabel}`,
        sublabel: `${diameterText} • [${statusBadge}] • Req: ${spec.specText}`,
        alt: `${spec.stageLabel} (${spec.specText})`,
        isPass: reading?.pass ?? false
      };
    });
  }, [currentSpecs, record]);

  const activeSpec = currentSpecs[activeIndex] || currentSpecs[0];
  const activeReading = activeSpec ? record.readings[activeSpec.id] : undefined;

  const handleSwitchLaser = (laser: 'Laser 1' | 'Laser 2') => {
    setActiveLaser(laser);
    setActiveIndex(0);
  };

  if (!isOpen) return null;

  const isLaser1 = activeLaser === 'Laser 1';
  const accentColor = isLaser1 ? '#f59e0b' : '#38bdf8';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Beam Profile Gallery — ${activeLaser}`}
    >
      <div
        className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isLaser1
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
              }`}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 font-mono tracking-tight">
                  {isLaser1 ? 'LASER HEAD 1 (HEAD A)' : 'LASER HEAD 2 (HEAD B)'} — BEAM PROFILE GALLERY
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {record.date}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {machineModel ? `${machineModel} ` : ''}{machineNumber ? `(${machineNumber}) • ` : ''}
                Interactive Accordion Inspection • 8 Checkpoint Stations
              </p>
            </div>
          </div>

          {/* Laser Head Switcher Tabs & Close Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => handleSwitchLaser('Laser 1')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  isLaser1
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Laser 1 (6A/6B/6C)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchLaser('Laser 2')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  !isLaser1
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Laser 2 (7A/7B/7C)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gallery Interactive Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center">
          <div className="w-full">
            <AccordionGallery
              items={galleryItems}
              defaultIndex={activeIndex}
              onActiveChange={setActiveIndex}
              accentColor={accentColor}
              height={440}
              gap={10}
              radius={14}
              expandRatio={0.48}
              trigger="hover"
              grayscale={true}
              showLabels={true}
            />
          </div>
        </div>

        {/* Footer: Detailed Telemetry Badge for Selected Checkpoint */}
        {activeSpec && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Selected Station:</span>
                <strong className="text-slate-100 font-mono text-xs">{activeSpec.stageLabel}</strong>
              </div>
              <div className="h-3 w-px bg-slate-800 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Requirement:</span>
                <span className="text-slate-300 font-mono">{activeSpec.specText}</span>
              </div>
              <div className="h-3 w-px bg-slate-800 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Measured:</span>
                <strong className="text-cyan-300 font-mono">
                  {activeReading?.measuredDiameterMm !== null && activeReading?.measuredDiameterMm !== undefined
                    ? `${activeReading.measuredDiameterMm} mm`
                    : '—'}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono border ${
                  activeReading?.pass
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                    : 'bg-rose-950/80 text-rose-400 border-rose-800'
                }`}
              >
                {activeReading?.pass ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASS</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>FAIL</span>
                  </>
                )}
              </div>

              <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                Hover or press ← → arrows to inspect
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeamProfileGalleryModal;
