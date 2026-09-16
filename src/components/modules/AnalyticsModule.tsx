import React, { useMemo, useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  XCircle, 
  ShieldCheck, 
  FileText, 
  Zap, 
  Package, 
  Clock, 
  Building2, 
  Check, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Machine, MHCSession, Contract, Customer, NavigationTab } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';

export interface AnalyticsProps {
  machines: Machine[];
  mhcSessions?: MHCSession[];
  contracts?: Contract[];
  customers?: Customer[];
  onNavigate?: (tab: NavigationTab) => void;
  onSelectMachine?: (machineId: string) => void;
}

export type StatusCategory = 'OPERATIONAL' | 'NEEDS_CALIBRATION' | 'MAINTENANCE_DUE' | 'OUT_OF_SERVICE';
export type MhcCoverageBand = 'RECENT' | 'DAYS_30_90' | 'DAYS_OVER_90' | 'NO_MHC';

export const AnalyticsModule: React.FC<AnalyticsProps> = ({
  machines = [],
  mhcSessions = [],
  contracts = [],
  customers = [],
  onNavigate,
  onSelectMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // State filters / toggles for drill-downs if desired
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusCategory | 'ALL'>('ALL');
  const [selectedCoverageFilter, setSelectedCoverageFilter] = useState<MhcCoverageBand | 'ALL'>('ALL');

  // 1. Authoritative Fleet Operational Status distribution
  const statusCounts = useMemo(() => {
    const counts = {
      OPERATIONAL: 0,
      NEEDS_CALIBRATION: 0,
      MAINTENANCE_DUE: 0,
      OUT_OF_SERVICE: 0
    };

    machines.forEach(m => {
      if (m.status && counts[m.status] !== undefined) {
        counts[m.status]++;
      } else {
        counts.OPERATIONAL++;
      }
    });

    return counts;
  }, [machines]);

  // Filtered machines by status
  const filteredMachinesByStatus = useMemo(() => {
    if (selectedStatusFilter === 'ALL') return machines;
    return machines.filter(m => (m.status || 'OPERATIONAL') === selectedStatusFilter);
  }, [machines, selectedStatusFilter]);

  // 2. Authoritative MHC Inspection Coverage calculation
  const coverageData = useMemo(() => {
    const now = Date.now();
    const bands: Record<MhcCoverageBand, Array<{ machine: Machine; latestDate: string | null; daysAgo: number | null }>> = {
      RECENT: [],
      DAYS_30_90: [],
      DAYS_OVER_90: [],
      NO_MHC: []
    };

    machines.forEach(m => {
      // Find all completed MHC sessions or records for this machine
      const sessionsForMachine = mhcSessions.filter(
        s => (s.machineId === m.id || s.machineSerialNumber === m.serialNumber) && s.completionStatus === 'COMPLETED'
      );

      // Extract valid inspection dates
      const validDates: Date[] = [];
      sessionsForMachine.forEach(s => {
        const dStr = s.completedDate || s.startDate || s.lastUpdated;
        if (dStr) {
          const parsed = new Date(dStr);
          if (!isNaN(parsed.getTime())) {
            validDates.push(parsed);
          }
        }
      });

      // Also check m.lastMhcDate
      if (m.lastMhcDate) {
        const parsed = new Date(m.lastMhcDate);
        if (!isNaN(parsed.getTime())) {
          validDates.push(parsed);
        }
      }

      if (validDates.length === 0) {
        bands.NO_MHC.push({ machine: m, latestDate: null, daysAgo: null });
      } else {
        // Sort descending to get most recent
        validDates.sort((a, b) => b.getTime() - a.getTime());
        const latest = validDates[0];
        const diffMs = now - latest.getTime();
        const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const isoDate = latest.toISOString().split('T')[0];

        if (days < 30) {
          bands.RECENT.push({ machine: m, latestDate: isoDate, daysAgo: days });
        } else if (days <= 90) {
          bands.DAYS_30_90.push({ machine: m, latestDate: isoDate, daysAgo: days });
        } else {
          bands.DAYS_OVER_90.push({ machine: m, latestDate: isoDate, daysAgo: days });
        }
      }
    });

    return bands;
  }, [machines, mhcSessions]);

  // 3. Authoritative Latest Laser Power Measurements
  const laserPowerSummaries = useMemo(() => {
    return machines.map(m => {
      // Look for latest MHC session with stage03_laserPower or laserPowerRecords
      const sessionsForMachine = mhcSessions.filter(
        s => (s.machineId === m.id || s.machineSerialNumber === m.serialNumber)
      );

      // Sort by startDate/lastUpdated descending
      const sortedSessions = [...sessionsForMachine].sort((a, b) => {
        const timeA = new Date(a.completedDate || a.lastUpdated || a.startDate || 0).getTime();
        const timeB = new Date(b.completedDate || b.lastUpdated || b.startDate || 0).getTime();
        return timeB - timeA;
      });

      let latestDate: string | null = null;
      let powerItems: Array<{
        laserIdentifier: string;
        ratedWatts?: number;
        beforeWatts?: number;
        afterWatts?: number;
        stabilityPercent?: number;
        result?: string;
      }> = [];

      for (const s of sortedSessions) {
        if (s.stage03_laserPower && Array.isArray(s.stage03_laserPower) && s.stage03_laserPower.length > 0) {
          const validItems = s.stage03_laserPower.filter(p => p.afterValueWatts > 0 || p.beforeValueWatts > 0 || p.ratedPowerWatts > 0);
          if (validItems.length > 0) {
            latestDate = s.completedDate || s.startDate || s.lastUpdated;
            powerItems = validItems.map(p => ({
              laserIdentifier: p.laserIdentifier || 'Laser 1',
              ratedWatts: p.ratedPowerWatts,
              beforeWatts: p.beforeValueWatts,
              afterWatts: p.afterValueWatts,
              stabilityPercent: p.stabilityPercent,
              result: p.result
            }));
            break;
          }
        }
      }

      // Check machine.laserPowerRecords if session didn't have it
      if (powerItems.length === 0 && m.laserPowerRecords && m.laserPowerRecords.length > 0) {
        const sortedRecords = [...m.laserPowerRecords].sort((a, b) => {
          const tA = new Date(a.timestamp || (a as any).date || 0).getTime();
          const tB = new Date(b.timestamp || (b as any).date || 0).getTime();
          return tB - tA;
        });
        const top = sortedRecords[0];
        latestDate = top.timestamp || (top as any).date || null;
        if (top.readings && Array.isArray(top.readings)) {
          powerItems = top.readings.map((r: any, idx: number) => ({
            laserIdentifier: r.laserName || `Laser Head ${idx + 1}`,
            ratedWatts: r.targetPowerWatts || r.ratedWatts,
            beforeWatts: r.beforeWatts,
            afterWatts: r.measuredWatts || r.afterWatts || r.powerWatts,
            stabilityPercent: r.stabilityPercent,
            result: r.status || (r.passed ? 'PASS' : 'WARNING')
          }));
        }
      }

      return {
        machine: m,
        latestDate,
        powerItems
      };
    });
  }, [machines, mhcSessions]);

  // 4. Authoritative Consumables Attention (Life <= 20% or Estimated Days <= 15)
  const attentionConsumables = useMemo(() => {
    const list: Array<{
      machine: Machine;
      consumableName: string;
      currentLifePercent: number | null;
      estimatedDaysRemaining: number | null;
      partNumber?: string;
      reason: string;
    }> = [];

    machines.forEach(m => {
      (m.consumables || []).forEach(c => {
        const hasLife = typeof c.currentLifePercent === 'number';
        const hasDays = typeof c.estimatedDaysRemaining === 'number';

        const isLowLife = hasLife && c.currentLifePercent! <= 20;
        const isLowDays = hasDays && c.estimatedDaysRemaining! <= 15;

        if (isLowLife || isLowDays) {
          let reason = '';
          if (isLowLife && isLowDays) {
            reason = `${c.currentLifePercent}% life remaining (${c.estimatedDaysRemaining}d)`;
          } else if (isLowLife) {
            reason = `${c.currentLifePercent}% life remaining`;
          } else {
            reason = `${c.estimatedDaysRemaining} days remaining`;
          }

          list.push({
            machine: m,
            consumableName: c.name,
            currentLifePercent: hasLife ? c.currentLifePercent! : null,
            estimatedDaysRemaining: hasDays ? c.estimatedDaysRemaining! : null,
            partNumber: c.partNumber,
            reason
          });
        }
      });
    });

    return list;
  }, [machines]);

  const allConsumablesCount = useMemo(() => {
    return machines.reduce((acc, m) => acc + (m.consumables?.length || 0), 0);
  }, [machines]);

  // 5. Authoritative Contract Coverage Analysis
  const contractCoverage = useMemo(() => {
    const coveredMachineIds = new Set<string>();
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE');

    activeContracts.forEach(c => {
      (c.machinesCoveredIds || []).forEach(id => coveredMachineIds.add(id));
    });

    const covered: Machine[] = [];
    const uncovered: Machine[] = [];

    machines.forEach(m => {
      if (coveredMachineIds.has(m.id)) {
        covered.push(m);
      } else {
        uncovered.push(m);
      }
    });

    return {
      activeContractsCount: activeContracts.length,
      covered,
      uncovered,
      coveragePercent: machines.length > 0 ? Math.round((covered.length / machines.length) * 100) : 0
    };
  }, [machines, contracts]);

  const totalRegisteredMachines = machines.length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Module Header & Quiet Industrial Context */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              Operational Analytics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Field telemetry, inspection currency, laser power verification, and service coverage across registered equipment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <Button
                variant="outline"
                size="sm"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => onNavigate('machines')}
              >
                Machine Passport
              </Button>
            )}
          </div>
        </div>

        {/* Quiet Industrial Telemetry Strip */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400 py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33]">
          <div className="flex items-center gap-2">
            <span>Fleet Equipment:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">{totalRegisteredMachines}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Operational:</span>
            <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{statusCounts.OPERATIONAL}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Attention/Due:</span>
            <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
              {statusCounts.NEEDS_CALIBRATION + statusCounts.MAINTENANCE_DUE}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Active Contracts:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">{contractCoverage.activeContractsCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Contract Coverage:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
              {totalRegisteredMachines > 0 ? `${contractCoverage.coveragePercent}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {totalRegisteredMachines === 0 ? (
        /* Honest Zero-State */
        <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#20252B] flex items-center justify-center mx-auto text-slate-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No registered equipment in fleet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Operational analytics, inspection currency, and laser verification will populate automatically when machines are registered in Machine Passport.
            </p>
          </div>
          {onNavigate && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('machines')}
              >
                Register Machine
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Operational Sections Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION 1: Fleet Operational Status */}
          <div className="rounded-xl border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  Fleet Operational Status
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time status distribution across registered machinery
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {totalRegisteredMachines} {totalRegisteredMachines === 1 ? 'unit' : 'units'}
              </span>
            </div>

            {/* Status Distribution Bars & Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div 
                onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'OPERATIONAL' ? 'ALL' : 'OPERATIONAL')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStatusFilter === 'OPERATIONAL'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-[#262B33] bg-slate-50/50 dark:bg-[#1C2026] hover:border-slate-300 dark:hover:border-[#3D4754]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Operational</span>
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {statusCounts.OPERATIONAL}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {Math.round((statusCounts.OPERATIONAL / totalRegisteredMachines) * 100)}% of fleet
                </div>
              </div>

              <div 
                onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'NEEDS_CALIBRATION' ? 'ALL' : 'NEEDS_CALIBRATION')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStatusFilter === 'NEEDS_CALIBRATION'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-[#262B33] bg-slate-50/50 dark:bg-[#1C2026] hover:border-slate-300 dark:hover:border-[#3D4754]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Needs Cal</span>
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {statusCounts.NEEDS_CALIBRATION}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {Math.round((statusCounts.NEEDS_CALIBRATION / totalRegisteredMachines) * 100)}% of fleet
                </div>
              </div>

              <div 
                onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'MAINTENANCE_DUE' ? 'ALL' : 'MAINTENANCE_DUE')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStatusFilter === 'MAINTENANCE_DUE'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-[#262B33] bg-slate-50/50 dark:bg-[#1C2026] hover:border-slate-300 dark:hover:border-[#3D4754]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Maint Due</span>
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {statusCounts.MAINTENANCE_DUE}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {Math.round((statusCounts.MAINTENANCE_DUE / totalRegisteredMachines) * 100)}% of fleet
                </div>
              </div>

              <div 
                onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'OUT_OF_SERVICE' ? 'ALL' : 'OUT_OF_SERVICE')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStatusFilter === 'OUT_OF_SERVICE'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-[#262B33] bg-slate-50/50 dark:bg-[#1C2026] hover:border-slate-300 dark:hover:border-[#3D4754]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {statusCounts.OUT_OF_SERVICE}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {Math.round((statusCounts.OUT_OF_SERVICE / totalRegisteredMachines) * 100)}% of fleet
                </div>
              </div>
            </div>

            {/* Segment Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-[#20252B]">
              {statusCounts.OPERATIONAL > 0 && (
                <div 
                  className="bg-emerald-500 h-full transition-all" 
                  style={{ width: `${(statusCounts.OPERATIONAL / totalRegisteredMachines) * 100}%` }} 
                  title={`Operational: ${statusCounts.OPERATIONAL}`}
                />
              )}
              {statusCounts.NEEDS_CALIBRATION > 0 && (
                <div 
                  className="bg-amber-400 h-full transition-all" 
                  style={{ width: `${(statusCounts.NEEDS_CALIBRATION / totalRegisteredMachines) * 100}%` }} 
                  title={`Needs Calibration: ${statusCounts.NEEDS_CALIBRATION}`}
                />
              )}
              {statusCounts.MAINTENANCE_DUE > 0 && (
                <div 
                  className="bg-amber-600 h-full transition-all" 
                  style={{ width: `${(statusCounts.MAINTENANCE_DUE / totalRegisteredMachines) * 100}%` }} 
                  title={`Maintenance Due: ${statusCounts.MAINTENANCE_DUE}`}
                />
              )}
              {statusCounts.OUT_OF_SERVICE > 0 && (
                <div 
                  className="bg-rose-500 h-full transition-all" 
                  style={{ width: `${(statusCounts.OUT_OF_SERVICE / totalRegisteredMachines) * 100}%` }} 
                  title={`Out of Service: ${statusCounts.OUT_OF_SERVICE}`}
                />
              )}
            </div>

            {/* Filtered Machine Micro-List */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex justify-between">
                <span>{selectedStatusFilter === 'ALL' ? 'All Registered Equipment' : `Machines with status: ${selectedStatusFilter}`}</span>
                {selectedStatusFilter !== 'ALL' && (
                  <button 
                    onClick={() => setSelectedStatusFilter('ALL')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredMachinesByStatus.map(m => (
                  <div 
                    key={m.id}
                    onClick={() => {
                      if (onSelectMachine) onSelectMachine(m.id);
                      if (onNavigate) onNavigate('machines');
                    }}
                    className="flex items-center justify-between p-2 rounded-md border border-slate-100 dark:border-[#20252B] bg-slate-50/50 dark:bg-[#16191D] hover:bg-slate-100 dark:hover:bg-[#20252B] cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {m.machineNumber || m.serialNumber || m.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">({m.model})</span>
                      <span className="text-slate-400 dark:text-slate-500">· {m.customerName || 'Customer'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                        m.status === 'OPERATIONAL'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : m.status === 'OUT_OF_SERVICE'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {m.status || 'OPERATIONAL'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: MHC Inspection Coverage */}
          <div className="rounded-xl border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  MHC Inspection Coverage
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Factual inspection currency calculated from completed MHC records
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {coverageData.RECENT.length + coverageData.DAYS_30_90.length + coverageData.DAYS_OVER_90.length} inspected
              </span>
            </div>

            {/* Age Classification Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div 
                onClick={() => setSelectedCoverageFilter(selectedCoverageFilter === 'RECENT' ? 'ALL' : 'RECENT')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCoverageFilter === 'RECENT'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-[#262B33] bg-slate-50/50 dark:bg-[#1C2026] hover:border-slate-300 dark:hover:border-[#3D4754]'
                }`}
              >
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Recent (&lt;30d)
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {coverageData.RECENT.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Active currency
                </div>
              </div>

              <div 
                onClick={() => setSelectedCoverageFilter(selectedCoverageFilter === 'DAYS_30_90' ? 'ALL' : 'DAYS_30_90')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCoverageFilter === 'DAYS_30_90'
                    ? 'border-slate-400 bg-slate-100/60 dark:bg-slate-800/40'
                    : 'border-slate-200 dark:border-[#262B33] bg-slate-50/50 dark:bg-[#1C2026] hover:border-slate-300 dark:hover:border-[#3D4754]'
                }`}
              >
                <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  30–90 Days
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {coverageData.DAYS_30_90.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Quarterly cycle
                </div>
              </div>

              <div 
                onClick={() => setSelectedCoverageFilter(selectedCoverageFilter === 'DAYS_OVER_90' ? 'ALL' : 'DAYS_OVER_90')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCoverageFilter === 'DAYS_OVER_90'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-[#262B33] bg-slate-50/50 dark:bg-[#1C2026] hover:border-slate-300 dark:hover:border-[#3D4754]'
                }`}
              >
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  &gt; 90 Days
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {coverageData.DAYS_OVER_90.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Prior quarter
                </div>
              </div>

              <div 
                onClick={() => setSelectedCoverageFilter(selectedCoverageFilter === 'NO_MHC' ? 'ALL' : 'NO_MHC')}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCoverageFilter === 'NO_MHC'
                    ? 'border-slate-400 bg-slate-100/60 dark:bg-slate-800/40'
                    : 'border-slate-200 dark:border-[#262B33] bg-slate-50/50 dark:bg-[#1C2026] hover:border-slate-300 dark:hover:border-[#3D4754]'
                }`}
              >
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No Recorded MHC
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {coverageData.NO_MHC.length}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Uninspected
                </div>
              </div>
            </div>

            {/* List by coverage band */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex justify-between">
                <span>
                  {selectedCoverageFilter === 'ALL' 
                    ? 'Equipment Inspection Records' 
                    : `Showing: ${selectedCoverageFilter.replace('_', ' ')}`}
                </span>
                {selectedCoverageFilter !== 'ALL' && (
                  <button 
                    onClick={() => setSelectedCoverageFilter('ALL')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {machines
                  .filter(m => {
                    if (selectedCoverageFilter === 'ALL') return true;
                    if (selectedCoverageFilter === 'RECENT') return coverageData.RECENT.some(x => x.machine.id === m.id);
                    if (selectedCoverageFilter === 'DAYS_30_90') return coverageData.DAYS_30_90.some(x => x.machine.id === m.id);
                    if (selectedCoverageFilter === 'DAYS_OVER_90') return coverageData.DAYS_OVER_90.some(x => x.machine.id === m.id);
                    if (selectedCoverageFilter === 'NO_MHC') return coverageData.NO_MHC.some(x => x.machine.id === m.id);
                    return true;
                  })
                  .map(m => {
                    const recMatch = coverageData.RECENT.find(x => x.machine.id === m.id)
                      || coverageData.DAYS_30_90.find(x => x.machine.id === m.id)
                      || coverageData.DAYS_OVER_90.find(x => x.machine.id === m.id);

                    return (
                      <div 
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-md border border-slate-100 dark:border-[#20252B] bg-slate-50/50 dark:bg-[#16191D] text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {m.machineNumber || m.serialNumber || m.name}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">({m.customerName || 'Customer'})</span>
                        </div>
                        <div>
                          {recMatch ? (
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {recMatch.latestDate} ({recMatch.daysAgo}d ago)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                              No recorded MHC
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* SECTION 3: Latest Laser Power Measurements */}
          <div className="rounded-xl border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-slate-400" />
                  Latest Laser Power Verification
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Most recent verified output power readings per equipment head
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {laserPowerSummaries.filter(l => l.powerItems.length > 0).length} / {totalRegisteredMachines} measured
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {laserPowerSummaries.map(({ machine, latestDate, powerItems }) => (
                <div 
                  key={machine.id}
                  className="p-3 rounded-lg border border-slate-100 dark:border-[#20252B] bg-slate-50/50 dark:bg-[#1C2026] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {machine.machineNumber || machine.serialNumber || machine.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        {machine.customerName || 'Customer'} · {machine.model}
                      </span>
                    </div>
                    {latestDate ? (
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        Verified: {latestDate.split('T')[0]}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                        No laser power measurements recorded
                      </span>
                    )}
                  </div>

                  {powerItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {powerItems.map((p, idx) => (
                        <div 
                          key={idx}
                          className="p-2 rounded border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{p.laserIdentifier}</span>
                            {p.result && (
                              <span className={`text-[10px] px-1 rounded font-semibold ${
                                p.result === 'PASS'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              }`}>
                                {p.result}
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>Rated: {p.ratedWatts ? `${p.ratedWatts} W` : '—'}</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              Measured: {p.afterWatts ? `${p.afterWatts} W` : (p.beforeWatts ? `${p.beforeWatts} W` : '—')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 rounded border border-dashed border-slate-200 dark:border-[#262B33] text-[11px] text-slate-400 dark:text-slate-500">
                      No laser power records available for this unit.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Consumables Attention Required */}
          <div className="rounded-xl border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  Consumables Attention
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Items requiring replacement (life &le; 20% or &le; 15 days remaining)
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {attentionConsumables.length} items flagged
              </span>
            </div>

            {attentionConsumables.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-slate-100 dark:border-[#20252B] bg-slate-50/50 dark:bg-[#1C2026] space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  All tracked consumables are in nominal range
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {allConsumablesCount} active consumable {allConsumablesCount === 1 ? 'item' : 'items'} monitored across fleet.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {attentionConsumables.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-950/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{item.consumableName}</span>
                        {item.partNumber && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            [{item.partNumber}]
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Machine: <span className="font-mono text-slate-700 dark:text-slate-300">{item.machine.machineNumber || item.machine.serialNumber}</span> ({item.machine.customerName || 'Customer'})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 dark:text-amber-400 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {item.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5: Service Contract Coverage Summary (Spans full width on large screens) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#20252B] pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Service Contract Fleet Coverage
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Authoritative mapping between active service contracts and covered production machinery
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Covered: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{contractCoverage.covered.length}</strong> / {totalRegisteredMachines}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Uncovered: <strong className="font-mono text-amber-600 dark:text-amber-400">{contractCoverage.uncovered.length}</strong>
                </span>
                {onNavigate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('contracts')}
                  >
                    View Contracts
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Covered List */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Covered Equipment ({contractCoverage.covered.length})</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {contractCoverage.covered.length === 0 ? (
                    <div className="p-3 rounded border border-dashed border-slate-200 dark:border-[#262B33] text-xs text-slate-400 dark:text-slate-500 text-center">
                      No machines covered under active contracts.
                    </div>
                  ) : (
                    contractCoverage.covered.map(m => (
                      <div 
                        key={m.id}
                        className="p-2 rounded border border-slate-100 dark:border-[#20252B] bg-slate-50/50 dark:bg-[#16191D] text-xs flex justify-between items-center"
                      >
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {m.machineNumber || m.serialNumber}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{m.customerName || 'Customer'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Uncovered List */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Not Under Active Contract ({contractCoverage.uncovered.length})</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {contractCoverage.uncovered.length === 0 ? (
                    <div className="p-3 rounded border border-dashed border-slate-200 dark:border-[#262B33] text-xs text-slate-400 dark:text-slate-500 text-center">
                      100% of fleet machinery is covered under active contracts.
                    </div>
                  ) : (
                    contractCoverage.uncovered.map(m => (
                      <div 
                        key={m.id}
                        className="p-2 rounded border border-slate-100 dark:border-[#20252B] bg-slate-50/50 dark:bg-[#16191D] text-xs flex justify-between items-center"
                      >
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {m.machineNumber || m.serialNumber}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">{m.customerName || 'Customer'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
