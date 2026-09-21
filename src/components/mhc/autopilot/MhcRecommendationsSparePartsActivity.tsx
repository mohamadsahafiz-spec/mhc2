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
      <div className="p-4 rounded-2xl border bg-[var(--surface-surface)] border-[var(--border-default)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 flex items-center justify-center font-bold text-sm">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold border border-[var(--color-primary)]/30">
                DAY 4 • 08
              </span>
              <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">Recommendations &amp; Spare Parts</h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Engineering recommendations, follow-up plan, consumed parts, and recommended spares (PDF Section 17)
            </p>
          </div>
        </div>

        {/* Machine Context */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--surface-workspace)] text-[var(--text-secondary)] border border-[var(--border-default)]">
            Model: <strong className="text-[var(--text-primary)]">{machine.model}</strong>
          </span>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--surface-workspace)] text-[var(--text-secondary)] border border-[var(--border-default)]">
            S/N: <strong className="text-[var(--text-primary)]">{machine.serialNumber}</strong>
          </span>
        </div>
      </div>

      {/* SECTION 1: ENGINEERING RECOMMENDATIONS & FUTURE ACTION PLAN */}
      <div className="p-5 rounded-2xl border space-y-4 bg-[var(--surface-surface)] border-[var(--border-default)] shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--text-primary)]">
              Engineering Recommendations &amp; Future Action Plan
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            Feeds PDF Section 17
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            Maintenance Advice, Alignment Observations &amp; Next Scheduled Actions
          </label>
          <textarea
            rows={4}
            disabled={isReadOnly}
            value={remarks.recommendations || ''}
            onChange={(e) => handleRecommendationsChange(e.target.value)}
            placeholder={isReadOnly ? 'No recommendations recorded...' : 'Enter engineering recommendations, optical alignment advice, preventive maintenance schedules, or future customer action items...'}
            className="w-full p-3 rounded-xl border text-xs outline-none transition-all bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)]"
          />
          <p className="text-[11px] text-[var(--text-muted)] italic">
            Leave blank or empty to show "—" in the final report without synthetic narrative.
          </p>
        </div>

        {/* FOLLOW-UP STATUS */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)]">Customer Service Follow-Up Required</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Indicates whether an on-site service visit or remote follow-up is necessary
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => handleFollowUpChange(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                remarks.followUpRequired !== true
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-xs'
                  : 'bg-[var(--surface-workspace)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
              }`}
            >
              ✓ NONE
            </button>
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => handleFollowUpChange(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                remarks.followUpRequired === true
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-xs'
                  : 'bg-[var(--surface-workspace)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
              }`}
            >
              ⚠ REQUIRED
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: CONSUMED / REPLACED PARTS */}
      <div className="p-5 rounded-2xl border space-y-4 bg-[var(--surface-surface)] border-[var(--border-default)] shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--text-primary)]">
              Consumed / Replaced Parts ({consumedParts.length})
            </h3>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              id="btn-add-consumed-part"
              onClick={() => handleOpenAddModal('REPLACED')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Consumed Part</span>
            </button>
          )}
        </div>

        {consumedParts.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[var(--border-default)] text-center text-xs text-[var(--text-muted)] bg-[var(--surface-workspace)]">
            No consumed or replaced parts recorded for this MHC service. (Will display "—" in PDF Section 17)
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-workspace)] text-[10px] font-mono text-[var(--text-secondary)] border-b border-[var(--border-default)]">
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
              <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
                {consumedParts.map((part) => (
                  <tr key={part.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="p-2.5 font-bold text-[var(--text-primary)] font-sans">{part.partName}</td>
                    <td className="p-2.5 text-[var(--color-primary)]">{part.partNumber}</td>
                    <td className="p-2.5 text-[var(--text-secondary)]">{part.category}</td>
                    <td className="p-2.5 text-center font-bold text-[var(--text-primary)]">{part.quantity}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                        {part.action}
                      </span>
                    </td>
                    <td className="p-2.5 text-[var(--text-secondary)]">{part.costIndicator.replace('_', ' ')}</td>
                    <td className="p-2.5 text-[var(--text-primary)] font-sans max-w-xs truncate">{part.reason || '—'}</td>
                    {!isReadOnly && (
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(part)}
                            className="p-1 rounded hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePart(part.id)}
                            className="p-1 rounded hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer"
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
      <div className="p-5 rounded-2xl border space-y-4 bg-[var(--surface-surface)] border-[var(--border-default)] shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--text-primary)]">
              Recommended Spare Parts ({recommendedParts.length})
            </h3>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              id="btn-add-recommended-part"
              onClick={() => handleOpenAddModal('RECOMMENDED')}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/15 hover:bg-[var(--color-primary)]/25 text-[var(--color-primary)] border border-[var(--color-primary)]/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recommended Spare Part</span>
            </button>
          )}
        </div>

        {recommendedParts.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[var(--border-default)] text-center text-xs text-[var(--text-muted)] bg-[var(--surface-workspace)]">
            No recommended spare parts recorded for this session. (Will display "—" in PDF Section 17)
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-workspace)] text-[10px] font-mono text-[var(--text-secondary)] border-b border-[var(--border-default)]">
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
              <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
                {recommendedParts.map((part) => (
                  <tr key={part.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="p-2.5 font-bold text-[var(--text-primary)] font-sans">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{part.partName}</span>
                        {part.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-mono font-medium">
                            Custom
                          </span>
                        )}
                        {part.sourceType === 'PASSPORT_CATALOG' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 font-mono font-medium">
                            Passport
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-[var(--color-primary)] font-mono">{part.partNumber || '—'}</td>
                    <td className="p-2.5 text-[var(--text-secondary)]">{part.category}</td>
                    <td className="p-2.5 text-center font-bold text-[var(--text-primary)]">{part.quantity}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                        {part.action}
                      </span>
                    </td>
                    <td className="p-2.5 text-[var(--text-secondary)]">{part.costIndicator.replace('_', ' ')}</td>
                    <td className="p-2.5 text-[var(--text-primary)] font-sans max-w-xs truncate">{part.reason || '—'}</td>
                    {!isReadOnly && (
                      <td className="p-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(part)}
                            className="p-1 rounded hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePart(part.id)}
                            className="p-1 rounded hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSavePartModal}
            className="w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4 bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-primary)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                    {editingPartId
                      ? (formAction === 'RECOMMENDED' ? 'Edit Recommended Item' : 'Edit Consumed Spare Part')
                      : (formAction === 'RECOMMENDED' ? 'Record Recommended Item' : 'Record Consumed Spare Part')}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                    {formAction === 'RECOMMENDED'
                      ? 'Feeds Section 17 Recommended Spare Parts (Procurement / Stock)'
                      : 'Feeds Section 17 Consumed Parts (Service Execution)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* SOURCE SELECTOR (RECOMMENDED ITEMS ONLY) */}
            {formAction === 'RECOMMENDED' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--text-secondary)] font-bold uppercase tracking-wider block">
                  Recommendation Source:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--surface-workspace)] rounded-xl border border-[var(--border-default)]">
                  <button
                    type="button"
                    id="btn-source-passport"
                    onClick={() => {
                      setFormItemSource('PASSPORT_CATALOG');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formItemSource === 'PASSPORT_CATALOG'
                        ? 'bg-[var(--surface-surface)] text-[var(--color-primary)] border border-[var(--border-subtle)] shadow-xs font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
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
                        ? 'bg-[var(--surface-surface)] text-[var(--color-primary)] border border-[var(--border-subtle)] shadow-xs font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
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
              <div className="p-3 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--text-secondary)] font-bold uppercase block">
                  Select from Machine Passport Parts Catalog:
                </label>
                {catalogParts.length > 0 ? (
                  <select
                    id="select-passport-catalog-item"
                    value={selectedCatalogPartId}
                    onChange={(e) => handleCatalogSelect(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--surface-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">-- Choose from catalog ({catalogParts.length} available) --</option>
                    {catalogParts.map(cp => (
                      <option key={cp.id} value={cp.id}>
                        {cp.partNumber} — {cp.partName} ({cp.category})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                    <span>No catalog parts currently registered. Switch to <strong>Custom Item</strong> to enter manually.</span>
                  </div>
                )}
              </div>
            )}

            {/* IF CUSTOM: INFORMATIVE HINT */}
            {formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-600 dark:text-amber-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Custom Item: Enter recommendation details directly without requiring Machine Passport registration.</span>
              </div>
            )}

            {/* CATALOG QUICK SELECTOR FOR CONSUMED PARTS */}
            {formAction !== 'RECOMMENDED' && catalogParts.length > 0 && !editingPartId && (
              <div className="p-3 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--text-secondary)] font-bold uppercase">
                  Quick Select from Recommended Parts Catalog (Optional):
                </label>
                <select
                  value={selectedCatalogPartId}
                  onChange={(e) => handleCatalogSelect(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--surface-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
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
                <label className="font-bold text-[var(--text-secondary)]">
                  {formAction === 'RECOMMENDED' ? 'Item / Description Name *' : 'Part Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formPartName}
                  onChange={(e) => setFormPartName(e.target.value)}
                  placeholder={formAction === 'RECOMMENDED' ? 'e.g. Diode Module, Galvo Mirror, Exhaust Filter' : 'e.g. Diode Module, Galvo Mirror'}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between">
                    <span>Part Number {formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' ? '' : '*'}</span>
                    {formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)] font-normal">Optional</span>
                    )}
                  </div>
                </label>
                <input
                  type="text"
                  required={formAction !== 'RECOMMENDED' || formItemSource !== 'CUSTOM'}
                  value={formPartNumber}
                  onChange={(e) => setFormPartNumber(e.target.value)}
                  placeholder={formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' ? 'Optional (e.g. FS-OPT-9941)' : 'e.g. FS-OPT-9941'}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--color-primary)]"
                />
                {formAction === 'RECOMMENDED' && formItemSource === 'CUSTOM' && (
                  <span className="text-[10px] text-[var(--text-muted)] font-sans block">Leave blank if no part number is assigned.</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Action Type</label>
                <select
                  value={formAction}
                  onChange={(e) => {
                    const newAction = e.target.value as MHCSparePartItem['action'];
                    setFormAction(newAction);
                    if (newAction === 'RECOMMENDED') {
                      setFormItemSource('CUSTOM');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="REPLACED">REPLACED (Consumed Part)</option>
                  <option value="USED">USED (Consumed Part)</option>
                  <option value="RECOMMENDED">RECOMMENDED (Future Spare Part)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as MHCSparePartItem['category'])}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="OPTICS">OPTICS</option>
                  <option value="LASER">LASER</option>
                  <option value="MECHANICAL">MECHANICAL</option>
                  <option value="ELECTRICAL">ELECTRICAL</option>
                  <option value="CONSUMABLES">CONSUMABLES</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">Cost Indicator</label>
                <select
                  value={formCostIndicator}
                  onChange={(e) => setFormCostIndicator(e.target.value as MHCSparePartItem['costIndicator'])}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="CUSTOMER_COST">CUSTOMER COST</option>
                  <option value="EO_SUPPORT">EO SUPPORT</option>
                  <option value="WARRANTY">WARRANTY</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-[var(--text-secondary)]">
                {formAction === 'RECOMMENDED' ? 'Recommendation Reason / Trigger Details' : 'Reason / Usage Details'}
              </label>
              <textarea
                rows={2}
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder={formAction === 'RECOMMENDED' ? 'e.g. Approaching rated operating hours; replace during next scheduled PM' : 'e.g. Degraded power output; swapped with certified spare during calibration'}
                className="w-full p-2.5 rounded-xl bg-[var(--surface-workspace)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white font-bold text-xs shadow-xs cursor-pointer"
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
      <div className="p-4 rounded-2xl border bg-[var(--surface-surface)] border-[var(--border-default)] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigateToActivity?.('06_via')}
          className="px-4 py-2.5 rounded-xl bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Activity 07 (Product &amp; Process / Via)</span>
        </button>

        {!isReadOnly ? (
          <button
            type="button"
            id="btn-complete-recommendations-activity"
            onClick={() => onCompleteActivity()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer ml-auto"
          >
            <span>Complete Activity 08 &amp; Proceed to 09 Readiness Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigateToActivity?.('08')}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white font-bold text-xs shadow-xs flex items-center gap-2 ml-auto cursor-pointer"
          >
            <span>View 09 Readiness Review →</span>
          </button>
        )}
      </div>
    </div>
  );
};
