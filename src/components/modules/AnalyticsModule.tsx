import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Calendar, 
  Building2, 
  Layers, 
  ChevronRight, 
  ExternalLink,
  SlidersHorizontal,
  Search,
  Check,
  AlertTriangle,
  FileText,
  BarChart2,
  Cpu
} from 'lucide-react';
import { Machine, MHCSession, Contract, Customer, NavigationTab } from '../../types';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';

export interface AnalyticsProps {
  machines: Machine[];
  mhcSessions?: MHCSession[];
  contracts?: Contract[];
  customers?: Customer[];
  onNavigate?: (tab: NavigationTab) => void;
  onSelectMachine?: (machineId: string) => void;
}

export type AnalysisMode = 'LASER_POWER' | 'SUBSYSTEMS' | 'FINDINGS' | 'ACTIVITY' | 'COMPARISON';
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
    machineId?: string;
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
  unit: string;
  sessionId?: string;
  machineId: string;
  label?: string;
}

interface MachineComparisonItem {
  machineId: string;
  label: string;
  model: string;
  sessionCount: number;
  latestLaserPower?: number;
  laserUnit?: string;
  evaluatedSubsystems: number;
  passCount: number;
  failCount: number;
  passRatePercent?: number;
}

export const AnalyticsModule: React.FC<AnalyticsProps> = ({
  machines = [],
  mhcSessions = [],
  contracts = [],
  customers = [],
  onNavigate,
  onSelectMachine
}) => {
  // -------------------------------------------------------------
  // WORKSPACE STATE
  // -------------------------------------------------------------
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisMode>('LASER_POWER');

  // Context & Scope Filters
  const [dateRange, setDateRange] = useState<DateRangeFilter>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [subsystemFilter, setSubsystemFilter] = useState<SubsystemType>('ALL');

  // Laser Power / Parameter Trajectory Scope
  const [trajectoryMachineId, setTrajectoryMachineId] = useState<string>(
    machines.length > 0 ? machines[0].id : ''
  );
  const [trajectoryParam, setTrajectoryParam] = useState<ParameterMetric>('LASER_POWER');

  // Drill-down & Hover States
  const [expandedFindingComponent, setExpandedFindingComponent] = useState<string | null>(null);
  const [activeHoverPoint, setActiveHoverPoint] = useState<ParameterDataPoint | null>(null);
  const [selectedSubsystemDrill, setSelectedSubsystemDrill] = useState<SubsystemType | null>(null);

  // -------------------------------------------------------------
  // 1. FILTERED SESSIONS (Strict Truthful FSOS Data)
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
  // 2. LASER POWER / PARAMETER MEASUREMENTS (NO BASELINE)
  // -------------------------------------------------------------
  const parameterTrajectoryData = useMemo(() => {
    if (!trajectoryMachineId) return { points: [], unit: '', machine: null };

    const targetMachine = machines.find(m => m.id === trajectoryMachineId);
    if (!targetMachine) return { points: [], unit: '', machine: null };

    // Find completed sessions for this machine
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

    if (trajectoryParam === 'LASER_POWER') {
      unit = 'W';

      machineSessions.forEach(s => {
        const dStr = (s.completedDate || s.startDate || s.lastUpdated || '').split('T')[0];
        if (!dStr) return;

        if (s.stage03_laserPower && Array.isArray(s.stage03_laserPower)) {
          // Take Laser Head 1 or primary head
          const head1 = s.stage03_laserPower.find(h => h.laserIdentifier === 'lh1') || s.stage03_laserPower[0];
          if (head1) {
            const val = (typeof head1.afterValueWatts === 'number' && head1.afterValueWatts > 0)
              ? head1.afterValueWatts
              : ((typeof head1.beforeValueWatts === 'number' && head1.beforeValueWatts > 0) ? head1.beforeValueWatts : 0);
            if (val > 0) {
              points.push({
                date: dStr,
                displayDate: dStr,
                value: val,
                unit: 'W',
                sessionId: s.id,
                machineId: targetMachine.id,
                label: head1.laserName || head1.laserIdentifier || 'Laser Head 1'
              });
            }
          }
        }
      });

      // Fallback to machine.laserPowerRecords if stage03 is empty
      if (points.length === 0 && targetMachine.laserPowerRecords && targetMachine.laserPowerRecords.length > 0) {
        const records = [...targetMachine.laserPowerRecords].sort((a, b) => 
          new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
        );
        records.forEach(r => {
          const dStr = (r.timestamp || '').split('T')[0];
          const rd = (r.readings || [])[0];
          if (rd && rd.actualPowerWatts > 0) {
            points.push({
              date: dStr,
              displayDate: dStr,
              value: rd.actualPowerWatts,
              unit: 'W',
              machineId: targetMachine.id,
              label: rd.headName || 'Laser Head'
            });
          }
        });
      }
    } else if (trajectoryParam === 'STAGE_CALIBRATION') {
      unit = 'µm';
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
      machineSessions.forEach(s => {
        const dStr = (s.completedDate || s.startDate || s.lastUpdated || '').split('T')[0];
        if (!dStr) return;

        if (s.agcData && typeof s.agcData.overallMaxDevUm === 'number') {
          points.push({
            date: dStr,
            displayDate: dStr,
            value: Number(s.agcData.overallMaxDevUm.toFixed(2)),
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
      unit,
      machine: targetMachine
    };
  }, [trajectoryMachineId, trajectoryParam, machines, mhcSessions]);

  // -------------------------------------------------------------
  // 2b. AUTHORITATIVE MACHINE SPECIFICATION (MHC / CALIBRATION SPECS)
  // -------------------------------------------------------------
  const machineSpec = useMemo(() => {
    const machine = parameterTrajectoryData.machine;
    if (!machine) {
      return {
        hasSpec: false,
        hasTolerance: false,
        targetValue: null as number | null,
        tolerancePercent: null as number | null,
        toleranceValue: null as number | null,
        minSpec: null as number | null,
        maxSpec: null as number | null,
        specLabel: 'No Target Spec',
        acceptableLabel: '',
        source: 'Machine Passport (MHC / Calibration Specs)'
      };
    }

    if (trajectoryParam === 'LASER_POWER') {
      const lp = machine.mhcSpecs?.laserPower;
      const targetWatts = (typeof lp?.targetPowerWatts === 'number' && lp.targetPowerWatts > 0) ? lp.targetPowerWatts : null;
      const tolerancePercent = (typeof lp?.powerTolerancePercent === 'number' && lp.powerTolerancePercent >= 0) ? lp.powerTolerancePercent : null;

      if (targetWatts !== null) {
        if (tolerancePercent !== null) {
          const delta = targetWatts * (tolerancePercent / 100);
          const minSpec = Number((targetWatts - delta).toFixed(2));
          const maxSpec = Number((targetWatts + delta).toFixed(2));
          return {
            hasSpec: true,
            hasTolerance: true,
            targetValue: targetWatts,
            tolerancePercent: tolerancePercent,
            toleranceValue: delta,
            minSpec: minSpec,
            maxSpec: maxSpec,
            specLabel: `Target: ${targetWatts} W ±${tolerancePercent}%`,
            acceptableLabel: `Acceptable: ${minSpec}–${maxSpec} W`,
            source: 'Machine Passport (MHC / Calibration Specs)'
          };
        } else {
          return {
            hasSpec: true,
            hasTolerance: false,
            targetValue: targetWatts,
            tolerancePercent: null,
            toleranceValue: null,
            minSpec: null,
            maxSpec: null,
            specLabel: `Target: ${targetWatts} W`,
            acceptableLabel: 'No Tolerance Configured',
            source: 'Machine Passport (MHC / Calibration Specs)'
          };
        }
      }

      return {
        hasSpec: false,
        hasTolerance: false,
        targetValue: null,
        tolerancePercent: null,
        toleranceValue: null,
        minSpec: null,
        maxSpec: null,
        specLabel: 'No Target Spec',
        acceptableLabel: '',
        source: 'Machine Passport (MHC / Calibration Specs)'
      };
    }

    if (trajectoryParam === 'STAGE_CALIBRATION') {
      const sc = machine.mhcSpecs?.stageCalibration;
      const tol = (typeof sc?.toleranceUm === 'number' && sc.toleranceUm > 0) ? sc.toleranceUm : null;
      if (tol !== null) {
        return {
          hasSpec: true,
          hasTolerance: true,
          targetValue: 0,
          tolerancePercent: null,
          toleranceValue: tol,
          minSpec: 0,
          maxSpec: tol,
          specLabel: `Tolerance: ±${tol} µm`,
          acceptableLabel: `Acceptable: 0.0–${tol} µm`,
          source: 'Machine Passport (MHC / Calibration Specs)'
        };
      }
      return {
        hasSpec: false,
        hasTolerance: false,
        targetValue: null,
        tolerancePercent: null,
        toleranceValue: null,
        minSpec: null,
        maxSpec: null,
        specLabel: 'No Target Spec',
        acceptableLabel: '',
        source: 'Machine Passport (MHC / Calibration Specs)'
      };
    }

    if (trajectoryParam === 'AGC_ERROR') {
      const agc = machine.mhcSpecs?.agcCalibration;
      const tol = (typeof agc?.toleranceUm === 'number' && agc.toleranceUm > 0) ? agc.toleranceUm : null;
      if (tol !== null) {
        return {
          hasSpec: true,
          hasTolerance: true,
          targetValue: 0,
          tolerancePercent: null,
          toleranceValue: tol,
          minSpec: 0,
          maxSpec: tol,
          specLabel: `Tolerance: ±${tol} µm`,
          acceptableLabel: `Acceptable: 0.0–${tol} µm`,
          source: 'Machine Passport (MHC / Calibration Specs)'
        };
      }
      return {
        hasSpec: false,
        hasTolerance: false,
        targetValue: null,
        tolerancePercent: null,
        toleranceValue: null,
        minSpec: null,
        maxSpec: null,
        specLabel: 'No Target Spec',
        acceptableLabel: '',
        source: 'Machine Passport (MHC / Calibration Specs)'
      };
    }

    return {
      hasSpec: false,
      hasTolerance: false,
      targetValue: null,
      tolerancePercent: null,
      toleranceValue: null,
      minSpec: null,
      maxSpec: null,
      specLabel: 'No Target Spec',
      acceptableLabel: '',
      source: 'Machine Passport (MHC / Calibration Specs)'
    };
  }, [parameterTrajectoryData.machine, trajectoryParam]);

  const getPointVerdict = (val: number) => {
    if (!machineSpec.hasSpec) {
      return {
        status: 'NO_SPEC' as const,
        badgeText: 'No Target Spec',
        fullText: 'No machine specification configured',
        colorClass: 'text-slate-400 dark:text-slate-500',
        bgClass: 'bg-slate-100 dark:bg-[#1E232B] text-slate-600 dark:text-slate-400'
      };
    }

    if (!machineSpec.hasTolerance || machineSpec.minSpec === null || machineSpec.maxSpec === null) {
      return {
        status: 'UNRATED' as const,
        badgeText: machineSpec.specLabel,
        fullText: machineSpec.specLabel,
        colorClass: 'text-slate-600 dark:text-slate-400',
        bgClass: 'bg-slate-100 dark:bg-[#1E232B] text-slate-700 dark:text-slate-300'
      };
    }

    if (val < machineSpec.minSpec) {
      return {
        status: 'BELOW_SPEC' as const,
        badgeText: 'Below Spec',
        fullText: `Below Spec (${machineSpec.minSpec}–${machineSpec.maxSpec} ${parameterTrajectoryData.unit})`,
        colorClass: 'text-rose-600 dark:text-rose-400',
        bgClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
      };
    }

    if (val > machineSpec.maxSpec) {
      return {
        status: 'ABOVE_SPEC' as const,
        badgeText: 'Above Spec',
        fullText: `Above Spec (${machineSpec.minSpec}–${machineSpec.maxSpec} ${parameterTrajectoryData.unit})`,
        colorClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
      };
    }

    return {
      status: 'IN_SPEC' as const,
      badgeText: 'Within Spec',
      fullText: `Within Spec (${machineSpec.minSpec}–${machineSpec.maxSpec} ${parameterTrajectoryData.unit})`,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
    };
  };

  // -------------------------------------------------------------
  // 3. SUBSYSTEM RESULTS AGGREGATION
  // -------------------------------------------------------------
  interface SubsystemNonPassItem {
    sessionId: string;
    machineLabel: string;
    date: string;
    verdict: 'WARN' | 'FAIL';
    detail: string;
  }

  interface SubsystemData {
    id: SubsystemType;
    name: string;
    pass: number;
    warn: number;
    fail: number;
    total: number;
    nonPassItems: SubsystemNonPassItem[];
  }

  const subsystemVerdicts = useMemo(() => {
    const data: Record<Exclude<SubsystemType, 'ALL'>, SubsystemData> = {
      LASER: { id: 'LASER', name: 'Laser Output (Stage 03)', pass: 0, warn: 0, fail: 0, total: 0, nonPassItems: [] },
      OPTICS: { id: 'OPTICS', name: 'Optics & Delivery (Stage 04)', pass: 0, warn: 0, fail: 0, total: 0, nonPassItems: [] },
      COOLING: { id: 'COOLING', name: 'Chiller & Cooling (Stage 05)', pass: 0, warn: 0, fail: 0, total: 0, nonPassItems: [] },
      PRODUCT_QA: { id: 'PRODUCT_QA', name: 'Product Quality (Stage 06)', pass: 0, warn: 0, fail: 0, total: 0, nonPassItems: [] },
      STAGE: { id: 'STAGE', name: 'Motion Stage (Calibration)', pass: 0, warn: 0, fail: 0, total: 0, nonPassItems: [] },
      AGC: { id: 'AGC', name: 'AGC Positioning', pass: 0, warn: 0, fail: 0, total: 0, nonPassItems: [] }
    };

    const machineMap = new Map<string, string>();
    machines.forEach(m => {
      machineMap.set(m.id, m.machineNumber || m.serialNumber || m.name);
    });

    filteredCompletedSessions.forEach(s => {
      const machineLabel = (s.machineId ? machineMap.get(s.machineId) : null) || s.machineNumber || 'Equipment';
      const date = s.completedDate || s.createdDate?.substring(0, 10) || 'Unknown';

      // 1. Laser Output (Stage 03)
      if (s.stage03_laserPower && Array.isArray(s.stage03_laserPower)) {
        s.stage03_laserPower.forEach(lp => {
          if (lp.afterValueWatts > 0 || lp.beforeValueWatts > 0 || lp.result) {
            data.LASER.total++;
            if (lp.result === 'PASS' || (!lp.result && lp.afterValueWatts > 0)) {
              data.LASER.pass++;
            } else if (lp.result === 'WARN' || lp.result === 'ATTENTION') {
              data.LASER.warn++;
              data.LASER.nonPassItems.push({
                sessionId: s.id,
                machineLabel,
                date,
                verdict: 'WARN',
                detail: `Power attention (${lp.afterValueWatts || lp.beforeValueWatts}W)`
              });
            } else if (lp.result === 'FAIL' || lp.result === 'OUT_OF_SPEC') {
              data.LASER.fail++;
              data.LASER.nonPassItems.push({
                sessionId: s.id,
                machineLabel,
                date,
                verdict: 'FAIL',
                detail: `Power out of spec (${lp.afterValueWatts || lp.beforeValueWatts}W)`
              });
            } else {
              data.LASER.pass++;
            }
          }
        });
      }

      // 2. Optics & Delivery (Stage 04)
      if (s.stage04_opticalInspection && Array.isArray(s.stage04_opticalInspection)) {
        s.stage04_opticalInspection.forEach(opt => {
          data.OPTICS.total++;
          if (opt.status === 'OK' || opt.status === 'PASS' || opt.status === 'GOOD') {
            data.OPTICS.pass++;
          } else if (opt.status === 'ATTENTION' || opt.status === 'WARN') {
            data.OPTICS.warn++;
            data.OPTICS.nonPassItems.push({
              sessionId: s.id,
              machineLabel,
              date,
              verdict: 'WARN',
              detail: `${opt.component || 'Optics'}: ${opt.note || 'Attention required'}`
            });
          } else if (opt.status === 'NG' || opt.status === 'FAIL') {
            data.OPTICS.fail++;
            data.OPTICS.nonPassItems.push({
              sessionId: s.id,
              machineLabel,
              date,
              verdict: 'FAIL',
              detail: `${opt.component || 'Optics'}: ${opt.note || 'Defect/NG detected'}`
            });
          } else {
            data.OPTICS.pass++;
          }
        });
      }

      // 3. Chiller & Cooling (Stage 05)
      if (s.stage05_chillerCooling && Array.isArray(s.stage05_chillerCooling)) {
        s.stage05_chillerCooling.forEach(c => {
          data.COOLING.total++;
          if (c.status === 'OK' || c.status === 'PASS' || c.status === 'GOOD') {
            data.COOLING.pass++;
          } else if (c.status === 'ATTENTION' || c.status === 'WARN') {
            data.COOLING.warn++;
            data.COOLING.nonPassItems.push({
              sessionId: s.id,
              machineLabel,
              date,
              verdict: 'WARN',
              detail: `${c.item || 'Chiller'}: ${c.notes || 'Parameter attention'}`
            });
          } else if (c.status === 'NG' || c.status === 'FAIL') {
            data.COOLING.fail++;
            data.COOLING.nonPassItems.push({
              sessionId: s.id,
              machineLabel,
              date,
              verdict: 'FAIL',
              detail: `${c.item || 'Chiller'}: ${c.notes || 'Cooling failure/NG'}`
            });
          } else {
            data.COOLING.pass++;
          }
        });
      }

      // 4. Product Quality (Stage 06)
      if (s.stage06_productQuality && Array.isArray(s.stage06_productQuality)) {
        s.stage06_productQuality.forEach(pq => {
          data.PRODUCT_QA.total++;
          if (pq.status === 'OK' || pq.status === 'PASS') {
            data.PRODUCT_QA.pass++;
          } else if (pq.status === 'ATTENTION' || pq.status === 'WARN') {
            data.PRODUCT_QA.warn++;
            data.PRODUCT_QA.nonPassItems.push({
              sessionId: s.id,
              machineLabel,
              date,
              verdict: 'WARN',
              detail: `${pq.process || 'Process'}: QA warning`
            });
          } else if (pq.status === 'NG' || pq.status === 'FAIL') {
            data.PRODUCT_QA.fail++;
            data.PRODUCT_QA.nonPassItems.push({
              sessionId: s.id,
              machineLabel,
              date,
              verdict: 'FAIL',
              detail: `${pq.process || 'Process'}: QA rejection`
            });
          } else {
            data.PRODUCT_QA.pass++;
          }
        });
      }

      // 5. Motion Stage
      if (s.stageCalibrationData) {
        data.STAGE.total++;
        const sc = s.stageCalibrationData;
        const isFail = sc.verdict === 'OUT_OF_SPEC' || sc.systemVerdict === 'OUT_OF_SPEC';
        const isWarn = sc.engineerDisposition === 'ACCEPTED_DEVIATION' || sc.engineerDisposition === 'CONDITIONAL_PASS';
        if (isFail) {
          data.STAGE.fail++;
          data.STAGE.nonPassItems.push({
            sessionId: s.id,
            machineLabel,
            date,
            verdict: 'FAIL',
            detail: `Stage calibration out of spec (${sc.systemVerdict || 'NG'})`
          });
        } else if (isWarn) {
          data.STAGE.warn++;
          data.STAGE.nonPassItems.push({
            sessionId: s.id,
            machineLabel,
            date,
            verdict: 'WARN',
            detail: `Stage conditional deviation (${sc.engineerDisposition})`
          });
        } else {
          data.STAGE.pass++;
        }
      }

      // 6. AGC Positioning
      if (s.agcData) {
        data.AGC.total++;
        const agc = s.agcData;
        const outOfSpecIndices = (agc.indices || []).filter(idx => idx.verdict === 'OUT_OF_SPEC');
        if (outOfSpecIndices.length > 0) {
          data.AGC.fail++;
          data.AGC.nonPassItems.push({
            sessionId: s.id,
            machineLabel,
            date,
            verdict: 'FAIL',
            detail: `AGC out of spec on index (${outOfSpecIndices.map(i => i.indexName).join(', ')})`
          });
        } else {
          data.AGC.pass++;
        }
      }
    });

    return data;
  }, [filteredCompletedSessions, machines]);

  // -------------------------------------------------------------
  // 4. FINDINGS ANALYSIS (Defect Frequency Ranking)
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

          let compSubsystem = 'OPTICS';
          const lower = f.component.toLowerCase();
          if (lower.includes('laser') || lower.includes('beam') || lower.includes('diode')) compSubsystem = 'LASER';
          else if (lower.includes('chiller') || lower.includes('cool') || lower.includes('water') || lower.includes('flow')) compSubsystem = 'COOLING';
          else if (lower.includes('stage') || lower.includes('axis') || lower.includes('chuck')) compSubsystem = 'STAGE';
          else if (lower.includes('agc') || lower.includes('sensor') || lower.includes('focus')) compSubsystem = 'AGC';
          else if (lower.includes('cut') || lower.includes('quality') || lower.includes('taper') || lower.includes('burr')) compSubsystem = 'PRODUCT_QA';

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
          if (s.machineId) group.affectedMachines.add(s.machineId);
          else if (s.machineSerialNumber) group.affectedMachines.add(s.machineSerialNumber);

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

      // 2. Stage 04 Optical non-pass
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
            if (s.machineId) group.affectedMachines.add(s.machineId);
            else if (s.machineSerialNumber) group.affectedMachines.add(s.machineSerialNumber);

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
  // 5. MHC ACTIVITY OVER TIME
  // -------------------------------------------------------------
  const activityTimeSeries = useMemo(() => {
    const monthMap = new Map<string, { month: string; sessionCount: number; machineIds: Set<string>; findingsCount: number; sessionIds: string[] }>();

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
          findingsCount: 0,
          sessionIds: []
        });
      }

      const item = monthMap.get(yearMonth)!;
      item.sessionCount++;
      item.sessionIds.push(s.id);
      if (s.machineId) item.machineIds.add(s.machineId);
      else if (s.machineSerialNumber) item.machineIds.add(s.machineSerialNumber);

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
  // 6. MACHINE COMPARISON DATA (Strict Real Data Gating)
  // -------------------------------------------------------------
  const machineComparisonList = useMemo((): MachineComparisonItem[] => {
    const list: MachineComparisonItem[] = [];

    machines.forEach(m => {
      const mSessions = mhcSessions.filter(
        s => (s.machineId === m.id || s.machineSerialNumber === m.serialNumber) && s.completionStatus === 'COMPLETED'
      );

      let latestPower: number | undefined;
      const sortedSessions = [...mSessions].sort((a, b) => {
        const tA = new Date(a.completedDate || a.startDate || a.lastUpdated || 0).getTime();
        const tB = new Date(b.completedDate || b.startDate || b.lastUpdated || 0).getTime();
        return tB - tA;
      });

      for (const s of sortedSessions) {
        if (s.stage03_laserPower && Array.isArray(s.stage03_laserPower)) {
          const h1 = s.stage03_laserPower[0];
          if (h1 && (h1.afterValueWatts > 0 || h1.beforeValueWatts > 0)) {
            latestPower = h1.afterValueWatts > 0 ? h1.afterValueWatts : h1.beforeValueWatts;
            break;
          }
        }
      }

      if (latestPower === undefined && m.laserPowerRecords && m.laserPowerRecords.length > 0) {
        const lastRec = m.laserPowerRecords[m.laserPowerRecords.length - 1];
        if (lastRec && lastRec.readings?.[0]?.actualPowerWatts) {
          latestPower = lastRec.readings[0].actualPowerWatts;
        }
      }

      let evaluatedSubsystems = 0;
      let passCount = 0;
      let failCount = 0;

      mSessions.forEach(s => {
        if (s.stage03_laserPower?.length) {
          evaluatedSubsystems++;
          const h1 = s.stage03_laserPower[0];
          if (h1.result === 'FAIL' || h1.result === 'OUT_OF_SPEC') failCount++;
          else passCount++;
        }
        if (s.stage04_opticalInspection?.length) {
          evaluatedSubsystems++;
          const ng = s.stage04_opticalInspection.some(i => i.status === 'NG' || i.status === 'FAIL');
          if (ng) failCount++;
          else passCount++;
        }
        if (s.stage05_chillerCooling?.length) {
          evaluatedSubsystems++;
          const ng = s.stage05_chillerCooling.some(i => i.status === 'NG' || i.status === 'FAIL');
          if (ng) failCount++;
          else passCount++;
        }
        if (s.stageCalibrationData) {
          evaluatedSubsystems++;
          const ng = s.stageCalibrationData.verdict === 'OUT_OF_SPEC' || s.stageCalibrationData.systemVerdict === 'OUT_OF_SPEC';
          if (ng) failCount++;
          else passCount++;
        }
      });

      const passRatePercent = evaluatedSubsystems > 0 ? Math.round((passCount / evaluatedSubsystems) * 100) : undefined;

      if (mSessions.length > 0 || latestPower !== undefined) {
        list.push({
          machineId: m.id,
          label: m.machineNumber || m.serialNumber || m.name,
          model: m.model,
          sessionCount: mSessions.length,
          latestLaserPower: latestPower,
          laserUnit: 'W',
          evaluatedSubsystems,
          passCount,
          failCount,
          passRatePercent
        });
      }
    });

    list.sort((a, b) => b.sessionCount - a.sessionCount);
    return list;
  }, [machines, mhcSessions]);

  const totalRegisteredMachines = machines.length;

  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* 1. ANALYSIS SELECTOR & WORKSPACE HEADER                        */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-[#262B33]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              Engineering Analytics Workspace
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select an engineering analysis to investigate longitudinal measurements, subsystem health, and verified service findings.
            </p>
          </div>

          {onNavigate && (
            <div className="flex items-center gap-2 shrink-0">
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

        {/* Primary Analysis Segmented Selector (ONE ANALYSIS ACTIVE AT A TIME) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1A1D23] p-1 rounded-md border border-slate-200 dark:border-[#262B33] overflow-x-auto">
          {[
            { id: 'LASER_POWER', label: 'Laser Power', icon: Zap },
            { id: 'SUBSYSTEMS', label: 'Subsystem Results', icon: Layers },
            { id: 'FINDINGS', label: 'Findings', icon: Search },
            { id: 'ACTIVITY', label: 'MHC Activity', icon: BarChart2 },
            { id: 'COMPARISON', label: 'Machine Comparison', icon: Cpu }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeAnalysis === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveAnalysis(tab.id as AnalysisMode);
                  setSelectedSubsystemDrill(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-[#121418] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/60 dark:border-[#2C323B]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Context & Scope Bar: ONLY filters relevant to the active analysis! */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          {/* Machine selector (Relevant for Laser Power) */}
          {activeAnalysis === 'LASER_POWER' && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1A1D23] px-2.5 py-1 rounded border border-slate-200 dark:border-[#262B33]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                MACHINE
              </span>
              <select
                value={trajectoryMachineId}
                onChange={e => setTrajectoryMachineId(e.target.value)}
                aria-label="Select Machine"
                className="bg-transparent text-slate-900 dark:text-slate-100 font-mono text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {machines.map(m => {
                  const machineNum = m.machineNumber || m.machineNo || m.serialNumber || m.name || m.id;
                  const modelStr = m.model ? ` · ${m.model}` : '';
                  return (
                    <option key={m.id} value={m.id} className="bg-white dark:bg-[#1A1D23] text-slate-900 dark:text-slate-100 font-sans">
                      {machineNum}{modelStr}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Metric selector (Relevant for Laser Power) */}
          {activeAnalysis === 'LASER_POWER' && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1A1D23] px-2.5 py-1 rounded border border-slate-200 dark:border-[#262B33]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                PARAMETER
              </span>
              <select
                value={trajectoryParam}
                onChange={e => setTrajectoryParam(e.target.value as ParameterMetric)}
                aria-label="Select Parameter"
                className="bg-transparent text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="LASER_POWER" className="bg-white dark:bg-[#1A1D23] text-slate-900 dark:text-slate-100">Laser Power · W</option>
                <option value="STAGE_CALIBRATION" className="bg-white dark:bg-[#1A1D23] text-slate-900 dark:text-slate-100">Stage Accuracy · µm</option>
                <option value="AGC_ERROR" className="bg-white dark:bg-[#1A1D23] text-slate-900 dark:text-slate-100">AGC Telemetry · µm</option>
              </select>
            </div>
          )}

          {/* Subsystem filter (Relevant for Subsystems & Findings) */}
          {(activeAnalysis === 'SUBSYSTEMS' || activeAnalysis === 'FINDINGS') && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1A1D23] px-2 py-1 rounded border border-slate-200 dark:border-[#262B33]">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={subsystemFilter}
                onChange={e => setSubsystemFilter(e.target.value as SubsystemType)}
                aria-label="Subsystem Filter"
                className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
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
          )}

          {/* Customer filter (Relevant for Subsystems, Findings, Activity) */}
          {(activeAnalysis === 'SUBSYSTEMS' || activeAnalysis === 'FINDINGS' || activeAnalysis === 'ACTIVITY') && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1A1D23] px-2 py-1 rounded border border-slate-200 dark:border-[#262B33]">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                aria-label="Customer Scope"
                className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-white dark:bg-[#1A1D23]">All Customers</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#1A1D23]">{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date range filter (Relevant for all analyses) */}
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
        </div>
      </div>

      {totalRegisteredMachines === 0 ? (
        /* Zero Fleet State */
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
        /* MAIN WORKSPACE CONTENT: ONE ANALYSIS ACTIVE AT A TIME */
        <main className="space-y-4">

          {/* ========================================================================= */}
          {/* VIEW 1: LASER POWER ANALYSIS                                              */}
          {/* ========================================================================= */}
          {activeAnalysis === 'LASER_POWER' && (
            <div className="space-y-4">
              <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#20252B]">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      {trajectoryParam === 'LASER_POWER' ? 'Laser Power Longitudinal Trend' : trajectoryParam === 'STAGE_CALIBRATION' ? 'Stage Accuracy Deviation Trend' : 'AGC Positioning Error Trend'}
                    </h2>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Physical verified telemetry for {parameterTrajectoryData.machine?.machineNumber || 'Selected Unit'} ({parameterTrajectoryData.machine?.model || 'Equipment'})
                    </span>
                  </div>

                  {/* Machine Passport Specification Reference Badge */}
                  <div className="flex items-center gap-2">
                    {machineSpec.hasSpec ? (
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#1E232B] px-3 py-1.5 rounded border border-slate-200 dark:border-[#2D333B] text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          SPEC
                        </span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {machineSpec.specLabel}
                        </span>
                        {machineSpec.acceptableLabel && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            · {machineSpec.acceptableLabel}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1E232B] px-2.5 py-1 rounded border border-slate-200 dark:border-[#2D333B] text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SPEC:</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">No Target Spec</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* State: 0 measurements */}
                {parameterTrajectoryData.points.length === 0 && (
                  <div className="py-10 px-4 rounded bg-slate-50/50 dark:bg-[#1A1D23]/50 border border-dashed border-slate-200 dark:border-[#262B33] text-center space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No Data
                    </span>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      No completed MHC sessions with recorded {trajectoryParam === 'LASER_POWER' ? 'laser power' : trajectoryParam === 'STAGE_CALIBRATION' ? 'stage calibration' : 'AGC error'} found for {parameterTrajectoryData.machine?.machineNumber || 'this unit'}.
                    </p>
                  </div>
                )}

                {/* State: 1 measurement */}
                {parameterTrajectoryData.points.length === 1 && (() => {
                  const pt = parameterTrajectoryData.points[0];
                  const verdict = getPointVerdict(pt.value);
                  return (
                    <div className="p-4 rounded bg-slate-50 dark:bg-[#1A1D23] border border-slate-200 dark:border-[#262B33] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                            {pt.value} {parameterTrajectoryData.unit}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${verdict.bgClass}`}>
                            {verdict.badgeText}
                          </span>
                          <span className="text-xs font-medium text-slate-500 font-mono">
                            1 verified measurement
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Recorded on <span className="font-mono text-slate-700 dark:text-slate-300">{pt.date}</span> ({pt.label || 'Reading'}).
                          {machineSpec.hasSpec && machineSpec.acceptableLabel && (
                            <span className="ml-1 text-slate-600 dark:text-slate-400">
                              · Machine spec target: <strong className="font-mono text-slate-800 dark:text-slate-200">{machineSpec.specLabel}</strong> ({machineSpec.acceptableLabel}).
                            </span>
                          )}
                        </p>
                      </div>

                      {onNavigate && pt.sessionId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate('mhc')}
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          View Source MHC Record
                        </Button>
                      )}
                    </div>
                  );
                })()}

                {/* State: 2+ measurements (Precision SVG Visual) */}
                {parameterTrajectoryData.points.length >= 2 && (() => {
                  const pts = parameterTrajectoryData.points;
                  const firstPt = pts[0];
                  const latestPt = pts[pts.length - 1];
                  const latestVerdict = getPointVerdict(latestPt.value);
                  const delta = Number((latestPt.value - firstPt.value).toFixed(2));
                  const sign = delta > 0 ? `+${delta}` : `${delta}`;
                  const isDrift = delta < 0 && trajectoryParam === 'LASER_POWER';

                  return (
                    <div className="space-y-4">
                      {/* Measurement Summary Strip */}
                      <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#20252B]">
                        <div className="flex items-baseline gap-3">
                          <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                            {firstPt.value} {parameterTrajectoryData.unit} → {latestPt.value} {parameterTrajectoryData.unit}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${latestVerdict.bgClass}`}>
                            Latest: {latestVerdict.badgeText}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {pts.length} verified measurements
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                          <span>First: <strong className="text-slate-700 dark:text-slate-300">{firstPt.value}{parameterTrajectoryData.unit}</strong> ({firstPt.date})</span>
                          <span>·</span>
                          <span>Latest: <strong className="text-slate-900 dark:text-slate-100">{latestPt.value}{parameterTrajectoryData.unit}</strong> ({latestPt.date})</span>
                          <span>·</span>
                          <span className={isDrift ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}>
                            Δ {sign} {parameterTrajectoryData.unit}
                          </span>
                        </div>
                      </div>

                      {/* Precision SVG Chart with Specification Tolerance Band */}
                      <div className="h-64 w-full relative pt-2">
                        {(() => {
                          const values = pts.map(p => p.value);
                          if (machineSpec.hasSpec && machineSpec.targetValue !== null) {
                            values.push(machineSpec.targetValue);
                          }
                          if (machineSpec.minSpec !== null) values.push(machineSpec.minSpec);
                          if (machineSpec.maxSpec !== null) values.push(machineSpec.maxSpec);

                          const rawMin = Math.min(...values);
                          const rawMax = Math.max(...values);
                          
                          const span = (rawMax - rawMin) || (rawMax * 0.1) || 1;
                          const minVal = Math.max(0, Number((rawMin - span * 0.2).toFixed(1)));
                          const maxVal = Number((rawMax + span * 0.2).toFixed(1));
                          const range = (maxVal - minVal) || 1;

                          const width = 740;
                          const height = 210;
                          const padX = 55;
                          const padY = 30;

                          const getY = (val: number) => {
                            return height - padY - ((val - minVal) / range) * (height - 2 * padY);
                          };

                          const plotPoints = pts.map((p, idx) => {
                            const x = padX + (idx / (pts.length - 1)) * (width - 2 * padX);
                            const y = getY(p.value);
                            const verdict = getPointVerdict(p.value);
                            return { ...p, x, y, verdict };
                          });

                          const pathD = plotPoints.reduce((acc, p, idx) => 
                            idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
                          );

                          return (
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                              {/* Specification Acceptable Tolerance Band (Shaded Zone) */}
                              {machineSpec.hasTolerance && machineSpec.minSpec !== null && machineSpec.maxSpec !== null && (
                                <g>
                                  <rect
                                    x={padX}
                                    y={getY(machineSpec.maxSpec)}
                                    width={width - 2 * padX}
                                    height={Math.max(2, getY(machineSpec.minSpec) - getY(machineSpec.maxSpec))}
                                    fill="currentColor"
                                    className="text-emerald-500/10 dark:text-emerald-400/10"
                                  />
                                  {/* Max spec dashed boundary */}
                                  <line
                                    x1={padX}
                                    y1={getY(machineSpec.maxSpec)}
                                    x2={width - padX}
                                    y2={getY(machineSpec.maxSpec)}
                                    stroke="currentColor"
                                    strokeDasharray="3 3"
                                    strokeWidth="1"
                                    className="text-emerald-600/40 dark:text-emerald-400/40"
                                  />
                                  <text
                                    x={width - padX + 4}
                                    y={getY(machineSpec.maxSpec) + 3}
                                    fontSize="8"
                                    fontFamily="monospace"
                                    className="fill-emerald-600/70 dark:fill-emerald-400/70"
                                  >
                                    +Spec {machineSpec.maxSpec}
                                  </text>

                                  {/* Min spec dashed boundary */}
                                  <line
                                    x1={padX}
                                    y1={getY(machineSpec.minSpec)}
                                    x2={width - padX}
                                    y2={getY(machineSpec.minSpec)}
                                    stroke="currentColor"
                                    strokeDasharray="3 3"
                                    strokeWidth="1"
                                    className="text-emerald-600/40 dark:text-emerald-400/40"
                                  />
                                  <text
                                    x={width - padX + 4}
                                    y={getY(machineSpec.minSpec) + 3}
                                    fontSize="8"
                                    fontFamily="monospace"
                                    className="fill-emerald-600/70 dark:fill-emerald-400/70"
                                  >
                                    -Spec {machineSpec.minSpec}
                                  </text>
                                </g>
                              )}

                              {/* Target Specification Line */}
                              {machineSpec.hasSpec && machineSpec.targetValue !== null && (
                                <g>
                                  <line
                                    x1={padX}
                                    y1={getY(machineSpec.targetValue)}
                                    x2={width - padX}
                                    y2={getY(machineSpec.targetValue)}
                                    stroke="currentColor"
                                    strokeDasharray="4 4"
                                    strokeWidth="1.25"
                                    className="text-emerald-600 dark:text-emerald-500"
                                  />
                                  <text
                                    x={padX - 8}
                                    y={getY(machineSpec.targetValue) + 3}
                                    textAnchor="end"
                                    fontSize="8.5"
                                    fontFamily="monospace"
                                    className="fill-emerald-600 dark:fill-emerald-400 font-semibold"
                                  >
                                    Target {machineSpec.targetValue}
                                  </text>
                                </g>
                              )}

                              {/* Base Grid lines */}
                              <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="currentColor" strokeDasharray="2 2" className="text-slate-200 dark:text-[#262B33]" />
                              <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="currentColor" className="text-slate-300 dark:text-[#333A44]" />

                              {/* Y-Axis Labels */}
                              <text x={padX - 8} y={padY + 4} textAnchor="end" fontSize="9" fontFamily="monospace" className="fill-slate-400">
                                {maxVal.toFixed(1)}
                              </text>
                              <text x={padX - 8} y={height - padY + 2} textAnchor="end" fontSize="9" fontFamily="monospace" className="fill-slate-400">
                                {minVal.toFixed(1)}
                              </text>

                              {/* Trajectory Polyline */}
                              <path
                                d={pathD}
                                fill="none"
                                stroke="#334155"
                                strokeWidth="2.5"
                                className="dark:stroke-slate-300"
                              />

                              {/* Nodes */}
                              {plotPoints.map((p, idx) => {
                                const isHovered = activeHoverPoint?.date === p.date && activeHoverPoint?.sessionId === p.sessionId;
                                const isPass = p.verdict.status === 'IN_SPEC';
                                const isFail = p.verdict.status === 'BELOW_SPEC' || p.verdict.status === 'ABOVE_SPEC';

                                return (
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
                                      r={isHovered ? 6.5 : 4.5}
                                      fill={isFail ? '#E11D48' : isPass ? '#059669' : '#0F172A'}
                                      className="transition-transform"
                                    />
                                    <circle
                                      cx={p.x}
                                      cy={p.y}
                                      r="2"
                                      fill="#FFFFFF"
                                      className="dark:fill-slate-900"
                                    />
                                    {!isHovered && (
                                      <text
                                        x={p.x}
                                        y={p.y - 8}
                                        textAnchor="middle"
                                        fontSize="9.5"
                                        fontFamily="monospace"
                                        className={`font-semibold ${
                                          isFail ? 'fill-rose-600 dark:fill-rose-400' : isPass ? 'fill-emerald-700 dark:fill-emerald-400' : 'fill-slate-800 dark:fill-slate-200'
                                        }`}
                                      >
                                        {p.value} {p.unit}
                                      </text>
                                    )}
                                    <text
                                      x={p.x}
                                      y={height - 10}
                                      textAnchor="middle"
                                      fontSize="9"
                                      fontFamily="monospace"
                                      className="fill-slate-500"
                                    >
                                      {p.date}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          );
                        })()}

                        {/* Tooltip */}
                        {activeHoverPoint && (() => {
                          const v = getPointVerdict(activeHoverPoint.value);
                          return (
                            <div className="absolute top-2 right-2 bg-slate-900 text-white text-xs p-2.5 rounded shadow-lg border border-slate-700 pointer-events-none z-10 space-y-0.5 font-mono">
                              <div className="text-[11px] text-slate-400">{activeHoverPoint.label || 'Laser Head'}</div>
                              <div className="text-sm font-bold text-white">{activeHoverPoint.value} {activeHoverPoint.unit}</div>
                              <div className="text-[11px] pt-0.5">
                                Status: <span className={v.status === 'IN_SPEC' ? 'text-emerald-400 font-semibold' : v.status === 'BELOW_SPEC' ? 'text-rose-400 font-semibold' : 'text-slate-300'}>{v.badgeText}</span>
                              </div>
                              <div className="text-[11px] text-slate-400">Date: {activeHoverPoint.date}</div>
                              {activeHoverPoint.sessionId && (
                                <div className="text-[10px] text-slate-300 pt-0.5">Click to inspect source MHC session</div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* Table of Verified Longitudinal Measurements */}
              {parameterTrajectoryData.points.length > 0 && (
                <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Measurement Log ({parameterTrajectoryData.points.length} records)
                    </h3>
                    {machineSpec.hasSpec && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Spec Reference: {machineSpec.specLabel}
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#262B33] text-slate-500 font-mono text-[11px]">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Component / Channel</th>
                          <th className="py-2 px-3">Measured Value</th>
                          <th className="py-2 px-3">Spec Verdict</th>
                          <th className="py-2 px-3">Source Record</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#20252B]">
                        {parameterTrajectoryData.points.map((pt, idx) => {
                          const verdict = getPointVerdict(pt.value);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#1A1D23]/50">
                              <td className="py-2 px-3 font-mono text-slate-800 dark:text-slate-200">{pt.date}</td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{pt.label || 'Primary Laser'}</td>
                              <td className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                                {pt.value} {pt.unit}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${verdict.bgClass}`}>
                                  {verdict.badgeText}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-500">
                                {pt.sessionId ? `MHC-${pt.sessionId.slice(-6).toUpperCase()}` : 'Machine Record'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {onNavigate && (
                                  <button
                                    onClick={() => onNavigate('mhc')}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline text-[11px]"
                                  >
                                    Open MHC Record
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: SUBSYSTEM ANALYSIS                                                */}
          {/* ========================================================================= */}
          {activeAnalysis === 'SUBSYSTEMS' && (
            <div className="space-y-4">
              <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20252B]">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      Subsystem Health & Verdict Distribution
                    </h2>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Evaluated verdicts across {filteredCompletedSessions.length} completed MHC inspection sessions
                    </span>
                  </div>
                </div>

                {/* Subsystem Grid List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(subsystemVerdicts) as Array<Exclude<SubsystemType, 'ALL'>>)
                    .filter(key => subsystemFilter === 'ALL' || subsystemFilter === key)
                    .map(key => {
                      const item = subsystemVerdicts[key];
                      const hasData = item.total > 0;
                      const passPercent = hasData ? Math.round((item.pass / item.total) * 100) : 0;
                      const isSelected = selectedSubsystemDrill === key;

                      return (
                        <div
                          key={key}
                          onClick={() => setSelectedSubsystemDrill(isSelected ? null : key)}
                          className={`p-3.5 rounded border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-slate-800 dark:border-slate-300 bg-slate-50/80 dark:bg-[#1A1D23]'
                              : 'border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] hover:border-slate-300 dark:hover:border-[#333A44]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {hasData ? `${item.total} inspections evaluated` : 'No inspections recorded'}
                              </span>
                            </div>
                            {hasData && (
                              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                                item.fail > 0 
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400' 
                                  : item.warn > 0 
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                              }`}>
                                {passPercent}% Pass
                              </span>
                            )}
                          </div>

                          {/* Verdict Breakdown Bar */}
                          {hasData && (
                            <div className="mt-3 space-y-1.5">
                              <div className="h-2 w-full lumen-bar-track rounded-full overflow-hidden flex">
                                <div style={{ width: `${(item.pass / item.total) * 100}%` }} className="h-full lumen-bar-fill-success" />
                                <div style={{ width: `${(item.warn / item.total) * 100}%` }} className="h-full lumen-bar-fill-warning" />
                                <div style={{ width: `${(item.fail / item.total) * 100}%` }} className="h-full lumen-bar-fill-danger" />
                              </div>

                              <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-500">
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{item.pass} Pass</span>
                                {item.warn > 0 && <span className="text-amber-700 dark:text-amber-400 font-medium">{item.warn} Warn</span>}
                                {item.fail > 0 && <span className="text-rose-700 dark:text-rose-400 font-medium">{item.fail} Fail</span>}
                              </div>
                            </div>
                          )}

                          {item.nonPassItems.length > 0 && (
                            <div className="mt-2 text-[10.5px] text-slate-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span>{item.nonPassItems.length} deviations recorded</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </section>

              {/* Subsystem Deviation Detail Drilldown */}
              {selectedSubsystemDrill && subsystemVerdicts[selectedSubsystemDrill as Exclude<SubsystemType, 'ALL'>]?.nonPassItems.length > 0 && (
                <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Recorded Deviations: {subsystemVerdicts[selectedSubsystemDrill as Exclude<SubsystemType, 'ALL'>].name}
                    </h3>
                    <button
                      onClick={() => setSelectedSubsystemDrill(null)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Close Details
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-[#20252B]">
                    {subsystemVerdicts[selectedSubsystemDrill as Exclude<SubsystemType, 'ALL'>].nonPassItems.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.2 font-mono text-[10px] font-bold rounded ${
                              item.verdict === 'FAIL'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                            }`}>
                              {item.verdict}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.machineLabel}</span>
                            <span className="text-slate-400 font-mono text-[11px]">{item.date}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px]">{item.detail}</p>
                        </div>

                        {onNavigate && (
                          <button
                            onClick={() => onNavigate('mhc')}
                            className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline shrink-0 font-mono"
                          >
                            Open Session →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: FINDINGS ANALYSIS                                                 */}
          {/* ========================================================================= */}
          {activeAnalysis === 'FINDINGS' && (
            <div className="space-y-4">
              <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20252B]">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      Recurring Findings & Component Defect Frequency
                    </h2>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ranked by recurrence frequency across completed MHC sessions
                    </span>
                  </div>
                </div>

                {recurringFindingsData.length === 0 ? (
                  <div className="py-8 px-4 rounded bg-slate-50/50 dark:bg-[#1A1D23]/50 border border-dashed border-slate-200 dark:border-[#262B33] text-center space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No recurring findings recorded.
                    </span>
                    <p className="text-[11px] text-slate-500">
                      No component defects or attention items were flagged in the selected scope.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-[#20252B]">
                    {recurringFindingsData.map((group, idx) => {
                      const isExpanded = expandedFindingComponent === group.component;
                      return (
                        <div key={idx} className="py-3 space-y-2">
                          <div 
                            className="flex items-start justify-between gap-4 cursor-pointer"
                            onClick={() => setExpandedFindingComponent(isExpanded ? null : group.component)}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{group.component}</h3>
                                {group.isRecurring && (
                                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-medium rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                                    Recurring
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                                <span>{group.occurrenceCount} occurrences</span>
                                <span>·</span>
                                <span>Affected machines: {group.affectedMachineLabels.join(', ')}</span>
                              </div>
                            </div>

                            <button className="text-xs text-slate-400 hover:text-slate-200 font-mono">
                              {isExpanded ? 'Hide Instances' : `View ${group.instances.length} Instances →`}
                            </button>
                          </div>

                          {/* Expanded Instances */}
                          {isExpanded && (
                            <div className="pl-3 border-l-2 border-slate-200 dark:border-[#262B33] space-y-2 mt-2 pt-1">
                              {group.instances.map((inst, iIdx) => (
                                <div key={iIdx} className="text-xs flex items-start justify-between gap-4 py-1">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">{inst.machineLabel}</span>
                                      <span className="text-slate-400 font-mono text-[11px]">{inst.date}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                      {inst.conditions.join(', ') || 'Condition recorded'}
                                      {inst.actionRecommendation ? ` — Action: ${inst.actionRecommendation}` : ''}
                                    </p>
                                  </div>

                                  {onNavigate && (
                                    <button
                                      onClick={() => onNavigate('mhc')}
                                      className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline font-mono shrink-0"
                                    >
                                      Inspect MHC →
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 4: MHC ACTIVITY ANALYSIS                                             */}
          {/* ========================================================================= */}
          {activeAnalysis === 'ACTIVITY' && (
            <div className="space-y-4">
              <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20252B]">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      MHC Service Execution Activity
                    </h2>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chronological service volume across completed inspection sessions
                    </span>
                  </div>
                </div>

                {/* Activity Summary Bar */}
                <div className="flex items-center gap-6 py-2 border-b border-slate-100 dark:border-[#20252B] text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500">Completed Sessions: </span>
                    <strong className="font-mono text-slate-900 dark:text-slate-100">{activityTimeSeries.totalCompleted}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Distinct Machines: </span>
                    <strong className="font-mono text-slate-900 dark:text-slate-100">{activityTimeSeries.uniqueMachinesInspected}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Total Findings: </span>
                    <strong className="font-mono text-slate-900 dark:text-slate-100">{activityTimeSeries.totalFindingsCount}</strong>
                  </div>
                </div>

                {activityTimeSeries.months.length === 0 ? (
                  <div className="py-8 px-4 rounded bg-slate-50/50 dark:bg-[#1A1D23]/50 border border-dashed border-slate-200 dark:border-[#262B33] text-center space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No Data
                    </span>
                    <p className="text-[11px] text-slate-500">
                      No completed MHC sessions found in the selected date range.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {/* Activity Time Series Bars */}
                    <div className="space-y-2">
                      {activityTimeSeries.months.map((m, idx) => {
                        const pct = Math.max(8, (m.sessionCount / activityTimeSeries.maxMonthlySessions) * 100);
                        return (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="text-slate-800 dark:text-slate-200">{m.month}</span>
                              <span className="text-slate-500">
                                {m.sessionCount} sessions ({m.machineIds.size} machines, {m.findingsCount} findings)
                              </span>
                            </div>
                            <ProgressBar
                              value={pct}
                              variant="primary"
                              size="sm"
                              animated={false}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 5: MACHINE COMPARISON                                                */}
          {/* ========================================================================= */}
          {activeAnalysis === 'COMPARISON' && (
            <div className="space-y-4">
              <section className="rounded-md border border-slate-200 dark:border-[#262B33] bg-white dark:bg-[#16191D] p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#20252B]">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      Cross-Machine Telemetry Comparison
                    </h2>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Head-to-head comparison across machines with verified operational records
                    </span>
                  </div>
                </div>

                {machineComparisonList.length < 2 ? (
                  <div className="py-8 px-4 rounded bg-slate-50/50 dark:bg-[#1A1D23]/50 border border-dashed border-slate-200 dark:border-[#262B33] text-center space-y-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Comparison requires at least 2 machines with verified data
                    </span>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Currently {machineComparisonList.length} machine has completed inspection telemetry. Cross-machine comparison activates automatically when multiple units have verified service data.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#262B33] text-slate-500 font-mono text-[11px]">
                          <th className="py-2 px-3">Equipment</th>
                          <th className="py-2 px-3">Model</th>
                          <th className="py-2 px-3">Completed Sessions</th>
                          <th className="py-2 px-3">Latest Laser Power</th>
                          <th className="py-2 px-3">Evaluated Subsystems</th>
                          <th className="py-2 px-3">Pass Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#20252B]">
                        {machineComparisonList.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#1A1D23]/50">
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 font-mono">
                              {m.label}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              {m.model}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-800 dark:text-slate-200">
                              {m.sessionCount}
                            </td>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                              {m.latestLaserPower !== undefined ? `${m.latestLaserPower} ${m.laserUnit || 'W'}` : 'No Data'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                              {m.evaluatedSubsystems} items ({m.passCount} Pass, {m.failCount} Fail)
                            </td>
                            <td className="py-2 px-3 font-mono">
                              {m.passRatePercent !== undefined ? (
                                <span className={`font-semibold ${
                                  m.passRatePercent >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                  {m.passRatePercent}%
                                </span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      )}
    </div>
  );
};
