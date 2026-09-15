import React, { useState, useEffect } from 'react';
import { FileText, Save, CheckSquare, Square, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Contract, Customer, Machine } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contract: Contract) => void;
  contractToEdit?: Contract | null;
  customer: Customer | null;
  customerMachines: Machine[];
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contractToEdit,
  customer,
  customerMachines
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalWorkingDays, setTotalWorkingDays] = useState<number | string>(80);
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'ACTIVE' | 'PENDING' | 'RENEWAL_DUE' | 'COMPLETED' | 'DRAFT'>('ACTIVE');
  const [customNotes, setCustomNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (contractToEdit) {
      setContractNumber(contractToEdit.contractNumber || '');
      setStartDate(contractToEdit.startDate || '');
      setEndDate(contractToEdit.endDate || '');
      setTotalWorkingDays(contractToEdit.totalWorkingDays ?? 80);
      setSelectedMachineIds(contractToEdit.machinesCoveredIds || []);
      setStatus((contractToEdit.status as any) || 'ACTIVE');
      setCustomNotes(contractToEdit.customNotes || '');
    } else {
      const currentYear = new Date().getFullYear();
      setContractNumber(`SLA-${currentYear}-${(customer?.name || 'CUST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`);
      setStartDate(`${currentYear}-01-01`);
      setEndDate(`${currentYear + 1}-12-31`); // 2-year default span
      setTotalWorkingDays(80);
      setSelectedMachineIds(customerMachines.map((m) => m.id)); // select all customer machines by default
      setStatus('ACTIVE');
      setCustomNotes('');
    }
    setError('');
  }, [contractToEdit, customer, customerMachines, isOpen]);

  const toggleMachine = (machineId: string) => {
    if (selectedMachineIds.includes(machineId)) {
      setSelectedMachineIds(selectedMachineIds.filter((id) => id !== machineId));
    } else {
      setSelectedMachineIds([...selectedMachineIds, machineId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedMachineIds(customerMachines.map((m) => m.id));
  };

  const handleDeselectAll = () => {
    setSelectedMachineIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNumber.trim()) {
      setError('Contract agreement number / reference is required.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and End dates are required.');
      return;
    }
    if (startDate > endDate) {
      setError('Start date cannot be later than End date.');
      return;
    }

    const workingDaysNum = Number(totalWorkingDays);
    if (isNaN(workingDaysNum) || workingDaysNum <= 0) {
      setError('Allocated working days must be greater than zero.');
      return;
    }

    const newContract: Contract = {
      id: contractToEdit?.id || `cnt-${Date.now()}`,
      contractNumber: contractNumber.trim(),
      customerId: customer?.id || '',
      customerName: customer?.name || 'Customer Account',
      plantName: contractToEdit?.plantName || customerMachines[0]?.plantName || 'Primary Facility',
      startDate,
      endDate,
      totalWorkingDays: workingDaysNum,
      machinesCoveredIds: selectedMachineIds,
      status,
      customNotes: customNotes.trim()
    };

    onSave(newContract);
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
      title={contractToEdit ? `Edit Service Agreement — ${contractToEdit.contractNumber}` : 'Register Service Agreement'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelClasses}>
              Contract Reference / SLA # <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="e.g. SLA-2026-FABCORP"
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className={selectClasses}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="RENEWAL_DUE">RENEWAL DUE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={labelClasses}>
              Start Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>
              End Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>
              Allocated Working Days <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="999"
              required
              value={totalWorkingDays}
              onChange={(e) => setTotalWorkingDays(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Machine Coverage Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelClasses}>Covered Machines Scope</label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sky-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-slate-400 hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>

          {customerMachines.length === 0 ? (
            <div className={`p-3 rounded-xl border text-xs text-center ${
              isDark ? 'bg-[#181C20] border-[#2B323A] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              No machines registered under this customer account yet.
            </div>
          ) : (
            <div className={`max-h-48 overflow-y-auto rounded-xl border p-2 space-y-1 ${
              isDark ? 'bg-[#181C20] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              {customerMachines.map((m) => {
                const isSelected = selectedMachineIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMachine(m.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? isDark
                          ? 'bg-sky-500/10 border border-sky-500/30 text-sky-200'
                          : 'bg-sky-50 border border-sky-200 text-sky-900'
                        : isDark
                        ? 'hover:bg-slate-800/50 text-slate-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span className="font-mono font-bold">{m.machineNumber || m.model}</span>
                      <span className="text-slate-400">({m.serialNumber || 'No SN'})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {m.plantName || 'Facility'} • {m.productionLineName || 'Line'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Notes */}
        <div>
          <label className={labelClasses}>SLA Terms & Service Notes</label>
          <textarea
            rows={2}
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="e.g. Quarterly MHC cadence, 80 working days total over 24-month contract span."
            className={inputClasses}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-700/30">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
            {contractToEdit ? 'Save Changes' : 'Register Agreement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
