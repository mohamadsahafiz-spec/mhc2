import React, { useState, useMemo } from 'react';
import { Sliders } from 'lucide-react';
import { Machine } from '../../types';
import {
  BeamCheckpointReading,
  BeamProfileCheckRecord,
  CHECKPOINT_SPECS,
  CheckpointId
} from '../../types/beamProfile';
import { BeamProfileEngine } from '../../utils/beamProfileEngine';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { BeamProfileCheckpointCard } from './BeamProfileCheckpointCard';

interface MhcEnterBeamProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine;
  onSave: (newRecord: BeamProfileCheckRecord) => void;
}

export const MhcEnterBeamProfileModal: React.FC<MhcEnterBeamProfileModalProps> = ({
  isOpen,
  onClose,
  machine,
  onSave
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formRemarks, setFormRemarks] = useState<string>('');
  const [activeLaserFilter, setActiveLaserFilter] = useState<'ALL' | 'LASER_1' | 'LASER_2'>('ALL');

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

  const currentFormParsed = useMemo<BeamProfileCheckRecord>(() => {
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
  }, [formDate, formRemarks, formReadings]);

  const laser1Specs = useMemo(() => CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 1'), []);
  const laser2Specs = useMemo(() => CHECKPOINT_SPECS.filter(s => s.laser === 'Laser 2'), []);

  const laser1PassedCount = useMemo(
    () => laser1Specs.filter(s => currentFormParsed.readings[s.id]?.pass).length,
    [laser1Specs, currentFormParsed.readings]
  );
  const laser2PassedCount = useMemo(
    () => laser2Specs.filter(s => currentFormParsed.readings[s.id]?.pass).length,
    [laser2Specs, currentFormParsed.readings]
  );
  const totalPassedCount = laser1PassedCount + laser2PassedCount;

  const handleSave = () => {
    const newRecord = BeamProfileEngine.evaluateRecord(currentFormParsed);
    onSave(newRecord);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enter New Beam Profile Check — ${machine.model} (${machine.machineNumber})`}
      maxWidth="4xl"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-2.5 max-h-[80vh] overflow-y-auto pr-1">
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

        {/* Engineer Remarks: Compact & Secondary */}
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
            <Button variant="outline" type="button" onClick={onClose} className="text-xs py-1 px-3">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1 px-4 shadow-sm"
            >
              Save Beam Check & Link to MHC
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
