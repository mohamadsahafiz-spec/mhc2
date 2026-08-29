import React, { useState } from 'react';
import {
  Aperture,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Upload,
  Image as ImageIcon,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { Machine } from '../../types';
import {
  BeamCheckpointReading,
  BeamCheckpointSpec,
  BeamProfileCheckRecord,
  CHECKPOINT_SPECS,
  CheckpointId
} from '../../types/beamProfile';
import { BeamProfileEngine } from '../../utils/beamProfileEngine';
import { StorageService } from '../../utils/persistence';
import { ImageStore } from '../../utils/imageStore';
import { getLocalDateString } from '../../utils/timeUtils';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

interface MachineBeamProfileWorkspaceProps {
  machine: Machine;
  onUpdateMachine: (updatedMachine: Machine) => void;
}

export const MachineBeamProfileWorkspace: React.FC<MachineBeamProfileWorkspaceProps> = ({
  machine,
  onUpdateMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const records = machine?.beamProfileRecords || [];
  const latestRecord = records[0] || null;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<BeamProfileCheckRecord | null>(null);

  // Form State for New Check
  const [formDate, setFormDate] = useState<string>(getLocalDateString());
  const [formRemarks, setFormRemarks] = useState<string>('');

  // Local state for the checkpoint inputs in the modal
  const [formReadings, setFormReadings] = useState<Record<CheckpointId, { diameterStr: string; imageDataUrl?: string }>>(() => {
    const init: Partial<Record<CheckpointId, { diameterStr: string; imageDataUrl?: string }>> = {};
    CHECKPOINT_SPECS.forEach(s => {
      let defaultValStr = '3.5';
      if (s.id.startsWith('6B') || s.id.startsWith('7B')) defaultValStr = '4.15';
      else if (s.maskSize) defaultValStr = (s.minMm + 0.1).toFixed(1);

      init[s.id] = {
        diameterStr: defaultValStr,
        imageDataUrl: BeamProfileEngine.generateSyntheticBeamSvg(s.id, s.id.includes('6A') || s.id.includes('7A') ? '#f59e0b' : '#06b6d4')
      };
    });
    return init as Record<CheckpointId, { diameterStr: string; imageDataUrl?: string }>;
  });

  const handleInputChange = (id: CheckpointId, field: 'diameterStr' | 'imageDataUrl', val?: string) => {
    setFormReadings(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val
      }
    }));
  };

  const handleImageFileUpload = (id: CheckpointId, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        handleInputChange(id, 'imageDataUrl', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Evaluate form values on the fly
  const currentFormParsed = React.useMemo<BeamProfileCheckRecord>(() => {
    const draftReadings: Partial<Record<CheckpointId, BeamCheckpointReading>> = {};
    CHECKPOINT_SPECS.forEach(s => {
      const entry = formReadings[s.id];
      const parsedNum = entry?.diameterStr ? parseFloat(entry.diameterStr) : null;
      const pass = BeamProfileEngine.evalSpec(parsedNum, s.minMm, s.maxMm);
      draftReadings[s.id] = {
        checkpointId: s.id,
        measuredDiameterMm: parsedNum !== null && !isNaN(parsedNum) ? parsedNum : null,
        imageDataUrl: entry?.imageDataUrl,
        pass
      };
    });

    return BeamProfileEngine.evaluateRecord({
      date: formDate,
      engineerRemarks: formRemarks,
      readings: draftReadings as Record<CheckpointId, BeamCheckpointReading>
    });
  }, [formReadings, formDate, formRemarks]);

  if (!machine) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${
        isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <Eye className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-50" />
        <p className="text-sm font-semibold">No machine selected for laser beam profile inspection.</p>
      </div>
    );
  }

  // Save New Record
  const handleSaveRecord = () => {
    const newRecord = BeamProfileEngine.evaluateRecord(currentFormParsed);
    const updatedRecords = [newRecord, ...records];
    const updatedMachine: Machine = {
      ...machine,
      beamProfileRecords: updatedRecords
    };

    onUpdateMachine(updatedMachine);
    const allMachines = StorageService.getMachines();
    const otherMachines = allMachines.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...otherMachines]);

    setIsAddModalOpen(false);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Beam Profile record?')) return;
    const updatedRecords = records.filter(r => r.id !== id);
    const updatedMachine: Machine = {
      ...machine,
      beamProfileRecords: updatedRecords
    };
    onUpdateMachine(updatedMachine);
    const allMachines = StorageService.getMachines();
    const otherMachines = allMachines.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...otherMachines]);
    try {
      await ImageStore.deleteImagesForRecord(id);
    } catch (err) {
      console.error('Failed to clean up IDB images:', err);
    }
  };

  // Quick pointers for latest record metrics
  const rec6A = latestRecord?.readings['6A'];
  const rec6B = latestRecord?.readings['6B'];
  const rec6C13 = latestRecord?.readings['6C-1.3mm'];
  const rec7A = latestRecord?.readings['7A'];
  const rec7B = latestRecord?.readings['7B'];
  const rec7C13 = latestRecord?.readings['7C-1.3mm'];

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#15181C] border-[#2B323A]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Aperture className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Beam Profile & Diameter Engineering Record
              {latestRecord && (
                <Badge variant={latestRecord.overallResult === 'PASS' ? 'success' : 'danger'}>
                  {latestRecord.overallResult}
                </Badge>
              )}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Machine-bound dual-laser optical beam diagnostics • Checkpoints 6A–6C (Laser 1) & 7A–7C (Laser 2)
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-2 px-4 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Enter New Beam Check
        </Button>
      </div>

      {/* LATEST RECORD SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Laser 1 Source & Top Hat */}
        <Card title="Laser 1 (Head A) Source / Top Hat">
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-500 font-bold block">6A — SOURCE</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm font-bold font-mono text-slate-200">
                    {rec6A?.measuredDiameterMm !== null && rec6A?.measuredDiameterMm !== undefined ? `${rec6A.measuredDiameterMm} mm` : '—'}
                  </span>
                  {rec6A && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${rec6A.pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {rec6A.pass ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">3.5mm ±10%</span>
              </div>

              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-500 font-bold block">6B — TOP HAT</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm font-bold font-mono text-slate-200">
                    {rec6B?.measuredDiameterMm !== null && rec6B?.measuredDiameterMm !== undefined ? `${rec6B.measuredDiameterMm} mm` : '—'}
                  </span>
                  {rec6B && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${rec6B.pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {rec6B.pass ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">4.2mm ±5%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Laser 2 Source & Top Hat */}
        <Card title="Laser 2 (Head B) Source / Top Hat">
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-500 font-bold block">7A — SOURCE</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm font-bold font-mono text-slate-200">
                    {rec7A?.measuredDiameterMm !== null && rec7A?.measuredDiameterMm !== undefined ? `${rec7A.measuredDiameterMm} mm` : '—'}
                  </span>
                  {rec7A && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${rec7A.pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {rec7A.pass ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">3.5mm ±10%</span>
              </div>

              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-500 font-bold block">7B — TOP HAT</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm font-bold font-mono text-slate-200">
                    {rec7B?.measuredDiameterMm !== null && rec7B?.measuredDiameterMm !== undefined ? `${rec7B.measuredDiameterMm} mm` : '—'}
                  </span>
                  {rec7B && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${rec7B.pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {rec7B.pass ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">4.2mm ±5%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Mask 1.3mm Checkpoints */}
        <Card title="Working Zone 1.3mm Masks">
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-500 font-bold block">6C / 1.3mm</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm font-bold font-mono text-slate-200">
                    {rec6C13?.measuredDiameterMm !== null && rec6C13?.measuredDiameterMm !== undefined ? `${rec6C13.measuredDiameterMm} mm` : '—'}
                  </span>
                  {rec6C13 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${rec6C13.pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {rec6C13.pass ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">≥1.3mm</span>
              </div>

              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-500 font-bold block">7C / 1.3mm</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm font-bold font-mono text-slate-200">
                    {rec7C13?.measuredDiameterMm !== null && rec7C13?.measuredDiameterMm !== undefined ? `${rec7C13.measuredDiameterMm} mm` : '—'}
                  </span>
                  {rec7C13 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${rec7C13.pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {rec7C13.pass ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block mt-1">≥1.3mm</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 4: Record Summary */}
        <Card title="Latest Record Info">
          <div className="space-y-2 text-xs flex flex-col justify-between h-full pb-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Latest Date:</span>
              <span className="font-bold font-mono text-slate-200">{latestRecord?.date || 'No Record'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Total Checkpoints:</span>
              <span className="font-bold font-mono text-slate-200">16 Items (6A-6C & 7A-7C)</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400 text-xs">Overall Verdict:</span>
              {latestRecord ? (
                <Badge variant={latestRecord.overallResult === 'PASS' ? 'success' : 'danger'}>
                  {latestRecord.overallResult}
                </Badge>
              ) : (
                <span className="text-slate-500 italic">No Checks</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* LATEST RECORD DETAILED GALLERY */}
      {latestRecord && (
        <Card title={`Latest Beam Profile Telemetry (${latestRecord.date})`}>
          <div className="space-y-4">
            {/* LASER 1 GALLERY */}
            <div>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                LASER 1 (HEAD A) CHECKPOINTS
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 1').map(s => {
                  const r = latestRecord.readings[s.id];
                  return (
                    <div key={s.id} className={`p-2 rounded-xl border flex flex-col items-center text-center ${
                      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-12 h-12 rounded bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center mb-1.5 relative">
                        {r?.imageDataUrl ? (
                          <img src={r.imageDataUrl} alt={s.stageLabel} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 block truncate w-full">{s.stageLabel}</span>
                      <span className="text-[11px] font-mono font-bold text-slate-100 my-0.5">
                        {r?.measuredDiameterMm !== null && r?.measuredDiameterMm !== undefined ? `${r.measuredDiameterMm}mm` : '—'}
                      </span>
                      <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                        r?.pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {r?.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LASER 2 GALLERY */}
            <div>
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                LASER 2 (HEAD B) CHECKPOINTS
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 2').map(s => {
                  const r = latestRecord.readings[s.id];
                  return (
                    <div key={s.id} className={`p-2 rounded-xl border flex flex-col items-center text-center ${
                      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-12 h-12 rounded bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center mb-1.5 relative">
                        {r?.imageDataUrl ? (
                          <img src={r.imageDataUrl} alt={s.stageLabel} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 block truncate w-full">{s.stageLabel}</span>
                      <span className="text-[11px] font-mono font-bold text-slate-100 my-0.5">
                        {r?.measuredDiameterMm !== null && r?.measuredDiameterMm !== undefined ? `${r.measuredDiameterMm}mm` : '—'}
                      </span>
                      <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                        r?.pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {r?.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* HISTORICAL RECORDS TABLE */}
      <Card title={`Beam Profile Records History (${records.length})`}>
        {records.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs italic">
            No Beam Profile records saved for this machine yet. Click "Enter New Beam Check" above to record one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Laser 1 (6A / 6B / 1.3mm)</th>
                  <th className="py-2.5 px-3">Laser 2 (7A / 7B / 1.3mm)</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3">Overall</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${
                isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-200 text-slate-800'
              }`}>
                {records.map(rec => {
                  const l1a = rec.readings['6A'];
                  const l1b = rec.readings['6B'];
                  const l1c13 = rec.readings['6C-1.3mm'];

                  const l2a = rec.readings['7A'];
                  const l2b = rec.readings['7B'];
                  const l2c13 = rec.readings['7C-1.3mm'];

                  return (
                    <tr key={rec.id} className={`hover:bg-slate-900/40 transition-colors ${
                      isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                    }`}>
                      <td className="py-2.5 px-3 font-bold">{rec.date}</td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {l1a?.measuredDiameterMm ?? '—'}mm / {l1b?.measuredDiameterMm ?? '—'}mm / {l1c13?.measuredDiameterMm ?? '—'}mm
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {l2a?.measuredDiameterMm ?? '—'}mm / {l2b?.measuredDiameterMm ?? '—'}mm / {l2c13?.measuredDiameterMm ?? '—'}mm
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 truncate max-w-[200px]">
                        {rec.engineerRemarks || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={rec.overallResult === 'PASS' ? 'success' : 'danger'}>
                          {rec.overallResult}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 font-sans">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRecordDetail(rec)}
                          className="py-1 px-2 text-[11px]"
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="py-1 px-2 text-[11px]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL 1: ENTER NEW BEAM CHECK */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`New Beam Profile Check — ${machine.model} (${machine.machineNumber})`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 text-xs">
          {/* Date Picker */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <label className="block font-semibold text-slate-300 mb-1">Check Date</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full sm:w-64 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
            />
          </div>

          {/* LASER 1 SECTION */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                LASER 1 (HEAD A) — BEAM PROFILE CHECKPOINTS
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 1').map(s => {
                const entry = formReadings[s.id];
                const parsedNum = entry?.diameterStr ? parseFloat(entry.diameterStr) : null;
                const pass = BeamProfileEngine.evalSpec(parsedNum, s.minMm, s.maxMm);

                return (
                  <div key={s.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{s.stageLabel}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400">Spec: {s.specText}</p>

                    {/* Beam Image Box + Upload */}
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-14 rounded bg-slate-950 border border-slate-800 shrink-0 relative overflow-hidden flex items-center justify-center">
                        {entry?.imageDataUrl ? (
                          <img src={entry.imageDataUrl} alt={s.stageLabel} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[10px] font-semibold flex items-center justify-center gap-1 w-full">
                          <Upload className="w-3 h-3 text-cyan-400" />
                          <span>Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageFileUpload(s.id, file);
                            }}
                          />
                        </label>

                        {entry?.imageDataUrl && (
                          <button
                            type="button"
                            onClick={() => handleInputChange(s.id, 'imageDataUrl', undefined)}
                            className="text-[9px] text-rose-400 hover:underline block text-center w-full"
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Diameter Input */}
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Diameter (mm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={entry?.diameterStr || ''}
                        onChange={(e) => handleInputChange(s.id, 'diameterStr', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LASER 2 SECTION */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                LASER 2 (HEAD B) — BEAM PROFILE CHECKPOINTS
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 2').map(s => {
                const entry = formReadings[s.id];
                const parsedNum = entry?.diameterStr ? parseFloat(entry.diameterStr) : null;
                const pass = BeamProfileEngine.evalSpec(parsedNum, s.minMm, s.maxMm);

                return (
                  <div key={s.id} className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{s.stageLabel}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        pass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400">Spec: {s.specText}</p>

                    {/* Beam Image Box + Upload */}
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-14 rounded bg-slate-950 border border-slate-800 shrink-0 relative overflow-hidden flex items-center justify-center">
                        {entry?.imageDataUrl ? (
                          <img src={entry.imageDataUrl} alt={s.stageLabel} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-600" />
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded px-2 py-1 text-[10px] font-semibold flex items-center justify-center gap-1 w-full">
                          <Upload className="w-3 h-3 text-cyan-400" />
                          <span>Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageFileUpload(s.id, file);
                            }}
                          />
                        </label>

                        {entry?.imageDataUrl && (
                          <button
                            type="button"
                            onClick={() => handleInputChange(s.id, 'imageDataUrl', undefined)}
                            className="text-[9px] text-rose-400 hover:underline block text-center w-full"
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Diameter Input */}
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Diameter (mm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={entry?.diameterStr || ''}
                        onChange={(e) => handleInputChange(s.id, 'diameterStr', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Engineer Remarks</label>
            <input
              type="text"
              value={formRemarks}
              onChange={(e) => setFormRemarks(e.target.value)}
              placeholder="e.g. Beam circularity and Gaussian energy distribution verified."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
            />
          </div>

          {/* Footer & Save */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">OVERALL VERDICT:</span>
              <Badge variant={currentFormParsed.overallResult === 'PASS' ? 'success' : 'danger'}>
                {currentFormParsed.overallResult}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs py-1.5 px-3">
                Cancel
              </Button>
              <Button onClick={handleSaveRecord} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-4">
                Save Beam Check Record
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: DETAIL VIEW */}
      {selectedRecordDetail && (
        <Modal
          isOpen={!!selectedRecordDetail}
          onClose={() => setSelectedRecordDetail(null)}
          title={`Beam Profile Record Details — ${selectedRecordDetail.date}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-slate-400 text-[10px] block">CHECK DATE</span>
                <strong className="text-slate-100 text-sm">{selectedRecordDetail.date}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block text-right">OVERALL VERDICT</span>
                <Badge variant={selectedRecordDetail.overallResult === 'PASS' ? 'success' : 'danger'}>
                  {selectedRecordDetail.overallResult}
                </Badge>
              </div>
            </div>

            {/* Checkpoints Grid */}
            <div className="space-y-3 font-sans">
              <h4 className="font-bold text-amber-400">Laser 1 Checkpoints</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 1').map(s => {
                  const r = selectedRecordDetail.readings[s.id];
                  return (
                    <div key={s.id} className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                      <div className="w-12 h-12 rounded bg-slate-900 border border-slate-800 mx-auto mb-1 overflow-hidden">
                        {r?.imageDataUrl && <img src={r.imageDataUrl} alt={s.stageLabel} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 block truncate">{s.stageLabel}</span>
                      <span className="text-xs font-mono font-bold block">{r?.measuredDiameterMm ?? '—'}mm</span>
                      <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${r?.pass ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {r?.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <h4 className="font-bold text-cyan-400 pt-2">Laser 2 Checkpoints</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 2').map(s => {
                  const r = selectedRecordDetail.readings[s.id];
                  return (
                    <div key={s.id} className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                      <div className="w-12 h-12 rounded bg-slate-900 border border-slate-800 mx-auto mb-1 overflow-hidden">
                        {r?.imageDataUrl && <img src={r.imageDataUrl} alt={s.stageLabel} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 block truncate">{s.stageLabel}</span>
                      <span className="text-xs font-mono font-bold block">{r?.measuredDiameterMm ?? '—'}mm</span>
                      <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${r?.pass ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {r?.pass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedRecordDetail.engineerRemarks && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-sans">
                <span className="text-slate-400 font-bold block mb-1">Engineer Remarks:</span>
                <p className="text-slate-200">{selectedRecordDetail.engineerRemarks}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
