import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Clock, 
  Calendar, 
  DollarSign, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ChevronRight, 
  ExternalLink, 
  RotateCcw,
  Upload
} from 'lucide-react';
import { RecommendedPart, MachineFamily } from '../../types/parts';
import { StorageService } from '../../utils/persistence';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { AddEditPartModal } from './AddEditPartModal';
import { ImportPartsModal } from './ImportPartsModal';
import { useTheme } from '../../context/ThemeContext';

interface RecommendedPartsWorkspaceProps {
  initialFamilyFilter?: MachineFamily | 'ALL';
  onSelectPartRef?: (partId: string) => void;
}

export const RecommendedPartsWorkspace: React.FC<RecommendedPartsWorkspaceProps> = ({
  initialFamilyFilter = 'ALL',
  onSelectPartRef
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // 1. Authoritative persistent state from StorageService
  const [parts, setParts] = useState<RecommendedPart[]>(() => StorageService.getRecommendedParts());

  // Reload handler
  const refreshParts = () => {
    const fresh = StorageService.getRecommendedParts();
    setParts(fresh);
  };

  useEffect(() => {
    refreshParts();
  }, []);

  // 2. Filter states
  const [familyFilter, setFamilyFilter] = useState<MachineFamily | 'ALL'>(initialFamilyFilter);
  const [criticalFilter, setCriticalFilter] = useState<'ALL' | 'CRITICAL' | 'STANDARD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 3. Modals & Actions state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<RecommendedPart | null>(null);
  const [deletingPart, setDeletingPart] = useState<RecommendedPart | null>(null);
  const [copiedPartId, setCopiedPartId] = useState<string | null>(null);
  const [selectedDetailPart, setSelectedDetailPart] = useState<RecommendedPart | null>(null);

  // Categories extracted from current records
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [parts]);

  // Filtered Parts
  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      // Machine Family filter
      if (familyFilter !== 'ALL' && part.machineFamily !== familyFilter) {
        return false;
      }

      // Critical filter
      if (criticalFilter === 'CRITICAL' && !part.isCritical) {
        return false;
      }
      if (criticalFilter === 'STANDARD' && part.isCritical) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && part.category !== selectedCategory) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = part.partNumber.toLowerCase().includes(q);
        const matchName = part.partName.toLowerCase().includes(q);
        const matchDesc = part.description?.toLowerCase().includes(q) || false;
        const matchRemark = part.remark?.toLowerCase().includes(q) || false;
        const matchCategory = part.category?.toLowerCase().includes(q) || false;
        const matchFamily = part.machineFamily.toLowerCase().includes(q);
        if (!matchNumber && !matchName && !matchDesc && !matchRemark && !matchCategory && !matchFamily) {
          return false;
        }
      }

      return true;
    });
  }, [parts, familyFilter, criticalFilter, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = parts.length;
    const bmd302wCount = parts.filter(p => p.machineFamily === 'BMD302W').length;
    const bmd250wmCount = parts.filter(p => p.machineFamily === 'BMD250WM').length;
    const criticalCount = parts.filter(p => p.isCritical).length;
    return { total, bmd302wCount, bmd250wmCount, criticalCount };
  }, [parts]);

  // Handle Save (Add / Edit)
  const handleSavePart = (part: RecommendedPart) => {
    StorageService.saveRecommendedPart(part);
    refreshParts();
  };

  // Handle Bulk Import
  const handleConfirmImport = (
    partsToPersist: RecommendedPart[],
    mode: 'SKIP_EXISTING' | 'OVERWRITE_EXISTING' | 'MERGE_ALL'
  ) => {
    // Save parts sequentially through authoritative StorageService
    partsToPersist.forEach(part => {
      StorageService.saveRecommendedPart(part);
    });
    refreshParts();
  };

  // Handle Delete
  const handleConfirmDelete = () => {
    if (deletingPart) {
      StorageService.deleteRecommendedPart(deletingPart.id);
      setDeletingPart(null);
      if (selectedDetailPart?.id === deletingPart.id) {
        setSelectedDetailPart(null);
      }
      refreshParts();
    }
  };

  // Handle Copy Part Number
  const handleCopyPartNumber = (part: RecommendedPart) => {
    navigator.clipboard?.writeText(part.partNumber);
    setCopiedPartId(part.id);
    setTimeout(() => setCopiedPartId(null), 2000);
  };

  const getFamilyBadge = (family: MachineFamily) => {
    switch (family) {
      case 'BMD302W':
        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider ${
            isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }`}>
            BMD302W
          </span>
        );
      case 'BMD250WM':
        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider ${
            isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
          }`}>
            BMD250WM
          </span>
        );
      default:
        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
            isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
            {family}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner & Global Counters */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">Recommended Parts Master</h2>
              <Badge variant="outline" className="text-[10px] font-mono">
                AUTHORITATIVE MASTER
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative spare parts catalog separated by machine family. Directly referenced by MHC Maintenance Recommendations and resolved in Executive Report Studio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            Import Parts
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingPart(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Recommended Part
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-400 font-medium">Total Registered Parts</div>
          <div className="text-xl font-bold font-mono mt-0.5 text-indigo-400">{stats.total}</div>
        </div>

        <div className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-400 font-medium">BMD302W Catalog</div>
          <div className="text-xl font-bold font-mono mt-0.5 text-blue-400">{stats.bmd302wCount}</div>
        </div>

        <div className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-400 font-medium">BMD250WM Catalog</div>
          <div className="text-xl font-bold font-mono mt-0.5 text-cyan-400">{stats.bmd250wmCount}</div>
        </div>

        <div className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-400 font-medium">Critical Components</div>
          <div className="text-xl font-bold font-mono mt-0.5 text-rose-400">{stats.criticalCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by part number, name, specification, category, remark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border transition-all ${
                isDark 
                  ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Machine Family Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setFamilyFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                familyFilter === 'ALL'
                  ? isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Families
            </button>
            <button
              onClick={() => setFamilyFilter('BMD302W')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                familyFilter === 'BMD302W'
                  ? isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BMD302W ({parts.filter(p => p.machineFamily === 'BMD302W').length})
            </button>
            <button
              onClick={() => setFamilyFilter('BMD250WM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                familyFilter === 'BMD250WM'
                  ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BMD250WM ({parts.filter(p => p.machineFamily === 'BMD250WM').length})
            </button>
          </div>

          {/* Criticality Filter */}
          <div className="flex items-center gap-1.5 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-2 lg:pt-0 lg:pl-3">
            <button
              onClick={() => setCriticalFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                criticalFilter === 'ALL'
                  ? isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-200 text-slate-900'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setCriticalFilter('CRITICAL')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                criticalFilter === 'CRITICAL'
                  ? isDark ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Critical Only
            </button>
            <button
              onClick={() => setCriticalFilter('STANDARD')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                criticalFilter === 'STANDARD'
                  ? isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-200 text-slate-900'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard
            </button>
          </div>
        </div>
      </Card>

      {/* Main Parts List / Zero State */}
      {parts.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold">No Recommended Parts Registered</h3>
            <p className="text-xs text-slate-400">
              Create authoritative spare part records for BMD302W and BMD250WM machine families. These records will be directly referenced in MHC inspections and report recommendations.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              Import Structured Parts
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingPart(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Recommended Part
            </Button>
          </div>
        </Card>
      ) : filteredParts.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">No parts match your filter criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your search query, machine family filter, or criticality filter.</p>
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFamilyFilter('ALL');
                setCriticalFilter('ALL');
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Table of Parts */}
          <div className={`overflow-x-auto rounded-2xl border ${
            isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
          }`}>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${
                  isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <th className="py-3 px-4 font-semibold">Part Number</th>
                  <th className="py-3 px-4 font-semibold">Part Name & Specs</th>
                  <th className="py-3 px-4 font-semibold">Machine Family</th>
                  <th className="py-3 px-4 font-semibold">Criticality</th>
                  <th className="py-3 px-4 font-semibold">Qty / Unit</th>
                  <th className="py-3 px-4 font-semibold">Life Span</th>
                  <th className="py-3 px-4 font-semibold">Lead Time</th>
                  <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#2B323A]">
                {filteredParts.map((part) => {
                  const isCopied = copiedPartId === part.id;
                  return (
                    <tr 
                      key={part.id}
                      className={`group transition-colors ${
                        isDark ? 'hover:bg-[#1A1E24]' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Part Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">
                            {part.partNumber}
                          </span>
                          <button
                            onClick={() => handleCopyPartNumber(part)}
                            title="Copy Part Number"
                            className={`p-1 rounded-md transition-colors ${
                              isCopied 
                                ? 'text-emerald-400 bg-emerald-500/10' 
                                : 'text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {part.category && (
                          <div className="text-[10px] font-sans font-normal text-slate-400 mt-0.5">
                            {part.category}
                          </div>
                        )}
                      </td>

                      {/* Part Name & Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {part.partName}
                        </div>
                        {part.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5" title={part.description}>
                            {part.description}
                          </div>
                        )}
                        {part.remark && (
                          <div className="text-[10px] text-amber-400/80 italic line-clamp-1 mt-0.5" title={part.remark}>
                            Note: {part.remark}
                          </div>
                        )}
                      </td>

                      {/* Machine Family */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getFamilyBadge(part.machineFamily)}
                      </td>

                      {/* Criticality */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {part.isCritical ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                            isDark ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-rose-100 text-rose-800'
                          }`}>
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                            Critical
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Standard
                          </span>
                        )}
                      </td>

                      {/* Qty / Unit */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-300 whitespace-nowrap">
                        {part.quantityPerMachine} <span className="text-[10px] text-slate-400 font-sans">{part.unit}</span>
                      </td>

                      {/* Life Span */}
                      <td className="py-3 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                        {part.recommendedLifeSpan ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            {part.recommendedLifeSpan}
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Lead Time */}
                      <td className="py-3 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                        {part.leadTime ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
                            {part.leadTime}
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-200 whitespace-nowrap">
                        {part.price !== undefined && part.price !== null ? (
                          <span>
                            {part.currency || 'USD'} {part.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-500 font-normal text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingPart(part);
                              setIsAddModalOpen(true);
                            }}
                            title="Edit Part Record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPart(part)}
                            title="Delete Part"
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Showing {filteredParts.length} of {parts.length} registered parts</span>
            <span>All parts stored with stable reference UUIDs for MHC cross-referencing</span>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditPartModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPart(null);
        }}
        onSave={handleSavePart}
        initialPart={editingPart}
        defaultFamily={familyFilter !== 'ALL' ? familyFilter : 'BMD302W'}
      />

      {/* Import Parts Modal */}
      <ImportPartsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingParts={parts}
        onConfirmImport={handleConfirmImport}
        defaultFamily={familyFilter !== 'ALL' ? familyFilter : 'BMD302W'}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingPart)}
        onClose={() => setDeletingPart(null)}
        title="Delete Recommended Part"
        subtitle="Confirm deletion of authoritative part record from the master catalog."
        maxWidth="md"
      >
        <div className="space-y-4 p-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Irreversible Action</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Deleting this part will remove its master record from storage. Any historical MHC records referencing this ID will indicate the part has been archived.
              </div>
            </div>
          </div>

          {deletingPart && (
            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
              isDark ? 'bg-[#1E2227] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Part Number:</span>
                <span className="font-mono font-bold text-indigo-400">{deletingPart.partNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Part Name:</span>
                <span className="font-semibold text-slate-200">{deletingPart.partName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Machine Family:</span>
                <span>{getFamilyBadge(deletingPart.machineFamily)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingPart(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
