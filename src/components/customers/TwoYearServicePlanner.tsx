import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Cpu, 
  ExternalLink,
  X,
  ArrowRight,
  Activity,
  Layers,
  LayoutGrid,
  ListTree,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Contract, Machine, MHCSession } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { useTheme } from '../../context/ThemeContext';
import { 
  getContractMetrics, 
  formatContractDuration, 
  ContractTimelineEvent 
} from '../../utils/contractEngine';

interface TwoYearServicePlannerProps {
  contract: Contract;
  customerName: string;
  customerMachines: Machine[];
  mhcSessions: MHCSession[];
  onClose: () => void;
  onOpenMhcSession?: (machineId: string, sessionId?: string) => void;
}

interface MonthSlot {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  yearMonthKey: string; // "YYYY-MM"
  monthLabel: string; // "Jan", "Feb", etc.
  quarterLabel: string; // "Q1 2025"
  isContractBoundaryStart: boolean;
  isContractBoundaryEnd: boolean;
  isInContractRange: boolean;
}

export const TwoYearServicePlanner: React.FC<TwoYearServicePlannerProps> = ({
  contract,
  customerName,
  customerMachines,
  mhcSessions,
  onClose,
  onOpenMhcSession
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Selected machine filter ('ALL' or machineId)
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('ALL');
  
  // Hovered machine for interactive row cross-highlighting
  const [hoveredMachineId, setHoveredMachineId] = useState<string | null>(null);

  // Selected view mode: 'matrix' (Fleet Matrix) | 'grid' (Quarterly Calendar) | 'timeline' (Chronological Flow)
  const [viewMode, setViewMode] = useState<'matrix' | 'grid' | 'timeline'>('matrix');

  // Selected single session for detailed inspection drawer
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Hovered event for inline preview tooltip
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Compute authoritative contract metrics
  const metrics = useMemo(() => {
    return getContractMetrics(contract, mhcSessions, customerMachines);
  }, [contract, mhcSessions, customerMachines]);

  // Generate monthly slots for the exact contract period
  const monthSlots = useMemo<MonthSlot[]>(() => {
    if (!contract.startDate || !contract.endDate) return [];

    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

    const slots: MonthSlot[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    while (current <= lastMonth) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const quarter = Math.floor(month / 3) + 1;
      const yearMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      const isFirstMonth = year === start.getFullYear() && month === start.getMonth();
      const isLastMonth = year === end.getFullYear() && month === end.getMonth();

      slots.push({
        year,
        month,
        yearMonthKey,
        monthLabel: monthNames[month],
        quarterLabel: `Q${quarter} ${year}`,
        isContractBoundaryStart: isFirstMonth,
        isContractBoundaryEnd: isLastMonth,
        isInContractRange: true
      });

      current.setMonth(current.getMonth() + 1);
    }

    return slots;
  }, [contract.startDate, contract.endDate]);

  // Group month slots into quarters
  const quarters = useMemo(() => {
    const grouped: { [quarterKey: string]: { label: string; year: number; quarterNum: number; months: MonthSlot[] } } = {};

    monthSlots.forEach((slot) => {
      const qKey = slot.quarterLabel;
      if (!grouped[qKey]) {
        grouped[qKey] = {
          label: qKey,
          year: slot.year,
          quarterNum: Math.floor(slot.month / 3) + 1,
          months: []
        };
      }
      grouped[qKey].months.push(slot);
    });

    return Object.values(grouped);
  }, [monthSlots]);

  // Map events by month key ("YYYY-MM")
  const eventsByMonthKey = useMemo(() => {
    const map = new Map<string, ContractTimelineEvent[]>();

    metrics.timelineEvents.forEach((ev) => {
      if (!ev.startDate) return;
      const monthKey = ev.startDate.slice(0, 7); // "YYYY-MM"
      const existing = map.get(monthKey) || [];
      existing.push(ev);
      map.set(monthKey, existing);
    });

    return map;
  }, [metrics.timelineEvents]);

  // Filtered timeline events based on selected machine
  const filteredTimelineEvents = useMemo(() => {
    if (selectedMachineFilter === 'ALL') {
      return metrics.timelineEvents;
    }
    return metrics.timelineEvents.filter((ev) => ev.machineId === selectedMachineFilter);
  }, [metrics.timelineEvents, selectedMachineFilter]);

  // Covered machines list
  const coveredMachines = metrics.coveredMachines;

  // Active selected preview event
  const activeEventDetail = useMemo(() => {
    if (!selectedEventId) return null;
    return metrics.timelineEvents.find((e) => e.sessionId === selectedEventId) || null;
  }, [selectedEventId, metrics.timelineEvents]);

  // SLA Utilization progress percentage capped 0-100
  const utilizationPercent = Math.min(100, Math.max(0, metrics.utilizationPercent));

  return (
    <div className={`flex flex-col space-y-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* ─── 1. CONTRACT SERVICE HORIZON & TELEMETRY STRIP ─── */}
      <div className={`p-4 rounded-xl border transition-colors ${
        isDark ? 'bg-[#15181C] border-[#262B33]' : 'bg-slate-50/90 border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Customer + Contract + Horizon Chain */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className={`font-mono font-bold tracking-tight text-base ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>
                {customerName}
              </span>
              <span className="text-slate-600 font-mono">/</span>
              <span className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {contract.contractNumber}
              </span>
              {contract.plantName && (
                <span className="text-xs text-slate-400 font-mono">
                  • {contract.plantName}
                </span>
              )}
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

            {/* Visual Horizon Ribbon */}
            <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/20 dark:bg-black/40 border border-slate-700/30">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span className="text-slate-300">{contract.startDate}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-slate-300">{contract.endDate}</span>
              </div>
              <span className="text-slate-500">({formatContractDuration(contract.startDate, contract.endDate)})</span>
              {contract.engineerAssigned && (
                <span className="text-slate-400 hidden sm:inline">
                  • Lead: <span className="text-slate-200 font-medium">{contract.engineerAssigned}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Integrated Working-Day Capacity Telemetry (Visual progress + metric) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-mono shrink-0 border-t lg:border-t-0 lg:border-l border-slate-700/30 pt-3 lg:pt-0 lg:pl-5">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Allocation</span>
                <span className="font-semibold text-slate-200 text-sm">{metrics.totalWorkingDays} <span className="text-[10px] text-slate-400 font-normal">days</span></span>
              </div>
              <div className="w-px h-6 bg-slate-700/40" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Consumed</span>
                <span className={`font-semibold text-sm ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>{metrics.consumedWorkingDays} <span className="text-[10px] text-slate-400 font-normal">days</span></span>
              </div>
              <div className="w-px h-6 bg-slate-700/40" />
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Remaining</span>
                <span className={`font-semibold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{metrics.remainingWorkingDays} <span className="text-[10px] text-slate-400 font-normal">days</span></span>
              </div>
            </div>

            {/* Mini visual capacity bar */}
            <div className="w-full sm:w-28 space-y-1">
              <ProgressBar
                value={utilizationPercent}
                variant={utilizationPercent > 90 ? 'warning' : 'primary'}
                size="xs"
                animated={true}
              />
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>{utilizationPercent}% SLA</span>
                <span>{metrics.timelineEvents.length} MHCs</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── 2. WORKSPACE CONTROL: FLEET FOCUS BAR & VIEW SWITCHER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Machine Focus Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            Covered Fleet:
          </span>

          <button
            onClick={() => setSelectedMachineFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              selectedMachineFilter === 'ALL'
                ? isDark 
                  ? 'bg-sky-500/20 text-[#8ECDF7] border border-sky-500/40 shadow-sm ring-1 ring-sky-500/20' 
                  : 'bg-sky-100 text-sky-900 border border-sky-300 font-semibold shadow-sm'
                : isDark 
                  ? 'bg-[#181B1F] text-slate-400 border border-[#2B313A] hover:text-slate-200 hover:border-slate-600' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            All Systems ({coveredMachines.length})
          </button>

          {coveredMachines.map((m) => {
            const isSelected = selectedMachineFilter === m.id;
            const machineSessionCount = metrics.timelineEvents.filter((ev) => ev.machineId === m.id).length;

            return (
              <button
                key={m.id}
                onClick={() => setSelectedMachineFilter(m.id)}
                onMouseEnter={() => setHoveredMachineId(m.id)}
                onMouseLeave={() => setHoveredMachineId(null)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? isDark 
                      ? 'bg-sky-500/20 text-[#8ECDF7] border border-sky-500/50 shadow-sm ring-1 ring-sky-500/30' 
                      : 'bg-sky-100 text-sky-900 border border-sky-300 font-bold shadow-sm'
                    : isDark 
                      ? 'bg-[#181B1F] text-slate-400 border border-[#2B313A] hover:text-slate-200 hover:border-slate-600' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                }`}
              >
                <span className={isSelected ? 'font-bold' : 'font-medium'}>{m.machineNumber || m.model}</span>
                {machineSessionCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isSelected ? 'bg-sky-400 text-slate-950' : 'bg-slate-700/60 text-slate-300'
                  }`}>
                    {machineSessionCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Tabs (Fleet Matrix | Quarterly Calendar | Chronological Flow) */}
        <div className="flex items-center gap-1 bg-[#121518] dark:bg-[#101215] p-1 rounded-lg border border-slate-700/30 self-start sm:self-auto shrink-0 shadow-inner">
          <button
            onClick={() => setViewMode('matrix')}
            title="Continuous machine-by-month service timeline"
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
              viewMode === 'matrix'
                ? isDark 
                  ? 'bg-sky-500/20 text-[#8ECDF7] font-bold border border-sky-500/30 shadow-sm' 
                  : 'bg-white text-sky-900 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fleet Matrix</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            title="Quarterly rhythm and cadence overview"
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? isDark 
                  ? 'bg-sky-500/20 text-[#8ECDF7] font-bold border border-sky-500/30 shadow-sm' 
                  : 'bg-white text-sky-900 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Quarterly Calendar</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            title="Time-ordered engineering service chronology"
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? isDark 
                  ? 'bg-sky-500/20 text-[#8ECDF7] font-bold border border-sky-500/30 shadow-sm' 
                  : 'bg-white text-sky-900 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Chronological Flow</span>
          </button>
        </div>
      </div>

      {/* ─── 3. WORKSPACE VIEWS ─── */}

      {/* VIEW 1: FLEET MATRIX (Continuous Machine-by-Month Service Map) */}
      {viewMode === 'matrix' && (
        <div className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-[#15181C] border-[#262B33]' : 'bg-white border-slate-200'
        }`}>
          {/* Header Bar */}
          <div className="px-4 py-2.5 border-b border-slate-700/30 flex items-center justify-between text-xs font-mono bg-black/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">
                {monthSlots.length}-Month Continuous Fleet Timeline
              </span>
              <span className="text-slate-500 text-[11px] hidden md:inline">
                ({quarters.length} Quarters • {contract.startDate} → {contract.endDate})
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-emerald-400" /> Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-amber-400" /> In Progress
              </span>
            </div>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <table className="w-full border-collapse min-w-[1060px] text-xs">
              <thead>
                {/* Quarters Band */}
                <tr className={isDark ? 'bg-[#111316]' : 'bg-slate-100'}>
                  <th className="p-2.5 text-left text-xs font-mono font-bold text-slate-400 border-b border-r border-slate-700/30 sticky left-0 z-20 bg-inherit min-w-[210px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                    Target System
                  </th>
                  {quarters.map((q, qIdx) => (
                    <th
                      key={q.label + qIdx}
                      colSpan={q.months.length}
                      className={`p-2 text-center text-xs font-mono font-bold border-b border-r border-slate-700/30 ${
                        isDark ? 'text-sky-300/90 bg-sky-950/20' : 'text-sky-900 bg-sky-50/80'
                      }`}
                    >
                      {q.label}
                    </th>
                  ))}
                </tr>

                {/* Months Band */}
                <tr className={isDark ? 'bg-[#181B1F]' : 'bg-slate-50'}>
                  <th className="p-2 text-left text-[11px] font-mono text-slate-500 border-b border-r border-slate-700/30 sticky left-0 z-20 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                    Model / Serial
                  </th>
                  {monthSlots.map((slot, sIdx) => {
                    const hasEventsInMonth = eventsByMonthKey.has(slot.yearMonthKey);
                    const isStart = slot.isContractBoundaryStart;
                    const isEnd = slot.isContractBoundaryEnd;

                    return (
                      <th
                        key={slot.yearMonthKey + sIdx}
                        className={`p-1.5 text-center text-[11px] font-mono border-b border-r border-slate-700/30 min-w-[72px] relative transition-colors ${
                          hasEventsInMonth
                            ? isDark ? 'text-[#8ECDF7] font-bold bg-sky-500/10' : 'text-sky-900 font-bold bg-sky-100/60'
                            : 'text-slate-400 font-normal'
                        }`}
                      >
                        {isStart && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-400" title="Contract Start" />
                        )}
                        {isEnd && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" title="Contract End" />
                        )}
                        <div>{slot.monthLabel}</div>
                        <div className="text-[9px] text-slate-500 font-mono">{slot.year.toString().slice(2)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {coveredMachines.length === 0 ? (
                  <tr>
                    <td colSpan={monthSlots.length + 1} className="p-10 text-center text-xs text-slate-500 font-mono">
                      No covered systems registered in this contract SLA.
                    </td>
                  </tr>
                ) : (
                  coveredMachines.map((machine) => {
                    const isFilteredOut = selectedMachineFilter !== 'ALL' && selectedMachineFilter !== machine.id;
                    const isHovered = hoveredMachineId === machine.id;

                    return (
                      <tr
                        key={machine.id}
                        onMouseEnter={() => setHoveredMachineId(machine.id)}
                        onMouseLeave={() => setHoveredMachineId(null)}
                        className={`border-b border-slate-700/20 transition-all duration-200 ${
                          isFilteredOut 
                            ? 'opacity-25 filter grayscale-[50%]' 
                            : isHovered 
                            ? isDark ? 'bg-slate-800/40' : 'bg-slate-50'
                            : ''
                        }`}
                      >
                        {/* Machine Identification Column (Machine ID DOMINANT) */}
                        <td className={`p-3 border-r border-slate-700/30 sticky left-0 z-10 text-xs font-mono transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] ${
                          isDark ? 'bg-[#15181C]' : 'bg-white'
                        }`}>
                          <div className={`font-bold text-sm truncate max-w-[195px] flex items-center gap-1.5 ${
                            selectedMachineFilter === machine.id 
                              ? isDark ? 'text-[#8ECDF7]' : 'text-sky-800' 
                              : isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            <Cpu className={`w-4 h-4 shrink-0 ${
                              selectedMachineFilter === machine.id ? 'text-sky-400' : 'text-slate-400'
                            }`} />
                            <span>{machine.machineNumber || machine.model}</span>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 truncate max-w-[195px] mt-0.5">
                            SN: <span className="font-mono text-slate-300">{machine.serialNumber}</span>
                          </div>

                          {machine.plantName && (
                            <div className="text-[9px] text-slate-500 truncate max-w-[195px]">
                              {machine.plantName}
                            </div>
                          )}
                        </td>

                        {/* Month Cells across the 24-Month Horizon */}
                        {monthSlots.map((slot) => {
                          const monthEvents = (eventsByMonthKey.get(slot.yearMonthKey) || []).filter(
                            (ev) => ev.machineId === machine.id
                          );

                          const hasEvent = monthEvents.length > 0;

                          return (
                            <td
                              key={slot.yearMonthKey}
                              className={`p-1.5 border-r border-slate-700/15 align-middle transition-colors ${
                                hasEvent
                                  ? isDark ? 'bg-sky-500/10' : 'bg-sky-50/70'
                                  : ''
                              }`}
                            >
                              {hasEvent ? (
                                <div className="space-y-1">
                                  {monthEvents.map((ev) => {
                                    const isCompleted = ev.completionStatus === 'COMPLETED';
                                    const isEventSelected = selectedEventId === ev.sessionId;

                                    return (
                                      <button
                                        key={ev.sessionId}
                                        onClick={() => setSelectedEventId(ev.sessionId)}
                                        onMouseEnter={() => setHoveredEventId(ev.sessionId)}
                                        onMouseLeave={() => setHoveredEventId(null)}
                                        className={`w-full text-left p-1.5 rounded-md border transition-all duration-200 transform hover:scale-105 shadow-sm group ${
                                          isEventSelected
                                            ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-slate-900'
                                            : ''
                                        } ${
                                          isCompleted
                                            ? isDark
                                              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 hover:border-emerald-300 hover:bg-emerald-900/60'
                                              : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-500'
                                            : isDark
                                              ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 hover:border-amber-300 hover:bg-amber-900/60'
                                              : 'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500'
                                        }`}
                                      >
                                        <div className="text-[10px] font-mono font-bold flex items-center justify-between">
                                          <span>{ev.startDate.slice(8, 10)} {slot.monthLabel}</span>
                                          <span className="text-[9px] px-1 rounded bg-black/40 text-slate-200 font-mono">
                                            {ev.daysConsumed}d
                                          </span>
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-300 truncate mt-0.5 group-hover:text-white">
                                          {ev.completionStatus}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="h-8 flex items-center justify-center text-slate-700/20 dark:text-slate-700/40 text-[10px] font-mono">
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: QUARTERLY CALENDAR (Quarterly Rhythm & Cadence View) */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-400">
            <span>Quarterly SLA Service Rhythm Overview</span>
            <span>{quarters.length} Operational Quarters Covered</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quarters.map((quarter) => {
              const quarterEvents = quarter.months.flatMap((m) => {
                const evs = eventsByMonthKey.get(m.yearMonthKey) || [];
                if (selectedMachineFilter === 'ALL') return evs;
                return evs.filter((e) => e.machineId === selectedMachineFilter);
              });

              return (
                <div
                  key={quarter.label}
                  className={`p-4 rounded-xl border transition-all ${
                    isDark ? 'bg-[#15181C] border-[#262B33]' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Quarter Title & Range */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/20 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md ${
                        isDark ? 'bg-sky-500/15 text-[#8ECDF7] border border-sky-500/30' : 'bg-sky-100 text-sky-900 border border-sky-300'
                      }`}>
                        {quarter.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {quarter.months[0].monthLabel} → {quarter.months[quarter.months.length - 1].monthLabel}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-medium text-slate-300">
                      {quarterEvents.length} MHC Session{quarterEvents.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* 3 Monthly Columns within this Quarter */}
                  <div className="grid grid-cols-3 gap-2">
                    {quarter.months.map((month) => {
                      const allMonthEvents = (eventsByMonthKey.get(month.yearMonthKey) || []).filter((ev) => {
                        if (selectedMachineFilter === 'ALL') return true;
                        return ev.machineId === selectedMachineFilter;
                      });

                      return (
                        <div
                          key={month.yearMonthKey}
                          className={`p-2 rounded-lg border flex flex-col min-h-[120px] transition-colors ${
                            allMonthEvents.length > 0
                              ? isDark
                                ? 'bg-[#181B1F] border-sky-500/30'
                                : 'bg-sky-50/50 border-sky-200'
                              : isDark
                                ? 'bg-[#111316] border-[#262B33]'
                                : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-slate-700/20 mb-1.5">
                            <span className="text-[11px] font-mono font-bold text-slate-300">
                              {month.monthLabel}
                            </span>
                            {allMonthEvents.length > 0 ? (
                              <span className="text-[9px] font-mono px-1 rounded bg-sky-500/20 text-[#8ECDF7] font-bold">
                                {allMonthEvents.length}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-600 font-mono">—</span>
                            )}
                          </div>

                          {allMonthEvents.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-[10px] text-slate-600 font-mono italic">
                              Idle
                            </div>
                          ) : (
                            <div className="space-y-1.5 flex-1">
                              {allMonthEvents.map((ev) => {
                                const isCompleted = ev.completionStatus === 'COMPLETED';
                                return (
                                  <div
                                    key={ev.sessionId}
                                    onClick={() => setSelectedEventId(ev.sessionId)}
                                    className={`p-1.5 rounded border cursor-pointer transition-all duration-150 hover:scale-[1.03] ${
                                      isCompleted
                                        ? isDark
                                          ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400'
                                          : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                                        : isDark
                                          ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400'
                                          : 'bg-amber-50 border-amber-200 hover:border-amber-400'
                                    }`}
                                  >
                                    <div className="text-[9px] font-mono font-bold text-slate-200 truncate">
                                      {ev.machineName}
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 mt-0.5">
                                      <span>{ev.startDate.slice(8, 10)} {month.monthLabel}</span>
                                      <span>{ev.daysConsumed}d</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: CHRONOLOGICAL FLOW (Time-Ordered Engineering Chronology) */}
      {viewMode === 'timeline' && (
        <div className={`p-5 rounded-xl border space-y-4 ${
          isDark ? 'bg-[#15181C] border-[#262B33]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/20">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
                Engineering Service Event Chronology
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {filteredTimelineEvents.length} Inspection Record{filteredTimelineEvents.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredTimelineEvents.length === 0 ? (
            <div className={`p-10 text-center rounded-xl border ${
              isDark ? 'bg-[#181B1F] border-[#262B33] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <CalendarIcon className="w-8 h-8 text-sky-400/40 mx-auto mb-2" />
              <p className="text-xs font-medium font-mono">No MHC service records logged in this contract timeframe.</p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Historical and active inspections for covered machines will automatically link here.
              </p>
            </div>
          ) : (
            <div className="relative pl-7 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/40">
              {filteredTimelineEvents.map((ev, index) => {
                const isCompleted = ev.completionStatus === 'COMPLETED';

                return (
                  <div key={ev.sessionId || index} className="relative group">
                    {/* Pulsing Timeline Node */}
                    <div className={`absolute -left-[23px] top-3.5 w-3.5 h-3.5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 ${
                      isCompleted
                        ? 'bg-emerald-400 border-slate-900 ring-2 ring-emerald-500/20'
                        : 'bg-amber-400 border-slate-900 ring-2 ring-amber-500/20'
                    }`} />

                    {/* Chronological Card */}
                    <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                      isDark
                        ? 'bg-[#181B1F] border-[#262B33] hover:border-sky-500/40 hover:bg-[#1c2026]'
                        : 'bg-slate-50 border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>
                              {ev.startDate}
                              {ev.completedDate && ev.completedDate !== ev.startDate && ` → ${ev.completedDate}`}
                            </span>
                            <Badge variant={isCompleted ? 'success' : 'warning'} size="sm">
                              {ev.completionStatus}
                            </Badge>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                              {ev.daysConsumed} Day{ev.daysConsumed > 1 ? 's' : ''} SLA
                            </span>
                          </div>

                          <div className="text-xs font-medium text-slate-200 flex items-center gap-2 flex-wrap">
                            <Cpu className="w-3.5 h-3.5 text-sky-400" />
                            <span className="font-bold text-slate-100">{ev.machineName}</span>
                            <span className="text-slate-400 font-mono">({ev.machineSerialNumber})</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 font-mono">Engineer: {ev.engineerName}</span>
                          </div>

                          {ev.dispositionVerdict && (
                            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Release Disposition: {ev.dispositionVerdict}</span>
                            </div>
                          )}
                        </div>

                        {onOpenMhcSession && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<ExternalLink className="w-3.5 h-3.5" />}
                            onClick={() => {
                              onClose();
                              onOpenMhcSession(ev.machineId, ev.sessionId);
                            }}
                          >
                            Open MHC Record
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
      )}

      {/* ─── 4. MHC SESSION RECORD DETAIL MODAL ─── */}
      {activeEventDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedEventId(null)}
        >
          <div
            className={`w-full max-w-lg p-5 rounded-2xl border shadow-2xl space-y-4 ${
              isDark ? 'bg-[#181B1F] border-[#2B313A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/20">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-sky-400" />
                <h4 className="text-sm font-bold font-mono">MHC Service Record Telemetry</h4>
              </div>
              <button
                onClick={() => setSelectedEventId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#111316] border-[#262B33]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Execution Date</span>
                  <span className="font-bold text-[#8ECDF7]">{activeEventDetail.startDate}</span>
                </div>
                {activeEventDetail.completedDate && (
                  <div className="flex items-center justify-between font-mono mt-1">
                    <span className="text-slate-400">Completion Date</span>
                    <span className="text-slate-200">{activeEventDetail.completedDate}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-mono mt-1">
                  <span className="text-slate-400">Capacity Deducted</span>
                  <span className="font-bold text-emerald-400">{activeEventDetail.daysConsumed} Working Day(s)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#111316] border-[#262B33]' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Target System</span>
                  <div className="font-bold text-slate-200 mt-0.5">{activeEventDetail.machineName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{activeEventDetail.machineSerialNumber}</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#111316] border-[#262B33]' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Field Engineer</span>
                  <div className="font-bold text-slate-200 mt-0.5">{activeEventDetail.engineerName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Status: {activeEventDetail.completionStatus}</div>
                </div>
              </div>

              {activeEventDetail.dispositionVerdict && (
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#111316] border-[#262B33]' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Release Disposition</span>
                  <p className="text-emerald-400 font-semibold mt-0.5">{activeEventDetail.dispositionVerdict}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEventId(null)}
              >
                Dismiss
              </Button>
              {onOpenMhcSession && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const machId = activeEventDetail.machineId;
                    const sessId = activeEventDetail.sessionId;
                    setSelectedEventId(null);
                    onClose();
                    onOpenMhcSession(machId, sessId);
                  }}
                >
                  Open Full Inspection Record
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
