import React from 'react';
import { Search, ArrowUpDown, X } from 'lucide-react';

export type HistoryStatusFilter = 'ALL' | 'COMPLETED' | 'IN_PROGRESS';
export type HistorySortOrder = 'DESC' | 'ASC';

interface MhcHistoryToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: HistoryStatusFilter;
  onStatusFilterChange: (val: HistoryStatusFilter) => void;
  sortOrder: HistorySortOrder;
  onToggleSortOrder: () => void;
  filteredCount: number;
  totalCount: number;
  isDark: boolean;
}

export const MhcHistoryToolbar: React.FC<MhcHistoryToolbarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onToggleSortOrder,
  filteredCount,
  totalCount,
  isDark
}) => {
  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== 'ALL';

  return (
    <div
      id="mhc-history-toolbar"
      className={`p-3 rounded-md border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDark ? 'bg-[#15181C] border-[#242930]' : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 max-w-lg">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="mhc-history-search-input"
            type="text"
            placeholder="Filter by session ID, machine model, customer, engineer..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full text-xs rounded pl-9 pr-8 py-1.5 border font-mono outline-none transition-colors ${
              isDark 
                ? 'bg-[#1B1E23] border-[#2B313A] text-slate-200 placeholder-slate-500 focus:border-slate-500' 
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          id="mhc-history-status-select"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as HistoryStatusFilter)}
          className={`text-xs font-mono rounded px-2.5 py-1.5 border outline-none cursor-pointer transition-colors ${
            isDark 
              ? 'bg-[#1B1E23] border-[#2B313A] text-slate-200 hover:border-slate-600 focus:border-slate-500' 
              : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 focus:border-slate-500'
          }`}
        >
          <option value="ALL">All Statuses</option>
          <option value="COMPLETED">Completed Only</option>
          <option value="IN_PROGRESS">In Progress Only</option>
        </select>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-3 text-xs font-mono text-slate-400">
        <button
          id="btn-mhc-toggle-sort"
          onClick={onToggleSortOrder}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors cursor-pointer ${
            isDark 
              ? 'bg-[#1B1E23] hover:bg-[#23272E] text-slate-300 border-[#2B313A]' 
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
          }`}
          title="Toggle chronological sorting"
        >
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
          <span>{sortOrder === 'DESC' ? 'Newest First' : 'Oldest First'}</span>
        </button>

        <span className="text-[11px] text-slate-500">
          Showing <strong className="text-slate-200 dark:text-slate-100">{filteredCount}</strong> of {totalCount} records
        </span>

        {hasActiveFilters && (
          <button
            onClick={() => {
              onSearchChange('');
              onStatusFilterChange('ALL');
            }}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
