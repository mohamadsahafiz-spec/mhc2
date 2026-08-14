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
  Upload,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal
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

  // Helper to parse approximate duration for sorting
  const parseDurationHours = (val?: string): number => {
    if (!val) return 0;
    const cleaned = val.trim().toLowerCase();
    const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
    if (!numMatch) return 0;
    const num = parseFloat(numMatch[1]);
    if (cleaned.includes('year') || cleaned.includes('yr')) return num * 365 * 24;
    if (cleaned.includes('month') || cleaned.includes('mo')) return num * 30 * 24;
    if (cleaned.includes('week') || cleaned.includes('wk')) return num * 7 * 24;
    if (cleaned.includes('day') || cleaned.includes('d')) return num * 24;
    if (cleaned.includes('hour') || cleaned.includes('hr') || cleaned.includes('h')) return num;
    return num;
  };

  // 3. Sorting state
  type SortField = 
    | 'partNumber' 
    | 'partName' 
    | 'machineFamily' 
    | 'isCritical' 
    | 'quantityPerMachine' 
    | 'recommendedLifeSpan' 
    | 'leadTime' 
    | 'price';
  type SortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField>('partNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Combined sort key for dropdown
  const currentSortKey = `${sortField}_${sortDirection}`;

  const handleSelectSort = (key: string) => {
    switch (key) {
      case 'partNumber_asc':
        setSortField('partNumber');
        setSortDirection('asc');
        break;
      case 'partNumber_desc':
        setSortField('partNumber');
        setSortDirection('desc');
        break;
      case 'price_asc':
        setSortField('price');
        setSortDirection('asc');
        break;
      case 'price_desc':
        setSortField('price');
        setSortDirection('desc');
        break;
      case 'quantity_asc':
        setSortField('quantityPerMachine');
        setSortDirection('asc');
        break;
      case 'quantity_desc':
        setSortField('quantityPerMachine');
        setSortDirection('desc');
        break;
      case 'leadTime_asc':
        setSortField('leadTime');
        setSortDirection('asc');
        break;
      case 'leadTime_desc':
        setSortField('leadTime');
        setSortDirection('desc');
        break;
      case 'lifeSpan_asc':
        setSortField('recommendedLifeSpan');
        setSortDirection('asc');
        break;
      case 'lifeSpan_desc':
        setSortField('recommendedLifeSpan');
        setSortDirection('desc');
        break;
      case 'critical_desc':
        setSortField('isCritical');
        setSortDirection('desc');
        break;
      case 'critical_asc':
        setSortField('isCritical');
        setSortDirection('asc');
        break;
      case 'machineFamily_asc':
        setSortField('machineFamily');
        setSortDirection('asc');
        break;
      case 'machineFamily_desc':
        setSortField('machineFamily');
        setSortDirection('desc');
        break;
      case 'partName_asc':
        setSortField('partName');
        setSortDirection('asc');
        break;
      case 'partName_desc':
        setSortField('partName');
        setSortDirection('desc');
        break;
      default:
        break;
    }
  };

  // Preset Views Handler
  const applyPresetView = (preset: 'expensive' | 'leadTime' | 'lifeSpan' | 'quantity' | 'critical') => {
    switch (preset) {
      case 'expensive':
        setSortField('price');
        setSortDirection('desc');
        break;
      case 'leadTime':
        setSortField('leadTime');
        setSortDirection('desc');
        break;
      case 'lifeSpan':
        setSortField('recommendedLifeSpan');
        setSortDirection('asc');
        break;
      case 'quantity':
        setSortField('quantityPerMachine');
        setSortDirection('desc');
        break;
      case 'critical':
        setSortField('isCritical');
        setSortDirection('desc');
        break;
    }
  };

  // 4. Modals & Actions state
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

  // Sorted and Filtered Parts
  const sortedAndFilteredParts = useMemo(() => {
    const list = [...filteredParts];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'partNumber':
          comparison = a.partNumber.localeCompare(b.partNumber, undefined, { numeric: true, sensitivity: 'base' });
          break;
        case 'partName':
          comparison = a.partName.localeCompare(b.partName, undefined, { sensitivity: 'base' });
          break;
        case 'machineFamily':
          comparison = a.machineFamily.localeCompare(b.machineFamily, undefined, { sensitivity: 'base' });
          break;
        case 'isCritical':
          // Critical boolean sort: true vs false
          comparison = (a.isCritical === b.isCritical ? 0 : a.isCritical ? 1 : -1);
          break;
        case 'quantityPerMachine':
          comparison = (a.quantityPerMachine ?? 0) - (b.quantityPerMachine ?? 0);
          break;
        case 'recommendedLifeSpan': {
          const hoursA = parseDurationHours(a.recommendedLifeSpan);
          const hoursB = parseDurationHours(b.recommendedLifeSpan);
          if (hoursA > 0 && hoursB > 0) {
            comparison = hoursA - hoursB;
          } else {
            comparison = (a.recommendedLifeSpan || '').localeCompare(b.recommendedLifeSpan || '', undefined, { numeric: true, sensitivity: 'base' });
          }
          break;
        }
        case 'leadTime': {
          const hoursA = parseDurationHours(a.leadTime);
          const hoursB = parseDurationHours(b.leadTime);
          if (hoursA > 0 && hoursB > 0) {
            comparison = hoursA - hoursB;
          } else {
            comparison = (a.leadTime || '').localeCompare(b.leadTime || '', undefined, { numeric: true, sensitivity: 'base' });
          }
          break;
        }
        case 'price':
          comparison = (a.price ?? 0) - (b.price ?? 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredParts, sortField, sortDirection]);

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
          {/* Compact Sort/View Control Bar */}
          <div className={`p-3 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isDark ? 'bg-[#181B1F] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            {/* Left: Summary & Preset View Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quick Views:</span>
              </div>
              
              {/* Preset 1: Most Expensive */}
              <button
                onClick={() => applyPresetView('expensive')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortField === 'price' && sortDirection === 'desc'
                    ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' : 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                    : isDark ? 'bg-[#1F242A] text-slate-300 hover:text-white border border-[#2E3640]' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
                title="Sort by Unit Price (High → Low)"
              >
                <span>💰</span>
                <span>Most Expensive</span>
              </button>

              {/* Preset 2: Longest Lead Time */}
              <button
                onClick={() => applyPresetView('leadTime')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortField === 'leadTime' && sortDirection === 'desc'
                    ? isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm' : 'bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-sm'
                    : isDark ? 'bg-[#1F242A] text-slate-300 hover:text-white border border-[#2E3640]' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
                title="Sort by Lead Time (Longest → Shortest)"
              >
                <span>⏳</span>
                <span>Longest Lead Time</span>
              </button>

              {/* Preset 3: Shortest Life Span */}
              <button
                onClick={() => applyPresetView('lifeSpan')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortField === 'recommendedLifeSpan' && sortDirection === 'asc'
                    ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-sm'
                    : isDark ? 'bg-[#1F242A] text-slate-300 hover:text-white border border-[#2E3640]' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
                title="Sort by Life Span (Shortest → Longest)"
              >
                <span>⏱️</span>
                <span>Shortest Life Span</span>
              </button>

              {/* Preset 4: Highest Quantity */}
              <button
                onClick={() => applyPresetView('quantity')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortField === 'quantityPerMachine' && sortDirection === 'desc'
                    ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm'
                    : isDark ? 'bg-[#1F242A] text-slate-300 hover:text-white border border-[#2E3640]' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
                title="Sort by Quantity (High → Low)"
              >
                <span>📦</span>
                <span>Highest Quantity</span>
              </button>

              {/* Preset 5: Critical Parts First */}
              <button
                onClick={() => applyPresetView('critical')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortField === 'isCritical' && sortDirection === 'desc'
                    ? isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm' : 'bg-rose-100 text-rose-900 border border-rose-300 shadow-sm'
                    : isDark ? 'bg-[#1F242A] text-slate-300 hover:text-white border border-[#2E3640]' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                }`}
                title="Sort Critical Parts First"
              >
                <span>🚨</span>
                <span>Critical First</span>
              </button>
            </div>

            {/* Right: Compact Sort Dropdown selector & Count */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">
                Showing <span className="font-semibold text-slate-200">{sortedAndFilteredParts.length}</span> of {parts.length}
              </span>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <label htmlFor="sort-select" className="text-xs text-slate-400 whitespace-nowrap">Sort by:</label>
                <select
                  id="sort-select"
                  value={currentSortKey}
                  onChange={(e) => handleSelectSort(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors outline-none cursor-pointer ${
                    isDark 
                      ? 'bg-[#1E2227] border-[#2B323A] text-slate-200 focus:border-indigo-500' 
                      : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500'
                  }`}
                >
                  <option value="partNumber_asc">Part Number: A → Z</option>
                  <option value="partNumber_desc">Part Number: Z → A</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="quantity_asc">Quantity: Low → High</option>
                  <option value="quantity_desc">Quantity: High → Low</option>
                  <option value="leadTime_asc">Lead Time: Shortest → Longest</option>
                  <option value="leadTime_desc">Lead Time: Longest → Shortest</option>
                  <option value="lifeSpan_asc">Life Span: Shortest → Longest</option>
                  <option value="lifeSpan_desc">Life Span: Longest → Shortest</option>
                  <option value="critical_desc">Critical Parts First</option>
                  <option value="critical_asc">Non-Critical First</option>
                  <option value="machineFamily_asc">Machine Family: A → Z</option>
                  <option value="machineFamily_desc">Machine Family: Z → A</option>
                  <option value="partName_asc">Part Name: A → Z</option>
                  <option value="partName_desc">Part Name: Z → A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table of Parts */}
          <div className={`overflow-x-auto rounded-2xl border ${
            isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
          }`}>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${
                  isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  {/* Part Number */}
                  <th 
                    className={`py-3 px-4 font-semibold cursor-pointer select-none transition-colors ${
                      sortField === 'partNumber' 
                        ? (isDark ? 'text-indigo-300 bg-indigo-500/10' : 'text-indigo-700 bg-indigo-50')
                        : (isDark ? 'hover:text-slate-200 hover:bg-slate-800/50' : 'hover:text-slate-900 hover:bg-slate-100')
                    }`}
                    onClick={() => handleSort('partNumber')}
                    title="Click to sort by Part Number"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Part Number</span>
                      <span className={`shrink-0 ${sortField === 'partNumber' ? 'text-indigo-400' : 'text-slate-400 opacity-40'}`}>
                        {sortField === 'partNumber' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Part Name & Specs */}
                  <th 
                    className={`py-3 px-4 font-semibold cursor-pointer select-none transition-colors ${
                      sortField === 'partName' 
                        ? (isDark ? 'text-indigo-300 bg-indigo-500/10' : 'text-indigo-700 bg-indigo-50')
                        : (isDark ? 'hover:text-slate-200 hover:bg-slate-800/50' : 'hover:text-slate-900 hover:bg-slate-100')
                    }`}
                    onClick={() => handleSort('partName')}
                    title="Click to sort by Part Name"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Part Name & Specs</span>
                      <span className={`shrink-0 ${sortField === 'partName' ? 'text-indigo-400' : 'text-slate-400 opacity-40'}`}>
                        {sortField === 'partName' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Machine Family */}
                  <th 
                    className={`py-3 px-4 font-semibold cursor-pointer select-none transition-colors ${
                      sortField === 'machineFamily' 
                        ? (isDark ? 'text-indigo-300 bg-indigo-500/10' : 'text-indigo-700 bg-indigo-50')
                        : (isDark ? 'hover:text-slate-200 hover:bg-slate-800/50' : 'hover:text-slate-900 hover:bg-slate-100')
                    }`}
                    onClick={() => handleSort('machineFamily')}
                    title="Click to sort by Machine Family"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Machine Family</span>
                      <span className={`shrink-0 ${sortField === 'machineFamily' ? 'text-indigo-400' : 'text-slate-400 opacity-40'}`}>
                        {sortField === 'machineFamily' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Criticality */}
                  <th 
                    className={`py-3 px-4 font-semibold cursor-pointer select-none transition-colors ${
                      sortField === 'isCritical' 
                        ? (isDark ? 'text-indigo-300 bg-indigo-500/10' : 'text-indigo-700 bg-indigo-50')
                        : (isDark ? 'hover:text-slate-200 hover:bg-slate-800/50' : 'hover:text-slate-900 hover:bg-slate-100')
                    }`}
                    onClick={() => handleSort('isCritical')}
                    title="Click to sort by Criticality"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Criticality</span>
                      <span className={`shrink-0 ${sortField === 'isCritical' ? 'text-indigo-400' : 'text-slate-400 opacity-40'}`}>
                        {sortField === 'isCritical' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Qty / Unit */}
                  <th 
                    className={`py-3 px-4 font-semibold cursor-pointer select-none transition-colors ${
                      sortField === 'quantityPerMachine' 
                        ? (isDark ? 'text-indigo-300 bg-indigo-500/10' : 'text-indigo-700 bg-indigo-50')
                        : (isDark ? 'hover:text-slate-200 hover:bg-slate-800/50' : 'hover:text-slate-900 hover:bg-slate-100')
                    }`}
                    onClick={() => handleSort('quantityPerMachine')}
                    title="Click to sort by Quantity"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Qty / Unit</span>
                      <span className={`shrink-0 ${sortField === 'quantityPerMachine' ? 'text-indigo-400' : 'text-slate-400 opacity-40'}`}>
                        {sortField === 'quantityPerMachine' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Life Span */}
                  <th 
                    className={`py-3 px-4 font-semibold cursor-pointer select-none transition-colors ${
                      sortField === 'recommendedLifeSpan' 
                        ? (isDark ? 'text-indigo-300 bg-indigo-500/10' : 'text-indigo-700 bg-indigo-50')
                        : (isDark ? 'hover:text-slate-200 hover:bg-slate-800/50' : 'hover:text-slate-900 hover:bg-slate-100')
                    }`}
                    onClick={() => handleSort('recommendedLifeSpan')}
                    title="Click to sort by Recommended Life Span"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Life Span</span>
                      <span className={`shrink-0 ${sortField === 'recommendedLifeSpan' ? 'text-indigo-400' : 'text-slate-400 opacity-40'}`}>
                        {sortField === 'recommendedLifeSpan' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Lead Time */}
                  <th 
                    className={`py-3 px-4 font-semibold cursor-pointer select-none transition-colors ${
                      sortField === 'leadTime' 
                        ? (isDark ? 'text-indigo-300 bg-indigo-500/10' : 'text-indigo-700 bg-indigo-50')
                        : (isDark ? 'hover:text-slate-200 hover:bg-slate-800/50' : 'hover:text-slate-900 hover:bg-slate-100')
                    }`}
                    onClick={() => handleSort('leadTime')}
                    title="Click to sort by Lead Time"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Lead Time</span>
                      <span className={`shrink-0 ${sortField === 'leadTime' ? 'text-indigo-400' : 'text-slate-400 opacity-40'}`}>
                        {sortField === 'leadTime' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Unit Price */}
                  <th 
                    className={`py-3 px-4 font-semibold text-right cursor-pointer select-none transition-colors ${
                      sortField === 'price' 
                        ? (isDark ? 'text-indigo-300 bg-indigo-500/10' : 'text-indigo-700 bg-indigo-50')
                        : (isDark ? 'hover:text-slate-200 hover:bg-slate-800/50' : 'hover:text-slate-900 hover:bg-slate-100')
                    }`}
                    onClick={() => handleSort('price')}
                    title="Click to sort by Unit Price"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Unit Price</span>
                      <span className={`shrink-0 ${sortField === 'price' ? 'text-indigo-400' : 'text-slate-400 opacity-40'}`}>
                        {sortField === 'price' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    </div>
                  </th>

                  {/* Actions */}
                  <th className="py-3 px-4 font-semibold text-center select-none">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#2B323A]">
                {sortedAndFilteredParts.map((part) => {
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
