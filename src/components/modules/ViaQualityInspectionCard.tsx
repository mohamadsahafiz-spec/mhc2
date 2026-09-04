import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';
import { ViaSpecification, TOP_VIA_SPEC, BOTTOM_VIA_SPEC } from '../../types/productProcess';
import { ProductProcessEngine } from '../../utils/productProcessEngine';
import { ImageStore } from '../../utils/imageStore';

interface ViaQualityInspectionCardProps {
  laser: 1 | 2;
  title: string;
  themeColor: 'amber' | 'cyan';
  topWidth: string;
  bottomWidth: string;
  imageDataUrl?: string;
  viaSpec?: ViaSpecification;
  onTopWidthChange: (val: string) => void;
  onBottomWidthChange: (val: string) => void;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  isDark?: boolean;
}

export const ViaQualityInspectionCard: React.FC<ViaQualityInspectionCardProps> = ({
  laser,
  title,
  themeColor,
  topWidth,
  bottomWidth,
  imageDataUrl,
  viaSpec,
  onTopWidthChange,
  onBottomWidthChange,
  onImageUpload,
  onImageRemove,
  isDark = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const topVal = topWidth.trim() !== '' ? parseFloat(topWidth) : null;
  const bottomVal = bottomWidth.trim() !== '' ? parseFloat(bottomWidth) : null;

  const topValid = topVal !== null && !isNaN(topVal);
  const bottomValid = bottomVal !== null && !isNaN(bottomVal);

  const topPass = topValid ? ProductProcessEngine.evalTopWidth(topVal, viaSpec) : false;
  const bottomPass = bottomValid ? ProductProcessEngine.evalBottomWidth(bottomVal, viaSpec) : false;
  const hasEntries = topValid || bottomValid;
  const overallPass = topValid && bottomValid && topPass && bottomPass;

  // Taper calculation: (Bottom / Top) * 100
  const taperVal = topValid && bottomValid && topVal > 0 ? (bottomVal / topVal) * 100 : null;
  const minTaper = viaSpec?.minTaperPercent !== undefined && viaSpec?.minTaperPercent !== null ? viaSpec.minTaperPercent : 40;
  const taperPass = taperVal !== null ? taperVal >= minTaper : false;

  const topSpecFormatted = ProductProcessEngine.getFormattedTopSpec(viaSpec);
  const bottomSpecFormatted = ProductProcessEngine.getFormattedBottomSpec(viaSpec);

  const isAmber = themeColor === 'amber';

  return (
    <div
      className={`p-2.5 rounded-xl border transition-colors ${
        isDark
          ? isAmber
            ? 'bg-slate-950/80 border-amber-900/40 hover:border-amber-700/50'
            : 'bg-slate-950/80 border-cyan-900/40 hover:border-cyan-700/50'
          : isAmber
          ? 'bg-amber-50/40 border-amber-200'
          : 'bg-cyan-50/40 border-cyan-200'
      }`}
    >
      {/* Header: Title, Taper Pill, and Pass/Fail Badge */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isAmber ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
          />
          <span
            className={`text-xs font-bold uppercase tracking-wider font-mono ${
              isAmber ? 'text-amber-400' : 'text-cyan-400'
            }`}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Taper Ratio Pill */}
          {taperVal !== null && (
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                taperPass
                  ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400'
                  : 'bg-amber-950/70 border-amber-800/80 text-amber-400'
              }`}
              title={`Taper Ratio: ${taperVal.toFixed(1)}% (Threshold: ≥${minTaper}%)`}
            >
              Taper: {taperVal.toFixed(1)}% {taperPass ? '✓' : '⚠'}
            </span>
          )}

          {/* Head Overall Verdict Badge */}
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              !hasEntries
                ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                : overallPass
                ? 'bg-emerald-950/90 border-emerald-700 text-emerald-300'
                : 'bg-rose-950/90 border-rose-700 text-rose-300'
            }`}
          >
            {!hasEntries ? 'PENDING' : overallPass ? 'HEAD PASS' : 'HEAD FAIL'}
          </span>
        </div>
      </div>

      {/* Main Body: Compact Image Box + Measurement Inputs */}
      <div className="flex items-center gap-3">
        {/* Compact Evidence Image Box (52x52px) */}
        <div className="shrink-0">
          <div
            className={`w-[52px] h-[52px] rounded-lg border relative overflow-hidden flex flex-col items-center justify-center group ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
            {(() => {
              const displaySrc = imageDataUrl?.startsWith('idb:') 
                ? ImageStore.resolveImage(imageDataUrl) 
                : imageDataUrl;
              return displaySrc ? (
                <>
                  <img
                    src={displaySrc}
                    alt={`${title} Via`}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay on hover to replace or remove */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[9px] text-cyan-300 font-bold hover:underline"
                      title="Replace image"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={onImageRemove}
                      className="text-[9px] text-rose-400 hover:underline"
                      title="Remove image"
                    >
                      Clear
                    </button>
                  </div>
                </>
              ) : imageDataUrl?.startsWith('idb:') ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-[8px] font-mono">
                  Loading
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                  title="Upload micro-inspection image"
                >
                  <ImageIcon className="w-4 h-4 mb-0.5" />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Add Pic</span>
                </button>
              );
            })()}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageUpload(file);
                  // Reset input so same file can be chosen again if needed
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>

        {/* Measurement Inputs Grid: Top and Bottom Width */}
        <div className="grid grid-cols-2 gap-2 flex-1 font-mono">
          {/* Top Drill Width */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <label
                className={`text-[10px] font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Top Width
              </label>
              <span
                className={`text-[9px] font-bold ${
                  !topValid
                    ? 'text-slate-400'
                    : topPass
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {!topValid ? topSpecFormatted : topPass ? 'PASS' : 'FAIL'}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={topWidth}
                onChange={(e) => onTopWidthChange(e.target.value)}
                placeholder="51.0"
                className={`w-full py-1 pl-2 pr-6 rounded text-xs font-bold font-mono transition-colors focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600/20'
                } ${
                  topValid
                    ? topPass
                      ? 'border-emerald-600/70'
                      : 'border-rose-600/70'
                    : ''
                }`}
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none font-bold">
                µm
              </span>
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              Target Gate: {topSpecFormatted}
            </div>
          </div>

          {/* Bottom Drill Width */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <label
                className={`text-[10px] font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Bottom Width
              </label>
              <span
                className={`text-[9px] font-bold ${
                  !bottomValid
                    ? 'text-slate-400'
                    : bottomPass
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {!bottomValid ? bottomSpecFormatted : bottomPass ? 'PASS' : 'FAIL'}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={bottomWidth}
                onChange={(e) => onBottomWidthChange(e.target.value)}
                placeholder="23.0"
                className={`w-full py-1 pl-2 pr-6 rounded text-xs font-bold font-mono transition-colors focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20'
                    : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600/20'
                } ${
                  bottomValid
                    ? bottomPass
                      ? 'border-emerald-600/70'
                      : 'border-rose-600/70'
                    : ''
                }`}
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none font-bold">
                µm
              </span>
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              Target Gate: {bottomSpecFormatted}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
