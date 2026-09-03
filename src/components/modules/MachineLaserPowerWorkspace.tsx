import React, { useState, useMemo } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Sliders,
  Clock,
  Eye,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { Machine } from '../../types';
import {
  LaserPowerCheckRecord,
  MaskSize,
  MASK_SPECS
} from '../../types/laserPower';
import { LaserPowerEngine } from '../../utils/laserPowerEngine';
import { StorageService } from '../../utils/persistence';
import { getLocalDateString } from '../../utils/timeUtils';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

interface MachineLaserPowerWorkspaceProps {
  machine: Machine;
  onUpdateMachine: (updatedMachine: Machine) => void;
}

export const MachineLaserPowerWorkspace: React.FC<MachineLaserPowerWorkspaceProps> = ({
  machine,
  onUpdateMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const records = useMemo(() => {
    const raw = machine?.laserPowerRecords || [];
    return [...raw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [machine?.laserPowerRecords]);
  const latestRecord = records[0] || null;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<LaserPowerCheckRecord | null>(null);

  // Form State for Power Check
  const [formDate, setFormDate] = useState<string>(getLocalDateString());
  const [formFreq, setFormFreq] = useState<number>(50);
  const [formRemarks, setFormRemarks] = useState<string>('');

  // Power inputs state
  const [lsHeadA, setLsHeadA] = useState<string>('15.2');
  const [lsHeadB, setLsHeadB] = useState<string>('15.0');

  const [optHeadA, setOptHeadA] = useState<string>('14.8');
  const [optHeadB, setOptHeadB] = useState<string>('14.6');

  const [maskInputs, setMaskInputs] = useState<Record<MaskSize, { headA: string; headB: string }>>({
    '2.2mm': { headA: '3.4', headB: '3.3' },
    '2.0mm': { headA: '2.7', headB: '2.6' },
    '1.8mm': { headA: '2.1', headB: '2.0' },
    '1.3mm': { headA: '1.2', headB: '1.1' },
    '1.1mm': { headA: '0.8', headB: '0.8' },
    '0.9mm': { headA: '0.5', headB: '0.4' }
  });

  const handleOpenAdd = () => {
    setEditingRecordId(null);
    setFormDate(getLocalDateString());
    setFormFreq(50);
    setFormRemarks('');
    setLsHeadA('15.2');
    setLsHeadB('15.0');
    setOptHeadA('14.8');
    setOptHeadB('14.6');
    setMaskInputs({
      '2.2mm': { headA: '3.4', headB: '3.3' },
      '2.0mm': { headA: '2.7', headB: '2.6' },
      '1.8mm': { headA: '2.1', headB: '2.0' },
      '1.3mm': { headA: '1.2', headB: '1.1' },
      '1.1mm': { headA: '0.8', headB: '0.8' },
      '0.9mm': { headA: '0.5', headB: '0.4' }
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec: LaserPowerCheckRecord) => {
    setEditingRecordId(rec.id);
    setFormDate(rec.date);
    setFormFreq(rec.frequencyKhz);
    setFormRemarks(rec.engineerRemarks || '');
    setLsHeadA(rec.laserSource.headA !== null && rec.laserSource.headA !== undefined ? String(rec.laserSource.headA) : '');
    setLsHeadB(rec.laserSource.headB !== null && rec.laserSource.headB !== undefined ? String(rec.laserSource.headB) : '');
    setOptHeadA(rec.opticsTopHat.headA !== null && rec.opticsTopHat.headA !== undefined ? String(rec.opticsTopHat.headA) : '');
    setOptHeadB(rec.opticsTopHat.headB !== null && rec.opticsTopHat.headB !== undefined ? String(rec.opticsTopHat.headB) : '');

    const newMasks: Record<MaskSize, { headA: string; headB: string }> = {
      '2.2mm': { headA: '', headB: '' },
      '2.0mm': { headA: '', headB: '' },
      '1.8mm': { headA: '', headB: '' },
      '1.3mm': { headA: '', headB: '' },
      '1.1mm': { headA: '', headB: '' },
      '0.9mm': { headA: '', headB: '' }
    };
    rec.workingZoneMasks.forEach(m => {
      newMasks[m.maskSize] = {
        headA: m.headA !== null && m.headA !== undefined ? String(m.headA) : '',
        headB: m.headB !== null && m.headB !== undefined ? String(m.headB) : ''
      };
    });
    setMaskInputs(newMasks);
    setSelectedRecordDetail(null);
    setIsAddModalOpen(true);
  };

  const handleMaskInputChange = (size: MaskSize, head: 'headA' | 'headB', val: string) => {
    setMaskInputs(prev => ({
      ...prev,
      [size]: {
        ...prev[size],
        [head]: val
      }
    }));
  };

  // Evaluate current form values on the fly
  const currentFormParsed = React.useMemo<LaserPowerCheckRecord>(() => {
    const parseNum = (s: string): number | null => {
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    };

    const draft: Partial<LaserPowerCheckRecord> = {
      date: formDate,
      frequencyKhz: formFreq,
      engineerRemarks: formRemarks,
      laserSource: {
        specText: '15W ±10% (13.5–16.5W)',
        minWatts: 13.5,
        maxWatts: 16.5,
        headA: parseNum(lsHeadA),
        headB: parseNum(lsHeadB),
        passA: false,
        passB: false
      },
      opticsTopHat: {
        specText: '15W ±10% (13.5–16.5W)',
        minWatts: 13.5,
        maxWatts: 16.5,
        headA: parseNum(optHeadA),
        headB: parseNum(optHeadB),
        passA: false,
        passB: false
      },
      workingZoneMasks: MASK_SPECS.map(s => ({
        maskSize: s.size,
        specText: s.specText,
        minWatts: s.minWatts,
        headA: parseNum(maskInputs[s.size].headA),
        headB: parseNum(maskInputs[s.size].headB),
        passA: false,
        passB: false
      }))
    };

    return LaserPowerEngine.evaluateRecord(draft);
  }, [formDate, formFreq, formRemarks, lsHeadA, lsHeadB, optHeadA, optHeadB, maskInputs]);

  if (!machine) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${
        isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <Zap className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-50" />
        <p className="text-sm font-semibold">No machine selected for laser power inspection.</p>
      </div>
    );
  }

  // Save Record
  const handleSaveRecord = () => {
    const evaluated = LaserPowerEngine.evaluateRecord(currentFormParsed);
    let updatedRecords: LaserPowerCheckRecord[];

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
      laserPowerRecords: updatedRecords
    };

    onUpdateMachine(updatedMachine);
    const allMachines = StorageService.getMachines();
    const otherMachines = allMachines.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...otherMachines]);

    setIsAddModalOpen(false);
    setEditingRecordId(null);
  };

  // Delete Record
  const handleDeleteRecord = (id: string) => {
    if (!confirm('Are you sure you want to delete this Laser Power record?')) return;
    const updatedRecords = records.filter(r => r.id !== id);
    const updatedMachine: Machine = {
      ...machine,
      laserPowerRecords: updatedRecords
    };
    onUpdateMachine(updatedMachine);
    const allMachines = StorageService.getMachines();
    const otherMachines = allMachines.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...otherMachines]);
  };

  const mask13 = latestRecord?.workingZoneMasks.find(m => m.maskSize === '1.3mm');

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#15181C] border-[#2B323A]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Laser Power Calibration & Health
              {latestRecord && (
                <Badge variant={latestRecord.overallResult === 'PASS' ? 'success' : 'danger'}>
                  {latestRecord.overallResult}
                </Badge>
              )}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Machine-bound engineering power meter records • Frequency: {latestRecord?.frequencyKhz || 50} kHz
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-4 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Enter New Power Check
        </Button>
      </div>

      {/* LATEST RECORD TELEMETRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Laser Source */}
        <Card title="Laser Source (External Meter)">
          <div className="space-y-2.5 text-xs">
            <div className={`flex items-center justify-between text-[11px] pb-1.5 border-b ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span className="font-medium">Spec: 15W ±10% (13.5–16.5W)</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800/40 border border-slate-700/40">
                {latestRecord?.frequencyKhz || 50} kHz
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    HEAD 1 (A)
                  </span>
                  {latestRecord && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                      latestRecord.laserSource.passA
                        ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {latestRecord.laserSource.passA ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {latestRecord?.laserSource.headA !== null && latestRecord?.laserSource.headA !== undefined
                    ? `${latestRecord.laserSource.headA} W`
                    : '—'}
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    HEAD 2 (B)
                  </span>
                  {latestRecord && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                      latestRecord.laserSource.passB
                        ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {latestRecord.laserSource.passB ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {latestRecord?.laserSource.headB !== null && latestRecord?.laserSource.headB !== undefined
                    ? `${latestRecord.laserSource.headB} W`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: After Top Hat / Optics */}
        <Card title="After Top Hat / Optics">
          <div className="space-y-2.5 text-xs">
            <div className={`flex items-center justify-between text-[11px] pb-1.5 border-b ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span className="font-medium">Spec: 15W ±10% (13.5–16.5W)</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800/40 border border-slate-700/40">
                External Meter
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    HEAD 1 (A)
                  </span>
                  {latestRecord && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                      latestRecord.opticsTopHat.passA
                        ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {latestRecord.opticsTopHat.passA ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {latestRecord?.opticsTopHat.headA !== null && latestRecord?.opticsTopHat.headA !== undefined
                    ? `${latestRecord.opticsTopHat.headA} W`
                    : '—'}
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    HEAD 2 (B)
                  </span>
                  {latestRecord && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                      latestRecord.opticsTopHat.passB
                        ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {latestRecord.opticsTopHat.passB ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {latestRecord?.opticsTopHat.headB !== null && latestRecord?.opticsTopHat.headB !== undefined
                    ? `${latestRecord.opticsTopHat.headB} W`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Working Zone (Mask 1.3mm) */}
        <Card title="Working Zone (1.3mm Mask)">
          <div className="space-y-2.5 text-xs">
            <div className={`flex items-center justify-between text-[11px] pb-1.5 border-b ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span className="font-medium">Spec: ≥1.0 W</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800/40 border border-slate-700/40">
                Internal Meter
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    HEAD 1 (A)
                  </span>
                  {mask13 && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                      mask13.passA
                        ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {mask13.passA ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {mask13?.headA !== null && mask13?.headA !== undefined ? `${mask13.headA} W` : '—'}
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    HEAD 2 (B)
                  </span>
                  {mask13 && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                      mask13.passB
                        ? isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {mask13.passB ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
                <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {mask13?.headB !== null && mask13?.headB !== undefined ? `${mask13.headB} W` : '—'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 4: Overall Calibration Summary (Distinct from individual measurements) */}
        <Card
          title={
            <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
              <Activity className="w-4 h-4" />
              <span>Overall Power Health</span>
            </div>
          }
          className={`self-start h-fit border-amber-500/25 ${isDark ? 'bg-[#181c22]' : 'bg-amber-500/[0.02]'}`}
        >
          <div className="space-y-3 text-xs">
            {/* Verdict Hero Display */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              latestRecord
                ? latestRecord.overallResult === 'PASS'
                  ? isDark ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : isDark ? 'bg-rose-950/40 border-rose-800/80 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
                : isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Health Verdict</span>
                <span className="text-sm font-bold font-mono">
                  {latestRecord?.overallResult || 'NO CHECKS'}
                </span>
              </div>
              {latestRecord && (
                latestRecord.overallResult === 'PASS' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                )
              )}
            </div>

            {/* Subordinated metadata fields */}
            <div className="space-y-1.5 pt-0.5 text-xs">
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
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Frequency:
                </span>
                <span className={`font-semibold font-mono text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {latestRecord?.frequencyKhz || 50} kHz
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* HISTORICAL RECORDS TABLE */}
      <Card title={`Laser Power Records History (${records.length})`}>
        {records.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs italic">
            No Laser Power Check records saved for this machine yet. Click "Enter New Power Check" above to record one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Frequency</th>
                  <th className="py-2.5 px-3">Laser Source (A / B)</th>
                  <th className="py-2.5 px-3">Optics / Top Hat (A / B)</th>
                  <th className="py-2.5 px-3">Mask 1.3mm (A / B)</th>
                  <th className="py-2.5 px-3">Overall</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${
                isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-200 text-slate-800'
              }`}>
                {records.map(rec => {
                  const m13 = rec.workingZoneMasks.find(m => m.maskSize === '1.3mm');
                  return (
                    <tr key={rec.id} className={`hover:bg-slate-900/40 transition-colors ${
                      isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                    }`}>
                      <td className="py-2.5 px-3 font-bold">{rec.date}</td>
                      <td className="py-2.5 px-3">{rec.frequencyKhz} kHz</td>
                      <td className="py-2.5 px-3">
                        {rec.laserSource.headA ?? '—'} W / {rec.laserSource.headB ?? '—'} W
                      </td>
                      <td className="py-2.5 px-3">
                        {rec.opticsTopHat.headA ?? '—'} W / {rec.opticsTopHat.headB ?? '—'} W
                      </td>
                      <td className="py-2.5 px-3">
                        {m13?.headA ?? '—'} W / {m13?.headB ?? '—'} W
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
                          className="py-1 px-2 text-[11px] text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
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

      {/* MODAL 1: ENTER / EDIT POWER CHECK */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecordId(null);
        }}
        title={editingRecordId ? `Edit Laser Power Check — ${formDate} (${machine.machineNumber})` : `New Laser Power Check — ${machine.model} (${machine.machineNumber})`}
        maxWidth="xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveRecord(); }} className="space-y-2.5">
          {/* Form Header / Quick Setup */}
          <div className={`p-2 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-[150px]">
              <label className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-mono transition-colors focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-amber-500/30'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600 focus:ring-amber-600/20'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 w-36 shrink-0">
              <label className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Freq
              </label>
              <div className="relative w-full">
                <input
                  type="number"
                  value={formFreq}
                  onChange={(e) => setFormFreq(Number(e.target.value))}
                  className={`w-full border rounded-lg pl-2.5 pr-7 py-1 text-xs font-mono transition-colors focus:outline-none focus:ring-1 ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-amber-500/30'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600 focus:ring-amber-600/20'
                  }`}
                />
                <span className={`absolute right-2 top-1 text-[10px] font-mono pointer-events-none ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  kHz
                </span>
              </div>
            </div>

            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10.5px] font-mono shrink-0 ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-white/80 border-slate-200 text-slate-600'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Nominal: 15.0W</span>
            </div>
          </div>

          {/* External Power Meter: Laser Source & Optics Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Section 1: Laser Source */}
            <div className={`p-2.5 rounded-xl border space-y-2 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Laser Source
                </span>
                <span className="text-[10px] text-slate-400 font-mono">15W ±10%</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      HEAD A
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      currentFormParsed.laserSource.passA
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                    }`}>
                      {currentFormParsed.laserSource.passA ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={lsHeadA}
                      onChange={(e) => setLsHeadA(e.target.value)}
                      placeholder="0.0"
                      className={`w-full border rounded px-2 py-1 text-xs font-mono pr-5 focus:outline-none focus:ring-1 ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-amber-500/30'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600 focus:ring-amber-600/20'
                      }`}
                    />
                    <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 font-mono pointer-events-none">W</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      HEAD B
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      currentFormParsed.laserSource.passB
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                    }`}>
                      {currentFormParsed.laserSource.passB ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={lsHeadB}
                      onChange={(e) => setLsHeadB(e.target.value)}
                      placeholder="0.0"
                      className={`w-full border rounded px-2 py-1 text-xs font-mono pr-5 focus:outline-none focus:ring-1 ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-amber-500/30'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600 focus:ring-amber-600/20'
                      }`}
                    />
                    <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 font-mono pointer-events-none">W</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Optics / Top Hat */}
            <div className={`p-2.5 rounded-xl border space-y-2 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Optics / Top Hat
                </span>
                <span className="text-[10px] text-slate-400 font-mono">15W ±10%</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      HEAD A
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      currentFormParsed.opticsTopHat.passA
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                    }`}>
                      {currentFormParsed.opticsTopHat.passA ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={optHeadA}
                      onChange={(e) => setOptHeadA(e.target.value)}
                      placeholder="0.0"
                      className={`w-full border rounded px-2 py-1 text-xs font-mono pr-5 focus:outline-none focus:ring-1 ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500/30'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-cyan-600/20'
                      }`}
                    />
                    <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 font-mono pointer-events-none">W</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      HEAD B
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      currentFormParsed.opticsTopHat.passB
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                    }`}>
                      {currentFormParsed.opticsTopHat.passB ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={optHeadB}
                      onChange={(e) => setOptHeadB(e.target.value)}
                      placeholder="0.0"
                      className={`w-full border rounded px-2 py-1 text-xs font-mono pr-5 focus:outline-none focus:ring-1 ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500/30'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-cyan-600/20'
                      }`}
                    />
                    <span className="absolute right-1.5 top-1 text-[10px] text-slate-400 font-mono pointer-events-none">W</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Working Zone - Compact Measurement Grid */}
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`px-3 py-1.5 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-100/90 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  Working Zone — Internal Meter Masks
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Min Threshold Specs (6 Apertures)</span>
            </div>

            <div className="p-2">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-1 px-2">Mask</th>
                    <th className="py-1 px-2">Spec</th>
                    <th className="py-1 px-2 text-right">
                      <span className="inline-flex items-center gap-1 text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Head A (W)
                      </span>
                    </th>
                    <th className="py-1 px-2 text-right">
                      <span className="inline-flex items-center gap-1 text-cyan-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        Head B (W)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200/80'}`}>
                  {MASK_SPECS.map(s => {
                    const parsedM = currentFormParsed.workingZoneMasks.find(m => m.maskSize === s.size);
                    return (
                      <tr key={s.size} className={`transition-colors ${isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-100/60'}`}>
                        <td className={`py-1 px-2 font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{s.size}</td>
                        <td className="py-1 px-2 text-slate-400 text-[11px]">{s.specText}</td>
                        <td className="py-1 px-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              step="0.1"
                              value={maskInputs[s.size].headA}
                              onChange={(e) => handleMaskInputChange(s.size, 'headA', e.target.value)}
                              placeholder="0.0"
                              className={`w-18 sm:w-20 border rounded px-2 py-0.5 text-xs font-mono text-right focus:outline-none focus:ring-1 ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-amber-500/30'
                                  : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600 focus:ring-amber-600/20'
                              }`}
                            />
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 min-w-[34px] text-center font-mono ${
                              parsedM?.passA ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80' : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                            }`}>
                              {parsedM?.passA ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        </td>
                        <td className="py-1 px-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              step="0.1"
                              value={maskInputs[s.size].headB}
                              onChange={(e) => handleMaskInputChange(s.size, 'headB', e.target.value)}
                              placeholder="0.0"
                              className={`w-18 sm:w-20 border rounded px-2 py-0.5 text-xs font-mono text-right focus:outline-none focus:ring-1 ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500/30'
                                  : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-cyan-600/20'
                              }`}
                            />
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 min-w-[34px] text-center font-mono ${
                              parsedM?.passB ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80' : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                            }`}>
                              {parsedM?.passB ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks (Optional & Secondary) */}
          <div className="flex items-center gap-2 pt-0.5">
            <label className={`text-[11px] font-medium shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Remarks <span className="text-slate-400 font-normal text-[10px]">(optional)</span>:
            </label>
            <input
              type="text"
              value={formRemarks}
              onChange={(e) => setFormRemarks(e.target.value)}
              placeholder="e.g. Power output stable across all working zone masks."
              className={`w-full border rounded-lg px-2.5 py-1 text-xs transition-colors focus:outline-none ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 text-slate-200 placeholder:text-slate-400 focus:border-slate-700'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
              }`}
            />
          </div>

          {/* Real-time Verdict Bar & Save Actions */}
          <div className={`pt-2.5 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                OVERALL VERDICT:
              </span>
              <Badge variant={currentFormParsed.overallResult === 'PASS' ? 'success' : 'danger'}>
                {currentFormParsed.overallResult}
              </Badge>
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
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-1 px-4 shadow-sm"
              >
                {editingRecordId ? 'Save Changes' : 'Save Power Check'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RECORD DETAIL VIEW */}
      {selectedRecordDetail && (
        <Modal
          isOpen={!!selectedRecordDetail}
          onClose={() => setSelectedRecordDetail(null)}
          title={`Laser Power Check Details — ${selectedRecordDetail.date}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">CHECK DATE & FREQUENCY</span>
                <strong className="text-slate-100 text-sm">{selectedRecordDetail.date} • {selectedRecordDetail.frequencyKhz} kHz</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] text-right">OVERALL VERDICT</span>
                <Badge variant={selectedRecordDetail.overallResult === 'PASS' ? 'success' : 'danger'}>
                  {selectedRecordDetail.overallResult}
                </Badge>
              </div>
            </div>

            {/* External Meter Table */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 space-y-2 font-sans">
              <h4 className="font-bold text-amber-400 text-xs">External Power Meter Measurements</h4>
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="py-1">Stage</th>
                    <th className="py-1">Spec</th>
                    <th className="py-1">Head A</th>
                    <th className="py-1">Head B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-1.5 font-bold text-slate-200">Laser Source</td>
                    <td className="py-1.5 text-slate-400">15W ±10%</td>
                    <td className="py-1.5 font-bold text-emerald-400">{selectedRecordDetail.laserSource.headA ?? '—'} W</td>
                    <td className="py-1.5 font-bold text-emerald-400">{selectedRecordDetail.laserSource.headB ?? '—'} W</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-bold text-slate-200">Optics / Top Hat</td>
                    <td className="py-1.5 text-slate-400">15W ±10%</td>
                    <td className="py-1.5 font-bold text-cyan-400">{selectedRecordDetail.opticsTopHat.headA ?? '—'} W</td>
                    <td className="py-1.5 font-bold text-cyan-400">{selectedRecordDetail.opticsTopHat.headB ?? '—'} W</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Internal Meter Mask Table */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 space-y-2 font-sans">
              <h4 className="font-bold text-emerald-400 text-xs">Working Zone Mask Readings (Internal Meter)</h4>
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="py-1">Mask</th>
                    <th className="py-1">Spec</th>
                    <th className="py-1">Head A</th>
                    <th className="py-1">Head B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedRecordDetail.workingZoneMasks.map(m => (
                    <tr key={m.maskSize}>
                      <td className="py-1.5 font-bold text-slate-200">{m.maskSize}</td>
                      <td className="py-1.5 text-slate-400">{m.specText}</td>
                      <td className={`py-1.5 font-bold ${m.passA ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.headA ?? '—'} W ({m.passA ? 'PASS' : 'FAIL'})
                      </td>
                      <td className={`py-1.5 font-bold ${m.passB ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.headB ?? '—'} W ({m.passB ? 'PASS' : 'FAIL'})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedRecordDetail.engineerRemarks && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-sans">
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
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-1.5 px-3 flex items-center gap-1.5"
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
