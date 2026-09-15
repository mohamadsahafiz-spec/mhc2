import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Building2, Layers, MapPin, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { Machine, Customer } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface MachineTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (
    machineId: string,
    transferData: {
      plantName: string;
      plantId: string;
      productionLineName: string;
      productionLineId: string;
      zone: string;
    }
  ) => void;
  machine: Machine | null;
  customer: Customer | null;
  existingPlants: string[];
  existingLines: string[];
}

export const MachineTransferModal: React.FC<MachineTransferModalProps> = ({
  isOpen,
  onClose,
  onTransfer,
  machine,
  customer,
  existingPlants,
  existingLines
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [siteMode, setSiteMode] = useState<'existing' | 'new'>('existing');
  const [targetPlant, setTargetPlant] = useState('');
  const [customPlant, setCustomPlant] = useState('');

  const [lineMode, setLineMode] = useState<'existing' | 'new'>('existing');
  const [targetLine, setTargetLine] = useState('');
  const [customLine, setCustomLine] = useState('');

  const [targetZone, setTargetZone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (machine) {
      setTargetPlant(machine.plantName || existingPlants[0] || '');
      setCustomPlant('');
      setTargetLine(machine.productionLineName || existingLines[0] || '');
      setCustomLine('');
      setTargetZone(machine.zone || '');
      setSiteMode(existingPlants.length > 0 ? 'existing' : 'new');
      setLineMode(existingLines.length > 0 ? 'existing' : 'new');
    }
    setError('');
  }, [machine, existingPlants, existingLines, isOpen]);

  if (!machine) return null;

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlant = siteMode === 'existing' ? targetPlant.trim() : customPlant.trim();
    const finalLine = lineMode === 'existing' ? targetLine.trim() : customLine.trim();

    if (!finalPlant && siteMode === 'new' && !customPlant.trim()) {
      setError('Please specify a target Site / Building.');
      return;
    }

    const plantId = finalPlant ? `plant-${finalPlant.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';
    const lineId = finalLine ? `line-${finalLine.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';

    onTransfer(machine.id, {
      plantName: finalPlant,
      plantId,
      productionLineName: finalLine,
      productionLineId: lineId,
      zone: targetZone.trim()
    });

    onClose();
  };

  const inputClasses = `w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
    isDark
      ? 'bg-[#181C20] border-[#2B323A] text-slate-100 placeholder-slate-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const selectClasses = `w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
    isDark
      ? 'bg-[#181C20] border-[#2B323A] text-slate-100'
      : 'bg-white border-slate-300 text-slate-900'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1 uppercase tracking-wider ${
    isDark ? 'text-slate-400' : 'text-slate-600'
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transfer Machine Asset — ${machine.machineNumber || machine.model}`}
    >
      <form onSubmit={handleTransferSubmit} className="space-y-4">
        {/* Machine Identity Banner */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          isDark ? 'bg-[#181C20] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="text-xs font-mono font-bold text-sky-400">{machine.machineNumber || machine.model}</div>
            <div className="text-xs text-slate-400">SN: {machine.serialNumber || 'N/A'} • {machine.model}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Current Assignment</div>
            <div className="text-xs font-medium text-amber-400">
              {machine.plantName || 'Unassigned Facility'} / {machine.productionLineName || 'Unassigned Line'}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Target Site/Building */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelClasses}>Target Site / Building</label>
            {existingPlants.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSiteMode('existing')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    siteMode === 'existing'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Existing Facility
                </button>
                <button
                  type="button"
                  onClick={() => setSiteMode('new')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    siteMode === 'new'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  + New Facility
                </button>
              </div>
            )}
          </div>

          {siteMode === 'existing' && existingPlants.length > 0 ? (
            <select
              value={targetPlant}
              onChange={(e) => setTargetPlant(e.target.value)}
              className={selectClasses}
            >
              {existingPlants.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={customPlant}
              onChange={(e) => setCustomPlant(e.target.value)}
              placeholder="e.g. Fab 2 Cleanroom Module B"
              className={inputClasses}
            />
          )}
        </div>

        {/* Target Production Line */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelClasses}>Target Production Line</label>
            {existingLines.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLineMode('existing')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    lineMode === 'existing'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Existing Line
                </button>
                <button
                  type="button"
                  onClick={() => setLineMode('new')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    lineMode === 'new'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  + New Line
                </button>
              </div>
            )}
          </div>

          {lineMode === 'existing' && existingLines.length > 0 ? (
            <select
              value={targetLine}
              onChange={(e) => setTargetLine(e.target.value)}
              className={selectClasses}
            >
              {existingLines.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={customLine}
              onChange={(e) => setCustomLine(e.target.value)}
              placeholder="e.g. Line 4 (High Precision)"
              className={inputClasses}
            />
          )}
        </div>

        {/* Cleanroom Zone */}
        <div>
          <label className={labelClasses}>Cleanroom Zone / Bay (Optional)</label>
          <input
            type="text"
            value={targetZone}
            onChange={(e) => setTargetZone(e.target.value)}
            placeholder="e.g. Bay 12 / ISO Class 4"
            className={inputClasses}
          />
        </div>

        {/* Transfer Invariant Notice */}
        <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
          isDark ? 'bg-slate-900/60 border-slate-700/40 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-400">Audit Invariant Guarantee:</strong> Machine identity and historical inspection records remain immutable. Historical MHC sessions retain the cleanroom facility recorded at the time of each inspection.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-700/30">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<ArrowRightLeft className="w-4 h-4" />}>
            Confirm Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
