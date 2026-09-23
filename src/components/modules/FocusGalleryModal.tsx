import React, { useState, useEffect, useMemo } from 'react';
import { X, Crosshair, CheckCircle2, Zap } from 'lucide-react';
import {
  FOCUS_WAFER_POSITIONS,
  FocusOptimizationRecord,
  FocusWaferPosition,
  LaserFocusEvidence
} from '../../types/focusOptimization';
import { ImageStore } from '../../utils/imageStore';
import { FocusOptimizationEngine } from '../../utils/focusOptimizationEngine';
import { AccordionGallery, AccordionGalleryItem } from '../common/AccordionGallery';

export interface FocusGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FocusOptimizationRecord;
  initialLaser?: 'laser1' | 'laser2';
  initialPosition?: FocusWaferPosition;
  machineModel?: string;
  machineNumber?: string;
}

export const FocusGalleryModal: React.FC<FocusGalleryModalProps> = ({
  isOpen,
  onClose,
  record,
  initialLaser = 'laser1',
  initialPosition,
  machineModel,
  machineNumber
}) => {
  const [activeLaser, setActiveLaser] = useState<'laser1' | 'laser2'>(initialLaser);
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync laser and position when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveLaser(initialLaser);
      if (initialPosition) {
        const foundIdx = FOCUS_WAFER_POSITIONS.indexOf(initialPosition);
        setActiveIndex(foundIdx >= 0 ? foundIdx : 3); // 3 is position '0' (Center/Best)
      } else {
        setActiveIndex(3); // Default to center optimal position '0'
      }
    }
  }, [isOpen, initialLaser, initialPosition]);

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

  const activeLaserEvidence: LaserFocusEvidence | undefined =
    activeLaser === 'laser1' ? record.laser1 : record.laser2;

  const isLaser1 = activeLaser === 'laser1';
  const headLabel = isLaser1 ? 'Laser 1 (Head A)' : 'Laser 2 (Head B)';
  const accentColor = isLaser1 ? '#f59e0b' : '#38bdf8';

  // Generate gallery items with real resolved images
  const galleryItems = useMemo<AccordionGalleryItem[]>(() => {
    const head = activeLaserEvidence;
    return FOCUS_WAFER_POSITIONS.map((pos) => {
      const reading = head?.positions?.[pos];
      const rawUrl = reading?.imageDataUrl;
      const resolved = rawUrl
        ? ImageStore.resolveImage(rawUrl) || (rawUrl.startsWith('idb:') ? undefined : rawUrl)
        : undefined;

      const fallbackColor = isLaser1 ? '#f59e0b' : '#38bdf8';
      const imageSrc =
        resolved ||
        FocusOptimizationEngine.generateSyntheticWaferDrillSvg(headLabel, pos, fallbackColor);

      const isBest = pos === '0';
      const drillText =
        reading?.drillDiameterUm !== null && reading?.drillDiameterUm !== undefined
          ? `${reading.drillDiameterUm}µm`
          : '—';

      const label = isBest ? `Position ${pos} [OPTIMAL BEST]` : `Position ${pos}`;
      const sublabel = isBest
        ? `Dia: ${drillText} • 0.00 Focus Point • Mask: ${head?.maskName || 'Width Square'}`
        : `Dia: ${drillText} • Defocus Step ${pos} • 2W@50kHz`;

      return {
        image: imageSrc,
        label,
        sublabel,
        alt: `${headLabel} Wafer Position ${pos}`,
        isPass: true
      };
    });
  }, [activeLaserEvidence, isLaser1, headLabel]);

  const activePosition = FOCUS_WAFER_POSITIONS[activeIndex] || FOCUS_WAFER_POSITIONS[3];
  const activeReading = activeLaserEvidence?.positions?.[activePosition];
  const isOptimalBest = activePosition === '0';

  const handleSwitchLaser = (laser: 'laser1' | 'laser2') => {
    setActiveLaser(laser);
    setActiveIndex(3); // Reset to position '0'
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Focus Optimization Gallery — ${headLabel}`}
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
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 font-mono tracking-tight">
                  {isLaser1 ? 'LASER HEAD 1 (HEAD A)' : 'LASER HEAD 2 (HEAD B)'} — FOCUS OPTIMIZATION GALLERY
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {record.date}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {machineModel ? `${machineModel} ` : ''}{machineNumber ? `(${machineNumber}) • ` : ''}
                Dummy Wafer Drill Matrix Sequence • 7 Optical Positions (+3 → -3)
              </p>
            </div>
          </div>

          {/* Laser Head Switcher Tabs & Close Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => handleSwitchLaser('laser1')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  isLaser1
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Laser 1 (Head A)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchLaser('laser2')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  !isLaser1
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Laser 2 (Head B)
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

        {/* Footer: Detailed Telemetry Badge for Selected Wafer Position */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Selected Position:</span>
              <strong className="text-slate-100 font-mono text-xs">
                {activePosition} {isOptimalBest ? '(Optimal Center)' : ''}
              </strong>
            </div>
            <div className="h-3 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Mask & Param:</span>
              <span className="text-slate-300 font-mono">
                {activeLaserEvidence?.maskName || 'Width Square'} • {activeLaserEvidence?.performParam || '2W@50kHz'}
              </span>
            </div>
            <div className="h-3 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Drill Crater Diameter:</span>
              <strong className="text-cyan-300 font-mono">
                {activeReading?.drillDiameterUm !== null && activeReading?.drillDiameterUm !== undefined
                  ? `${activeReading.drillDiameterUm} µm`
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono border ${
                isOptimalBest
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isOptimalBest ? 'BEST FOCUS (0.00)' : 'STEP VERIFIED'}</span>
            </div>

            <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
              Hover or press ← → arrows to inspect sequence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusGalleryModal;
