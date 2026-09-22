import React, { useRef } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import { BeamCheckpointSpec } from '../../types/beamProfile';
import { ImageStore } from '../../utils/imageStore';

interface BeamProfileCheckpointCardProps {
  spec: BeamCheckpointSpec;
  reading: { diameterStr: string; imageDataUrl?: string };
  pass: boolean;
  isDark: boolean;
  onDiameterChange: (val: string) => void;
  onImageUpload: (file: File) => void;
}

export const BeamProfileCheckpointCard: React.FC<BeamProfileCheckpointCardProps> = ({
  spec,
  reading,
  pass,
  isDark,
  onDiameterChange,
  onImageUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLaser1 = spec.laser === 'Laser 1';
  const isSource = spec.code.endsWith('A');
  const isOptics = spec.code.endsWith('B');

  // Friendly short label
  const stageTitle = spec.maskSize
    ? `Mask ${spec.maskSize}`
    : isSource
    ? 'Laser Source'
    : 'Flat Top Optics';

  const rawImg = reading.imageDataUrl;
  const resolvedImg = rawImg ? (ImageStore.resolveImage(rawImg) || (rawImg.startsWith('idb:') ? undefined : rawImg)) : undefined;

  return (
    <div
      className="p-2 rounded-xl border transition-all bg-raised border-theme-default hover:border-theme-strong shadow-xs"
    >
      {/* Top Bar: Code Badge + Stage Title + PASS/FAIL */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono shrink-0 ${
              isSource
                ? isDark
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                : isOptics
                ? isDark
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                : isDark
                ? isLaser1
                  ? 'bg-amber-950/40 text-amber-300/90 border border-amber-800/40'
                  : 'bg-cyan-950/40 text-cyan-300/90 border border-cyan-800/40'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {spec.id.includes('Mask') || spec.maskSize ? spec.maskSize : spec.code}
          </span>
          <span
            className="text-[11px] font-semibold truncate text-theme-primary"
            title={spec.stageLabel}
          >
            {stageTitle}
          </span>
        </div>

        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 transition-colors ${
            pass
              ? isDark
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isDark
              ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {pass ? 'PASS' : 'FAIL'}
        </span>
      </div>

      {/* Spec Subtitle: Clean & Readable */}
      <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 px-0.5">
        <span className="text-theme-muted">Spec:</span>
        <span className="font-semibold text-theme-secondary">
          {spec.specText}
        </span>
      </div>

      {/* Interaction Row: Compact Thumbnail + Tabbable Numeric Diameter Input */}
      <div className="flex items-center gap-2">
        {/* Thumbnail Preview / Upload */}
        <div className="relative w-10 h-10 shrink-0">
          <input
            type="file"
            id={`bp-file-${spec.id}`}
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImageUpload(file);
                e.target.value = '';
              }
            }}
          />

          {resolvedImg ? (
            <div
              className="w-10 h-10 rounded-lg border relative overflow-hidden group cursor-pointer bg-workspace border-theme-default"
              onClick={() => fileInputRef.current?.click()}
              title="Click to replace beam profile image"
            >
              <img
                src={resolvedImg}
                alt={spec.stageLabel}
                className="w-full h-full object-cover"
              />
              {/* Replace Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <RefreshCw className="w-3 h-3 text-cyan-300" />
              </div>
            </div>
          ) : (
            <label
              htmlFor={`bp-file-${spec.id}`}
              className="w-10 h-10 rounded-lg border border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors bg-workspace border-theme-default hover:border-cyan-500 hover:bg-cyan-500/10 text-theme-muted hover:text-cyan-600"
              title="Upload beam profile image"
            >
              <Upload className="w-3 h-3" />
              <span className="text-[8px] font-semibold mt-0.5 tracking-tight">+Img</span>
            </label>
          )}
        </div>

        {/* Diameter Input */}
        <div className="relative flex-1">
          <input
            type="number"
            step="0.01"
            value={reading.diameterStr || ''}
            onChange={(e) => onDiameterChange(e.target.value)}
            placeholder="0.00"
            className="w-full border rounded-lg pl-2 pr-7 py-1 text-xs font-mono transition-colors focus:outline-none focus:ring-1 bg-surface border-theme-default text-theme-primary placeholder:text-theme-muted focus:border-cyan-500 focus:ring-cyan-500/30"
          />
          <span
            className="absolute right-2 top-1 text-[10px] font-mono pointer-events-none text-theme-muted"
          >
            mm
          </span>
        </div>
      </div>
    </div>
  );
};
