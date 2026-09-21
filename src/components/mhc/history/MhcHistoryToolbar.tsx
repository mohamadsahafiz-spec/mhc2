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
      className="p-3 rounded-card border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface border-theme-default text-theme-primary shadow-theme-card"
    >
      <div className="flex items-center gap-2 flex-1 max-w-lg">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-theme-muted" />
          <input
            id="mhc-history-search-input"
            type="text"
            placeholder="Filter by session ID, machine model, customer, engineer..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs rounded-button pl-9 pr-8 py-1.5 border font-mono outline-none transition-colors bg-canvas border-theme-default text-theme-primary placeholder:text-theme-muted hover:border-theme-hover focus:border-cyan-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-theme-muted hover:text-theme-primary cursor-pointer"
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
          className="text-xs font-mono rounded-button px-2.5 py-1.5 border outline-none cursor-pointer transition-colors bg-canvas border-theme-default text-theme-primary hover:border-theme-hover focus:border-cyan-500/50"
        >
          <option value="ALL">All Statuses</option>
          <option value="COMPLETED">Completed Only</option>
          <option value="IN_PROGRESS">In Progress Only</option>
        </select>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-3 text-xs font-mono text-theme-muted">
        <button
          id="btn-mhc-toggle-sort"
          onClick={onToggleSortOrder}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-button border transition-colors cursor-pointer bg-canvas hover:bg-surface-hover text-theme-secondary hover:text-theme-primary border-theme-default shadow-2xs"
          title="Toggle chronological sorting"
        >
          <ArrowUpDown className="w-3 h-3 text-theme-muted" />
          <span>{sortOrder === 'DESC' ? 'Newest First' : 'Oldest First'}</span>
        </button>

        <span className="text-[11px] text-theme-muted">
          Showing <strong className="text-theme-primary">{filteredCount}</strong> of {totalCount} records
        </span>

        {hasActiveFilters && (
          <button
            onClick={() => {
              onSearchChange('');
              onStatusFilterChange('ALL');
            }}
            className="text-[11px] text-theme-muted hover:text-theme-primary underline cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
