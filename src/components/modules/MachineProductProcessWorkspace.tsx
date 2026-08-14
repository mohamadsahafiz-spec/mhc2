import React, { useState } from 'react';
import { Plus, Upload, Image as ImageIcon, CheckCircle, CheckCircle2, XCircle, Sliders, Layers, FileText, Trash2 } from 'lucide-react';
import { Machine } from '../../types';
import { ProductProcessRecord, TOP_VIA_SPEC, BOTTOM_VIA_SPEC } from '../../types/productProcess';
import { ProductProcessEngine } from '../../utils/productProcessEngine';
import { StorageService } from '../../utils/persistence';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface MachineProductProcessWorkspaceProps {
  machine: Machine;
  onUpdateMachine: (updatedMachine: Machine) => void;
}

export const MachineProductProcessWorkspace: React.FC<MachineProductProcessWorkspaceProps> = ({
  machine,
  onUpdateMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  if (!machine) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${
        isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-50" />
        <p className="text-sm font-semibold">No machine selected for product process inspection.</p>
      </div>
    );
  }

  const records = machine?.productProcessRecords || [];
  const latestRecord = records[0] || null;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for New Check
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formProduct, setFormProduct] = useState(latestRecord?.productName || '');
  const [formRecipe, setFormRecipe] = useState(latestRecord?.recipeName || '');
  const [formLot, setFormLot] = useState(latestRecord?.lotPanel || '');
  const [formRemarks, setFormRemarks] = useState('');

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

  // Laser 1 Via Quality
  const [l1Top, setL1Top] = useState<string>('');
  const [l1Bottom, setL1Bottom] = useState<string>('');
  const [l1Image, setL1Image] = useState<string | undefined>(undefined);

  // Laser 2 Via Quality
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

  const handleSaveNewRecord = () => {
    const draft = {
      date: formDate,
      productName: formProduct,
      recipeName: formRecipe,
      lotPanel: formLot,
      engineerRemarks: formRemarks,
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
    const updatedRecords = [newRecord, ...records];
    const updatedMachine: Machine = {
      ...machine,
      productProcessRecords: updatedRecords
    };

    onUpdateMachine(updatedMachine);
    const all = StorageService.getMachines();
    const others = all.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...others]);

    setIsAddModalOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    const updatedRecords = records.filter(r => r.id !== id);
    const updatedMachine: Machine = {
      ...machine,
      productProcessRecords: updatedRecords
    };
    onUpdateMachine(updatedMachine);
    const all = StorageService.getMachines();
    const others = all.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...others]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-5 border-slate-800 bg-slate-900/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Layers className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-100">Product, Process & Via Quality</h3>
              <Badge variant="cyan">{machine.machineNumber}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authoritative machine product recipes, process parameters, and via drilling micro-inspection logs.
            </p>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-2 px-4 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Enter New Product / Process Check
          </Button>
        </div>
      </Card>

      {/* Latest Record Highlight */}
      {latestRecord ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span className="font-bold text-slate-200">LATEST VERIFIED RECORD ({latestRecord.date})</span>
            <Badge variant={latestRecord.overallResult === 'PASS' ? 'success' : 'danger'}>
              OVERALL: {latestRecord.overallResult}
            </Badge>
          </div>

          {/* Product & Process Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Product Identity */}
            <Card className="p-4 border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Product Identity
                </h4>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Product Name</span>
                  <span className="font-bold text-slate-200">{latestRecord.productName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Recipe</span>
                  <span className="text-cyan-300 font-bold">{latestRecord.recipeName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Lot / Panel</span>
                  <span className="text-amber-300">{latestRecord.lotPanel || '—'}</span>
                </div>
              </div>
            </Card>

            {/* Process Parameters Phase 1 & 2 */}
            <Card className="p-4 border-slate-800 bg-slate-950 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  Process Parameters
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                {/* Phase 1 */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block border-b border-slate-800 pb-1">Phase 1</span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Power:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.powerWatts ?? '—'} W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.frequencyKhz ?? '—'} kHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shot Count:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.shotCount ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mask:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.maskMm ?? '—'} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Defocus:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.defocusMm ?? '—'} mm</span>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase block border-b border-slate-800 pb-1">Phase 2</span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Power:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.powerWatts ?? '—'} W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.frequencyKhz ?? '—'} kHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shot Count:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.shotCount ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mask:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.maskMm ?? '—'} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Defocus:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.defocusMm ?? '—'} mm</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Via Quality Cards: Laser 1 & Laser 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Laser 1 Via Quality */}
            <Card className="p-4 border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                  VIA QUALITY — LASER 1 (HEAD A)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  latestRecord.laser1Via.overallPass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {latestRecord.laser1Via.overallPass ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {latestRecord.laser1Via.viaImageDataUrl ? (
                    <img src={latestRecord.laser1Via.viaImageDataUrl} alt="Laser 1 Via" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono flex-1">
                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Top Drill Width</span>
                      <span className="font-bold text-slate-100">{latestRecord.laser1Via.topWidthUm ?? '—'} µm</span>
                      <span className="text-[9px] text-slate-500 block">Spec: {TOP_VIA_SPEC.target}±{TOP_VIA_SPEC.tolerance}µm</span>
                    </div>
                    {latestRecord.laser1Via.topPass ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Bottom Drill Width</span>
                      <span className="font-bold text-slate-100">{latestRecord.laser1Via.bottomWidthUm ?? '—'} µm</span>
                      <span className="text-[9px] text-slate-500 block">Spec: {BOTTOM_VIA_SPEC.target}±{BOTTOM_VIA_SPEC.tolerance}µm</span>
                    </div>
                    {latestRecord.laser1Via.bottomPass ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Laser 2 Via Quality */}
            <Card className="p-4 border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider">
                  VIA QUALITY — LASER 2 (HEAD B)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  latestRecord.laser2Via.overallPass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {latestRecord.laser2Via.overallPass ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {latestRecord.laser2Via.viaImageDataUrl ? (
                    <img src={latestRecord.laser2Via.viaImageDataUrl} alt="Laser 2 Via" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono flex-1">
                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Top Drill Width</span>
                      <span className="font-bold text-slate-100">{latestRecord.laser2Via.topWidthUm ?? '—'} µm</span>
                      <span className="text-[9px] text-slate-500 block">Spec: {TOP_VIA_SPEC.target}±{TOP_VIA_SPEC.tolerance}µm</span>
                    </div>
                    {latestRecord.laser2Via.topPass ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Bottom Drill Width</span>
                      <span className="font-bold text-slate-100">{latestRecord.laser2Via.bottomWidthUm ?? '—'} µm</span>
                      <span className="text-[9px] text-slate-500 block">Spec: {BOTTOM_VIA_SPEC.target}±{BOTTOM_VIA_SPEC.tolerance}µm</span>
                    </div>
                    {latestRecord.laser2Via.bottomPass ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center text-slate-400 border-dashed border-slate-800">
          <p>No product or process records found for this machine.</p>
          <Button onClick={() => setIsAddModalOpen(true)} className="mt-3 bg-cyan-500 text-slate-950 font-bold text-xs">
            Add Initial Record
          </Button>
        </Card>
      )}

      {/* Historical Records Table */}
      <Card className="p-4 border-slate-800 bg-slate-900/90 space-y-3">
        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
          Product & Process Verification History ({records.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Product / Recipe</th>
                <th className="py-2 px-2">Lot / Panel</th>
                <th className="py-2 px-2">Phase 1 Pwr / Freq</th>
                <th className="py-2 px-2">Phase 2 Pwr / Freq</th>
                <th className="py-2 px-2">Laser 1 Via (Top/Btm)</th>
                <th className="py-2 px-2">Laser 2 Via (Top/Btm)</th>
                <th className="py-2 px-2 text-center">Result</th>
                <th className="py-2 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-800/40">
                  <td className="py-2 px-2 font-bold text-slate-200">{rec.date}</td>
                  <td className="py-2 px-2 text-slate-300">
                    <div className="font-semibold">{rec.productName || '—'}</div>
                    <div className="text-[10px] text-cyan-400">{rec.recipeName || '—'}</div>
                  </td>
                  <td className="py-2 px-2 text-amber-300">{rec.lotPanel || '—'}</td>
                  <td className="py-2 px-2 text-slate-300">
                    {rec.phase1.powerWatts ?? '—'}W / {rec.phase1.frequencyKhz ?? '—'}kHz
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {rec.phase2.powerWatts ?? '—'}W / {rec.phase2.frequencyKhz ?? '—'}kHz
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {rec.laser1Via.topWidthUm ?? '—'}µm / {rec.laser1Via.bottomWidthUm ?? '—'}µm
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {rec.laser2Via.topWidthUm ?? '—'}µm / {rec.laser2Via.bottomWidthUm ?? '—'}µm
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Badge variant={rec.overallResult === 'PASS' ? 'success' : 'danger'} className="text-[9px]">
                      {rec.overallResult}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Enter New Record Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Enter New Product, Process & Via Check — ${machine.model}`}
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
              PROCESS PARAMETERS (PHASE 1 & PHASE 2)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phase 1 Inputs */}
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

              {/* Phase 2 Inputs */}
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

          {/* Via Quality Inputs: Laser 1 & Laser 2 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              VIA QUALITY MICRO-INSPECTION
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Laser 1 Via Entry */}
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
                    <label className="block text-[10px] text-slate-400">Top Drill Width (µm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={l1Top}
                      onChange={(e) => setL1Top(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                    <span className="text-[9px] text-slate-500">Spec: 51±10µm</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Bottom Drill Width (µm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={l1Bottom}
                      onChange={(e) => setL1Bottom(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                    <span className="text-[9px] text-slate-500">Spec: 23±10µm</span>
                  </div>
                </div>
              </div>

              {/* Laser 2 Via Entry */}
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
                    <label className="block text-[10px] text-slate-400">Top Drill Width (µm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={l2Top}
                      onChange={(e) => setL2Top(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                    <span className="text-[9px] text-slate-500">Spec: 51±10µm</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Bottom Drill Width (µm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={l2Bottom}
                      onChange={(e) => setL2Bottom(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
                    />
                    <span className="text-[9px] text-slate-500">Spec: 23±10µm</span>
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
              placeholder="e.g. Recipe parameters verified against production specs."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
            />
          </div>

          {/* Footer & Save */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs py-1.5 px-3">
              Cancel
            </Button>
            <Button onClick={handleSaveNewRecord} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-4">
              Save Record to Passport
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
