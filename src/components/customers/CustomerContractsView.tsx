import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Customer, Contract, Machine, MHCSession } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { 
  getContractMetrics, 
  formatContractDuration, 
  ContractTimelineEvent 
} from '../../utils/contractEngine';
import { ContractModal } from './ContractModal';

interface CustomerContractsViewProps {
  customer: Customer;
  contracts: Contract[];
  customerMachines: Machine[];
  mhcSessions: MHCSession[];
  onSaveContract: (contract: Contract) => void;
  onOpenMhcSession?: (machineId: string, sessionId?: string) => void;
}

export const CustomerContractsView: React.FC<CustomerContractsViewProps> = ({
  customer,
  contracts,
  customerMachines,
  mhcSessions,
  onSaveContract,
  onOpenMhcSession
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Filter contracts for this customer
  const customerContracts = contracts.filter(
    (c) => c.customerId === customer.id || c.customerName === customer.name
  );

  const [selectedContractId, setSelectedContractId] = useState<string>(
    customerContracts[0]?.id || ''
  );
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('ALL');
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Sync selected contract if list changes
  const activeContract = customerContracts.find((c) => c.id === selectedContractId) || customerContracts[0];

  const handleCreateContract = () => {
    setEditingContract(null);
    setIsContractModalOpen(true);
  };

  const handleEditContract = (c: Contract) => {
    setEditingContract(c);
    setIsContractModalOpen(true);
  };

  if (!activeContract || customerContracts.length === 0) {
    return (
      <div className="space-y-4">
        <div className={`p-8 text-center rounded-2xl border ${
          isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-300' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <FileText className="w-10 h-10 text-sky-400 mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-bold">No Service Agreements Registered</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            There are no active or historical MHC service contracts registered for {customer.name}.
          </p>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreateContract}>
            Register Service Agreement
          </Button>
        </div>

        {isContractModalOpen && (
          <ContractModal
            isOpen={isContractModalOpen}
            onClose={() => setIsContractModalOpen(false)}
            onSave={onSaveContract}
            contractToEdit={editingContract}
            customer={customer}
            customerMachines={customerMachines}
          />
        )}
      </div>
    );
  }

  // Calculate authoritative metrics
  const metrics = getContractMetrics(activeContract, mhcSessions, customerMachines);

  // Filter timeline events by selected machine filter
  const displayedEvents = metrics.timelineEvents.filter((ev) => {
    if (selectedMachineFilter === 'ALL') return true;
    return ev.machineId === selectedMachineFilter;
  });

  return (
    <div className="space-y-5">
      {/* Contract Selector Rail (if multiple contracts exist) & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
          {customerContracts.map((cnt) => {
            const isSelected = cnt.id === activeContract.id;
            return (
              <button
                key={cnt.id}
                onClick={() => setSelectedContractId(cnt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? isDark
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                      : 'bg-sky-50 text-sky-700 border border-sky-300 shadow-sm'
                    : isDark
                    ? 'bg-[#181C20] text-slate-400 border border-[#2B323A] hover:text-slate-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{cnt.contractNumber}</span>
                <span className={`text-[10px] px-1 rounded ${
                  cnt.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {cnt.status || 'ACTIVE'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={() => handleEditContract(activeContract)}
          >
            Edit Agreement
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleCreateContract}
          >
            New Contract
          </Button>
        </div>
      </div>

      {/* Contract Overview & Day Consumption Metrics */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono text-sky-400">
                {activeContract.contractNumber}
              </span>
              <Badge
                variant={
                  metrics.derivedStatus === 'ACTIVE'
                    ? 'success'
                    : metrics.derivedStatus === 'COMPLETED'
                    ? 'cyan'
                    : 'neutral'
                }
                size="sm"
              >
                {metrics.derivedStatus}
              </Badge>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Coverage Window: <strong className="font-mono text-slate-300">{formatContractDuration(activeContract.startDate, activeContract.endDate)}</strong>
            </div>
          </div>

          {/* Allocation Gauges */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 bg-black/10 dark:bg-black/20 p-3 rounded-xl border border-slate-700/20">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Allocation</div>
              <div className="text-sm sm:text-base font-bold font-mono text-slate-200 mt-0.5">
                {metrics.totalWorkingDays} <span className="text-xs font-normal text-slate-400">Days</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">MHC Consumed</div>
              <div className="text-sm sm:text-base font-bold font-mono text-sky-400 mt-0.5">
                {metrics.consumedWorkingDays} <span className="text-xs font-normal text-slate-400">Days</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Remaining</div>
              <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-0.5">
                {metrics.remainingWorkingDays} <span className="text-xs font-normal text-slate-400">Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">SLA MHC Service-Day Consumption</span>
            <span className="font-mono font-bold text-sky-400">{metrics.utilizationPercent}% Consumed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-700/30 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.utilizationPercent >= 90
                  ? 'bg-rose-500'
                  : metrics.utilizationPercent >= 75
                  ? 'bg-amber-500'
                  : 'bg-sky-500'
              }`}
              style={{ width: `${metrics.utilizationPercent}%` }}
            />
          </div>
        </div>

        {/* Covered Machine Chips & Filter Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Machine Events:
            </span>
            <button
              onClick={() => setSelectedMachineFilter('ALL')}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                selectedMachineFilter === 'ALL'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Covered ({metrics.coveredMachines.length})
            </button>
            {metrics.coveredMachines.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMachineFilter(m.id)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  selectedMachineFilter === m.id
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.machineNumber || m.model}
              </button>
            ))}
          </div>

          {metrics.uncoveredMachines.length > 0 && (
            <div className="text-[11px] text-amber-400/80">
              {metrics.uncoveredMachines.length} machine{metrics.uncoveredMachines.length > 1 ? 's' : ''} not covered under this agreement
            </div>
          )}
        </div>
      </div>

      {/* 2-Year Service Timeline / Calendar */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Service Execution Timeline ({activeContract.startDate} → {activeContract.endDate})
            </h4>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {displayedEvents.length} Recorded Inspection Event{displayedEvents.length === 1 ? '' : 's'}
          </span>
        </div>

        {displayedEvents.length === 0 ? (
          <div className={`p-6 text-center rounded-xl border ${
            isDark ? 'bg-[#181C20] border-[#2B323A] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <p className="text-xs">
              No MHC inspection events recorded within this contract coverage window for the selected machine scope.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/40">
            {displayedEvents.map((ev, index) => {
              const isCompleted = ev.completionStatus === 'COMPLETED';

              return (
                <div key={ev.sessionId || index} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[23px] top-3.5 w-3 h-3 rounded-full border-2 transition-transform group-hover:scale-125 ${
                    isCompleted
                      ? 'bg-emerald-400 border-emerald-900'
                      : 'bg-amber-400 border-amber-900'
                  }`} />

                  {/* Event Card */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    isDark
                      ? 'bg-[#181C20] border-[#2B323A] hover:border-sky-500/40'
                      : 'bg-slate-50 border-slate-200 hover:border-sky-300'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-sky-400">
                            {ev.startDate}
                            {ev.completedDate && ev.completedDate !== ev.startDate && ` → ${ev.completedDate}`}
                          </span>
                          <Badge variant={isCompleted ? 'success' : 'warning'} size="sm">
                            {ev.completionStatus}
                          </Badge>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            {ev.daysConsumed} Day{ev.daysConsumed > 1 ? 's' : ''} Consumed
                          </span>
                        </div>

                        <div className="text-xs font-medium text-slate-200 flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ev.machineName}</span>
                          <span className="text-slate-400 font-mono">({ev.machineSerialNumber})</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">Engineer: {ev.engineerName}</span>
                        </div>
                      </div>

                      {onOpenMhcSession && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                          onClick={() => onOpenMhcSession(ev.machineId, ev.sessionId)}
                        >
                          View Session
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contract Add/Edit Modal */}
      {isContractModalOpen && (
        <ContractModal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          onSave={onSaveContract}
          contractToEdit={editingContract}
          customer={customer}
          customerMachines={customerMachines}
        />
      )}
    </div>
  );
};
