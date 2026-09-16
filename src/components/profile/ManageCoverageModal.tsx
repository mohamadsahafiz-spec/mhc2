import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Search, 
  Check, 
  X, 
  Compass, 
  AlertCircle 
} from 'lucide-react';
import { Plant, Customer } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';

interface ManageCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlants: Plant[];
  customers?: Customer[];
  assignedPlantIds: string[];
  onSaveCoverage: (selectedPlantIds: string[]) => void;
}

export const ManageCoverageModal: React.FC<ManageCoverageModalProps> = ({
  isOpen,
  onClose,
  allPlants,
  customers = [],
  assignedPlantIds,
  onSaveCoverage,
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Staged selection of plant IDs
  const [stagedSelection, setStagedSelection] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync staged selection whenever modal opens with current assignedPlantIds
  useEffect(() => {
    if (isOpen) {
      setStagedSelection([...assignedPlantIds]);
      setSearchQuery('');
    }
  }, [isOpen, assignedPlantIds]);

  // Quick lookup of customer name
  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach(c => map.set(c.id, c.name));
    return map;
  }, [customers]);

  // Filter canonical plants by search query
  const filteredPlants = useMemo(() => {
    if (!searchQuery.trim()) return allPlants;
    const q = searchQuery.toLowerCase().trim();
    return allPlants.filter(plant => {
      const custName = plant.customerName || customerMap.get(plant.customerId) || '';
      return (
        plant.name.toLowerCase().includes(q) ||
        custName.toLowerCase().includes(q) ||
        (plant.location && plant.location.toLowerCase().includes(q))
      );
    });
  }, [allPlants, searchQuery, customerMap]);

  if (!isOpen) return null;

  const handleTogglePlant = (plantId: string) => {
    setStagedSelection(prev => {
      if (prev.includes(plantId)) {
        return prev.filter(id => id !== plantId);
      } else {
        return [...prev, plantId];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredPlants.map(p => p.id);
    setStagedSelection(prev => {
      const set = new Set([...prev, ...filteredIds]);
      return Array.from(set);
    });
  };

  const handleClearAll = () => {
    setStagedSelection([]);
  };

  const handleSave = () => {
    onSaveCoverage(stagedSelection);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-coverage-title"
    >
      <div 
        className={`w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors ${
          isDark 
            ? 'bg-[#14171A] border-[#2B323A] text-slate-200' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-[#181B20] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded border ${
              isDark ? 'bg-[#1F242C] border-[#2B323A] text-sky-400' : 'bg-white border-slate-200 text-indigo-600'
            }`}>
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 id="manage-coverage-title" className="text-sm font-semibold leading-none">
                Select Service Locations
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                {stagedSelection.length} of {allPlants.length} sites selected for coverage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ${
              isDark ? 'hover:bg-[#242A32]' : 'hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search customer, site, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium ${
                isDark 
                  ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 placeholder-slate-500' 
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] px-0.5">
            <span className="text-slate-500">
              Showing {filteredPlants.length} canonical semiconductor {filteredPlants.length === 1 ? 'site' : 'sites'}
            </span>
            <div className="flex items-center gap-2 font-mono">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className={`hover:underline ${isDark ? 'text-sky-400' : 'text-indigo-600'}`}
              >
                Select All
              </button>
              <span className="text-slate-400">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-rose-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Plant List (Checkboxes) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredPlants.length > 0 ? (
            filteredPlants.map((plant) => {
              const isSelected = stagedSelection.includes(plant.id);
              const customerDisplayName = plant.customerName || customerMap.get(plant.customerId) || 'EO Customer';

              return (
                <div
                  key={plant.id}
                  onClick={() => handleTogglePlant(plant.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleTogglePlant(plant.id);
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-colors select-none ${
                    isSelected
                      ? isDark 
                        ? 'bg-sky-950/40 border-sky-600/80 text-sky-100' 
                        : 'bg-indigo-50/90 border-indigo-300 text-indigo-950'
                      : isDark
                        ? 'bg-[#191D23] border-[#2B323A] hover:border-slate-600 text-slate-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  {/* Styled Checkbox Box */}
                  <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                    isSelected
                      ? isDark
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : 'bg-indigo-600 border-indigo-600 text-white'
                      : isDark
                        ? 'border-[#3D4653] bg-[#14171A]'
                        : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold truncate leading-tight">
                        {customerDisplayName} — {plant.name}
                      </p>
                      {isSelected && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                          isDark 
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          Covered
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span>{plant.location || 'Location unassigned'}</span>
                    </p>

                    {plant.timezone && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Timezone: {plant.timezone}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-medium text-slate-400">
                No matching customer sites found for "{searchQuery}".
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#181B20] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[11px] text-slate-500 font-mono">
            {stagedSelection.length} selected
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Save Coverage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
