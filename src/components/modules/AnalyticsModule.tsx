import React, { useMemo } from 'react';
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
  AlertTriangle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Machine, MHCSession, Contract, Customer, NavigationTab } from '../../types';
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
      const sessionsForMachine = mhcSessions.filter(
        s => (s.machineId === m.id || s.machineSerialNumber === m.serialNumber) && s.completionStatus === 'COMPLETED'
      );

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

      if (m.lastMhcDate) {
        const parsed = new Date(m.lastMhcDate);
        if (!isNaN(parsed.getTime())) {
          validDates.push(parsed);
        }
      }

      if (validDates.length === 0) {
        bands.NO_MHC.push({ machine: m, latestDate: null, daysAgo: null });
      } else {
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

  // 3. Authoritative Laser Power Measurements Summary
  const laserSummary = useMemo(() => {
    let measuredMachinesCount = 0;
    let totalHeadsMeasured = 0;
    let passCount = 0;
    let warningCount = 0;
    const latestDates: string[] = [];

    machines.forEach(m => {
      const sessionsForMachine = mhcSessions.filter(
        s => (s.machineId === m.id || s.machineSerialNumber === m.serialNumber)
      );

      const sortedSessions = [...sessionsForMachine].sort((a, b) => {
        const timeA = new Date(a.completedDate || a.lastUpdated || a.startDate || 0).getTime();
        const timeB = new Date(b.completedDate || b.lastUpdated || b.startDate || 0).getTime();
        return timeB - timeA;
      });

      let found = false;
      for (const s of sortedSessions) {
        if (s.stage03_laserPower && Array.isArray(s.stage03_laserPower) && s.stage03_laserPower.length > 0) {
          const validItems = s.stage03_laserPower.filter(p => p.afterValueWatts > 0 || p.beforeValueWatts > 0 || p.ratedPowerWatts > 0);
          if (validItems.length > 0) {
            measuredMachinesCount++;
            found = true;
            const d = s.completedDate || s.startDate || s.lastUpdated;
            if (d) latestDates.push(d.split('T')[0]);
            validItems.forEach(p => {
              totalHeadsMeasured++;
              if (p.result === 'PASS' || (!p.result && p.afterValueWatts > 0)) {
                passCount++;
              } else if (p.result) {
                warningCount++;
              }
            });
            break;
          }
        }
      }

      if (!found && m.laserPowerRecords && m.laserPowerRecords.length > 0) {
        measuredMachinesCount++;
        const top = m.laserPowerRecords[0];
        if (top.timestamp) latestDates.push(top.timestamp.split('T')[0]);
        (top.readings || []).forEach(r => {
          totalHeadsMeasured++;
          if (r.status === 'PASS' || r.passed) {
            passCount++;
          } else {
            warningCount++;
          }
        });
      }
    });

    latestDates.sort((a, b) => b.localeCompare(a));

    return {
      measuredMachinesCount,
      totalHeadsMeasured,
      passCount,
      warningCount,
      mostRecentDate: latestDates[0] || null
    };
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
            reason = `${c.currentLifePercent}% life (${c.estimatedDaysRemaining}d remaining)`;
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

  // Equipment needing operational attention
  const attentionMachines = useMemo(() => {
    return machines.filter(m => m.status && m.status !== 'OPERATIONAL');
  }, [machines]);

  const totalAttentionCount = attentionMachines.length + attentionConsumables.length;

  return (
    <div className="space-y-5 pb-10 max-w-7xl mx-auto">
      {/* 1. Header & Navigation Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#262B33]">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            Operational Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fleet health distribution, inspection currency, laser verification, and service contract coverage.
          </p>
        </div>

        {onNavigate && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onNavigate('machines')}
            >
              Machine Passport
            </Button>
          </div>
        )}
      </div>

      {totalRegisteredMachines === 0 ? (
        /* Truthful Zero-State */
        <div className="p-10 text-center rounded-lg border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#20252B] flex items-center justify-center mx-auto text-slate-400">
            <Activity className="w-5 h-5" />
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
        <div className="space-y-5">
          {/* 2. Glanceable Top Summary Blocks (Flat, High-Signal) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Status Summary */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] space-y-2">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Fleet Operational</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{totalRegisteredMachines} total</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                  {Math.round((statusCounts.OPERATIONAL / totalRegisteredMachines) * 100)}%
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {statusCounts.OPERATIONAL} active
                </span>
              </div>
              {/* Segment line */}
              <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-[#20252B]">
                {statusCounts.OPERATIONAL > 0 && (
                  <div className="bg-emerald-500 h-full" style={{ width: `${(statusCounts.OPERATIONAL / totalRegisteredMachines) * 100}%` }} />
                )}
                {statusCounts.NEEDS_CALIBRATION > 0 && (
                  <div className="bg-amber-400 h-full" style={{ width: `${(statusCounts.NEEDS_CALIBRATION / totalRegisteredMachines) * 100}%` }} />
                )}
                {statusCounts.MAINTENANCE_DUE > 0 && (
                  <div className="bg-amber-600 h-full" style={{ width: `${(statusCounts.MAINTENANCE_DUE / totalRegisteredMachines) * 100}%` }} />
                )}
                {statusCounts.OUT_OF_SERVICE > 0 && (
                  <div className="bg-rose-500 h-full" style={{ width: `${(statusCounts.OUT_OF_SERVICE / totalRegisteredMachines) * 100}%` }} />
                )}
              </div>
            </div>

            {/* Inspection Currency */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] space-y-2">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>MHC Currency</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {coverageData.RECENT.length + coverageData.DAYS_30_90.length}/{totalRegisteredMachines}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                  {coverageData.RECENT.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  &lt;30d current
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between font-mono">
                <span>30-90d: {coverageData.DAYS_30_90.length}</span>
                <span>&gt;90d: {coverageData.DAYS_OVER_90.length}</span>
                <span>None: {coverageData.NO_MHC.length}</span>
              </div>
            </div>

            {/* Laser Verification */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] space-y-2">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Laser Power Verified</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {laserSummary.measuredMachinesCount}/{totalRegisteredMachines} units
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                  {laserSummary.totalHeadsMeasured}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  heads tested
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between font-mono">
                <span className="text-emerald-600 dark:text-emerald-400">Pass: {laserSummary.passCount}</span>
                {laserSummary.warningCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">Alert: {laserSummary.warningCount}</span>
                )}
                <span>Latest: {laserSummary.mostRecentDate || '—'}</span>
              </div>
            </div>

            {/* Contract Coverage */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] space-y-2">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Contract Coverage</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {contractCoverage.activeContractsCount} active
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                  {contractCoverage.coveragePercent}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({contractCoverage.covered.length}/{totalRegisteredMachines})
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {contractCoverage.uncovered.length > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {contractCoverage.uncovered.length} unit{contractCoverage.uncovered.length === 1 ? '' : 's'} uncovered
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">100% active coverage</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Operational Attention Required (Prominent, High-Priority, No Redundant Cards) */}
          <div className="rounded-lg border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-2.5">
              <div className="flex items-center gap-2">
                {totalAttentionCount > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Operational Attention
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {totalAttentionCount === 0 ? 'All nominal' : `${totalAttentionCount} flagged item${totalAttentionCount === 1 ? '' : 's'}`}
              </span>
            </div>

            {totalAttentionCount === 0 ? (
              <div className="py-3 px-3.5 rounded bg-slate-50/60 dark:bg-[#1C2026] text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>All fleet machinery, laser optical power, and monitored consumables are within nominal operating thresholds.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Equipment Status Flags */}
                {attentionMachines.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (onSelectMachine) onSelectMachine(m.id);
                      if (onNavigate) onNavigate('machines');
                    }}
                    className="flex items-center justify-between p-2.5 rounded border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50 dark:hover:bg-amber-950/25 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {m.machineNumber || m.serialNumber || m.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">· {m.model} ({m.customerName || 'Customer'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                        m.status === 'OUT_OF_SERVICE'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {m.status}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}

                {/* Consumables Flags */}
                {attentionConsumables.map((c, idx) => (
                  <div
                    key={`c-${idx}`}
                    onClick={() => {
                      if (onSelectMachine) onSelectMachine(c.machine.id);
                      if (onNavigate) onNavigate('machines');
                    }}
                    className="flex items-center justify-between p-2.5 rounded border border-slate-200 dark:border-[#262B33] bg-slate-50/60 dark:bg-[#1C2026] hover:bg-slate-100 dark:hover:bg-[#20252B] cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium text-slate-900 dark:text-slate-100">{c.consumableName}</span>
                      {c.partNumber && (
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">[{c.partNumber}]</span>
                      )}
                      <span className="text-slate-500 dark:text-slate-400">
                        on <strong className="font-mono font-normal text-slate-700 dark:text-slate-300">{c.machine.machineNumber || c.machine.serialNumber}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                        {c.reason}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Compact Structural Breakdown (Inspection Currency & Contract Coverage) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inspection Currency Distribution */}
            <div className="rounded-lg border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Inspection Currency
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {coverageData.RECENT.length + coverageData.DAYS_30_90.length + coverageData.DAYS_OVER_90.length} inspected
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-[#1C2026]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Recent (&lt;30 days)</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {coverageData.RECENT.length} <span className="text-slate-400 font-normal">({totalRegisteredMachines > 0 ? Math.round((coverageData.RECENT.length / totalRegisteredMachines) * 100) : 0}%)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-[#1C2026]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Quarterly (30–90 days)</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {coverageData.DAYS_30_90.length} <span className="text-slate-400 font-normal">({totalRegisteredMachines > 0 ? Math.round((coverageData.DAYS_30_90.length / totalRegisteredMachines) * 100) : 0}%)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-[#1C2026]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Prior Quarter (&gt;90 days)</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {coverageData.DAYS_OVER_90.length} <span className="text-slate-400 font-normal">({totalRegisteredMachines > 0 ? Math.round((coverageData.DAYS_OVER_90.length / totalRegisteredMachines) * 100) : 0}%)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-[#1C2026]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span>No Recorded MHC</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {coverageData.NO_MHC.length} <span className="text-slate-400 font-normal">({totalRegisteredMachines > 0 ? Math.round((coverageData.NO_MHC.length / totalRegisteredMachines) * 100) : 0}%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Service Contract Coverage */}
            <div className="rounded-lg border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Contract Coverage Details
                  </h3>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('contracts')}
                    className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-[#1C2026]">
                  <span className="text-slate-600 dark:text-slate-400">Active Service Agreements</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {contractCoverage.activeContractsCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-[#1C2026]">
                  <span className="text-slate-600 dark:text-slate-400">Covered Fleet Equipment</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {contractCoverage.covered.length} of {totalRegisteredMachines} ({contractCoverage.coveragePercent}%)
                  </span>
                </div>

                {contractCoverage.uncovered.length > 0 ? (
                  <div className="p-2 rounded border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/15 space-y-1">
                    <div className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{contractCoverage.uncovered.length} Equipment Not Under Contract</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 pl-5">
                      {contractCoverage.uncovered.map(m => m.machineNumber || m.serialNumber).join(', ')}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Complete coverage: all registered fleet equipment is covered.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
