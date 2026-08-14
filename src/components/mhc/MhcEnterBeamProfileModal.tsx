import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Sliders } from 'lucide-react';
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
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formRemarks, setFormRemarks] = useState<string>('');

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

  const currentFormParsed = React.useMemo<BeamProfileCheckRecord>(() => {
    const draftReadings: Partial<Record<CheckpointId, BeamCheckpointReading>> = {};
    CHECKPOINT_SPECS.forEach(s => {
      const entry = formReadings[s.id];
      const parsedNum = entry?.diameterStr ? parseFloat(entry.diameterStr) : null;
      const pass = BeamProfileEngine.evalSpec(parsedNum, s.minMm, s.maxMm);
      draftReadings[s.id] = {
        checkpointId: s.id,
        measuredDiameterMm: isNaN(parsedNum as number) ? null : parsedNum,
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

  const handleSave = () => {
    const newRecord = BeamProfileEngine.evaluateRecord(currentFormParsed);
    onSave(newRecord);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enter New Beam Profile Check — ${machine.model} (${machine.machineNumber})`}
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
              LASER 1 (HEAD A) — BEAM CHECKPOINTS
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
                        <span>Upload</span>
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
              LASER 2 (HEAD B) — BEAM CHECKPOINTS
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
                        <span>Upload</span>
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
            placeholder="e.g. Beam profile images captured and specs validated."
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
            <Button variant="outline" onClick={onClose} className="text-xs py-1.5 px-3">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-4">
              Save Beam Check & Link to MHC
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
