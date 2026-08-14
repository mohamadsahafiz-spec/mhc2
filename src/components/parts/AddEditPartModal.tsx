import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Check, 
  X, 
  DollarSign, 
  Clock, 
  Calendar, 
  Layers, 
  Tag, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { RecommendedPart, MachineFamily } from '../../types/parts';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface AddEditPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: RecommendedPart) => void;
  initialPart?: RecommendedPart | null;
  defaultFamily?: MachineFamily;
}

const CATEGORY_PRESETS = [
  'Optics',
  'Laser Source',
  'Cooling System',
  'Motion / Stage',
  'Electrical & Sensors',
  'Pneumatics & Gas',
  'Mechanical & Structural',
  'Consumable & Filters',
  'General'
];

const UNIT_PRESETS = ['PCS', 'SET', 'EA', 'UNIT', 'MTR', 'ROLL', 'KIT', 'BTL'];

export const AddEditPartModal: React.FC<AddEditPartModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPart,
  defaultFamily = 'BMD302W'
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [machineFamily, setMachineFamily] = useState<MachineFamily>(defaultFamily);
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [quantityPerMachine, setQuantityPerMachine] = useState<number>(1);
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [recommendedLifeSpan, setRecommendedLifeSpan] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [remark, setRemark] = useState('');
  const [category, setCategory] = useState('General');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPart) {
      setMachineFamily(initialPart.machineFamily || 'BMD302W');
      setPartNumber(initialPart.partNumber || '');
      setPartName(initialPart.partName || '');
      setDescription(initialPart.description || '');
      setUnit(initialPart.unit || 'PCS');
      setQuantityPerMachine(initialPart.quantityPerMachine || 1);
      setPrice(initialPart.price !== undefined ? String(initialPart.price) : '');
      setCurrency(initialPart.currency || 'USD');
      setRecommendedLifeSpan(initialPart.recommendedLifeSpan || '');
      setLeadTime(initialPart.leadTime || '');
      setIsCritical(Boolean(initialPart.isCritical));
      setRemark(initialPart.remark || '');
      setCategory(initialPart.category || 'General');
    } else {
      setMachineFamily(defaultFamily);
      setPartNumber('');
      setPartName('');
      setDescription('');
      setUnit('PCS');
      setQuantityPerMachine(1);
      setPrice('');
      setCurrency('USD');
      setRecommendedLifeSpan('');
      setLeadTime('');
      setIsCritical(false);
      setRemark('');
      setCategory('General');
    }
    setValidationError(null);
  }, [initialPart, defaultFamily, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNumber.trim()) {
      setValidationError('Part Number is required.');
      return;
    }
    if (!partName.trim()) {
      setValidationError('Part Name is required.');
      return;
    }
    if (!unit.trim()) {
      setValidationError('Unit is required.');
      return;
    }
    if (quantityPerMachine < 1) {
      setValidationError('Quantity per machine must be at least 1.');
      return;
    }

    const parsedPrice = price.trim() !== '' ? parseFloat(price) : undefined;
    if (parsedPrice !== undefined && (isNaN(parsedPrice) || parsedPrice < 0)) {
      setValidationError('Price must be a valid non-negative number.');
      return;
    }

    const now = new Date().toISOString();
    const partToSave: RecommendedPart = {
      id: initialPart?.id || `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      machineFamily,
      partNumber: partNumber.trim(),
      partName: partName.trim(),
      description: description.trim() || undefined,
      unit: unit.trim().toUpperCase(),
      quantityPerMachine: Math.max(1, Math.floor(quantityPerMachine)),
      price: parsedPrice,
      currency: currency.trim() || 'USD',
      recommendedLifeSpan: recommendedLifeSpan.trim() || undefined,
      leadTime: leadTime.trim() || undefined,
      isCritical,
      remark: remark.trim() || undefined,
      category: category.trim() || undefined,
      createdAt: initialPart?.createdAt || now,
      updatedAt: now
    };

    onSave(partToSave);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPart ? 'Edit Recommended Part Record' : 'Add New Recommended Part'}
      subtitle="Authoritative spare parts master specification for MHC maintenance recommendations and report resolution."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Machine Family & Criticality */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Machine Family <span className="text-rose-400">*</span>
            </label>
            <select
              value={machineFamily}
              onChange={(e) => setMachineFamily(e.target.value as MachineFamily)}
              className={`w-full px-3 py-2 rounded-xl text-xs border font-medium transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
              required
            >
              <option value="BMD302W">BMD302W (Dual Laser Series)</option>
              <option value="BMD250WM">BMD250WM (Precision Series)</option>
              <option value="OTHER">Other / Universal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Component Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border font-medium transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
            >
              {CATEGORY_PRESETS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Part Number & Part Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Part Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 100-302-9901"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Part Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. F-Theta Scan Lens 1064nm"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Description & Technical Specification
          </label>
          <textarea
            rows={2}
            placeholder="Detailed engineering specifications, mounting interface, optical parameters..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs border transition-all ${
              isDark 
                ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
            }`}
          />
        </div>

        {/* Unit, Qty, Price, Currency */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Unit <span className="text-rose-400">*</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-xl text-xs border font-medium transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
            >
              {UNIT_PRESETS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Qty / Machine <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={quantityPerMachine}
              onChange={(e) => setQuantityPerMachine(parseInt(e.target.value) || 1)}
              className={`w-full px-2.5 py-2 rounded-xl text-xs border transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Unit Price (Est.)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-xl text-xs border transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`w-full px-2.5 py-2 rounded-xl text-xs border font-medium transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="MYR">MYR (RM)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="SGD">SGD (S$)</option>
              <option value="TWD">TWD (NT$)</option>
            </select>
          </div>
        </div>

        {/* Life Span & Lead Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Recommended Life Span
            </label>
            <input
              type="text"
              placeholder="e.g. 20,000 hrs / 2 years"
              value={recommendedLifeSpan}
              onChange={(e) => setRecommendedLifeSpan(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Procurement Lead Time
            </label>
            <input
              type="text"
              placeholder="e.g. 4-6 weeks / In Stock"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
            />
          </div>
        </div>

        {/* Critical Part Flag Toggle */}
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
          isCritical 
            ? isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'
            : isDark ? 'bg-[#1E2227] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="pt-0.5">
            <input
              type="checkbox"
              id="isCriticalCheckbox"
              checked={isCritical}
              onChange={(e) => setIsCritical(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
          </div>
          <label htmlFor="isCriticalCheckbox" className="text-xs cursor-pointer select-none space-y-0.5">
            <div className="font-bold flex items-center gap-1.5 text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              Critical Part Designation
            </div>
            <div className="text-[11px] text-slate-400">
              Flags this component as mission-critical. Failure or degradation directly impacts laser uptime, beam stability, or wafer release safety.
            </div>
          </label>
        </div>

        {/* Remark */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Engineering Remarks / Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Inspect for coating degradation every 6 months; replace O-rings concurrently."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs border transition-all ${
              isDark 
                ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
            }`}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {initialPart ? 'Update Part Record' : 'Save Recommended Part'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
