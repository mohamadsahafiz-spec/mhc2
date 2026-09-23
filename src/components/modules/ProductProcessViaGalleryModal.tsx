import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  ProductProcessRecord,
  ViaQualityReading,
  ViaSpecification
} from '../../types/productProcess';
import { ImageStore } from '../../utils/imageStore';
import { ProductProcessEngine } from '../../utils/productProcessEngine';
import { AccordionGallery, AccordionGalleryItem } from '../common/AccordionGallery';

export interface ProductProcessViaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProductProcessRecord;
  initialLaser?: 'laser1' | 'laser2';
  initialView?: 'top' | 'bottom';
  machineModel?: string;
  machineNumber?: string;
}

export const ProductProcessViaGalleryModal: React.FC<ProductProcessViaGalleryModalProps> = ({
  isOpen,
  onClose,
  record,
  initialLaser = 'laser1',
  initialView = 'top',
  machineModel,
  machineNumber
}) => {
  const [activeLaser, setActiveLaser] = useState<'laser1' | 'laser2'>(initialLaser);
  const [activeIndex, setActiveIndex] = useState(initialView === 'bottom' ? 1 : 0);

  // Sync laser and view when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveLaser(initialLaser);
      setActiveIndex(initialView === 'bottom' ? 1 : 0);
    }
  }, [isOpen, initialLaser, initialView]);

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

  const activeVia: ViaQualityReading | undefined =
    activeLaser === 'laser1' ? record.laser1Via : record.laser2Via;

  const isLaser1 = activeLaser === 'laser1';
  const headLabel = isLaser1 ? 'Laser 1 (Head A)' : 'Laser 2 (Head B)';
  const accentColor = isLaser1 ? '#f59e0b' : '#38bdf8';

  const spec: ViaSpecification | undefined = record.viaSpec;
  const topSpecStr = ProductProcessEngine.getFormattedTopSpec(spec);
  const bottomSpecStr = ProductProcessEngine.getFormattedBottomSpec(spec);
  const taperSpecStr = ProductProcessEngine.getFormattedTaperSpec(spec);

  const topWidth = activeVia?.topWidthUm ?? null;
  const bottomWidth = activeVia?.bottomWidthUm ?? null;
  const topPass = activeVia?.topPass ?? false;
  const bottomPass = activeVia?.bottomPass ?? false;
  const overallPass = activeVia?.overallPass ?? false;

  const taperVal =
    topWidth !== null && bottomWidth !== null && topWidth > 0
      ? (bottomWidth / topWidth) * 100
      : null;

  // Resolve images for Top Via and Bottom Via
  const galleryItems = useMemo<AccordionGalleryItem[]>(() => {
    const rawTopUrl = activeVia?.topViaImageDataUrl || activeVia?.viaImageDataUrl;
    const resolvedTop = rawTopUrl
      ? ImageStore.resolveImage(rawTopUrl) || (rawTopUrl.startsWith('idb:') ? undefined : rawTopUrl)
      : undefined;

    const rawBottomUrl = activeVia?.bottomViaImageDataUrl;
    const resolvedBottom = rawBottomUrl
      ? ImageStore.resolveImage(rawBottomUrl) || (rawBottomUrl.startsWith('idb:') ? undefined : rawBottomUrl)
      : undefined;

    const fallbackColor = isLaser1 ? '#f59e0b' : '#38bdf8';

    const topImg =
      resolvedTop ||
      ProductProcessEngine.generateSyntheticViaSvg(
        headLabel,
        topWidth ?? 51,
        bottomWidth ?? 23,
        fallbackColor,
        'top'
      );

    const bottomImg =
      resolvedBottom ||
      ProductProcessEngine.generateSyntheticViaSvg(
        headLabel,
        topWidth ?? 51,
        bottomWidth ?? 23,
        fallbackColor,
        'bottom'
      );

    const topItem: AccordionGalleryItem = {
      image: topImg,
      label: 'Top Via Micro-Inspection',
      sublabel: `Diameter: ${topWidth !== null ? `${topWidth} µm` : '—'} • Target: ${topSpecStr} • ${
        topPass ? 'PASS' : 'FAIL'
      }`,
      alt: `${headLabel} Top Via Inspection`,
      isPass: topPass
    };

    const bottomItem: AccordionGalleryItem = {
      image: bottomImg,
      label: 'Bottom Via Micro-Inspection',
      sublabel: `Diameter: ${bottomWidth !== null ? `${bottomWidth} µm` : '—'} • Target: ${bottomSpecStr} • ${
        bottomPass ? 'PASS' : 'FAIL'
      }`,
      alt: `${headLabel} Bottom Via Inspection`,
      isPass: bottomPass
    };

    return [topItem, bottomItem];
  }, [activeVia, headLabel, isLaser1, topWidth, bottomWidth, topSpecStr, bottomSpecStr, topPass, bottomPass]);

  const isTopActive = activeIndex === 0;

  const handleSwitchLaser = (laser: 'laser1' | 'laser2') => {
    setActiveLaser(laser);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Product Process Via Gallery — ${headLabel}`}
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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 font-mono tracking-tight">
                  {isLaser1 ? 'LASER HEAD 1 (HEAD A)' : 'LASER HEAD 2 (HEAD B)'} — VIA QUALITY GALLERY
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {record.date}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {machineModel ? `${machineModel} ` : ''}{machineNumber ? `(${machineNumber}) • ` : ''}
                {record.productName ? `${record.productName} • ` : ''}
                {record.recipeName ? `Recipe: ${record.recipeName} • ` : ''}
                Top Via & Bottom Via Dual Micro-Inspection
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
              gap={12}
              radius={14}
              expandRatio={0.65}
              trigger="hover"
              grayscale={true}
              showLabels={true}
            />
          </div>
        </div>

        {/* Footer: Detailed Telemetry Badge for Selected Via Perspective */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Inspecting:</span>
              <strong className="text-slate-100 font-mono text-xs">
                {isTopActive ? 'Top Via (Entrance)' : 'Bottom Via (Exit Core)'}
              </strong>
            </div>
            <div className="h-3 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Top Width:</span>
              <span className="text-slate-200 font-mono font-bold">
                {topWidth !== null ? `${topWidth} µm` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({topSpecStr})</span>
            </div>
            <div className="h-3 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Bottom Width:</span>
              <span className="text-slate-200 font-mono font-bold">
                {bottomWidth !== null ? `${bottomWidth} µm` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({bottomSpecStr})</span>
            </div>
            {taperVal !== null && (
              <>
                <div className="h-3 w-px bg-slate-800 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Taper Ratio:</span>
                  <span className="text-cyan-300 font-mono font-bold">{taperVal.toFixed(1)}%</span>
                  <span className="text-[10px] text-slate-500 font-mono">({taperSpecStr})</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono border ${
                overallPass
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800'
              }`}
            >
              {overallPass ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{overallPass ? 'HEAD IN SPEC (PASS)' : 'HEAD OUT OF SPEC (FAIL)'}</span>
            </div>

            <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
              Hover or press ← → arrows to toggle Top / Bottom Via
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductProcessViaGalleryModal;
