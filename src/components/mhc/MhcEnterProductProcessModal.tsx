import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Sliders, Layers, Zap } from 'lucide-react';
import { Machine } from '../../types';
import { ProductProcessRecord, TOP_VIA_SPEC, BOTTOM_VIA_SPEC } from '../../types/productProcess';
import { ProductProcessEngine } from '../../utils/productProcessEngine';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

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

  const handleSave = () => {
    const draft = {
      date: formDate,
      productName: formProduct,
      recipeName: formRecipe,
      lotPanel: formLot,
      engineerRemarks: formRemarks,
      laser1PowerOffsetPercent: l1Offset !== '' ? parseFloat(l1Offset) : null,
      laser2PowerOffsetPercent: l2Offset !== '' ? parseFloat(l2Offset) : null,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enter Product, Process & Via Check — ${machine.machineNumber}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 text-xs">
        {/* Header Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Check Date</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Product Name</label>
            <input
              type="text"
              value={formProduct}
              onChange={(e) => setFormProduct(e.target.value)}
              placeholder="e.g. HDI Rigid-Flex Rev C"
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Recipe Name</label>
            <input
              type="text"
              value={formRecipe}
              onChange={(e) => setFormRecipe(e.target.value)}
              placeholder="e.g. HDI_VIA_MICRO_50UM"
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Lot / Panel</label>
            <input
              type="text"
              value={formLot}
              onChange={(e) => setFormLot(e.target.value)}
              placeholder="e.g. LOT-2026-8834 / P-01"
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>
        </div>

        {/* Process Parameters Phase 1 & 2 */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
          <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            PROCESS PARAMETERS
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phase 1 */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-amber-400 uppercase text-[11px] block border-b border-slate-800 pb-1">PHASE 1</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="block text-[10px] text-slate-400">Power (W)</label>
                  <input type="number" step="0.1" value={p1Power} onChange={(e) => setP1Power(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Freq (kHz)</label>
                  <input type="number" step="1" value={p1Freq} onChange={(e) => setP1Freq(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Shot Count</label>
                  <input type="number" step="1" value={p1Shots} onChange={(e) => setP1Shots(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Mask (mm)</label>
                  <input type="number" step="0.1" value={p1Mask} onChange={(e) => setP1Mask(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Defocus (mm)</label>
                  <input type="number" step="0.05" value={p1Defocus} onChange={(e) => setP1Defocus(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-400 uppercase text-[11px] block border-b border-slate-800 pb-1">PHASE 2</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="block text-[10px] text-slate-400">Power (W)</label>
                  <input type="number" step="0.1" value={p2Power} onChange={(e) => setP2Power(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Freq (kHz)</label>
                  <input type="number" step="1" value={p2Freq} onChange={(e) => setP2Freq(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Shot Count</label>
                  <input type="number" step="1" value={p2Shots} onChange={(e) => setP2Shots(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Mask (mm)</label>
                  <input type="number" step="0.1" value={p2Mask} onChange={(e) => setP2Mask(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Defocus (mm)</label>
                  <input type="number" step="0.05" value={p2Defocus} onChange={(e) => setP2Defocus(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Process Power Offset (Machine Passport Source of Truth) */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              PROCESS POWER OFFSET
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Range: −20% to +20%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="font-bold text-amber-400 text-[11px] uppercase block">LASER 1 POWER OFFSET</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={l1Offset}
                  onChange={(e) => setL1Offset(e.target.value)}
                  placeholder="e.g. -12.0"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                />
                <span className="text-slate-400 font-mono text-xs font-bold">%</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Applied to Laser 1 recipe power in §09</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="font-bold text-cyan-400 text-[11px] uppercase block">LASER 2 POWER OFFSET</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={l2Offset}
                  onChange={(e) => setL2Offset(e.target.value)}
                  placeholder="e.g. 2.0"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                />
                <span className="text-slate-400 font-mono text-xs font-bold">%</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Applied to Laser 2 recipe power in §09</span>
            </div>
          </div>
        </div>

        {/* Via Quality */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
          <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            VIA QUALITY MICRO-INSPECTION
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Laser 1 */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-bold text-amber-400 text-xs uppercase block">LASER 1 (HEAD A)</span>
              
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded bg-slate-950 border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center relative">
                  {l1Image ? (
                    <img src={l1Image} alt="Laser 1 Via" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-[11px] font-semibold flex items-center justify-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload Via Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(1, file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="block text-[10px] text-slate-400">Top Width (µm)</label>
                  <input type="number" step="0.1" value={l1Top} onChange={(e) => setL1Top(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                  <span className="text-[9px] text-slate-500">Spec: {TOP_VIA_SPEC.target}±{TOP_VIA_SPEC.tolerance}µm</span>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Bottom Width (µm)</label>
                  <input type="number" step="0.1" value={l1Bottom} onChange={(e) => setL1Bottom(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                  <span className="text-[9px] text-slate-500">Spec: {BOTTOM_VIA_SPEC.target}±{BOTTOM_VIA_SPEC.tolerance}µm</span>
                </div>
              </div>
            </div>

            {/* Laser 2 */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
              <span className="font-bold text-cyan-400 text-xs uppercase block">LASER 2 (HEAD B)</span>
              
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded bg-slate-950 border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center relative">
                  {l2Image ? (
                    <img src={l2Image} alt="Laser 2 Via" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-[11px] font-semibold flex items-center justify-center gap-1.5 w-full">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload Via Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(2, file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="block text-[10px] text-slate-400">Top Width (µm)</label>
                  <input type="number" step="0.1" value={l2Top} onChange={(e) => setL2Top(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                  <span className="text-[9px] text-slate-500">Spec: {TOP_VIA_SPEC.target}±{TOP_VIA_SPEC.tolerance}µm</span>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400">Bottom Width (µm)</label>
                  <input type="number" step="0.1" value={l2Bottom} onChange={(e) => setL2Bottom(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100" />
                  <span className="text-[9px] text-slate-500">Spec: {BOTTOM_VIA_SPEC.target}±{BOTTOM_VIA_SPEC.tolerance}µm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">Engineer Remarks</label>
          <input
            type="text"
            value={formRemarks}
            onChange={(e) => setFormRemarks(e.target.value)}
            placeholder="e.g. Saved directly from Smart MHC workspace."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <Button variant="outline" onClick={onClose} className="text-xs py-1.5 px-3">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-4">
            Save Record & Link to MHC
          </Button>
        </div>
      </div>
    </Modal>
  );
};
