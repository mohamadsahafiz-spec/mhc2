import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Cpu, 
  ArrowRightLeft, 
  ExternalLink, 
  History, 
  Search, 
  ShieldCheck, 
  MapPin, 
  ChevronRight, 
  ChevronDown,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Customer, Machine } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { MachineTransferModal } from './MachineTransferModal';

interface CustomerHierarchyViewProps {
  customer: Customer;
  machines: Machine[];
  onSelectMachine: (machineId: string) => void;
  onOpenMhcHistory?: (machineId: string) => void;
  onTransferMachine: (
    machineId: string,
    transferData: {
      plantName: string;
      plantId: string;
      productionLineName: string;
      productionLineId: string;
      zone: string;
    }
  ) => void;
}

export const CustomerHierarchyView: React.FC<CustomerHierarchyViewProps> = ({
  customer,
  machines,
  onSelectMachine,
  onOpenMhcHistory,
  onTransferMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedPlants, setCollapsedPlants] = useState<Record<string, boolean>>({});
  const [transferringMachine, setTransferringMachine] = useState<Machine | null>(null);

  // Filter machines belonging to this customer
  const customerMachines = machines.filter(
    (m) => m.customerId === customer.id || m.customerName === customer.name
  );

  // Collect all unique plant and line names for transfer dropdowns
  const existingPlants = Array.from(
    new Set(customerMachines.map((m) => (m.plantName || '').trim()).filter(Boolean))
  );
  const existingLines = Array.from(
    new Set(customerMachines.map((m) => (m.productionLineName || '').trim()).filter(Boolean))
  );

  // Apply search query
  const filteredMachines = customerMachines.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.machineNumber && m.machineNumber.toLowerCase().includes(q)) ||
      (m.model && m.model.toLowerCase().includes(q)) ||
      (m.serialNumber && m.serialNumber.toLowerCase().includes(q)) ||
      (m.plantName && m.plantName.toLowerCase().includes(q)) ||
      (m.productionLineName && m.productionLineName.toLowerCase().includes(q)) ||
      (m.zone && m.zone.toLowerCase().includes(q))
    );
  });

  // Group machines: Site/Plant -> Production Line -> Machines
  const plantGroups = React.useMemo(() => {
    const map = new Map<string, Map<string, Machine[]>>();

    filteredMachines.forEach((m) => {
      const plantKey = m.plantName || 'Primary Cleanroom Facility';
      const lineKey = m.productionLineName || 'Main Production Line';

      if (!map.has(plantKey)) {
        map.set(plantKey, new Map());
      }
      const lineMap = map.get(plantKey)!;
      if (!lineMap.has(lineKey)) {
        lineMap.set(lineKey, []);
      }
      lineMap.get(lineKey)!.push(m);
    });

    return map;
  }, [filteredMachines]);

  const togglePlantCollapse = (plantName: string) => {
    setCollapsedPlants((prev) => ({ ...prev, [plantName]: !prev[plantName] }));
  };

  return (
    <div className="space-y-4">
      {/* Infrastructure Hierarchy Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter site, line, machine SN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isDark
                ? 'bg-[#181C20] border-[#2B323A] text-slate-200 placeholder-slate-500'
                : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-center">
          <span className="font-mono font-medium text-sky-400">{customerMachines.length}</span> Machine{customerMachines.length === 1 ? '' : 's'} across{' '}
          <span className="font-mono font-medium text-emerald-400">{Math.max(1, plantGroups.size)}</span> Site{plantGroups.size === 1 ? '' : 's'}
        </div>
      </div>

      {/* Empty Machines State */}
      {customerMachines.length === 0 ? (
        <div className={`p-8 text-center rounded-2xl border ${
          isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-300' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <Building2 className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-bold">No Machines Assigned</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            There are currently no machine assets assigned to {customer.name}. Use Machine Passport to register or allocate machines.
          </p>
        </div>
      ) : filteredMachines.length === 0 ? (
        <div className={`p-6 text-center rounded-xl border ${
          isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <p className="text-xs">No machines match your search filter "{searchQuery}".</p>
        </div>
      ) : (
        /* Hierarchical Tree Render */
        <div className="space-y-4">
          {Array.from(plantGroups.entries()).map(([plantName, lineMap]) => {
            const isCollapsed = !!collapsedPlants[plantName];
            const plantMachineCount = Array.from(lineMap.values()).reduce(
              (acc: number, list: Machine[]) => acc + list.length,
              0
            );

            return (
              <div
                key={plantName}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
                }`}
              >
                {/* Site/Building Header */}
                <div
                  onClick={() => togglePlantCollapse(plantName)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer select-none border-b ${
                    isDark
                      ? 'bg-[#181C20] border-[#2B323A] hover:bg-[#1E2328]'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-sm font-bold">{plantName}</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        ({lineMap.size} Line{lineMap.size === 1 ? '' : 's'} • {plantMachineCount} Machine{plantMachineCount === 1 ? '' : 's'})
                      </span>
                    </div>
                  </div>

                  <Badge variant="cyan" size="sm">
                    Site / Facility
                  </Badge>
                </div>

                {/* Lines & Machines within Site */}
                {!isCollapsed && (
                  <div className="p-4 space-y-4">
                    {Array.from(lineMap.entries()).map(([lineName, lineMachines]) => (
                      <div
                        key={lineName}
                        className={`rounded-xl p-3 border ${
                          isDark ? 'bg-[#181C20]/60 border-[#2B323A]' : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        {/* Line Header */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/20">
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-200">{lineName}</span>
                            <span className="text-[10px] text-slate-400">
                              ({lineMachines.length} Machine{lineMachines.length === 1 ? '' : 's'})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            Production Line
                          </span>
                        </div>

                        {/* Machines Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                          {lineMachines.map((m) => (
                            <div
                              key={m.id}
                              className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                                isDark
                                  ? 'bg-[#14171A] border-[#2B323A] hover:border-slate-600'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    <span className="text-xs font-mono font-bold text-slate-100">
                                      {m.machineNumber || m.model}
                                    </span>
                                    {m.status === 'OPERATIONAL' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                        <CheckCircle2 className="w-3 h-3" /> Ready
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                                        <AlertTriangle className="w-3 h-3" /> {m.status || 'Active'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    SN: {m.serialNumber || 'N/A'} • {m.model}
                                  </div>
                                  {m.zone && (
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-2.5 h-2.5 text-slate-500" /> Zone: {m.zone}
                                    </div>
                                  )}
                                </div>

                                {m.healthScore !== undefined && (
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-400">Health</div>
                                    <div className={`text-xs font-mono font-bold ${
                                      m.healthScore >= 90
                                        ? 'text-emerald-400'
                                        : m.healthScore >= 75
                                        ? 'text-amber-400'
                                        : 'text-rose-400'
                                    }`}>
                                      {m.healthScore}%
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Machine Action Footer */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-700/20 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setTransferringMachine(m)}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                  <span>Transfer</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  {onOpenMhcHistory && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenMhcHistory(m.id)}
                                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-400 transition-colors"
                                    >
                                      <History className="w-3 h-3" />
                                      <span>MHC History</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onSelectMachine(m.id)}
                                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium transition-colors"
                                  >
                                    <span>Passport</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Machine Transfer Modal */}
      {transferringMachine && (
        <MachineTransferModal
          isOpen={!!transferringMachine}
          onClose={() => setTransferringMachine(null)}
          onTransfer={onTransferMachine}
          machine={transferringMachine}
          customer={customer}
          existingPlants={existingPlants}
          existingLines={existingLines}
        />
      )}
    </div>
  );
};
