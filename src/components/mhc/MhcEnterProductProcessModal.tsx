import React, { useState, useMemo } from 'react';
import { Upload, Image as ImageIcon, Sliders, Layers, Zap, ShieldCheck } from 'lucide-react';
import { Machine } from '../../types';
import { ProductProcessRecord, ViaSpecification, TOP_VIA_SPEC, BOTTOM_VIA_SPEC } from '../../types/productProcess';
import { ProductProcessEngine } from '../../utils/productProcessEngine';
import { useTheme } from '../../context/ThemeContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ViaQualityInspectionCard } from '../modules/ViaQualityInspectionCard';

interface MhcEnterProductProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine;
  onSave: (newRecord: ProductProcessRecord) => void;
}

export const MhcEnterProductProcessModal: React.FC<MhcEnterProductProcessModalProps> = ({
  isOpen,
  onClose,
  machine,
  onSave
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const records = machine?.productProcessRecords || [];
  const latestRecord = records[0] || null;

  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formProduct, setFormProduct] = useState(latestRecord?.productName || '');
  const [formRecipe, setFormRecipe] = useState(latestRecord?.recipeName || '');
  const [formLot, setFormLot] = useState(latestRecord?.lotPanel || '');
  const [formRemarks, setFormRemarks] = useState('');
  const [l1Offset, setL1Offset] = useState<string>(
    latestRecord?.laser1PowerOffsetPercent !== undefined && latestRecord?.laser1PowerOffsetPercent !== null
      ? String(latestRecord.laser1PowerOffsetPercent)
      : ''
  );
  const [l2Offset, setL2Offset] = useState<string>(
    latestRecord?.laser2PowerOffsetPercent !== undefined && latestRecord?.laser2PowerOffsetPercent !== null
      ? String(latestRecord.laser2PowerOffsetPercent)
      : ''
  );

  // Authoritative Via Specification State
  const [topTarget, setTopTarget] = useState<string>(
    latestRecord?.viaSpec?.topTargetUm !== undefined ? String(latestRecord.viaSpec.topTargetUm) : String(TOP_VIA_SPEC.target)
  );
  const [topTolerance, setTopTolerance] = useState<string>(
    latestRecord?.viaSpec?.topToleranceUm !== undefined ? String(latestRecord.viaSpec.topToleranceUm) : String(TOP_VIA_SPEC.tolerance)
  );
  const [bottomTarget, setBottomTarget] = useState<string>(
    latestRecord?.viaSpec?.bottomTargetUm !== undefined ? String(latestRecord.viaSpec.bottomTargetUm) : String(BOTTOM_VIA_SPEC.target)
  );
  const [bottomTolerance, setBottomTolerance] = useState<string>(
    latestRecord?.viaSpec?.bottomToleranceUm !== undefined ? String(latestRecord.viaSpec.bottomToleranceUm) : String(BOTTOM_VIA_SPEC.tolerance)
  );
  const [minTaper, setMinTaper] = useState<string>(
    latestRecord?.viaSpec?.minTaperPercent !== undefined ? String(latestRecord.viaSpec.minTaperPercent) : '40'
  );
  const [taperSpecText, setTaperSpecText] = useState<string>(
    latestRecord?.viaSpec?.taperSpecText || '≥ 40%'
  );

  const [isImportSpecOpen, setIsImportSpecOpen] = useState(false);
  const [importSpecJson, setImportSpecJson] = useState('');

  // Phase 1
  const [p1Power, setP1Power] = useState<string>('');
  const [p1Freq, setP1Freq] = useState<string>('');
  const [p1Shots, setP1Shots] = useState<string>('');
  const [p1Mask, setP1Mask] = useState<string>('');
  const [p1Defocus, setP1Defocus] = useState<string>('');

  // Phase 2
  const [p2Power, setP2Power] = useState<string>('');
  const [p2Freq, setP2Freq] = useState<string>('');
  const [p2Shots, setP2Shots] = useState<string>('');
  const [p2Mask, setP2Mask] = useState<string>('');
  const [p2Defocus, setP2Defocus] = useState<string>('');

  // Laser 1 Via
  const [l1Top, setL1Top] = useState<string>('');
  const [l1Bottom, setL1Bottom] = useState<string>('');
  const [l1Image, setL1Image] = useState<string | undefined>(undefined);

  // Laser 2 Via
  const [l2Top, setL2Top] = useState<string>('');
  const [l2Bottom, setL2Bottom] = useState<string>('');
  const [l2Image, setL2Image] = useState<string | undefined>(undefined);

  const applyPreset = (preset: 'std50' | 'hdi35' | 'fine25') => {
    if (preset === 'std50') {
      setTopTarget('51');
      setTopTolerance('10');
      setBottomTarget('23');
      setBottomTolerance('10');
      setMinTaper('40');
      setTaperSpecText('≥ 40%');
    } else if (preset === 'hdi35') {
      setTopTarget('35');
      setTopTolerance('5');
      setBottomTarget('18');
      setBottomTolerance('5');
      setMinTaper('45');
      setTaperSpecText('≥ 45%');
    } else if (preset === 'fine25') {
      setTopTarget('25');
      setTopTolerance('4');
      setBottomTarget('14');
      setBottomTolerance('4');
      setMinTaper('50');
      setTaperSpecText('≥ 50%');
    }
  };

  const handleImportSpec = () => {
    try {
      const parsed = JSON.parse(importSpecJson);
      if (parsed.topTargetUm !== undefined) setTopTarget(String(parsed.topTargetUm));
      if (parsed.topToleranceUm !== undefined) setTopTolerance(String(parsed.topToleranceUm));
      if (parsed.bottomTargetUm !== undefined) setBottomTarget(String(parsed.bottomTargetUm));
      if (parsed.bottomToleranceUm !== undefined) setBottomTolerance(String(parsed.bottomToleranceUm));
      if (parsed.minTaperPercent !== undefined) setMinTaper(String(parsed.minTaperPercent));
      if (parsed.taperSpecText) setTaperSpecText(parsed.taperSpecText);
      setIsImportSpecOpen(false);
      setImportSpecJson('');
    } catch {
      alert('Invalid JSON specification format.');
    }
  };

  const handleImageUpload = (laser: 1 | 2, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        if (laser === 1) setL1Image(dataUrl);
        else setL2Image(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Derived live evaluation for modal
  const liveTopTarget = topTarget.trim() !== '' ? parseFloat(topTarget) : TOP_VIA_SPEC.target;
  const liveTopTolerance = topTolerance.trim() !== '' ? parseFloat(topTolerance) : TOP_VIA_SPEC.tolerance;
  const liveBottomTarget = bottomTarget.trim() !== '' ? parseFloat(bottomTarget) : BOTTOM_VIA_SPEC.target;
  const liveBottomTolerance = bottomTolerance.trim() !== '' ? parseFloat(bottomTolerance) : BOTTOM_VIA_SPEC.tolerance;
  const liveMinTaper = minTaper.trim() !== '' ? parseFloat(minTaper) : 40;

  const currentViaSpec: ViaSpecification = useMemo(() => ({
    topTargetUm: liveTopTarget,
    topToleranceUm: liveTopTolerance,
    bottomTargetUm: liveBottomTarget,
    bottomToleranceUm: liveBottomTolerance,
    minTaperPercent: liveMinTaper,
    taperSpecText: taperSpecText.trim() || '≥ 40%'
  }), [liveTopTarget, liveTopTolerance, liveBottomTarget, liveBottomTolerance, liveMinTaper, taperSpecText]);

  const l1TopVal = l1Top.trim() !== '' ? parseFloat(l1Top) : null;
  const l1BottomVal = l1Bottom.trim() !== '' ? parseFloat(l1Bottom) : null;
  const l1HasEntries = l1TopVal !== null || l1BottomVal !== null;
  const l1OverallPass = l1TopVal !== null && l1BottomVal !== null && ProductProcessEngine.evalTopWidth(l1TopVal, currentViaSpec) && ProductProcessEngine.evalBottomWidth(l1BottomVal, currentViaSpec);

  const l2TopVal = l2Top.trim() !== '' ? parseFloat(l2Top) : null;
  const l2BottomVal = l2Bottom.trim() !== '' ? parseFloat(l2Bottom) : null;
  const l2HasEntries = l2TopVal !== null || l2BottomVal !== null;
  const l2OverallPass = l2TopVal !== null && l2BottomVal !== null && ProductProcessEngine.evalTopWidth(l2TopVal, currentViaSpec) && ProductProcessEngine.evalBottomWidth(l2BottomVal, currentViaSpec);

  const formOverallPass = l1OverallPass && l2OverallPass;
  const hasInspectionData = l1HasEntries || l2HasEntries;

  const l1OffsetNum = l1Offset.trim() !== '' ? parseFloat(l1Offset) : null;
  const l2OffsetNum = l2Offset.trim() !== '' ? parseFloat(l2Offset) : null;
  const deltaOffset = l1OffsetNum !== null && l2OffsetNum !== null ? Math.abs(l1OffsetNum - l2OffsetNum) : null;

  const handleSave = () => {
    const viaSpecObj: ViaSpecification | undefined = topTarget !== '' && bottomTarget !== '' ? {
      topTargetUm: parseFloat(topTarget),
      topToleranceUm: parseFloat(topTolerance) || 0,
      bottomTargetUm: parseFloat(bottomTarget),
      bottomToleranceUm: parseFloat(bottomTolerance) || 0,
      minTaperPercent: minTaper !== '' ? parseFloat(minTaper) : 40,
      taperSpecText: taperSpecText.trim() || '≥ 40%'
    } : undefined;

    const draft = {
      date: formDate,
      productName: formProduct,
      recipeName: formRecipe,
      lotPanel: formLot,
      engineerRemarks: formRemarks,
      laser1PowerOffsetPercent: l1Offset !== '' ? parseFloat(l1Offset) : null,
      laser2PowerOffsetPercent: l2Offset !== '' ? parseFloat(l2Offset) : null,
      viaSpec: viaSpecObj,
      phase1: {
        powerWatts: parseFloat(p1Power) || null,
        frequencyKhz: parseFloat(p1Freq) || null,
        shotCount: parseInt(p1Shots) || null,
        maskMm: parseFloat(p1Mask) || null,
        defocusMm: parseFloat(p1Defocus) || null
      },
      phase2: {
        powerWatts: parseFloat(p2Power) || null,
        frequencyKhz: parseFloat(p2Freq) || null,
        shotCount: parseInt(p2Shots) || null,
        maskMm: parseFloat(p2Mask) || null,
        defocusMm: parseFloat(p2Defocus) || null
      },
      laser1Via: {
        topWidthUm: parseFloat(l1Top) || null,
        bottomWidthUm: parseFloat(l1Bottom) || null,
        viaImageDataUrl: l1Image
      },
      laser2Via: {
        topWidthUm: parseFloat(l2Top) || null,
        bottomWidthUm: parseFloat(l2Bottom) || null,
        viaImageDataUrl: l2Image
      }
    };

    const newRecord = ProductProcessEngine.evaluateRecord(draft);
    onSave(newRecord);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Enter Product, Process & Via Check — ${machine.machineNumber}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-2.5 max-h-[82vh] overflow-y-auto pr-1 text-xs">
          {/* 1. Header Metadata Bar */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Check Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:outline-none focus:ring-1 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-cyan-600/20'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Product Name
              </label>
              <input
                type="text"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                placeholder="e.g. HDI Rigid-Flex Rev C"
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600/20'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Recipe Name
              </label>
              <input
                type="text"
                value={formRecipe}
                onChange={(e) => setFormRecipe(e.target.value)}
                placeholder="e.g. HDI_VIA_MICRO_50UM"
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:outline-none focus:ring-1 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600/20'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Lot / Panel
              </label>
              <input
                type="text"
                value={formLot}
                onChange={(e) => setFormLot(e.target.value)}
                placeholder="e.g. LOT-2026-8834 / P-01"
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:outline-none focus:ring-1 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600/20'
                }`}
              />
            </div>
          </div>

          {/* 2. Process Parameters (Phase 1 & Phase 2) */}
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs font-mono">
                  PROCESS PARAMETERS (PHASE 1 & PHASE 2)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Dual-Phase Drilling Recipe</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Phase 1 */}
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/90 border-amber-900/30' : 'bg-white border-amber-200'}`}>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-amber-400 uppercase text-[10px] font-mono">PHASE 1 (ROUGH / BULK)</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5 font-mono">
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Power</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p1Power}
                      onChange={(e) => setP1Power(e.target.value)}
                      placeholder="W"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">W</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Freq</label>
                    <input
                      type="number"
                      step="1"
                      value={p1Freq}
                      onChange={(e) => setP1Freq(e.target.value)}
                      placeholder="kHz"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">kHz</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Shots</label>
                    <input
                      type="number"
                      step="1"
                      value={p1Shots}
                      onChange={(e) => setP1Shots(e.target.value)}
                      placeholder="qty"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">shots</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Mask</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p1Mask}
                      onChange={(e) => setP1Mask(e.target.value)}
                      placeholder="mm"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">mm</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Defocus</label>
                    <input
                      type="number"
                      step="0.05"
                      value={p1Defocus}
                      onChange={(e) => setP1Defocus(e.target.value)}
                      placeholder="mm"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">mm</span>
                  </div>
                </div>
              </div>

              {/* Phase 2 */}
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/90 border-cyan-900/30' : 'bg-white border-cyan-200'}`}>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-bold text-cyan-400 uppercase text-[10px] font-mono">PHASE 2 (CLEAN / FINISH)</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5 font-mono">
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Power</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p2Power}
                      onChange={(e) => setP2Power(e.target.value)}
                      placeholder="W"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">W</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Freq</label>
                    <input
                      type="number"
                      step="1"
                      value={p2Freq}
                      onChange={(e) => setP2Freq(e.target.value)}
                      placeholder="kHz"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">kHz</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Shots</label>
                    <input
                      type="number"
                      step="1"
                      value={p2Shots}
                      onChange={(e) => setP2Shots(e.target.value)}
                      placeholder="qty"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">shots</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Mask</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p2Mask}
                      onChange={(e) => setP2Mask(e.target.value)}
                      placeholder="mm"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">mm</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Defocus</label>
                    <input
                      type="number"
                      step="0.05"
                      value={p2Defocus}
                      onChange={(e) => setP2Defocus(e.target.value)}
                      placeholder="mm"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Offsets & Authoritative Via Specifications */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
            {/* Power Offsets (5 cols) */}
            <div className={`lg:col-span-5 p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-xs font-mono">
                    POWER OFFSETS
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">±20% Max</span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                {/* Laser 1 Offset */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/80 border-amber-900/30' : 'bg-white border-amber-200'}`}>
                  <span className="block text-[9px] text-amber-400 font-bold uppercase mb-0.5 truncate">L1 (Head A)</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={l1Offset}
                      onChange={(e) => setL1Offset(e.target.value)}
                      placeholder="-12.0"
                      className={`w-full py-1 pl-1.5 pr-4 rounded text-xs font-bold font-mono border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                  </div>
                  <span className="block text-[8px] text-slate-500 mt-0.5 truncate">Recipe offset</span>
                </div>

                {/* Laser 2 Offset */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/80 border-cyan-900/30' : 'bg-white border-cyan-200'}`}>
                  <span className="block text-[9px] text-cyan-400 font-bold uppercase mb-0.5 truncate">L2 (Head B)</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={l2Offset}
                      onChange={(e) => setL2Offset(e.target.value)}
                      placeholder="2.0"
                      className={`w-full py-1 pl-1.5 pr-4 rounded text-xs font-bold font-mono border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                  </div>
                  <span className="block text-[8px] text-slate-500 mt-0.5 truncate">Recipe offset</span>
                </div>
              </div>

              {deltaOffset !== null && (
                <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono">
                  <span className="text-slate-400">Head Delta (|L1-L2|):</span>
                  <span className="font-bold text-amber-300">{deltaOffset.toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Authoritative Via Acceptance Specification (7 cols) */}
            <div className={`lg:col-span-7 p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-950/90 border-amber-500/30 shadow-sm shadow-amber-500/5' : 'bg-amber-50/50 border-amber-300'
            } space-y-2`}>
              <div className="flex items-center justify-between pb-1 border-b border-amber-900/30">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-xs font-mono">
                    AUTHORITATIVE VIA SPECIFICATION (GATES)
                  </span>
                  <span className="hidden sm:inline text-[9px] bg-amber-950/80 border border-amber-800/80 text-amber-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                    GATES ≠ READINGS
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyPreset('std50')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] border border-slate-700 font-mono"
                  >
                    Std 50
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('hdi35')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] border border-slate-700 font-mono"
                  >
                    HDI 35
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('fine25')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] border border-slate-700 font-mono"
                  >
                    Fine 25
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImportSpecOpen(true)}
                    className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[9px] border border-cyan-800 font-mono flex items-center gap-1"
                  >
                    <Upload className="w-2.5 h-2.5" />
                    JSON
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
                {/* Top Diameter Gate */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-bold text-slate-300 uppercase">Top Dia</span>
                    <span className="text-[8.5px] text-cyan-400 font-bold">
                      {(liveTopTarget - liveTopTolerance).toFixed(1)}–{(liveTopTarget + liveTopTolerance).toFixed(1)}µm
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[8px] text-slate-400">Target (µm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={topTarget}
                        onChange={(e) => setTopTarget(e.target.value)}
                        placeholder="51"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-400">Tol (± µm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={topTolerance}
                        onChange={(e) => setTopTolerance(e.target.value)}
                        placeholder="10"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Diameter Gate */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-bold text-slate-300 uppercase">Bottom Dia</span>
                    <span className="text-[8.5px] text-cyan-400 font-bold">
                      {(liveBottomTarget - liveBottomTolerance).toFixed(1)}–{(liveBottomTarget + liveBottomTolerance).toFixed(1)}µm
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[8px] text-slate-400">Target (µm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={bottomTarget}
                        onChange={(e) => setBottomTarget(e.target.value)}
                        placeholder="23"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-400">Tol (± µm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={bottomTolerance}
                        onChange={(e) => setBottomTolerance(e.target.value)}
                        placeholder="10"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                  </div>
                </div>

                {/* Taper Spec */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-bold text-slate-300 uppercase">Taper Ratio</span>
                    <span className="text-[8.5px] text-amber-400 font-bold">
                      (B/T)×100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[8px] text-slate-400">Min Ratio (%)</label>
                      <input
                        type="number"
                        step="1"
                        value={minTaper}
                        onChange={(e) => setMinTaper(e.target.value)}
                        placeholder="40"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-400">Label</label>
                      <input
                        type="text"
                        value={taperSpecText}
                        onChange={(e) => setTaperSpecText(e.target.value)}
                        placeholder="≥ 40%"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Via Quality Micro-Inspection (Evidence & Measurements) */}
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs font-mono">
                  VIA QUALITY MICRO-INSPECTION
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Dual-Head Inspection Evidence & Measured Diameters
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <ViaQualityInspectionCard
                laser={1}
                title="Laser 1 (Head A)"
                themeColor="amber"
                topWidth={l1Top}
                bottomWidth={l1Bottom}
                imageDataUrl={l1Image}
                viaSpec={currentViaSpec}
                onTopWidthChange={setL1Top}
                onBottomWidthChange={setL1Bottom}
                onImageUpload={(file) => handleImageUpload(1, file)}
                onImageRemove={() => setL1Image(undefined)}
                isDark={isDark}
              />
              <ViaQualityInspectionCard
                laser={2}
                title="Laser 2 (Head B)"
                themeColor="cyan"
                topWidth={l2Top}
                bottomWidth={l2Bottom}
                imageDataUrl={l2Image}
                viaSpec={currentViaSpec}
                onTopWidthChange={setL2Top}
                onBottomWidthChange={setL2Bottom}
                onImageUpload={(file) => handleImageUpload(2, file)}
                onImageRemove={() => setL2Image(undefined)}
                isDark={isDark}
              />
            </div>
          </div>

          {/* 5. Engineer Remarks (Visually Secondary) */}
          <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800/70' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <label className={`text-[10px] font-medium whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Engineer Remarks (optional):
              </label>
              <input
                type="text"
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="e.g. Recipe parameters verified against production specs."
                className={`flex-1 text-xs py-1 px-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                } outline-none`}
              />
            </div>
          </div>

          {/* 6. Footer Bar & Overall Verdict */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            {/* Left: Overall Verdict summary */}
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Overall Verdict:</span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                  !hasInspectionData
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : formOverallPass
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-rose-950 text-rose-300 border-rose-700'
                }`}
              >
                {!hasInspectionData ? 'PENDING' : formOverallPass ? 'PASS' : 'FAIL'}
              </span>
              {hasInspectionData && (
                <span className="hidden sm:inline text-[10px] text-slate-400">
                  ({formOverallPass ? 'Both Heads In Spec' : 'One or More Heads Out of Spec'})
                </span>
              )}
            </div>

            {/* Right: Cancel & Save Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} className="text-xs py-1.5 px-3">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-4">
                Save Record & Link to MHC
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Import Specification Modal */}
      <Modal
        isOpen={isImportSpecOpen}
        onClose={() => setIsImportSpecOpen(false)}
        title="Import Authoritative Via Specification"
        maxWidth="max-w-lg"
      >
        <div className="space-y-3 text-xs">
          <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
            Paste a customer/engineering Via Specification JSON object below to populate the target limits:
          </p>
          <textarea
            value={importSpecJson}
            onChange={(e) => setImportSpecJson(e.target.value)}
            placeholder={`{\n  "topTargetUm": 51,\n  "topToleranceUm": 10,\n  "bottomTargetUm": 23,\n  "bottomToleranceUm": 10,\n  "minTaperPercent": 40,\n  "taperSpecText": "≥ 40%"\n}`}
            className={`w-full h-36 border rounded p-2.5 font-mono text-xs focus:border-cyan-500 outline-none ${
              isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsImportSpecOpen(false)} className="text-xs py-1.5 px-3">
              Cancel
            </Button>
            <Button onClick={handleImportSpec} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-4">
              Apply Spec
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
