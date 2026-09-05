import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Package,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Machine, MHCSession, MHCSparePartItem, MHCEngineerRemarksData } from '../../../types';
import { StorageService } from '../../../utils/persistence';

interface MhcRecommendationsSparePartsActivityProps {
  session: MHCSession;
  machine: Machine;
  isDark?: boolean;
  isReadOnly?: boolean;
  onNavigateToActivity?: (code: string) => void;
  onCompleteActivity: (note?: string) => void;
  onUpdateSession: (session: MHCSession) => void;
  showNotification?: (msg: string) => void;
  activeCode?: string;
}

export const MhcRecommendationsSparePartsActivity: React.FC<MhcRecommendationsSparePartsActivityProps> = ({
  session,
  machine,
  isDark = true,
  isReadOnly = false,
  onNavigateToActivity,
  onCompleteActivity,
  onUpdateSession,
  showNotification,
  activeCode = '07'
}) => {
  // Extract remarks and parts
  const remarks: MHCEngineerRemarksData = session.stage08_engineerRemarks || {};
  const spareParts: MHCSparePartItem[] = session.stage07_spareParts || [];

  // Categorize parts
  const consumedParts = spareParts.filter(p => p.action === 'REPLACED' || p.action === 'USED');
  const recommendedParts = spareParts.filter(p => p.action === 'RECOMMENDED');

  // Modal / Form state for adding/editing a spare part
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [defaultActionForNewPart, setDefaultActionForNewPart] = useState<'REPLACED' | 'RECOMMENDED'>('REPLACED');

  // Form Fields
  const [formPartName, setFormPartName] = useState('');
  const [formPartNumber, setFormPartNumber] = useState('');
  const [formCategory, setFormCategory] = useState<MHCSparePartItem['category']>('OPTICS');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formAction, setFormAction] = useState<MHCSparePartItem['action']>('REPLACED');
  const [formCostIndicator, setFormCostIndicator] = useState<MHCSparePartItem['costIndicator']>('CUSTOMER_COST');
  const [formReason, setFormReason] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItemSource, setFormItemSource] = useState<'PASSPORT_CATALOG' | 'CUSTOM'>('CUSTOM');
  const [selectedCatalogPartId, setSelectedCatalogPartId] = useState<string>('');

  // Catalog items for quick selection
  const catalogParts = React.useMemo(() => {
    try {
      return StorageService.getRecommendedParts() || [];
    } catch {
      return [];
    }
  }, []);

  // Update recommendations text
  const handleRecommendationsChange = (text: string) => {
    if (isReadOnly) return;
    const updatedRemarks: MHCEngineerRemarksData = {
      ...remarks,
      recommendations: text
    };
    onUpdateSession({
      ...session,
      stage08_engineerRemarks: updatedRemarks,
      lastUpdated: new Date().toISOString()
    });
  };

  // Update follow-up required
  const handleFollowUpChange = (required: boolean) => {
    if (isReadOnly) return;
    const updatedRemarks: MHCEngineerRemarksData = {
      ...remarks,
      followUpRequired: required
    };
    onUpdateSession({
      ...session,
      stage08_engineerRemarks: updatedRemarks,
      lastUpdated: new Date().toISOString()
    });
  };

  // Open modal to add new part
  const handleOpenAddModal = (targetAction: 'REPLACED' | 'RECOMMENDED') => {
    if (isReadOnly) return;
    setEditingPartId(null);
    setDefaultActionForNewPart(targetAction);
    setFormAction(targetAction);
    setFormPartName('');
    setFormPartNumber('');
    setFormCategory('OPTICS');
    setFormQuantity(1);
    setFormCostIndicator('CUSTOMER_COST');
    setFormReason('');
    setFormNotes('');
    if (targetAction === 'RECOMMENDED') {
      setFormItemSource(catalogParts.length > 0 ? 'PASSPORT_CATALOG' : 'CUSTOM');
      setSelectedCatalogPartId('');
    } else {
      setFormItemSource('CUSTOM');
      setSelectedCatalogPartId('');
    }
    setIsModalOpen(true);
  };

  // Open modal to edit existing part
  const handleOpenEditModal = (part: MHCSparePartItem) => {
    if (isReadOnly) return;
    setEditingPartId(part.id);
    setFormAction(part.action);
    setFormPartName(part.partName);
    setFormPartNumber(part.partNumber || '');
    setFormCategory(part.category);
    setFormQuantity(part.quantity || 1);
    setFormCostIndicator(part.costIndicator || 'CUSTOMER_COST');
    setFormReason(part.reason || '');
    setFormNotes(part.notes || '');

    if (part.action === 'RECOMMENDED') {
      let isCustomItem = false;
      if (typeof part.isCustom === 'boolean') {
        isCustomItem = part.isCustom;
      } else if (part.sourceType === 'CUSTOM') {
        isCustomItem = true;
      } else if (part.sourceType === 'PASSPORT_CATALOG' || part.catalogPartId) {
        isCustomItem = false;
      } else {
        // Fallback detection for legacy records
        const catalogMatch = catalogParts.find(cp => cp.id === part.catalogPartId || (part.partNumber && cp.partNumber === part.partNumber));
        isCustomItem = !catalogMatch;
      }

      setFormItemSource(isCustomItem ? 'CUSTOM' : 'PASSPORT_CATALOG');
      setSelectedCatalogPartId(part.catalogPartId || '');
    } else {
      setFormItemSource('CUSTOM');
      setSelectedCatalogPartId('');
    }
    setIsModalOpen(true);
  };

  // Delete a part
  const handleDeletePart = (id: string) => {
    if (isReadOnly) return;
    const updated = spareParts.filter(p => p.id !== id);
    onUpdateSession({
      ...session,
      stage07_spareParts: updated,
      lastUpdated: new Date().toISOString()
    });
    if (showNotification) showNotification('Part item removed.');
  };

  // Save modal form
  const handleSavePartModal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formPartName.trim();
    const trimmedNumber = formPartNumber.trim();

    if (!trimmedName) {
      if (showNotification) {
        showNotification(formAction === 'RECOMMENDED' ? 'Item / Description Name is required.' : 'Part Name is required.');
      }
      return;
    }

    const isRecommended = formAction === 'RECOMMENDED';
    const isCustomRec = isRecommended && formItemSource === 'CUSTOM';

    // Validation rules:
    // Consumed parts: part number is mandatory
    // Custom recommended item: part number is OPTIONAL
    // Passport catalog recommended item: requires a selection or part number
    if (!isRecommended && !trimmedNumber) {
      if (showNotification) showNotification('Part Number is required for consumed/replaced parts.');
      return;
    }

    if (isRecommended && formItemSource === 'PASSPORT_CATALOG' && !trimmedNumber && !selectedCatalogPartId) {
      if (showNotification) showNotification('Please select a part from the catalog, or switch to Custom Item.');
      return;
    }

    const savedPartNumber = trimmedNumber || undefined;
    const sourceType = isRecommended ? formItemSource : undefined;
    const isCustom = isRecommended ? (formItemSource === 'CUSTOM') : undefined;
    const catalogPartId = isRecommended && formItemSource === 'PASSPORT_CATALOG' ? (selectedCatalogPartId || undefined) : undefined;

    let updatedList: MHCSparePartItem[];
    if (editingPartId) {
      updatedList = spareParts.map(p => {
        if (p.id === editingPartId) {
          return {
            ...p,
            partName: trimmedName,
            partNumber: savedPartNumber,
            category: formCategory,
            quantity: Math.max(1, Number(formQuantity) || 1),
            action: formAction,
            costIndicator: formCostIndicator,
            reason: formReason.trim(),
            notes: formNotes.trim() || undefined,
            sourceType,
            isCustom,
            catalogPartId
          };
        }
        return p;
      });
    } else {
      const newPart: MHCSparePartItem = {
        id: `SP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        partName: trimmedName,
        partNumber: savedPartNumber,
        category: formCategory,
        quantity: Math.max(1, Number(formQuantity) || 1),
        action: formAction,
        costIndicator: formCostIndicator,
        reason: formReason.trim(),
        notes: formNotes.trim() || undefined,
        sourceType,
        isCustom,
        catalogPartId
      };
      updatedList = [...spareParts, newPart];
    }

    onUpdateSession({
      ...session,
      stage07_spareParts: updatedList,
      lastUpdated: new Date().toISOString()
    });

    setIsModalOpen(false);
    if (showNotification) {
      showNotification(
        editingPartId
          ? (isRecommended ? 'Recommendation updated successfully.' : 'Part updated successfully.')
          : (isRecommended ? 'Recommendation recorded successfully.' : 'Part recorded successfully.')
      );
    }
  };

  // Handle Catalog Quick Select
  const handleCatalogSelect = (catalogId: string) => {
    setSelectedCatalogPartId(catalogId);
    const selected = catalogParts.find(p => p.id === catalogId);
    if (selected) {
      setFormPartName(selected.partName || '');
      setFormPartNumber(selected.partNumber || '');
      if (selected.category) {
        const catUpper = selected.category.toUpperCase() as MHCSparePartItem['category'];
        if (['OPTICS', 'LASER', 'MECHANICAL', 'ELECTRICAL', 'CONSUMABLES'].includes(catUpper)) {
          setFormCategory(catUpper);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-sm">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                DAY 4 • 07
              </span>
              <h2 className="text-base font-bold tracking-tight">Recommendations &amp; Spare Parts</h2>
            </div>
            <p className="text-xs text-slate-400">
              Engineering recommendations, follow-up plan, consumed parts, and recommended spares (PDF Section 17)
            </p>
          </div>
        </div>

        {/* Machine Context */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Model: <strong className="text-cyan-300">{machine.model}</strong>
          </span>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            S/N: <strong className="text-slate-200">{machine.serialNumber}</strong>
          </span>
        </div>
      </div>

      {/* SECTION 1: ENGINEERING RECOMMENDATIONS & FUTURE ACTION PLAN */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
              Engineering Recommendations &amp; Future Action Plan
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Feeds PDF Section 17
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Maintenance Advice, Alignment Observations &amp; Next Scheduled Actions
          </label>
          <textarea
            rows={4}
            disabled={isReadOnly}
            value={remarks.recommendations || ''}
            onChange={(e) => handleRecommendationsChange(e.target.value)}
            placeholder={isReadOnly ? 'No recommendations recorded...' : 'Enter engineering recommendations, optical alignment advice, preventive maintenance schedules, or future customer action items...'}
            className={`w-full p-3 rounded-xl border text-xs outline-none transition-all ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
            }`}
          />
          <p className="text-[11px] text-slate-500 italic">
            Leave blank or empty to show "—" in the final report without synthetic narrative.
          </p>
        </div>

        {/* FOLLOW-UP STATUS */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-200">Customer Service Follow-Up Required</div>
            <div className="text-[11px] text-slate-400">
              Indicates whether an on-site service visit or remote follow-up is necessary
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => handleFollowUpChange(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                remarks.followUpRequired !== true
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              ✓ NONE
            </button>
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => handleFollowUpChange(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                remarks.followUpRequired === true
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              ⚠ REQUIRED
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: CONSUMED / REPLACED PARTS */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
              Consumed / Replaced Parts ({consumedParts.length})
            </h3>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              id="btn-add-consumed-part"
              onClick={() => handleOpenAddModal('REPLACED')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Consumed Part</span>
            </button>
          )}
        </div>

        {consumedParts.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No consumed or replaced parts recorded for this MHC service. (Will display "—" in PDF Section 17)
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-[10px] font-mono text-slate-400 border-b border-slate-800">
                  <th className="p-2.5">PART NAME</th>
                  <th className="p-2.5">PART NUMBER</th>
                  <th className="p-2.5">CATEGORY</th>
                  <th className="p-2.5 text-center">QTY</th>
                  <th className="p-2.5">ACTION</th>
                  <th className="p-2.5">COST</th>
                  <th className="p-2.5">REASON / NOTES</th>
                  {!isReadOnly && <th className="p-2.5 text-right">ACTIONS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {consumedParts.map((part) => (
                  <tr key={part.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-2.5 font-bold text-slate-200 font-sans">{part.partName}</td>
                    <td className="p-2.5 text-cyan-300">{part.partNumber}</td>
                    <td className="p-2.5 text-slate-400">{part.category}</td>
                    <td className="p-2.5 text-center font-bold text-slate-200">{part.quantity}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {part.action}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-400">{part.costIndicator.replace('_', ' ')}</td>
                    <td className="p-2.5 text-slate-300 font-sans max-w-xs truncate">{part.reason || '—'}</td>
                    {!isReadOnly && (
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(part)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePart(part.id)}
                            className="p-1 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: RECOMMENDED SPARE PARTS */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
              Recommended Spare Parts ({recommendedParts.length})
            </h3>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              id="btn-add-recommended-part"
              onClick={() => handleOpenAddModal('RECOMMENDED')}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recommended Spare Part</span>
            </button>
          )}
        </div>

        {recommendedParts.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No recommended spare parts recorded for this session. (Will display "—" in PDF Section 17)
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-[10px] font-mono text-slate-400 border-b border-slate-800">
                  <th className="p-2.5">PART NAME</th>
                  <th className="p-2.5">PART NUMBER</th>
                  <th className="p-2.5">CATEGORY</th>
                  <th className="p-2.5 text-center">QTY</th>
                  <th className="p-2.5">ACTION</th>
                  <th className="p-2.5">COST</th>
                  <th className="p-2.5">RECOMMENDATION REASON</th>
                  {!isReadOnly && <th className="p-2.5 text-right">ACTIONS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {recommendedParts.map((part) => (
                  <tr key={part.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-2.5 font-bold text-slate-200 font-sans">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{part.partName}</span>
                        {part.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-medium">
                            Custom
                          </span>
                        )}
                        {part.sourceType === 'PASSPORT_CATALOG' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-medium">
                            Passport
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-cyan-300 font-mono">{part.partNumber || '—'}</td>
                    <td className="p-2.5 text-slate-400">{part.category}</td>
                    <td className="p-2.5 text-center font-bold text-slate-200">{part.quantity}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {part.action}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-400">{part.costIndicator.replace('_', ' ')}</td>
                    <td className="p-2.5 text-slate-300 font-sans max-w-xs truncate">{part.reason || '—'}</td>
                    {!isReadOnly && (
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(part)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePart(part.id)}
                            className="p-1 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PART */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSavePartModal}
            className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4 ${
              isDark ? 'bg-slate-900 border-cyan-500/40 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {editingPartId
                      ? (formAction === 'RECOMMENDED' ? 'Edit Recommended Item' : 'Edit Consumed Spare Part')
                      : (formAction === 'RECOMMENDED' ? 'Record Recommended Item' : 'Record Consumed Spare Part')}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formAction === 'RECOMMENDED'
                      ? 'Feeds Section 17 Recommended Spare Parts (Procurement / Stock)'
                      : 'Feeds Section 17 Consumed Parts (Service Execution)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* SOURCE SELECTOR (RECOMMENDED ITEMS ONLY) */}
            {formAction === 'RECOMMENDED' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                  Recommendation Source:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    id="btn-source-passport"
                    onClick={() => {
                      setFormItemSource('PASSPORT_CATALOG');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formItemSource === 'PASSPORT_CATALOG'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Existing Passport Item</span>
                  </button>
                  <button
                    type="button"
                    id="btn-source-custom"
                    onClick={() => {
                      setFormItemSource('CUSTOM');
                      setSelectedCatalogPartId('');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formItemSource === 'CUSTOM'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Custom Item</span>
                  </button>
                </div>
              </div>
            )}

            {/* IF PASSPORT_CATALOG: CATALOG SELECTOR */}
            {formAction === 'RECOMMENDED' && formItemSource === 'PASSPORT_CATALOG' && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                  Select from Machine Passport Parts Catalog:
                </label>
                {catalogParts.length > 0 ? (
                  <select
                    id="select-passport-catalog-item"
                    value={selectedCatalogPartId}
                    onChange={(e) => handleCatalogSelect(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose from catalog ({catalogParts.length} available) --</option>
                    {catalogParts.map(cp => (
                      <option key={cp.id} value={cp.id}>
                        {cp.partNumber} — {cp.partName} ({cp.category})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>No catalog parts currently registered. Switch to <strong>Custom Item</strong> to enter manually.</span>
                  </div>
                )}
              </div>
            )}

            {/* IF CUSTOM: INFORMATIVE HINT */}
            {formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' && (
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300/90 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Custom Item: Enter recommendation details directly without requiring Machine Passport registration.</span>
              </div>
            )}

            {/* CATALOG QUICK SELECTOR FOR CONSUMED PARTS (UNCHANGED) */}
            {formAction !== 'RECOMMENDED' && catalogParts.length > 0 && !editingPartId && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                  Quick Select from Recommended Parts Catalog (Optional):
                </label>
                <select
                  value={selectedCatalogPartId}
                  onChange={(e) => handleCatalogSelect(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose from parts catalog (optional) --</option>
                  {catalogParts.map(cp => (
                    <option key={cp.id} value={cp.id}>
                      {cp.partNumber} — {cp.partName} ({cp.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  {formAction === 'RECOMMENDED' ? 'Item / Description Name *' : 'Part Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formPartName}
                  onChange={(e) => setFormPartName(e.target.value)}
                  placeholder={formAction === 'RECOMMENDED' ? 'e.g. Diode Module, Galvo Mirror, Exhaust Filter' : 'e.g. Diode Module, Galvo Mirror'}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Part Number {formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' ? '' : '*'}</span>
                    {formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' && (
                      <span className="text-[10px] font-mono text-slate-400 font-normal">Optional</span>
                    )}
                  </div>
                </label>
                <input
                  type="text"
                  required={formAction !== 'RECOMMENDED' || formItemSource !== 'CUSTOM'}
                  value={formPartNumber}
                  onChange={(e) => setFormPartNumber(e.target.value)}
                  placeholder={formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' ? 'Optional (e.g. FS-OPT-9941)' : 'e.g. FS-OPT-9941'}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono outline-none focus:border-cyan-500"
                />
                {formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' && (
                  <span className="text-[10px] text-slate-500 font-sans block">Leave blank if no part number is assigned.</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Action Type</label>
                <select
                  value={formAction}
                  onChange={(e) => {
                    const newAction = e.target.value as MHCSparePartItem['action'];
                    setFormAction(newAction);
                    if (newAction === 'RECOMMENDED') {
                      setFormItemSource('CUSTOM');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="REPLACED">REPLACED (Consumed Part)</option>
                  <option value="USED">USED (Consumed Part)</option>
                  <option value="RECOMMENDED">RECOMMENDED (Future Spare Part)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as MHCSparePartItem['category'])}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="OPTICS">OPTICS</option>
                  <option value="LASER">LASER</option>
                  <option value="MECHANICAL">MECHANICAL</option>
                  <option value="ELECTRICAL">ELECTRICAL</option>
                  <option value="CONSUMABLES">CONSUMABLES</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Cost Indicator</label>
                <select
                  value={formCostIndicator}
                  onChange={(e) => setFormCostIndicator(e.target.value as MHCSparePartItem['costIndicator'])}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="CUSTOMER_COST">CUSTOMER COST</option>
                  <option value="EO_SUPPORT">EO SUPPORT</option>
                  <option value="WARRANTY">WARRANTY</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-300">
                {formAction === 'RECOMMENDED' ? 'Recommendation Reason / Trigger Details' : 'Reason / Usage Details'}
              </label>
              <textarea
                rows={2}
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder={formAction === 'RECOMMENDED' ? 'e.g. Approaching rated operating hours; replace during next scheduled PM' : 'e.g. Degraded power output; swapped with certified spare during calibration'}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                {editingPartId
                  ? (formAction === 'RECOMMENDED' ? 'Update Recommendation' : 'Update Part Record')
                  : (formAction === 'RECOMMENDED' ? 'Record Recommendation' : 'Save Part Record')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FOOTER NAVIGATION & COMPLETION CONTROLS */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      } flex flex-wrap items-center justify-between gap-3`}>
        <button
          type="button"
          onClick={() => onNavigateToActivity?.('06')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Activity 06 (Temperature &amp; Evidence)</span>
        </button>

        {!isReadOnly ? (
          <button
            type="button"
            id="btn-complete-recommendations-activity"
            onClick={() => onCompleteActivity()}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer ring-2 ring-emerald-400/50 ml-auto"
          >
            <span>Complete Activity 07 &amp; Proceed to 08 Readiness Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigateToActivity?.('08')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-2 ml-auto"
          >
            <span>View 08 Readiness Review →</span>
          </button>
        )}
      </div>
    </div>
  );
};
