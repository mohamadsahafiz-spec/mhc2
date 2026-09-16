import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Calendar, 
  Building2, 
  Layers, 
  ChevronRight, 
  ExternalLink,
  ChevronDown,
  Info
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

export type DateRangeFilter = 'ALL' | '30D' | '90D' | '365D';
export type SubsystemType = 'ALL' | 'LASER' | 'OPTICS' | 'COOLING' | 'PRODUCT_QA' | 'STAGE' | 'AGC';
export type ParameterMetric = 'LASER_POWER' | 'STAGE_CALIBRATION' | 'AGC_ERROR';

interface FindingGroup {
  component: string;
  subsystem: string;
  occurrenceCount: number;
  affectedMachines: Set<string>;
  affectedMachineLabels: string[];
  isRecurring: boolean;
  instances: Array<{
    machineId: string;
    machineLabel: string;
    date: string;
    conditions: string[];
    actionRecommendation?: string;
    severity?: string;
    sessionId?: string;
  }>;
}

interface ParameterDataPoint {
  date: string;
  displayDate: string;
  value: number;
  baseline?: number;
  unit: string;
  sessionId?: string;
  machineId: string;
  label?: string;
}

export const AnalyticsModule: React.FC<AnalyticsProps> = ({
  machines = [],
  mhcSessions = [],
  contracts = [],
  customers = [],
  onNavigate,
  onSelectMachine
}) => {
  // Global Filters
  const [dateRange, setDateRange] = useState<DateRangeFilter>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [subsystemFilter, setSubsystemFilter] = useState<SubsystemType>('ALL');

  // Trajectory Local State (Machine & Parameter)
  const [trajectoryMachineId, setTrajectoryMachineId] = useState<string>(
    machines.length > 0 ? machines[0].id : ''
  );
  const [trajectoryParam, setTrajectoryParam] = useState<ParameterMetric>('LASER_POWER');

  // Drill-down State
  const [expandedFindingComponent, setExpandedFindingComponent] = useState<string | null>(null);
  const [activeHoverPoint, setActiveHoverPoint] = useState<ParameterDataPoint | null>(null);

  // -------------------------------------------------------------
  // 1. FILTERED COMPLETED SESSIONS (Truthful FSOS Data)
  // -------------------------------------------------------------
  const filteredCompletedSessions = useMemo(() => {
    const now = Date.now();
    let cutoffMs = 0;
    if (dateRange === '30D') cutoffMs = now - 30 * 24 * 60 * 60 * 1000;
    else if (dateRange === '90D') cutoffMs = now - 90 * 24 * 60 * 60 * 1000;
    else if (dateRange === '365D') cutoffMs = now - 365 * 24 * 60 * 60 * 1000;

    return mhcSessions.filter(s => {
      // Must be completed
      if (s.completionStatus !== 'COMPLETED') return false;

      // Date check
      const dateStr = s.completedDate || s.startDate || s.lastUpdated;
      if (dateRange !== 'ALL' && dateStr) {
        const time = new Date(dateStr).getTime();
        if (!isNaN(time) && time < cutoffMs) return false;
      }

      // Customer check
      if (selectedCustomerId !== 'ALL') {
        const targetCust = customers.find(c => c.id === selectedCustomerId);
        const matchId = s.customerId === selectedCustomerId;
        const matchName = targetCust && s.customerName && s.customerName.toLowerCase() === targetCust.name.toLowerCase();
        if (!matchId && !matchName) return false;
      }

      return true;
    });
  }, [mhcSessions, dateRange, selectedCustomerId, customers]);

  // -------------------------------------------------------------
  // 2. PARAMETER TRAJECTORY (Strict Longitudinal Math) — PRIMARY
  // -------------------------------------------------------------
  const parameterTrajectoryData = useMemo(() => {
    if (!trajectoryMachineId) return { points: [], baseline: null, unit: '', machine: null };

    const targetMachine = machines.find(m => m.id === trajectoryMachineId);
    if (!targetMachine) return { points: [], baseline: null, unit: '', machine: null };

    // Find all completed sessions for this machine
    const machineSessions = mhcSessions.filter(
      s => (s.machineId === targetMachine.id || s.machineSerialNumber === targetMachine.serialNumber) &&
           s.completionStatus === 'COMPLETED'
    );

    // Sort chronologically ascending
    machineSessions.sort((a, b) => {
      const tA = new Date(a.completedDate || a.startDate || a.lastUpdated || 0).getTime();
      const tB = new Date(b.completedDate || b.startDate || b.lastUpdated || 0).getTime();
      return tA - tB;
    });

    const points: ParameterDataPoint[] = [];
    let unit = '';
    let nominalBaseline: number | null = null;

    if (trajectoryParam === 'LASER_POWER') {
      unit = 'W';
      machineSessions.forEach(s => {
        const dStr = (s.completedDate || s.startDate || s.lastUpdated || '').split('T')[0];
        if (!dStr) return;

        if (s.stage03_laserPower && Array.isArray(s.stage03_laserPower)) {
          // Take Laser Head 1 or primary head
          const head1 = s.stage03_laserPower.find(h => h.laserIdentifier === 'lh1') || s.stage03_laserPower[0];
          if (head1) {
            const val = head1.afterValueWatts > 0 ? head1.afterValueWatts : head1.beforeValueWatts;
            if (val > 0) {
              if (head1.ratedPowerWatts > 0 && nominalBaseline === null) {
                nominalBaseline = head1.ratedPowerWatts;
              }
              points.push({
                date: dStr,
                displayDate: dStr,
                value: val,
                baseline: head1.ratedPowerWatts || nominalBaseline || undefined,
                unit: 'W',
                sessionId: s.id,
                machineId: targetMachine.id,
                label: head1.laserName || 'Laser Head 1'
              });
            }
          }
        }
      });

      // Fallback to machine.laserPowerRecords if session stage03 is empty
      if (points.length === 0 && targetMachine.laserPowerRecords && targetMachine.laserPowerRecords.length > 0) {
        const records = [...targetMachine.laserPowerRecords].sort((a, b) => 
          new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
        );
        records.forEach(r => {
          const dStr = (r.timestamp || '').split('T')[0];
          const rd = (r.readings || [])[0];
          if (rd && rd.actualPowerWatts > 0) {
            if (rd.targetPowerWatts > 0 && nominalBaseline === null) nominalBaseline = rd.targetPowerWatts;
            points.push({
              date: dStr,
              displayDate: dStr,
              value: rd.actualPowerWatts,
              baseline: rd.targetPowerWatts,
              unit: 'W',
              machineId: targetMachine.id,
              label: rd.headName || 'Laser Head'
            });
          }
        });
      }
    } else if (trajectoryParam === 'STAGE_CALIBRATION') {
      unit = 'µm';
      nominalBaseline = 2.0; // 2.0 µm spec tolerance
      machineSessions.forEach(s => {
        const dStr = (s.completedDate || s.startDate || s.lastUpdated || '').split('T')[0];
        if (!dStr) return;

        if (s.stageCalibrationData) {
          const sc = s.stageCalibrationData;
          const dev = typeof sc.overallMaxDevUm === 'number' ? sc.overallMaxDevUm : (sc.maxAbsXUm || 0);
          if (dev >= 0) {
            points.push({
              date: dStr,
              displayDate: dStr,
              value: Number(dev.toFixed(2)),
              baseline: sc.specToleranceUm || 2.0,
              unit: 'µm',
              sessionId: s.id,
              machineId: targetMachine.id,
              label: 'Max Axis Dev'
            });
          }
        }
      });
    } else if (trajectoryParam === 'AGC_ERROR') {
      unit = 'µm';
      nominalBaseline = 3.0; // 3.0 µm spec tolerance
      machineSessions.forEach(s => {
        const dStr = (s.completedDate || s.startDate || s.lastUpdated || '').split('T')[0];
        if (!dStr) return;

        if (s.agcData && typeof s.agcData.overallMaxDevUm === 'number') {
          points.push({
            date: dStr,
            displayDate: dStr,
            value: Number(s.agcData.overallMaxDevUm.toFixed(2)),
            baseline: 3.0,
            unit: 'µm',
            sessionId: s.id,
            machineId: targetMachine.id,
            label: 'AGC Max Error'
          });
        }
      });
    }

    return {
      points,
      baseline: nominalBaseline,
      unit,
      machine: targetMachine
    };
  }, [trajectoryMachineId, trajectoryParam, machines, mhcSessions]);

  // -------------------------------------------------------------
  // 3. SUBSYSTEM VERDICT DISTRIBUTION — SECONDARY
  // -------------------------------------------------------------
  const subsystemVerdicts = useMemo(() => {
    const data: Record<Exclude<SubsystemType, 'ALL'>, { name: string; pass: number; warn: number; fail: number; total: number }> = {
      LASER: { name: 'Laser Output', pass: 0, warn: 0, fail: 0, total: 0 },
      OPTICS: { name: 'Optics & Delivery', pass: 0, warn: 0, fail: 0, total: 0 },
      COOLING: { name: 'Chiller & Cooling', pass: 0, warn: 0, fail: 0, total: 0 },
      PRODUCT_QA: { name: 'Product Quality', pass: 0, warn: 0, fail: 0, total: 0 },
      STAGE: { name: 'Motion Stage', pass: 0, warn: 0, fail: 0, total: 0 },
      AGC: { name: 'AGC Positioning', pass: 0, warn: 0, fail: 0, total: 0 }
    };

    filteredCompletedSessions.forEach(s => {
      // 1. Laser Output (Stage 03)
      if (s.stage03_laserPower && Array.isArray(s.stage03_laserPower)) {
        s.stage03_laserPower.forEach(lp => {
          if (lp.afterValueWatts > 0 || lp.beforeValueWatts > 0 || lp.ratedPowerWatts > 0) {
            data.LASER.total++;
            if (lp.result === 'PASS' || (!lp.result && lp.afterValueWatts > 0)) data.LASER.pass++;
            else if (lp.result === 'WARN' || lp.result === 'ATTENTION') data.LASER.warn++;
            else if (lp.result === 'FAIL' || lp.result === 'OUT_OF_SPEC') data.LASER.fail++;
            else data.LASER.pass++;
          }
        });
      }

      // 2. Optics & Delivery (Stage 04)
      if (s.stage04_opticalInspection && Array.isArray(s.stage04_opticalInspection)) {
        s.stage04_opticalInspection.forEach(opt => {
          data.OPTICS.total++;
          if (opt.status === 'OK' || opt.status === 'PASS' || opt.status === 'GOOD') data.OPTICS.pass++;
          else if (opt.status === 'ATTENTION' || opt.status === 'WARN') data.OPTICS.warn++;
          else if (opt.status === 'NG' || opt.status === 'FAIL') data.OPTICS.fail++;
          else data.OPTICS.pass++;
        });
      }

      // 3. Chiller & Cooling (Stage 05)
      if (s.stage05_chillerCooling && Array.isArray(s.stage05_chillerCooling)) {
        s.stage05_chillerCooling.forEach(c => {
          data.COOLING.total++;
          if (c.status === 'OK' || c.status === 'PASS' || c.status === 'GOOD') data.COOLING.pass++;
          else if (c.status === 'ATTENTION' || c.status === 'WARN') data.COOLING.warn++;
          else if (c.status === 'NG' || c.status === 'FAIL') data.COOLING.fail++;
          else data.COOLING.pass++;
        });
      }

      // 4. Product Quality (Stage 06)
      if (s.stage06_productQuality && Array.isArray(s.stage06_productQuality)) {
        s.stage06_productQuality.forEach(pq => {
          data.PRODUCT_QA.total++;
          if (pq.status === 'OK' || pq.status === 'PASS') data.PRODUCT_QA.pass++;
          else if (pq.status === 'ATTENTION' || pq.status === 'WARN') data.PRODUCT_QA.warn++;
          else if (pq.status === 'NG' || pq.status === 'FAIL') data.PRODUCT_QA.fail++;
          else data.PRODUCT_QA.pass++;
        });
      }

      // 5. Motion Stage
      if (s.stageCalibrationData) {
        data.STAGE.total++;
        const sc = s.stageCalibrationData;
        const isFail = sc.verdict === 'OUT_OF_SPEC' || sc.systemVerdict === 'OUT_OF_SPEC';
        const isWarn = sc.engineerDisposition === 'ACCEPTED_DEVIATION' || sc.engineerDisposition === 'CONDITIONAL_PASS';
        if (isFail) data.STAGE.fail++;
        else if (isWarn) data.STAGE.warn++;
        else data.STAGE.pass++;
      }

      // 6. AGC Positioning
      if (s.agcData) {
        data.AGC.total++;
        const agc = s.agcData;
        const hasFail = (agc.indices || []).some(idx => idx.verdict === 'OUT_OF_SPEC');
        if (hasFail) data.AGC.fail++;
        else data.AGC.pass++;
      }
    });

    return data;
  }, [filteredCompletedSessions]);

  // -------------------------------------------------------------
  // 4. RECURRING FINDINGS & DEFECT FREQUENCY — SECONDARY
  // -------------------------------------------------------------
  const recurringFindingsData = useMemo(() => {
    const findingMap = new Map<string, FindingGroup>();

    const machineMap = new Map<string, string>();
    machines.forEach(m => {
      machineMap.set(m.id, m.machineNumber || m.serialNumber || m.name);
      if (m.serialNumber) machineMap.set(m.serialNumber, m.machineNumber || m.serialNumber);
    });

    filteredCompletedSessions.forEach(s => {
      const machineLabel = machineMap.get(s.machineId) || machineMap.get(s.machineSerialNumber) || s.machineSerialNumber || 'Equipment';
      const sessionDate = (s.completedDate || s.startDate || s.lastUpdated || '').split('T')[0] || 'Unknown Date';

      // 1. Structured inspectionFindings
      if (s.inspectionFindings && Array.isArray(s.inspectionFindings)) {
        s.inspectionFindings.forEach(f => {
          if (!f.component) return;

          // Map component to subsystem
          let compSubsystem = 'OPTICS';
          const lower = f.component.toLowerCase();
          if (lower.includes('laser') || lower.includes('beam') || lower.includes('diode')) compSubsystem = 'LASER';
          else if (lower.includes('chiller') || lower.includes('cool') || lower.includes('water') || lower.includes('flow')) compSubsystem = 'COOLING';
          else if (lower.includes('stage') || lower.includes('axis') || lower.includes('chuck')) compSubsystem = 'STAGE';
          else if (lower.includes('agc') || lower.includes('sensor') || lower.includes('focus')) compSubsystem = 'AGC';
          else if (lower.includes('cut') || lower.includes('quality') || lower.includes('taper') || lower.includes('burr')) compSubsystem = 'PRODUCT_QA';

          // Apply subsystem filter if active
          if (subsystemFilter !== 'ALL' && compSubsystem !== subsystemFilter) return;

          const key = f.component.trim();
          if (!findingMap.has(key)) {
            findingMap.set(key, {
              component: key,
              subsystem: compSubsystem,
              occurrenceCount: 0,
              affectedMachines: new Set<string>(),
              affectedMachineLabels: [],
              isRecurring: false,
              instances: []
            });
          }

          const group = findingMap.get(key)!;
          group.occurrenceCount++;
          group.affectedMachines.add(s.machineId || s.machineSerialNumber);
          if (!group.affectedMachineLabels.includes(machineLabel)) {
            group.affectedMachineLabels.push(machineLabel);
          }
          group.instances.push({
            machineId: s.machineId,
            machineLabel,
            date: sessionDate,
            conditions: f.conditions || [],
            actionRecommendation: f.actionRecommendation,
            severity: f.customConditionDetail || f.engineerNote || undefined,
            sessionId: s.id
          });
        });
      }

      // 2. Stage 04 Optical Inspection non-pass items
      if (s.stage04_opticalInspection && Array.isArray(s.stage04_opticalInspection)) {
        s.stage04_opticalInspection.forEach(opt => {
          if (opt.status === 'NG' || opt.status === 'ATTENTION') {
            if (subsystemFilter !== 'ALL' && subsystemFilter !== 'OPTICS') return;

            const key = opt.item ? opt.item.trim() : 'Optical Component';
            if (!findingMap.has(key)) {
              findingMap.set(key, {
                component: key,
                subsystem: 'OPTICS',
                occurrenceCount: 0,
                affectedMachines: new Set<string>(),
                affectedMachineLabels: [],
                isRecurring: false,
                instances: []
              });
            }

            const group = findingMap.get(key)!;
            group.occurrenceCount++;
            group.affectedMachines.add(s.machineId || s.machineSerialNumber);
            if (!group.affectedMachineLabels.includes(machineLabel)) {
              group.affectedMachineLabels.push(machineLabel);
            }
            group.instances.push({
              machineId: s.machineId,
              machineLabel,
              date: sessionDate,
              conditions: [opt.status === 'NG' ? 'Out of Specification / Defective' : 'Attention Required'],
              actionRecommendation: opt.details || 'Inspect / Clean / Replace',
              sessionId: s.id
            });
          }
        });
      }
    });

    const list = Array.from(findingMap.values()).map(g => {
      g.isRecurring = g.occurrenceCount >= 2 || g.affectedMachines.size > 1;
      return g;
    });

    list.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
    return list;
  }, [filteredCompletedSessions, machines, subsystemFilter]);

  // -------------------------------------------------------------
  // 5. MHC ACTIVITY & VOLUME TIME-SERIES — COMPACT / SUPPORTING
  // -------------------------------------------------------------
  const activityTimeSeries = useMemo(() => {
    const monthMap = new Map<string, { month: string; sessionCount: number; machineIds: Set<string>; findingsCount: number }>();

    filteredCompletedSessions.forEach(s => {
      const dateStr = s.completedDate || s.startDate || s.lastUpdated;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;

      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(yearMonth)) {
        monthMap.set(yearMonth, {
          month: yearMonth,
          sessionCount: 0,
          machineIds: new Set<string>(),
          findingsCount: 0
        });
      }

      const item = monthMap.get(yearMonth)!;
      item.sessionCount++;
      if (s.machineId) item.machineIds.add(s.machineId);
      else if (s.machineSerialNumber) item.machineIds.add(s.machineSerialNumber);

      // Count findings in this session
      let sessionFindings = 0;
      if (s.inspectionFindings && Array.isArray(s.inspectionFindings)) {
        sessionFindings += s.inspectionFindings.length;
      }
      if (s.stage04_opticalInspection && Array.isArray(s.stage04_opticalInspection)) {
        sessionFindings += s.stage04_opticalInspection.filter(i => i.status === 'NG' || i.status === 'ATTENTION').length;
      }
      item.findingsCount += sessionFindings;
    });

    const sorted = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    const totalCompleted = filteredCompletedSessions.length;
    const uniqueMachinesInspected = new Set(
      filteredCompletedSessions.map(s => s.machineId || s.machineSerialNumber).filter(Boolean)
    ).size;
    const totalFindingsCount = sorted.reduce((acc, curr) => acc + curr.findingsCount, 0);

    const maxMonthlySessions = sorted.reduce((max, curr) => Math.max(max, curr.sessionCount), 0) || 1;

    return {
      months: sorted,
      totalCompleted,
      uniqueMachinesInspected,
      totalFindingsCount,
      maxMonthlySessions
    };
  }, [filteredCompletedSessions]);

  // -------------------------------------------------------------
  // 6. CUSTOMER & SITE SERVICE ACTIVITY — SUPPORTING
  // -------------------------------------------------------------
  const siteActivityData = useMemo(() => {
    const custMap = new Map<string, { name: string; sessionCount: number; machineIds: Set<string>; plants: Set<string> }>();

    filteredCompletedSessions.forEach(s => {
      const name = s.customerName || (s.customerId ? customers.find(c => c.id === s.customerId)?.name : null) || 'General Customer';
      if (!custMap.has(name)) {
        custMap.set(name, {
          name,
          sessionCount: 0,
          machineIds: new Set<string>(),
          plants: new Set<string>()
        });
      }

      const item = custMap.get(name)!;
      item.sessionCount++;
      if (s.machineId) item.machineIds.add(s.machineId);
      if (s.customerPlant) item.plants.add(s.customerPlant);
    });

    const list = Array.from(custMap.values()).map(c => ({
      name: c.name,
      sessionCount: c.sessionCount,
      machineCount: c.machineIds.size,
      plantCount: c.plants.size
    }));

    list.sort((a, b) => b.sessionCount - a.sessionCount);
    return list;
  }, [filteredCompletedSessions, customers]);

  // -------------------------------------------------------------
  // 7. CONTRACT PROTECTION GAP — SUPPORTING
  // -------------------------------------------------------------
  const contractCoverage = useMemo(() => {
    const coveredIds = new Set<string>();
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE');

    activeContracts.forEach(c => {
      (c.machinesCoveredIds || []).forEach(id => coveredIds.add(id));
    });

    const covered: Machine[] = [];
    const uncovered: Machine[] = [];

    machines.forEach(m => {
      if (coveredIds.has(m.id)) covered.push(m);
      else uncovered.push(m);
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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & COMPACT GLOBAL FILTER BAR                            */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-[#262B33]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Engineering Analytics Workstation
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Longitudinal physical parameter trends, subsystem failure distributions, and recurring defect telemetry.
            </p>
          </div>

          {onNavigate && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('mhc')}
              >
                MHC Records
              </Button>
            </div>
          )}
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1A1D23] p-0.5 rounded border border-slate-200 dark:border-[#262B33]">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {(['ALL', '30D', '90D', '365D'] as DateRangeFilter[]).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-white dark:bg-[#121418] text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {range === 'ALL' ? 'All Time' : range === '30D' ? '30D' : range === '90D' ? '90D' : '1 Year'}
              </button>
            ))}
          </div>

          {/* Customer Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1A1D23] px-2 py-1 rounded border border-slate-200 dark:border-[#262B33]">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              aria-label="Customer Scope"
              className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-white dark:bg-[#1A1D23]">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#1A1D23]">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Subsystem Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1A1D23] px-2 py-1 rounded border border-slate-200 dark:border-[#262B33]">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={subsystemFilter}
              onChange={e => setSubsystemFilter(e.target.value as SubsystemType)}
              aria-label="Subsystem Scope"
              className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-white dark:bg-[#1A1D23]">All Subsystems</option>
              <option value="LASER" className="bg-white dark:bg-[#1A1D23]">Laser Output (Stage 03)</option>
              <option value="OPTICS" className="bg-white dark:bg-[#1A1D23]">Optics & Alignment (Stage 04)</option>
              <option value="COOLING" className="bg-white dark:bg-[#1A1D23]">Chiller & Cooling (Stage 05)</option>
              <option value="PRODUCT_QA" className="bg-white dark:bg-[#1A1D23]">Product Quality (Stage 06)</option>
              <option value="STAGE" className="bg-white dark:bg-[#1A1D23]">Motion Stage (Calibration)</option>
              <option value="AGC" className="bg-white dark:bg-[#1A1D23]">AGC Telemetry</option>
            </select>
          </div>

          {/* Filter Status Reset */}
          {(dateRange !== 'ALL' || selectedCustomerId !== 'ALL' || subsystemFilter !== 'ALL') && (
            <button
              onClick={() => {
                setDateRange('ALL');
                setSelectedCustomerId('ALL');
                setSubsystemFilter('ALL');
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline ml-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {totalRegisteredMachines === 0 ? (
        /* Zero State */
        <div className="p-10 text-center rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] space-y-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#20252B] flex items-center justify-center mx-auto text-slate-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">No registered equipment in fleet</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-0.5">
              Statistical trajectory models and subsystem distributions populate automatically when machinery and verified MHC inspection records exist.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ============================================================= */}
          {/* LEVEL 1: PRIMARY ENGINEERING ANALYSIS                         */}
          {/* Physical Parameter Longitudinal Trajectory                    */}
          {/* ============================================================= */}
          <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#20252B] pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Physical Parameter Trajectory
                  </h2>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Longitudinal measurement progression across consecutive MHC service sessions
                  </span>
                </div>
              </div>

              {/* Machine & Parameter Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1A1D23] px-2 py-1 rounded border border-slate-200 dark:border-[#262B33]">
                  <span className="text-[11px] text-slate-400 font-medium">Machine:</span>
                  <select
                    value={trajectoryMachineId}
                    onChange={e => setTrajectoryMachineId(e.target.value)}
                    aria-label="Trajectory Machine"
                    className="bg-transparent text-xs text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none cursor-pointer"
                  >
                    {machines.map(m => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-[#1A1D23]">
                        {m.machineNumber || m.serialNumber || m.name} ({m.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1A1D23] px-2 py-1 rounded border border-slate-200 dark:border-[#262B33]">
                  <span className="text-[11px] text-slate-400 font-medium">Metric:</span>
                  <select
                    value={trajectoryParam}
                    onChange={e => setTrajectoryParam(e.target.value as ParameterMetric)}
                    aria-label="Trajectory Metric"
                    className="bg-transparent text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="LASER_POWER" className="bg-white dark:bg-[#1A1D23]">Laser Power (Watts)</option>
                    <option value="STAGE_CALIBRATION" className="bg-white dark:bg-[#1A1D23]">Stage Accuracy (µm)</option>
                    <option value="AGC_ERROR" className="bg-white dark:bg-[#1A1D23]">AGC Positioning (µm)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Trajectory Body — Data-Density Aware */}
            {parameterTrajectoryData.points.length === 0 ? (
              /* Compact 0-Measurement State */
              <div className="p-4 rounded bg-slate-50/50 dark:bg-[#1A1D23]/50 border border-dashed border-slate-200 dark:border-[#262B33] text-center space-y-1">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  No verified physical readings recorded
                </span>
                <p className="text-[11px] text-slate-500">
                  No completed MHC sessions with recorded {trajectoryParam.replace('_', ' ').toLowerCase()} found for {parameterTrajectoryData.machine?.machineNumber || 'this unit'}.
                </p>
              </div>
            ) : parameterTrajectoryData.points.length === 1 ? (
              /* Compact 1-Measurement State */
              <div className="p-3.5 rounded bg-slate-50 dark:bg-[#1A1D23] border border-slate-200 dark:border-[#262B33] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      1 verified reading — trend requires at least 2 measurements.
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Baseline captured on <span className="font-mono text-slate-700 dark:text-slate-300">{parameterTrajectoryData.points[0].date}</span>: {' '}
                      <strong className="font-mono text-slate-900 dark:text-slate-100">
                        {parameterTrajectoryData.points[0].value} {parameterTrajectoryData.unit}
                      </strong>
                      {parameterTrajectoryData.baseline && (
                        <span className="text-slate-500"> (Rated baseline: {parameterTrajectoryData.baseline} {parameterTrajectoryData.unit})</span>
                      )}
                    </div>
                  </div>
                </div>

                {onNavigate && parameterTrajectoryData.points[0].sessionId && (
                  <button
                    onClick={() => onNavigate('mhc')}
                    className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline font-mono shrink-0"
                  >
                    View Source MHC Record →
                  </button>
                )}
              </div>
            ) : (
              /* 2+ Measurements: Prominent High-Precision Engineering Chart */
              <div className="space-y-4">
                {/* Precision Statistics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-50 dark:bg-[#1A1D23] border border-slate-100 dark:border-[#22262E]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">First Reading</span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {parameterTrajectoryData.points[0].value} {parameterTrajectoryData.unit}
                    </div>
                    <span className="text-[10px] text-slate-500">{parameterTrajectoryData.points[0].date}</span>
                  </div>

                  <div className="p-2 rounded bg-slate-50 dark:bg-[#1A1D23] border border-slate-100 dark:border-[#22262E]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Latest Reading</span>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {parameterTrajectoryData.points[parameterTrajectoryData.points.length - 1].value} {parameterTrajectoryData.unit}
                    </div>
                    <span className="text-[10px] text-slate-500">{parameterTrajectoryData.points[parameterTrajectoryData.points.length - 1].date}</span>
                  </div>

                  <div className="p-2 rounded bg-slate-50 dark:bg-[#1A1D23] border border-slate-100 dark:border-[#22262E]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Overall Delta (Δ)</span>
                    {(() => {
                      const first = parameterTrajectoryData.points[0].value;
                      const latest = parameterTrajectoryData.points[parameterTrajectoryData.points.length - 1].value;
                      const delta = Number((latest - first).toFixed(2));
                      const sign = delta > 0 ? `+${delta}` : `${delta}`;
                      const isDrift = delta < 0 && trajectoryParam === 'LASER_POWER';
                      return (
                        <div className={`text-sm font-semibold mt-0.5 ${isDrift ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {sign} {parameterTrajectoryData.unit}
                        </div>
                      );
                    })()}
                    <span className="text-[10px] text-slate-500">{parameterTrajectoryData.points.length} measurements</span>
                  </div>

                  <div className="p-2 rounded bg-slate-50 dark:bg-[#1A1D23] border border-slate-100 dark:border-[#22262E]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rated Baseline</span>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {parameterTrajectoryData.baseline ? `${parameterTrajectoryData.baseline} ${parameterTrajectoryData.unit}` : 'Standard Spec'}
                    </div>
                    <span className="text-[10px] text-slate-500">Nominal Target</span>
                  </div>
                </div>

                {/* SVG Polyline & Scatter Visualization */}
                <div className="h-52 w-full relative pt-2">
                  {(() => {
                    const pts = parameterTrajectoryData.points;
                    const values = pts.map(p => p.value);
                    if (parameterTrajectoryData.baseline) values.push(parameterTrajectoryData.baseline);
                    const minVal = Math.min(...values) * 0.92;
                    const maxVal = Math.max(...values) * 1.08;
                    const range = (maxVal - minVal) || 1;

                    const width = 640;
                    const height = 180;
                    const padX = 40;
                    const padY = 24;

                    const plotPoints = pts.map((p, idx) => {
                      const x = padX + (idx / (pts.length - 1)) * (width - 2 * padX);
                      const y = height - padY - ((p.value - minVal) / range) * (height - 2 * padY);
                      return { ...p, x, y };
                    });

                    const pathD = plotPoints.reduce((acc, p, idx) => 
                      idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
                    );

                    let baselineY: number | null = null;
                    if (parameterTrajectoryData.baseline) {
                      baselineY = height - padY - ((parameterTrajectoryData.baseline - minVal) / range) * (height - 2 * padY);
                    }

                    return (
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                        {/* Reference Grid lines */}
                        <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="currentColor" strokeDasharray="2 2" className="text-slate-200 dark:text-[#262B33]" />
                        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="currentColor" className="text-slate-300 dark:text-[#333A44]" />

                        {/* Baseline Nominal Reference Line */}
                        {baselineY !== null && (
                          <g>
                            <line
                              x1={padX}
                              y1={baselineY}
                              x2={width - padX}
                              y2={baselineY}
                              stroke="#64748B"
                              strokeDasharray="4 4"
                              strokeWidth="1.2"
                            />
                            <text x={width - padX + 6} y={baselineY + 3} fill="#64748B" fontSize="9" fontFamily="monospace">
                              Spec ({parameterTrajectoryData.baseline}{parameterTrajectoryData.unit})
                            </text>
                          </g>
                        )}

                        {/* Trajectory Polyline */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#334155"
                          strokeWidth="2.5"
                          className="dark:stroke-slate-300"
                        />

                        {/* Interactive Data Point Nodes */}
                        {plotPoints.map((p, idx) => (
                          <g
                            key={`node-${idx}`}
                            className="cursor-pointer group"
                            onClick={() => {
                              if (onNavigate) onNavigate('mhc');
                            }}
                            onMouseEnter={() => setActiveHoverPoint(p)}
                            onMouseLeave={() => setActiveHoverPoint(null)}
                          >
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="5"
                              fill="#0F172A"
                              className="dark:fill-slate-100 transition-transform group-hover:scale-125"
                            />
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="2"
                              fill="#FFFFFF"
                              className="dark:fill-slate-900"
                            />
                            {/* Value tooltip label */}
                            <text
                              x={p.x}
                              y={p.y - 9}
                              textAnchor="middle"
                              fontSize="9"
                              fontFamily="monospace"
                              className="fill-slate-800 dark:fill-slate-200 font-semibold"
                            >
                              {p.value} {p.unit}
                            </text>
                            {/* Date label */}
                            <text
                              x={p.x}
                              y={height - 6}
                              textAnchor="middle"
                              fontSize="8.5"
                              fontFamily="monospace"
                              className="fill-slate-400"
                            >
                              {p.date}
                            </text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>

                {/* Hover Drilldown Banner */}
                {activeHoverPoint && (
                  <div className="p-2 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs flex items-center justify-between font-mono">
                    <span>
                      {activeHoverPoint.date}: {activeHoverPoint.value} {activeHoverPoint.unit} ({activeHoverPoint.label || 'Reading'})
                    </span>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('mhc')}
                        className="underline text-[11px] hover:opacity-80"
                      >
                        Inspect Source MHC Session →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ============================================================= */}
          {/* LEVEL 2: SECONDARY ANALYSIS (Subsystems & Defect Frequency)   */}
          {/* 2-Column Responsive Layout                                    */}
          {/* ============================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* 1. SUBSYSTEM VERDICT DISTRIBUTION */}
            <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Subsystem Verdict Distribution
                  </h3>
                </div>
                <div className="flex items-center gap-2.5 text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Pass</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Warn</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Fail</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Aggregated pass, attention, and out-of-spec rates across completed physical inspection stages.
              </p>

              {/* Subsystem Bars */}
              <div className="space-y-2.5 pt-1">
                {(Object.keys(subsystemVerdicts) as Array<Exclude<SubsystemType, 'ALL'>>).map(subKey => {
                  const item = subsystemVerdicts[subKey];
                  const hasData = item.total > 0;
                  const passPct = hasData ? Math.round((item.pass / item.total) * 100) : 0;
                  const warnPct = hasData ? Math.round((item.warn / item.total) * 100) : 0;
                  const failPct = hasData ? Math.max(0, 100 - passPct - warnPct) : 0;
                  const isSelected = subsystemFilter === subKey;

                  return (
                    <div
                      key={subKey}
                      onClick={() => setSubsystemFilter(subsystemFilter === subKey ? 'ALL' : subKey)}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-slate-400 bg-slate-50 dark:border-slate-600 dark:bg-[#1C2026]'
                          : 'border-slate-100 dark:border-[#20252B] hover:border-slate-200 dark:hover:border-[#262B33]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {hasData ? `${item.total} tests (${passPct}% pass)` : '0 records'}
                        </span>
                      </div>

                      {/* Stacked Segment Bar */}
                      <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-[#20252B]">
                        {hasData ? (
                          <>
                            {passPct > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${passPct}%` }} />}
                            {warnPct > 0 && <div className="bg-amber-500 h-full" style={{ width: `${warnPct}%` }} />}
                            {failPct > 0 && <div className="bg-rose-500 h-full" style={{ width: `${failPct}%` }} />}
                          </>
                        ) : (
                          <div className="bg-slate-200 dark:bg-[#262B33] w-full h-full" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2. RECURRING FINDINGS & DEFECT FREQUENCY */}
            <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Recurring Findings & Defect Frequency
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {recurringFindingsData.length} finding categor{recurringFindingsData.length === 1 ? 'y' : 'ies'}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Frequency ranking across real inspection findings. Click finding to inspect occurrences.
              </p>

              {recurringFindingsData.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-[#1A1D23]/50 rounded border border-dashed border-slate-200 dark:border-[#262B33]">
                  0 recorded findings matching current filter parameters.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {recurringFindingsData.map((f, idx) => {
                    const isExpanded = expandedFindingComponent === f.component;
                    const maxOccurrences = recurringFindingsData[0]?.occurrenceCount || 1;
                    const barWidthPct = Math.max(12, Math.round((f.occurrenceCount / maxOccurrences) * 100));

                    return (
                      <div
                        key={`find-${idx}`}
                        className="p-2 rounded border border-slate-200 dark:border-[#262B33] bg-slate-50/40 dark:bg-[#1A1D23] space-y-1.5 transition-all"
                      >
                        <div
                          onClick={() => setExpandedFindingComponent(isExpanded ? null : f.component)}
                          className="flex items-center justify-between cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {f.isRecurring ? (
                              <span className="text-[9.5px] font-mono font-semibold px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                RECURRING
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-mono font-medium px-1 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-[#262B33] dark:text-slate-300">
                                ISOLATED
                              </span>
                            )}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {f.component}
                            </span>
                            <span className="text-[10.5px] text-slate-400">
                              ({f.affectedMachines.size} unit{f.affectedMachines.size === 1 ? '' : 's'})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            <span>{f.occurrenceCount}x</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {/* Frequency Bar */}
                        <div className="w-full h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-[#262B33]">
                          <div
                            className={`h-full rounded-full ${f.isRecurring ? 'bg-amber-500' : 'bg-slate-500'}`}
                            style={{ width: `${barWidthPct}%` }}
                          />
                        </div>

                        {/* Expanded Drill-Down Details */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-200 dark:border-[#262B33] space-y-1.5 text-[11px]">
                            <div className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">Recorded Inspection Occurrences:</div>
                            <div className="space-y-1">
                              {f.instances.map((inst, iIdx) => (
                                <div
                                  key={`inst-${iIdx}`}
                                  className="p-1.5 rounded bg-white dark:bg-[#121418] border border-slate-100 dark:border-[#20252B] flex items-center justify-between"
                                >
                                  <div>
                                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                      {inst.machineLabel}
                                    </span>
                                    <span className="text-slate-400 ml-1.5">· {inst.date}</span>
                                    {inst.conditions.length > 0 && (
                                      <div className="text-[10px] text-slate-500">
                                        Condition: {inst.conditions.join(', ')}
                                      </div>
                                    )}
                                    {inst.actionRecommendation && (
                                      <div className="text-[10px] text-amber-700 dark:text-amber-400">
                                        Action: {inst.actionRecommendation}
                                      </div>
                                    )}
                                  </div>

                                  {onNavigate && (
                                    <button
                                      onClick={() => onNavigate('mhc')}
                                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                                      title="Open MHC Record"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ============================================================= */}
          {/* LEVEL 3: SUPPORTING ANALYSIS (Volume, Sites, Contracts)       */}
          {/* Visually quieter, lower hierarchy                             */}
          {/* ============================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            
            {/* 1. MHC Activity & Volume Time-Series */}
            <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Service Activity
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {activityTimeSeries.totalCompleted} sessions
                </span>
              </div>

              {activityTimeSeries.months.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-slate-400">
                  No completed sessions in filter range.
                </div>
              ) : activityTimeSeries.months.length < 3 ? (
                /* Compact Summary when 1 or 2 periods exist */
                <div className="space-y-1.5 pt-1 text-xs">
                  {activityTimeSeries.months.map(m => (
                    <div key={m.month} className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-[#1A1D23]">
                      <span className="font-mono text-slate-600 dark:text-slate-400">{m.month}</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {m.sessionCount} session{m.sessionCount === 1 ? '' : 's'} ({m.machineIds.size} unit{m.machineIds.size === 1 ? '' : 's'})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Mini Bar Sparkline when 3+ periods exist */
                <div className="space-y-1.5 pt-1">
                  <div className="h-16 flex items-end gap-1 border-b border-slate-200 dark:border-[#262B33] pb-1">
                    {activityTimeSeries.months.map(m => {
                      const heightPct = Math.max(15, Math.round((m.sessionCount / activityTimeSeries.maxMonthlySessions) * 100));
                      return (
                        <div
                          key={m.month}
                          className="flex-1 flex flex-col items-center gap-0.5 group relative"
                          title={`${m.month}: ${m.sessionCount} sessions`}
                        >
                          <div
                            className="w-full bg-slate-600 dark:bg-slate-400 rounded-t"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>{activityTimeSeries.months[0]?.month}</span>
                    <span>{activityTimeSeries.months[activityTimeSeries.months.length - 1]?.month}</span>
                  </div>
                </div>
              )}
            </section>

            {/* 2. Customer & Site Service Distribution */}
            <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Customer Distribution
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {siteActivityData.length} accounts
                </span>
              </div>

              {siteActivityData.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-slate-400">
                  No client activity recorded.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-24 overflow-y-auto text-xs">
                  {siteActivityData.map((c, idx) => (
                    <div
                      key={`site-${idx}`}
                      className="p-1.5 rounded bg-slate-50/60 dark:bg-[#1A1D23] flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate mr-2">{c.name}</span>
                      <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                        {c.sessionCount}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 3. Contract Fleet Protection Coverage */}
            <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#20252B] pb-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Contract Coverage
                  </h4>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('contracts')}
                    className="text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline"
                  >
                    Contracts →
                  </button>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fleet Coverage:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {contractCoverage.coveragePercent}% ({contractCoverage.covered.length}/{totalRegisteredMachines})
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-[#262B33]">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${contractCoverage.coveragePercent}%` }}
                  />
                </div>

                {contractCoverage.uncovered.length > 0 ? (
                  <div className="text-[10px] text-slate-500">
                    {contractCoverage.uncovered.length} unprotected machine{contractCoverage.uncovered.length === 1 ? '' : 's'}.
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>100% active contract protection.</span>
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>
      )}
    </div>
  );
};
