import React, { useState, useMemo } from 'react';
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
  Info,
  Edit3
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
import { BeamProfileCheckpointCard } from '../mhc/BeamProfileCheckpointCard';

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

  const records = useMemo(() => {
    const raw = machine?.beamProfileRecords || [];
    return [...raw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [machine?.beamProfileRecords]);
  const latestRecord = records[0] || null;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<BeamProfileCheckRecord | null>(null);

  // Form State for New Check
  const [formDate, setFormDate] = useState<string>(getLocalDateString());
  const [formRemarks, setFormRemarks] = useState<string>('');
  const [activeLaserFilter, setActiveLaserFilter] = useState<'ALL' | 'LASER_1' | 'LASER_2'>('ALL');

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

  const handleOpenAdd = () => {
    setEditingRecordId(null);
    setFormDate(getLocalDateString());
    setFormRemarks('');
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
    setFormReadings(init as Record<CheckpointId, { diameterStr: string; imageDataUrl?: string }>);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec: BeamProfileCheckRecord) => {
    setEditingRecordId(rec.id);
    setFormDate(rec.date);
    setFormRemarks(rec.engineerRemarks || '');
    const init: Partial<Record<CheckpointId, { diameterStr: string; imageDataUrl?: string }>> = {};
    CHECKPOINT_SPECS.forEach(s => {
      const r = rec.readings[s.id];
      init[s.id] = {
        diameterStr: r?.measuredDiameterMm !== null && r?.measuredDiameterMm !== undefined ? String(r.measuredDiameterMm) : '',
        imageDataUrl: r?.imageDataUrl
      };
    });
    setFormReadings(init as Record<CheckpointId, { diameterStr: string; imageDataUrl?: string }>);
    setSelectedRecordDetail(null);
    setIsAddModalOpen(true);
  };

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

  const laser1Specs = React.useMemo(() => CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 1'), []);
  const laser2Specs = React.useMemo(() => CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 2'), []);

  const laser1PassedCount = React.useMemo(
    () => laser1Specs.filter(s => currentFormParsed.readings[s.id]?.pass).length,
    [laser1Specs, currentFormParsed.readings]
  );
  const laser2PassedCount = React.useMemo(
    () => laser2Specs.filter(s => currentFormParsed.readings[s.id]?.pass).length,
    [laser2Specs, currentFormParsed.readings]
  );
  const totalPassedCount = laser1PassedCount + laser2PassedCount;

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

  // Save Record
  const handleSaveRecord = () => {
    const evaluated = BeamProfileEngine.evaluateRecord(currentFormParsed);
    let updatedRecords: BeamProfileCheckRecord[];

    if (editingRecordId) {
      updatedRecords = records.map(r =>
        r.id === editingRecordId
          ? { ...evaluated, id: editingRecordId, createdAt: r.createdAt }
          : r
      );
    } else {
      updatedRecords = [evaluated, ...records];
    }
    updatedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const updatedMachine: Machine = {
      ...machine,
      beamProfileRecords: updatedRecords
    };

    onUpdateMachine(updatedMachine);
    const allMachines = StorageService.getMachines();
    const otherMachines = allMachines.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...otherMachines]);

    setIsAddModalOpen(false);
    setEditingRecordId(null);
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
          onClick={handleOpenAdd}
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
          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      6A — SOURCE
                    </span>
                    {rec6A && (
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                        rec6A.pass
                          ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}>
                        {rec6A.pass ? 'PASS' : 'FAIL'}
                      </span>
                    )}
                  </div>
                  <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {rec6A?.measuredDiameterMm !== null && rec6A?.measuredDiameterMm !== undefined
                      ? `${rec6A.measuredDiameterMm} mm`
                      : '—'}
                  </span>
                </div>
                <span className={`text-[9px] font-medium block mt-1.5 pt-1 border-t ${
                  isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}>
                  Spec: 3.5mm ±10%
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      6B — TOP HAT
                    </span>
                    {rec6B && (
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                        rec6B.pass
                          ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}>
                        {rec6B.pass ? 'PASS' : 'FAIL'}
                      </span>
                    )}
                  </div>
                  <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {rec6B?.measuredDiameterMm !== null && rec6B?.measuredDiameterMm !== undefined
                      ? `${rec6B.measuredDiameterMm} mm`
                      : '—'}
                  </span>
                </div>
                <span className={`text-[9px] font-medium block mt-1.5 pt-1 border-t ${
                  isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}>
                  Spec: 4.2mm ±5%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Laser 2 Source & Top Hat */}
        <Card title="Laser 2 (Head B) Source / Top Hat">
          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      7A — SOURCE
                    </span>
                    {rec7A && (
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                        rec7A.pass
                          ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}>
                        {rec7A.pass ? 'PASS' : 'FAIL'}
                      </span>
                    )}
                  </div>
                  <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {rec7A?.measuredDiameterMm !== null && rec7A?.measuredDiameterMm !== undefined
                      ? `${rec7A.measuredDiameterMm} mm`
                      : '—'}
                  </span>
                </div>
                <span className={`text-[9px] font-medium block mt-1.5 pt-1 border-t ${
                  isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}>
                  Spec: 3.5mm ±10%
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      7B — TOP HAT
                    </span>
                    {rec7B && (
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                        rec7B.pass
                          ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}>
                        {rec7B.pass ? 'PASS' : 'FAIL'}
                      </span>
                    )}
                  </div>
                  <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {rec7B?.measuredDiameterMm !== null && rec7B?.measuredDiameterMm !== undefined
                      ? `${rec7B.measuredDiameterMm} mm`
                      : '—'}
                  </span>
                </div>
                <span className={`text-[9px] font-medium block mt-1.5 pt-1 border-t ${
                  isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}>
                  Spec: 4.2mm ±5%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Mask 1.3mm Checkpoints */}
        <Card title="Working Zone 1.3mm Masks">
          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      LASER 1 (6C)
                    </span>
                    {rec6C13 && (
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                        rec6C13.pass
                          ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}>
                        {rec6C13.pass ? 'PASS' : 'FAIL'}
                      </span>
                    )}
                  </div>
                  <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {rec6C13?.measuredDiameterMm !== null && rec6C13?.measuredDiameterMm !== undefined
                      ? `${rec6C13.measuredDiameterMm} mm`
                      : '—'}
                  </span>
                </div>
                <span className={`text-[9px] font-medium block mt-1.5 pt-1 border-t ${
                  isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}>
                  Spec: ≥1.3mm
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      LASER 2 (7C)
                    </span>
                    {rec7C13 && (
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                        rec7C13.pass
                          ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}>
                        {rec7C13.pass ? 'PASS' : 'FAIL'}
                      </span>
                    )}
                  </div>
                  <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {rec7C13?.measuredDiameterMm !== null && rec7C13?.measuredDiameterMm !== undefined
                      ? `${rec7C13.measuredDiameterMm} mm`
                      : '—'}
                  </span>
                </div>
                <span className={`text-[9px] font-medium block mt-1.5 pt-1 border-t ${
                  isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-500'
                }`}>
                  Spec: ≥1.3mm
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 4: Record Summary (Clearly secondary to engineering measurements) */}
        <Card
          title={
            <div className="flex items-center gap-1.5 text-slate-400">
              <Info className="w-4 h-4 opacity-75" />
              <span>Latest Record Info</span>
            </div>
          }
          className={`self-start h-fit border-dashed ${isDark ? 'bg-[#16191D]/80 border-slate-800' : 'bg-slate-50/70 border-slate-300/80'}`}
        >
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                Latest Date:
              </span>
              <span className={`font-semibold font-mono text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {latestRecord?.date || 'No Record'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Checkpoints:</span>
              <span className={`font-semibold font-mono text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                16 Checkpoints
              </span>
            </div>

            <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Overall Verdict:</span>
              {latestRecord ? (
                <Badge variant={latestRecord.overallResult === 'PASS' ? 'emerald' : 'rose'}>
                  {latestRecord.overallResult}
                </Badge>
              ) : (
                <span className="text-slate-500 italic text-[11px]">No Checks</span>
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
                          onClick={() => handleOpenEdit(rec)}
                          className="py-1 px-2 text-[11px] text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/10"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </Button>
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

      {/* MODAL 1: ENTER / EDIT BEAM CHECK */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecordId(null);
        }}
        title={editingRecordId ? `Edit Beam Profile Check — ${formDate} (${machine.machineNumber})` : `New Beam Profile Check — ${machine.model} (${machine.machineNumber})`}
        maxWidth="4xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveRecord(); }} className="space-y-2.5 max-h-[80vh] overflow-y-auto pr-1">
          {/* Top Bar: Date, Quick Head Switcher, and Pass Stats */}
          <div
            className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <label
                className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`border rounded-lg px-2.5 py-1 text-xs font-mono transition-colors focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500/30'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-cyan-600/20'
                }`}
              />
            </div>

            {/* Quick Head Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveLaserFilter('ALL')}
                className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                  activeLaserFilter === 'ALL'
                    ? 'bg-slate-800 text-slate-100 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({CHECKPOINT_SPECS.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveLaserFilter('LASER_1')}
                className={`px-2.5 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeLaserFilter === 'LASER_1'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Laser 1 ({laser1PassedCount}/8)
              </button>
              <button
                type="button"
                onClick={() => setActiveLaserFilter('LASER_2')}
                className={`px-2.5 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeLaserFilter === 'LASER_2'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-cyan-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Laser 2 ({laser2PassedCount}/8)
              </button>
            </div>

            {/* Live Pass Tally Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono shrink-0 ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-slate-400">Status:</span>
              <span
                className={`font-bold ${
                  totalPassedCount === CHECKPOINT_SPECS.length ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {totalPassedCount} / {CHECKPOINT_SPECS.length} Stations Passed
              </span>
            </div>
          </div>

          {/* LASER 1 SECTION */}
          {(activeLaserFilter === 'ALL' || activeLaserFilter === 'LASER_1') && (
            <div
              className={`p-2.5 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    LASER HEAD 1 (HEAD A) — BEAM PROFILE CHECKPOINTS
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    (6A Source • 6B Flat Top • 6C Masks)
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    laser1PassedCount === 8
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                  }`}
                >
                  {laser1PassedCount} / 8 PASS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {laser1Specs.map((s) => {
                  const entry = formReadings[s.id] || { diameterStr: '' };
                  const r = currentFormParsed.readings[s.id];
                  return (
                    <BeamProfileCheckpointCard
                      key={s.id}
                      spec={s}
                      reading={entry}
                      pass={r?.pass ?? false}
                      isDark={isDark}
                      onDiameterChange={(val) => handleInputChange(s.id, 'diameterStr', val)}
                      onImageUpload={(file) => handleImageFileUpload(s.id, file)}
                      onImageRemove={() => handleInputChange(s.id, 'imageDataUrl', undefined)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* LASER 2 SECTION */}
          {(activeLaserFilter === 'ALL' || activeLaserFilter === 'LASER_2') && (
            <div
              className={`p-2.5 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    LASER HEAD 2 (HEAD B) — BEAM PROFILE CHECKPOINTS
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    (7A Source • 7B Flat Top • 7C Masks)
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    laser2PassedCount === 8
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                      : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80'
                  }`}
                >
                  {laser2PassedCount} / 8 PASS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {laser2Specs.map((s) => {
                  const entry = formReadings[s.id] || { diameterStr: '' };
                  const r = currentFormParsed.readings[s.id];
                  return (
                    <BeamProfileCheckpointCard
                      key={s.id}
                      spec={s}
                      reading={entry}
                      pass={r?.pass ?? false}
                      isDark={isDark}
                      onDiameterChange={(val) => handleInputChange(s.id, 'diameterStr', val)}
                      onImageUpload={(file) => handleImageFileUpload(s.id, file)}
                      onImageRemove={() => handleInputChange(s.id, 'imageDataUrl', undefined)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Remarks (Visually Secondary) */}
          <div className="flex items-center gap-2 pt-0.5">
            <label
              className={`text-[11px] font-medium shrink-0 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Engineer Remarks <span className="text-[10px] font-normal text-slate-400">(optional)</span>:
            </label>
            <input
              type="text"
              value={formRemarks}
              onChange={(e) => setFormRemarks(e.target.value)}
              placeholder="e.g. Beam profile images captured and specs validated."
              className={`w-full border rounded-lg px-2.5 py-1 text-xs transition-colors focus:outline-none ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-200 placeholder:text-slate-400 focus:border-slate-700'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
              }`}
            />
          </div>

          {/* Footer & Save Action */}
          <div
            className={`pt-2.5 border-t flex items-center justify-between ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                OVERALL VERDICT:
              </span>
              <Badge variant={currentFormParsed.overallResult === 'PASS' ? 'success' : 'danger'}>
                {currentFormParsed.overallResult}
              </Badge>
              <span className="text-[11px] font-mono text-slate-400">
                ({totalPassedCount} / {CHECKPOINT_SPECS.length} Stations Passed)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingRecordId(null);
                }}
                className="text-xs py-1 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1 px-4 shadow-sm"
              >
                {editingRecordId ? 'Save Changes' : 'Save Beam Check Record'}
              </Button>
            </div>
          </div>
        </form>
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

            {/* Modal Detail Footer with Edit button */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-sans">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecordDetail(null)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                onClick={() => handleOpenEdit(selectedRecordDetail)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit This Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
