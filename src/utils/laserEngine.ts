/* =====================================================
   LASER ENGINE (laserEngine.ts)
   FSOS Native Laser Lifecycle Engine (v0.9.0 Phase 2.1)
   Deterministic calculation engine for multi-laser operating hours,
   remaining lifetime %, worst-state status aggregation, accuracy rating,
   recalibration transactions, and EOL prognosis.
   ===================================================== */

import { ProductProcessEngine } from './productProcessEngine';

export interface CalibrationHistoryRecord {
  date: string;
  time?: string;
  laserId?: string;
  laserName?: string;
  estimatedHour: number;
  actualHour: number;
  difference: number;
  reason: string;
  rating: string;
}

export type AccuracyLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface AccuracyInfo {
  level: AccuracyLevel;
  label: string;
  color: string;
  code: string;
  icon: string;
}

export interface RecalibrationRecommendation {
  status: string;
  urgency: 'SAFE' | 'WARNING' | 'ALARM' | 'BASELINE_REQUIRED';
  color: string;
}

export interface RemainingDaysInfo {
  daysVal: number | string;
  statusMsg: string;
  urgency: 'SAFE' | 'WARNING' | 'ALARM' | 'BASELINE_REQUIRED';
  formattedText: string;
}

export interface RecommendedLimitInfo {
  daysText: string;
  subText: string;
  dateFormatted: string;
  isExceeded: boolean;
}

export interface LaserAge {
  years: number | null;
  remainDays: number | null;
  formattedText: string;
}

export interface LaserHeadDomain {
  id: string;
  name?: string;
  serialNo?: string;
  ratedLife?: number;
  warningLife?: number;
  contingencyCeiling?: number;
  baseLaserHour?: number | null;
  baseTimestamp?: string | null;
  runtimeState?: string;
  lastRecalibrationDate?: string | null;
  calibrationHistory?: CalibrationHistoryRecord[];
}

export interface MaintenanceRecord {
  date: string;
  engineer: string;
  action: string;
  notes: string;
}

export interface MachineDomain {
  id: string;
  machineNo?: string;
  machineName?: string;
  machineNumber?: string;
  customerName?: string;
  customerId?: string;
  plantName?: string;
  lineId?: string;
  contractType?: string;
  status?: string;
  installDate?: string;
  lastServiceDate?: string;
  nextServiceDue?: string;
  healthScore?: number;
  opticalPowerWatts?: number;
  laserModel?: string;
  consumables?: any[];
  serialNo?: string;
  manufacturer?: string;
  model?: string;
  department?: string;
  lasers?: LaserHeadDomain[];
  maintenanceHistory?: MaintenanceRecord[];
  lastUpdated?: string;
  // Legacy backward compatibility fields
  ratedLife?: number;
  warningLife?: number;
  contingencyCeiling?: number;
  baseLaserHour?: number | null;
  baseTimestamp?: string | null;
  lastRecalibrationDate?: string | null;
  calibrationHistory?: CalibrationHistoryRecord[];
}

export type LaserStatus = 'SAFE' | 'WARNING' | 'ALARM' | 'BASELINE_REQUIRED';

export interface LaserMetrics {
  id: string;
  name: string;
  serialNo: string;
  baseLaserHour: number | null;
  baseTimestamp: string | null;
  ratedLife: number;
  warningLife: number;
  contingencyCeiling: number;
  isContingencyActive: boolean;
  hoursExceeded: number;
  contingencyMargin: number | null;
  warningMessage: string;
  currentHour: number | null;
  currentHourRaw: number | null;
  estimatedCurrentHour: number | null;
  recommendedRemainingHour: number | null;
  remainingDays: number | string | null;
  remainingTotal: number | null;
  lifeRemainingPercent: number | null;
  formattedLifeRemaining: string;
  status: LaserStatus;
  runtimeState: string;
  baselineRequired: boolean;
  estimatedRecommendedEOL: string | null;
  contingencyActive: boolean;
  remainingDaysInfo: RemainingDaysInfo;
  recommendedLimitInfo: RecommendedLimitInfo;
  daysSinceRecal: number | null;
  accuracy: AccuracyInfo;
  recalRecommendation: RecalibrationRecommendation;
  nextRecalDate: string;
  eolDate: string;
  age: LaserAge;
  lastRecalibrationDate: string | null;
  calibrationHistory: CalibrationHistoryRecord[];
}

export interface MachineMetrics {
  status: LaserStatus;
  totalLasers: number;
  safeCount: number;
  warningCount: number;
  alarmCount: number;
  baselineRequiredCount: number;
  avgLifeRemaining: number | null;
  formattedAvgLifeRemaining: string;
  laserMetricsList: LaserMetrics[];
  mostCriticalLaser: LaserMetrics;
  // Shortcuts mapped to most critical laser
  currentHour: number | string;
  currentHourRaw: number | null | undefined;
  remainingTotal: number | string;
  remainingDaysInfo: RemainingDaysInfo;
  recommendedLimitInfo: RecommendedLimitInfo;
  lifeRemainingPercent: number | null;
  formattedLifeRemaining: string;
  accuracy: AccuracyInfo;
  daysSinceRecal: number | null;
  recalRecommendation: RecalibrationRecommendation;
  nextRecalDate: string;
  eolDate: string;
  age: LaserAge;
  lastRecalibrationDate: string | null;
  healthPercent: number | null;
  baselineRequired: boolean;
}

export interface RecalibrationAnalysis {
  laserName: string;
  estimatedHour: number;
  actualHour: number;
  difference: number;
  ratingInfo: {
    absDiff: number;
    rating: string;
    label: string;
    warningMsg: string | null;
  };
}

export interface RecalibrationResult {
  updatedMachine: MachineDomain;
  analysis: RecalibrationAnalysis;
}

// =====================================================
// UTILITY FUNCTIONS (UTILITIES & FORMATTING)
// =====================================================

export function formatHours(val: number | string | null | undefined): string {
  const num = Number(val) || 0;
  return String(Math.round(num));
}

export function safeToISOString(val: unknown, fallback: string | null = null): string | null {
  if (!val) return fallback;
  try {
    const date = new Date(val as string | number | Date);
    if (isNaN(date.getTime())) return fallback;
    return date.toISOString();
  } catch {
    return fallback;
  }
}

export function safeToDatetimeLocal(val: unknown, fallback = ''): string {
  const iso = safeToISOString(val, null);
  if (!iso) return fallback;
  return iso.slice(0, 16);
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'N/A';
  }
}

export function getCurrentEvalTime(simulatedDateStr?: string | null): Date {
  const now = new Date();
  if (!simulatedDateStr) return now;
  const simDate = new Date(simulatedDateStr);
  if (isNaN(simDate.getTime())) return now;
  simDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return simDate;
}

export function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/**
 * Helper: Format Life Remaining percentage according to system precision rules:
 * - >= 10%: Whole % (e.g., 53%)
 * - 1% - 10%: 1 decimal place (e.g., 4.8%)
 * - < 1% and > 0%: 1 decimal place (e.g., 0.5%). Never round down positive values to 0%.
 * - <= 0%: 0%
 */
export function formatLifeRemainingPercent(val: number | null | undefined): string {
  const p = Number(val);
  if (isNaN(p) || p <= 0) return '0%';
  if (p >= 10) return Math.round(p) + '%';
  const str = p.toFixed(1);
  return str.endsWith('.0') ? Math.round(p) + '%' : str + '%';
}

// =====================================================
// CORE LASER LIFECYCLE ENGINE
// =====================================================

export const LaserEngine = {
  /**
   * Calculate continuous estimated laser hour from baseline and timestamp.
   * Assumes continuous 24-hour daily operation.
   * Formula: Current Laser Hour = Base Laser Hour + Elapsed Time (in Hours)
   * Current Laser Hour is NEVER permanently stored; calculated dynamically.
   */
  calculateEstimatedHour(
    baseLaserHour: number | null | undefined,
    baseTimestamp: string | null | undefined,
    currentTime: Date | string | number
  ): number | null {
    if (baseLaserHour === null || baseLaserHour === undefined || isNaN(Number(baseLaserHour))) return null;
    if (!baseTimestamp || isNaN(new Date(baseTimestamp).getTime())) return null;
    const baseHour = Number(baseLaserHour);
    const baseMs = new Date(baseTimestamp).getTime();
    const currentMs = new Date(currentTime).getTime();

    if (isNaN(currentMs) || currentMs < baseMs) {
      return baseHour;
    }

    const elapsedMs = currentMs - baseMs;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    return baseHour + elapsedHours;
  },

  /**
   * Calculate remaining operating hours before rated life limit.
   * Allowed to be negative if overdue!
   */
  calculateRemainingHours(currentHour: number | null | undefined, ratedLife: number): number {
    const rated = Number(ratedLife) || 25000;
    return rated - Number(currentHour || 0);
  },

  /**
   * Calculate remaining days based on remaining hours (assuming 24h/day continuous operation).
   */
  calculateRemainingDays(remainingHours: number): number {
    const rem = Number(remainingHours) || 0;
    if (rem < 0) {
      return Math.floor(Math.abs(rem) / 24);
    }
    return Math.floor(rem / 24);
  },

  /**
   * Calculate remaining days breakdown and warning/alarm threshold info.
   */
  calculateRemainingDaysInfo(remainingTotal: number, ratedLife: number, warningLife?: number): RemainingDaysInfo {
    const rated = Number(ratedLife) || 25000;
    const warn = Number(warningLife) || Math.floor(rated * 0.8);
    const warningThreshold = rated - warn;

    let daysVal = 0;
    let statusMsg = "";
    let urgency: 'SAFE' | 'WARNING' | 'ALARM' | 'BASELINE_REQUIRED' = "SAFE";

    if (remainingTotal > warningThreshold) {
      daysVal = Math.floor((remainingTotal - warningThreshold) / 24);
      statusMsg = "Days to WARNING";
      urgency = "SAFE";
    } else if (remainingTotal >= 0) {
      daysVal = Math.floor(remainingTotal / 24);
      statusMsg = "Days to ALARM";
      urgency = "WARNING";
    } else {
      daysVal = Math.floor(Math.abs(remainingTotal) / 24);
      statusMsg = "Days Overdue";
      urgency = "ALARM";
    }

    return {
      daysVal,
      statusMsg,
      urgency,
      formattedText: remainingTotal < 0 ? `${daysVal}d overdue` : `${daysVal.toLocaleString()} days`
    };
  },

  /**
   * Calculate Life Remaining Percentage:
   * Life Remaining % = (Remaining Hours / Rated Lifetime) * 100
   * Clamped between 0% and 100%.
   */
  calculateLifeRemainingPercent(remainingHours: number, ratedLife: number): number {
    const rated = Number(ratedLife) || 25000;
    const rem = Number(remainingHours);
    if (rated <= 0 || rem <= 0) return 0;
    const rawPct = (rem / rated) * 100;
    return Math.max(0, Math.min(100, rawPct));
  },

  /**
   * Determine laser status based on current laser hour and rated/warning limits.
   * - ALARM: Current hour >= Rated life (Remaining hours <= 0)
   * - WARNING: Current hour >= Warning life
   * - SAFE: Current hour < Warning life
   */
  calculateLaserStatus(currentHour: number, ratedLife: number, warningLife?: number): LaserStatus {
    const curr = Number(currentHour) || 0;
    const rated = Number(ratedLife) || 25000;
    const warn = Number(warningLife) || Math.floor(rated * 0.8);

    if (curr >= rated) {
      return 'ALARM';
    } else if (curr >= warn) {
      return 'WARNING';
    } else {
      return 'SAFE';
    }
  },

  /**
   * Calculate equivalent laser age in Years and Days based on current laser hour.
   */
  calculateLaserAge(currentHour: number | null | undefined): LaserAge {
    const hrs = Number(currentHour) || 0;
    const years = Math.floor(hrs / 8760);
    const remainDays = Math.floor((hrs % 8760) / 24);
    return { years, remainDays, formattedText: `${years} Years • ${remainDays} Days` };
  },

  /**
   * Calculate days elapsed since last recalibration.
   */
  calculateDaysSinceRecalibration(lastRecalibrationDate: string | null | undefined, currentTime: Date | string | number): number {
    if (!lastRecalibrationDate) return 0;
    const recalMs = new Date(lastRecalibrationDate).getTime();
    const currentMs = new Date(currentTime).getTime();
    if (isNaN(recalMs) || isNaN(currentMs) || currentMs < recalMs) {
      return 0;
    }
    return Math.floor((currentMs - recalMs) / (1000 * 60 * 60 * 24));
  },

  /**
   * Determine Accuracy level based solely on days since last recalibration.
   * 0–30 days -> HIGH (Green)
   * 31–90 days -> MEDIUM (Yellow)
   * >90 days -> LOW (Red)
   */
  calculateAccuracy(daysSinceRecalibration: number): AccuracyInfo {
    const days = Number(daysSinceRecalibration) || 0;
    if (days <= 30) {
      return { level: 'HIGH', label: '🟢 HIGH', color: 'var(--green)', code: 'HIGH', icon: '🟢' };
    } else if (days <= 90) {
      return { level: 'MEDIUM', label: '🟡 MEDIUM', color: 'var(--yellow)', code: 'MEDIUM', icon: '🟡' };
    } else {
      return { level: 'LOW', label: '🔴 LOW', color: 'var(--red)', code: 'LOW', icon: '🔴' };
    }
  },

  /**
   * Determine advisory status for next recommended recalibration.
   */
  calculateRecalibrationRecommendation(daysSinceRecalibration: number): RecalibrationRecommendation {
    const days = Number(daysSinceRecalibration) || 0;
    if (days <= 30) {
      return { status: 'No Action Required', urgency: 'SAFE', color: 'var(--green)' };
    } else if (days <= 90) {
      return { status: 'Verify During Next Service Visit', urgency: 'WARNING', color: 'var(--yellow)' };
    } else {
      return { status: 'Recalibration Recommended', urgency: 'ALARM', color: 'var(--red)' };
    }
  },

  /**
   * Calculate suggested next recalibration date (30 days from last recalibration).
   */
  calculateNextRecalibrationDate(lastRecalibrationDate?: string | null): string {
    if (!lastRecalibrationDate) return new Date().toISOString().split('T')[0];
    const recalDate = new Date(lastRecalibrationDate);
    if (isNaN(recalDate.getTime())) return new Date().toISOString().split('T')[0];
    const nextDate = new Date(recalDate);
    nextDate.setDate(nextDate.getDate() + 30);
    if (isNaN(nextDate.getTime())) return new Date().toISOString().split('T')[0];
    try {
      return nextDate.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  },

  /**
   * Calculate estimated End-of-Life date based on rated life and continuous 24h consumption.
   */
  calculateEstimatedEndOfLifeDate(currentHour: number | null | undefined, ratedLife: number, currentTime?: Date | string | number): string {
    const remainingHours = this.calculateRemainingHours(currentHour, ratedLife);
    let now = currentTime ? new Date(currentTime) : new Date();
    if (isNaN(now.getTime())) now = new Date();
    if (remainingHours <= 0) {
      return 'EXCEEDED';
    }
    const eolMs = now.getTime() + (remainingHours * 3600 * 1000);
    const eolDate = new Date(eolMs);
    if (isNaN(eolDate.getTime())) return 'N/A';
    try {
      return eolDate.toISOString().split('T')[0];
    } catch {
      return 'N/A';
    }
  },

  /**
   * Calculate deviation between actual machine hour meter reading and estimated hour.
   * Deviation = Actual Hour - Estimated Hour
   */
  calculateDeviation(actualHour: number, estimatedHour: number): number {
    return Number(actualHour) - Number(estimatedHour);
  },

  /**
   * Rating scale based on deviation absolute difference.
   */
  calculateDeviationRating(differenceHours: number) {
    const absDiff = Math.abs(Number(differenceHours) || 0);
    let rating = '';
    let label = '';
    let warningMsg: string | null = null;

    if (absDiff <= 10) {
      rating = '★★★★★ Excellent';
      label = 'Excellent';
    } else if (absDiff <= 25) {
      rating = '★★★★☆ Very Good';
      label = 'Very Good';
    } else if (absDiff <= 50) {
      rating = '★★★☆☆ Good';
      label = 'Good';
    } else if (absDiff <= 100) {
      rating = '★★☆☆☆ Fair';
      label = 'Fair';
    } else {
      rating = '★☆☆☆☆ Poor';
      label = 'Poor';
      warningMsg = 'Laser head experienced extended downtime or deviation. Baseline updated.';
    }

    return { absDiff, rating, label, warningMsg };
  },

  /**
   * Calculate metrics for an individual laser head.
   */
  calculateLaserMetrics(laser: LaserHeadDomain, currentTime?: Date | string | number): LaserMetrics {
    let now = currentTime ? new Date(currentTime) : new Date();
    if (isNaN(now.getTime())) now = new Date();

    const validBaseHour = (typeof laser.baseLaserHour === 'number' && !isNaN(laser.baseLaserHour));
    const validBaseTs = !!(laser.baseTimestamp && !isNaN(new Date(laser.baseTimestamp).getTime()));
    const hasValidBaseline = validBaseHour && validBaseTs;

    const ratedLife = Number(laser.ratedLife) || 25000;
    const warningLife = Number(laser.warningLife) || Math.floor(ratedLife * 0.8);
    const contingencyCeiling = Number(laser.contingencyCeiling) || (ratedLife + 3000);

    if (!hasValidBaseline) {
      return {
        id: laser.id,
        name: laser.name || 'Laser Head',
        serialNo: laser.serialNo || '',
        baseLaserHour: validBaseHour ? (laser.baseLaserHour as number) : null,
        baseTimestamp: validBaseTs ? (laser.baseTimestamp as string) : null,
        ratedLife,
        warningLife,
        contingencyCeiling,
        isContingencyActive: false,
        hoursExceeded: 0,
        contingencyMargin: null,
        warningMessage: "Record the current physical laser hour-meter reading and capture date/time to begin automatic runtime estimation.",
        currentHour: null,
        currentHourRaw: null,
        estimatedCurrentHour: null,
        recommendedRemainingHour: null,
        remainingDays: null,
        remainingTotal: null,
        lifeRemainingPercent: null,
        formattedLifeRemaining: '—',
        status: 'BASELINE_REQUIRED',
        runtimeState: 'BASELINE_REQUIRED',
        baselineRequired: true,
        estimatedRecommendedEOL: null,
        contingencyActive: false,
        remainingDaysInfo: {
          daysVal: '—',
          statusMsg: 'Baseline Required',
          urgency: 'BASELINE_REQUIRED',
          formattedText: '—'
        },
        recommendedLimitInfo: {
          daysText: '—',
          subText: 'Baseline Required',
          dateFormatted: '—',
          isExceeded: false
        },
        daysSinceRecal: null,
        accuracy: { level: 'UNKNOWN', label: '⚪ UNKNOWN', color: 'var(--muted)', code: 'UNKNOWN', icon: '⚪' },
        recalRecommendation: { status: 'Baseline Required', urgency: 'BASELINE_REQUIRED', color: 'var(--muted)' },
        nextRecalDate: '—',
        eolDate: '—',
        age: { years: null, remainDays: null, formattedText: '—' },
        lastRecalibrationDate: laser.lastRecalibrationDate || null,
        calibrationHistory: Array.isArray(laser.calibrationHistory) ? laser.calibrationHistory : []
      };
    }

    const baseHour = Number(laser.baseLaserHour);
    const baseTs = laser.baseTimestamp as string;

    const currentHour = this.calculateEstimatedHour(baseHour, baseTs, now) as number;
    const remainingTotal = this.calculateRemainingHours(currentHour, ratedLife);
    const lifeRemainingPercent = this.calculateLifeRemainingPercent(remainingTotal, ratedLife);
    const formattedLifeRemaining = formatLifeRemainingPercent(lifeRemainingPercent);
    const status = this.calculateLaserStatus(currentHour, ratedLife, warningLife);
    const remainingDaysInfo = this.calculateRemainingDaysInfo(remainingTotal, ratedLife, warningLife);
    const age = this.calculateLaserAge(currentHour);

    const isContingencyActive = currentHour >= ratedLife;
    const hoursExceeded = isContingencyActive ? Math.round((currentHour - ratedLife) * 10) / 10 : 0;
    const contingencyMargin = isContingencyActive ? Math.max(0, Math.round((contingencyCeiling - currentHour) * 10) / 10) : null;

    let warningMessage = "";
    if (status === 'WARNING') {
      warningMessage = "REPLACEMENT PLANNING REQUIRED • RECOMMENDED LIFE LIMIT APPROACHING";
    } else if (status === 'ALARM') {
      warningMessage = "RECOMMENDED LASER LIFE EXCEEDED";
    }

    const recalDateValid = laser.lastRecalibrationDate && !isNaN(new Date(laser.lastRecalibrationDate).getTime());
    const recalTs = recalDateValid ? (laser.lastRecalibrationDate as string) : baseTs;
    const daysSinceRecal = this.calculateDaysSinceRecalibration(recalTs, now);
    const accuracy = this.calculateAccuracy(daysSinceRecal);
    const recalRecommendation = this.calculateRecalibrationRecommendation(daysSinceRecal);
    const nextRecalDate = this.calculateNextRecalibrationDate(recalTs);
    const eolDate = this.calculateEstimatedEndOfLifeDate(currentHour, ratedLife, now);

    let limitDateFormatted = 'N/A';
    let limitDaysText = '';
    let limitSubText = '';

    if (!isContingencyActive) {
      const remainingMs = Math.max(0, remainingTotal) * 3600 * 1000;
      const limitTimestamp = now.getTime() + remainingMs;
      limitDateFormatted = formatDate(new Date(limitTimestamp).toISOString());

      if (remainingTotal < 24 && remainingTotal >= 0) {
        limitDaysText = '<1 day';
      } else {
        const days = Math.floor(remainingTotal / 24);
        limitDaysText = `${days.toLocaleString()} days`;
      }
      limitSubText = `Est. ${limitDateFormatted}`;
    } else {
      const exceededMs = hoursExceeded * 3600 * 1000;
      const exceededTimestamp = now.getTime() - exceededMs;
      limitDateFormatted = formatDate(new Date(exceededTimestamp).toISOString());

      const daysOverdue = Math.floor(hoursExceeded / 24);
      if (daysOverdue < 1) {
        limitDaysText = '<1 day overdue';
      } else {
        limitDaysText = `${daysOverdue.toLocaleString()} days overdue`;
      }
      limitSubText = `Exceeded ${limitDateFormatted}`;
    }

    const recommendedLimitInfo: RecommendedLimitInfo = {
      daysText: limitDaysText,
      subText: limitSubText,
      dateFormatted: limitDateFormatted,
      isExceeded: isContingencyActive
    };

    return {
      id: laser.id,
      name: laser.name || 'Laser Head',
      serialNo: laser.serialNo || '',
      baseLaserHour: baseHour,
      baseTimestamp: baseTs,
      ratedLife,
      warningLife,
      contingencyCeiling,
      isContingencyActive,
      hoursExceeded,
      contingencyMargin,
      warningMessage,
      currentHour: Math.round(currentHour * 10) / 10,
      currentHourRaw: currentHour,
      estimatedCurrentHour: Math.round(currentHour * 10) / 10,
      recommendedRemainingHour: Math.round(remainingTotal * 10) / 10,
      remainingDays: remainingDaysInfo.daysVal,
      remainingTotal: Math.round(remainingTotal * 10) / 10,
      lifeRemainingPercent,
      formattedLifeRemaining,
      status,
      runtimeState: 'NORMAL',
      baselineRequired: false,
      estimatedRecommendedEOL: eolDate,
      contingencyActive: isContingencyActive,
      remainingDaysInfo,
      recommendedLimitInfo,
      daysSinceRecal,
      accuracy,
      recalRecommendation,
      nextRecalDate,
      eolDate,
      age,
      lastRecalibrationDate: recalTs,
      calibrationHistory: Array.isArray(laser.calibrationHistory) ? laser.calibrationHistory : []
    };
  },

  /**
   * Calculate machine metrics across all of its laser heads.
   * Uses "WORST STATE WINS" logic (ALARM > BASELINE_REQUIRED > WARNING > SAFE) for overall machine status.
   */
  calculateMachineMetrics(machine: MachineDomain, currentTime?: Date | string | number): MachineMetrics {
    let now = currentTime ? new Date(currentTime) : new Date();
    if (isNaN(now.getTime())) now = new Date();

    if (!machine || typeof machine !== 'object') {
      const dummyLaser: LaserMetrics = {
        id: 'NONE',
        name: 'No Laser Head',
        serialNo: '—',
        baseLaserHour: null,
        baseTimestamp: null,
        ratedLife: 25000,
        warningLife: 20000,
        contingencyCeiling: 28000,
        isContingencyActive: false,
        hoursExceeded: 0,
        contingencyMargin: null,
        warningMessage: 'No Machine Selected',
        currentHour: null,
        currentHourRaw: null,
        estimatedCurrentHour: null,
        recommendedRemainingHour: null,
        remainingDays: null,
        remainingTotal: null,
        lifeRemainingPercent: null,
        formattedLifeRemaining: '—',
        status: 'BASELINE_REQUIRED',
        runtimeState: 'BASELINE_REQUIRED',
        baselineRequired: true,
        estimatedRecommendedEOL: null,
        contingencyActive: false,
        remainingDaysInfo: { daysVal: '—', statusMsg: 'No Machine Selected', urgency: 'BASELINE_REQUIRED', formattedText: '—' },
        recommendedLimitInfo: { daysText: '—', subText: 'No Machine Selected', dateFormatted: '—', isExceeded: false },
        daysSinceRecal: null,
        accuracy: { level: 'UNKNOWN', label: '⚪ UNKNOWN', color: 'var(--muted)', code: 'UNKNOWN', icon: '⚪' },
        recalRecommendation: { status: 'No Machine', urgency: 'BASELINE_REQUIRED', color: 'var(--muted)' },
        nextRecalDate: '—',
        eolDate: '—',
        age: { years: null, remainDays: null, formattedText: '—' },
        lastRecalibrationDate: null,
        calibrationHistory: []
      };

      return {
        status: 'SAFE',
        totalLasers: 0,
        safeCount: 0,
        warningCount: 0,
        alarmCount: 0,
        baselineRequiredCount: 0,
        avgLifeRemaining: null,
        formattedAvgLifeRemaining: '—',
        laserMetricsList: [],
        mostCriticalLaser: dummyLaser,
        currentHour: '—',
        currentHourRaw: null,
        remainingTotal: '—',
        remainingDaysInfo: dummyLaser.remainingDaysInfo,
        recommendedLimitInfo: dummyLaser.recommendedLimitInfo,
        lifeRemainingPercent: null,
        formattedLifeRemaining: '—',
        accuracy: dummyLaser.accuracy,
        daysSinceRecal: null,
        recalRecommendation: dummyLaser.recalRecommendation,
        nextRecalDate: '—',
        eolDate: '—',
        age: dummyLaser.age,
        lastRecalibrationDate: null,
        healthPercent: null,
        baselineRequired: false
      };
    }

    let lasers = Array.isArray(machine.lasers) && machine.lasers.length > 0 ? machine.lasers : [];

    if (lasers.length === 0) {
      // Fallback for single machine object format
      const validBaseTs = (machine.baseTimestamp && !isNaN(new Date(machine.baseTimestamp).getTime())) ? machine.baseTimestamp : null;
      const validBaseHour = (typeof machine.baseLaserHour === 'number' && !isNaN(machine.baseLaserHour)) ? machine.baseLaserHour : null;
      const fallbackLaser: LaserHeadDomain = {
        id: (machine.id || 'L-101') + '-L1',
        name: 'Laser Head 1',
        serialNo: machine.serialNo || '',
        ratedLife: Number(machine.ratedLife) || 25000,
        warningLife: Number(machine.warningLife) || Math.floor((Number(machine.ratedLife) || 25000) * 0.8),
        baseLaserHour: validBaseHour,
        baseTimestamp: validBaseTs,
        lastRecalibrationDate: (machine.lastRecalibrationDate && !isNaN(new Date(machine.lastRecalibrationDate).getTime())) ? machine.lastRecalibrationDate : null,
        calibrationHistory: Array.isArray(machine.calibrationHistory) ? machine.calibrationHistory : []
      };
      lasers = [fallbackLaser];
    }

    const laserMetricsList = lasers.map(l => this.calculateLaserMetrics(l, now));

    let safeCount = 0;
    let warningCount = 0;
    let alarmCount = 0;
    let baselineRequiredCount = 0;

    laserMetricsList.forEach(lm => {
      if (lm.status === 'ALARM') alarmCount++;
      else if (lm.status === 'BASELINE_REQUIRED') baselineRequiredCount++;
      else if (lm.status === 'WARNING') warningCount++;
      else safeCount++;
    });

    let machineStatus: LaserStatus = 'SAFE';
    if (alarmCount > 0) machineStatus = 'ALARM';
    else if (baselineRequiredCount > 0) machineStatus = 'BASELINE_REQUIRED';
    else if (warningCount > 0) machineStatus = 'WARNING';

    // Identify most critical laser head (lowest life remaining % or worst status)
    let mostCriticalLaser = laserMetricsList[0];
    const statusPriority: Record<LaserStatus, number> = { ALARM: 4, BASELINE_REQUIRED: 3, WARNING: 2, SAFE: 1 };

    laserMetricsList.forEach(lm => {
      const currentPri = statusPriority[mostCriticalLaser.status] || 0;
      const targetPri = statusPriority[lm.status] || 0;

      if (targetPri > currentPri) {
        mostCriticalLaser = lm;
      } else if (targetPri === currentPri) {
        const targetPct = (typeof lm.lifeRemainingPercent === 'number' && lm.lifeRemainingPercent !== null) ? lm.lifeRemainingPercent : -1;
        const currentPct = (typeof mostCriticalLaser.lifeRemainingPercent === 'number' && mostCriticalLaser.lifeRemainingPercent !== null) ? mostCriticalLaser.lifeRemainingPercent : -1;
        if (targetPct < currentPct) {
          mostCriticalLaser = lm;
        }
      }
    });

    const validPctLasers = laserMetricsList.filter(l => typeof l.lifeRemainingPercent === 'number' && l.lifeRemainingPercent !== null);
    const totalLifePct = validPctLasers.reduce((acc, l) => acc + (l.lifeRemainingPercent || 0), 0);
    const avgLifeRemaining = validPctLasers.length > 0 ? totalLifePct / validPctLasers.length : null;
    const formattedAvgLifeRemaining = avgLifeRemaining !== null ? formatLifeRemainingPercent(avgLifeRemaining) : '—';

    return {
      status: machineStatus,
      totalLasers: laserMetricsList.length,
      safeCount,
      warningCount,
      alarmCount,
      baselineRequiredCount,
      avgLifeRemaining: avgLifeRemaining !== null ? Math.round(avgLifeRemaining * 10) / 10 : null,
      formattedAvgLifeRemaining,
      laserMetricsList,
      mostCriticalLaser,
      // Backwards compatibility shortcuts mapped to most critical laser
      currentHour: mostCriticalLaser.currentHour !== null ? mostCriticalLaser.currentHour : '—',
      currentHourRaw: mostCriticalLaser.currentHourRaw,
      remainingTotal: mostCriticalLaser.remainingTotal !== null ? mostCriticalLaser.remainingTotal : '—',
      remainingDaysInfo: mostCriticalLaser.remainingDaysInfo,
      recommendedLimitInfo: mostCriticalLaser.recommendedLimitInfo,
      lifeRemainingPercent: mostCriticalLaser.lifeRemainingPercent,
      formattedLifeRemaining: mostCriticalLaser.formattedLifeRemaining,
      accuracy: mostCriticalLaser.accuracy,
      daysSinceRecal: mostCriticalLaser.daysSinceRecal,
      recalRecommendation: mostCriticalLaser.recalRecommendation,
      nextRecalDate: mostCriticalLaser.nextRecalDate,
      eolDate: mostCriticalLaser.eolDate,
      age: mostCriticalLaser.age,
      lastRecalibrationDate: mostCriticalLaser.lastRecalibrationDate,
      healthPercent: mostCriticalLaser.lifeRemainingPercent,
      baselineRequired: mostCriticalLaser.baselineRequired || baselineRequiredCount > 0
    };
  },

  /**
   * Perform Recalibration logic for a specific laser head in a machine.
   */
  executeRecalibration(
    machine: MachineDomain,
    laserId: string | null | undefined,
    actualHour: number,
    reason?: string,
    timestamp?: Date | string | number
  ): RecalibrationResult {
    let recalTime = timestamp ? new Date(timestamp) : new Date();
    if (isNaN(recalTime.getTime())) recalTime = new Date();
    const recalISO = recalTime.toISOString();

    const lasers = Array.isArray(machine.lasers) ? [...machine.lasers] : [];
    const laserIndex = lasers.findIndex(l => l.id === laserId) >= 0 ? lasers.findIndex(l => l.id === laserId) : 0;
    const targetLaser = lasers[laserIndex];

    if (!targetLaser) {
      throw new Error(`Laser ${laserId} not found in machine`);
    }

    const currentEstimated = this.calculateEstimatedHour(targetLaser.baseLaserHour, targetLaser.baseTimestamp, recalTime) || 0;
    const diff = this.calculateDeviation(actualHour, currentEstimated);
    const ratingInfo = this.calculateDeviationRating(diff);

    let dateStr = 'N/A';
    let timeStr = '00:00';
    try {
      dateStr = recalTime.toISOString().split('T')[0];
      timeStr = recalTime.toTimeString().split(' ')[0].substring(0, 5);
    } catch {
      const fallback = new Date();
      dateStr = fallback.toISOString().split('T')[0];
      timeStr = fallback.toTimeString().split(' ')[0].substring(0, 5);
    }

    const historyRecord: CalibrationHistoryRecord = {
      date: dateStr,
      time: timeStr,
      laserId: targetLaser.id,
      laserName: targetLaser.name || 'Laser Head',
      estimatedHour: Math.round(currentEstimated * 10) / 10,
      actualHour: Number(actualHour),
      difference: Math.round(diff * 10) / 10,
      reason: reason || 'Manual Verification',
      rating: ratingInfo.rating
    };

    const existingLaserHistory = Array.isArray(targetLaser.calibrationHistory) ? targetLaser.calibrationHistory : [];
    const updatedLaserHistory = [historyRecord, ...existingLaserHistory].slice(0, 10);

    lasers[laserIndex] = {
      ...targetLaser,
      baseLaserHour: Number(actualHour),
      baseTimestamp: recalISO,
      lastRecalibrationDate: recalISO,
      calibrationHistory: updatedLaserHistory
    };

    const updatedMachine: MachineDomain = {
      ...machine,
      lasers,
      lastUpdated: recalISO
    };

    return {
      updatedMachine,
      analysis: {
        laserName: targetLaser.name || 'Laser Head',
        estimatedHour: Math.round(currentEstimated * 10) / 10,
        actualHour: Number(actualHour),
        difference: Math.round(diff * 10) / 10,
        ratingInfo
      }
    };
  },

  /**
   * Add a new laser head to a machine.
   */
  addLaserToMachine(machine: MachineDomain, laserData: Partial<LaserHeadDomain>): MachineDomain {
    const lasers = Array.isArray(machine.lasers) ? [...machine.lasers] : [];
    const newIndex = lasers.length + 1;
    const validTs = (laserData.baseTimestamp && !isNaN(new Date(laserData.baseTimestamp).getTime())) ? laserData.baseTimestamp : null;
    const newLaser: LaserHeadDomain = {
      id: `${machine.id}-L${Date.now().toString().slice(-4)}`,
      name: laserData.name || `Laser Head ${newIndex}`,
      serialNo: laserData.serialNo || `${machine.serialNo || 'SN'}-L${newIndex}`,
      ratedLife: Number(laserData.ratedLife) || 25000,
      warningLife: Number(laserData.warningLife) || Math.floor((Number(laserData.ratedLife) || 25000) * 0.8),
      contingencyCeiling: Number(laserData.contingencyCeiling) || 28000,
      baseLaserHour: (typeof laserData.baseLaserHour === 'number' && !isNaN(laserData.baseLaserHour)) ? laserData.baseLaserHour : null,
      baseTimestamp: validTs,
      lastRecalibrationDate: validTs,
      calibrationHistory: []
    };

    lasers.push(newLaser);
    return {
      ...machine,
      lasers,
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * Update an existing laser head parameters.
   */
  updateLaserInMachine(machine: MachineDomain, laserId: string, laserData: Partial<LaserHeadDomain>): MachineDomain {
    const lasers = Array.isArray(machine.lasers) ? [...machine.lasers] : [];
    const index = lasers.findIndex(l => l.id === laserId);
    if (index === -1) return machine;

    lasers[index] = {
      ...lasers[index],
      name: laserData.name || lasers[index].name,
      serialNo: laserData.serialNo || lasers[index].serialNo,
      ratedLife: Number(laserData.ratedLife) || lasers[index].ratedLife,
      warningLife: Number(laserData.warningLife) || lasers[index].warningLife,
      contingencyCeiling: Number(laserData.contingencyCeiling) || lasers[index].contingencyCeiling,
      ...(typeof laserData.baseLaserHour === 'number' ? { baseLaserHour: laserData.baseLaserHour } : {}),
      ...(laserData.baseTimestamp ? { baseTimestamp: laserData.baseTimestamp } : {})
    };

    return {
      ...machine,
      lasers,
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * Delete a laser head from a machine (if > 1 laser exists).
   */
  deleteLaserFromMachine(machine: MachineDomain, laserId: string): MachineDomain {
    const lasers = Array.isArray(machine.lasers) ? [...machine.lasers] : [];
    if (lasers.length <= 1) {
      throw new Error('A machine must have at least one laser head.');
    }

    const filtered = lasers.filter(l => l.id !== laserId);
    return {
      ...machine,
      lasers: filtered,
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * Normalize raw machine object or list into well-formed MachineDomain objects
   * ensuring all laser head domain parameters (baseLaserHour, baseTimestamp, ratedLife, calibrationHistory) exist.
   * Naturally sorts machines by machine number / name.
   */
  normalizeMachines(list: any[]): MachineDomain[] {
    if (!Array.isArray(list)) return [];
    const normalized = list.map(m => this.normalizeMachine(m));
    return normalized.sort((a, b) => {
      const nameA = a.machineNo || a.machineName || a.id || '';
      const nameB = b.machineNo || b.machineName || b.id || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  },

  /**
   * Calculate overall machine engineering status: PASS | WARNING | FAIL
   * Derived from laser head remaining life and runtime state
   */
  getMachineHealthStatus(machine: MachineDomain | any): 'PASS' | 'WARNING' | 'FAIL' {
    if (!machine) return 'FAIL';
    const lasers = Array.isArray(machine.lasers) && machine.lasers.length > 0
      ? machine.lasers
      : (Array.isArray(machine.laserHeads) ? machine.laserHeads : []);
    
    if (lasers.length === 0) return 'PASS';

    let minRemainingLifePct = 100;
    let hasFail = false;
    let hasWarning = false;

    for (const laser of lasers) {
      const metrics = this.calculateLaserMetrics(laser);
      if (metrics) {
        if (metrics.runtimeState === 'EXCEEDED_CEILING' || metrics.runtimeState === 'EXCEEDED_RATED') {
          hasFail = true;
        } else if (metrics.runtimeState === 'WARNING_ZONE') {
          hasWarning = true;
        }
        if (typeof metrics.lifeRemainingPct === 'number' && !isNaN(metrics.lifeRemainingPct)) {
          if (metrics.lifeRemainingPct < minRemainingLifePct) {
            minRemainingLifePct = metrics.lifeRemainingPct;
          }
        }
      }
    }

    if (hasFail || minRemainingLifePct <= 5) return 'FAIL';
    if (hasWarning || minRemainingLifePct <= 20) return 'WARNING';
    return 'PASS';
  },

  normalizeMachine(m: any): MachineDomain {
    if (!m) {
      return {
        id: 'WD-' + Math.floor(Math.random() * 100000),
        machineNo: 'WD-000',
        machineName: 'Wafer Driller BMD302W',
        serialNo: 'SN-0000',
        manufacturer: 'SemiconTech',
        model: 'BMD302W',
        department: 'Wafer Prep',
        lasers: [{
          id: 'WD-000-L1',
          name: 'Laser Head 1',
          serialNo: 'SN-0000-L1',
          ratedLife: 25000,
          warningLife: 20000,
          contingencyCeiling: 28000,
          baseLaserHour: null,
          baseTimestamp: null,
          runtimeState: 'BASELINE_REQUIRED',
          lastRecalibrationDate: null,
          calibrationHistory: []
        }],
        maintenanceHistory: [],
        lastUpdated: new Date().toISOString()
      };
    }

    const id = m.id || 'WD-' + Math.floor(Math.random() * 100000);
    const machineNo = m.machineNo || m.machineNumber || 'WD-000';
    const machineName = m.machineName || ('Wafer Driller ' + (m.model || 'BMD302W'));
    const serialNo = m.serialNo || m.serialNumber || 'SN-0000';
    const manufacturer = m.manufacturer || 'SemiconTech';
    const model = m.model || 'BMD302W';
    const department = m.department || 'Wafer Prep';

    let lasers = Array.isArray(m.lasers) && m.lasers.length > 0 ? m.lasers : null;

    if (!lasers && Array.isArray(m.laserHeads) && m.laserHeads.length > 0) {
      lasers = m.laserHeads.map((lh: any, idx: number) => {
        const rated = Number(lh.ratedLife || lh.maxRecommendedHours) || 25000;
        const warn = Number(lh.warningLife) || Math.floor(rated * 0.8);
        const baseHour = typeof lh.baseLaserHour === 'number' ? lh.baseLaserHour : (typeof lh.runningHours === 'number' ? lh.runningHours : null);
        const baseTs = lh.baseTimestamp ? safeToISOString(lh.baseTimestamp) : (lh.installationDate ? safeToISOString(lh.installationDate) : (m.baselineDate ? safeToISOString(m.baselineDate) : null));
        return {
          id: lh.id || `${id}-L${idx + 1}`,
          name: lh.name || `Laser Head ${idx + 1}`,
          serialNo: lh.serialNo || lh.serialNumber || `${serialNo}-L${idx + 1}`,
          ratedLife: rated,
          warningLife: warn,
          contingencyCeiling: Number(lh.contingencyCeiling) || (rated + 3000),
          baseLaserHour: baseHour,
          baseTimestamp: baseTs,
          runtimeState: (!baseTs || baseHour === null) ? 'BASELINE_REQUIRED' : (lh.runtimeState || 'NORMAL'),
          lastRecalibrationDate: lh.lastRecalibrationDate || baseTs,
          calibrationHistory: Array.isArray(lh.calibrationHistory) ? lh.calibrationHistory : []
        };
      });
    }

    if (!lasers) {
      const rated = Number(m.ratedLife) || 25000;
      const warn = Number(m.warningLife) || Math.floor(rated * 0.8);
      const contingency = (typeof m.contingencyCeiling === 'number' && !isNaN(m.contingencyCeiling))
        ? m.contingencyCeiling
        : (Number(m.contingencyCeiling) || (rated + 3000));
      const baseHour = (typeof m.baseLaserHour === 'number' && !isNaN(m.baseLaserHour)) ? m.baseLaserHour : (typeof m.prevHour === 'number' && !isNaN(m.prevHour) ? m.prevHour : null);
      let baseTs = (m.baseTimestamp && !isNaN(new Date(m.baseTimestamp).getTime()))
        ? m.baseTimestamp
        : ((m.prevDate && !isNaN(new Date(m.prevDate).getTime())) ? new Date(m.prevDate).toISOString() : (m.baselineDate ? safeToISOString(m.baselineDate) : null));

      lasers = [{
        id: `${id}-L1`,
        name: 'Laser Head 1',
        serialNo: m.laserSerialNo || (serialNo ? `${serialNo}-L1` : 'LS-101'),
        ratedLife: rated,
        warningLife: warn,
        contingencyCeiling: contingency,
        baseLaserHour: baseHour,
        baseTimestamp: baseTs,
        runtimeState: (!baseTs || baseHour === null) ? 'BASELINE_REQUIRED' : 'NORMAL',
        lastRecalibrationDate: m.lastRecalibrationDate || baseTs,
        calibrationHistory: Array.isArray(m.calibrationHistory) ? m.calibrationHistory : []
      }];
    } else {
      lasers = lasers.map((laser: any, idx: number) => {
        const lRated = Number(laser.ratedLife || laser.maxRecommendedHours) || 25000;
        const lWarn = Number(laser.warningLife) || Math.floor(lRated * 0.8);
        const lContingency = (typeof laser.contingencyCeiling === 'number' && !isNaN(laser.contingencyCeiling))
          ? laser.contingencyCeiling
          : (Number(laser.contingencyCeiling) || (lRated + 3000));
        const lBase = (typeof laser.baseLaserHour === 'number' && !isNaN(laser.baseLaserHour)) ? laser.baseLaserHour : null;
        const lTs = (laser.baseTimestamp && !isNaN(new Date(laser.baseTimestamp).getTime())) ? laser.baseTimestamp : null;

        return {
          id: laser.id || `${id}-L${idx + 1}`,
          name: laser.name || `Laser Head ${idx + 1}`,
          serialNo: laser.serialNo || laser.serialNumber || `${serialNo}-L${idx + 1}`,
          ratedLife: lRated,
          warningLife: lWarn,
          contingencyCeiling: lContingency,
          baseLaserHour: lBase,
          baseTimestamp: lTs,
          runtimeState: (!lTs || lBase === null) ? 'BASELINE_REQUIRED' : (laser.runtimeState || 'NORMAL'),
          lastRecalibrationDate: laser.lastRecalibrationDate || lTs,
          calibrationHistory: Array.isArray(laser.calibrationHistory) ? laser.calibrationHistory : []
        };
      });
    }

    return {
      ...m,
      id,
      machineNo,
      machineName,
      serialNo,
      manufacturer,
      model,
      department,
      lasers,
      maintenanceHistory: Array.isArray(m.maintenanceHistory) ? m.maintenanceHistory : [],
      productProcessRecords: Array.isArray(m.productProcessRecords)
        ? m.productProcessRecords
        : [],
      lastUpdated: m.lastUpdated || new Date().toISOString()
    };
  },

  /**
   * Parse and map backup JSON from the Laser Hour Monitor into FSOS Machine & Laser Lifecycle model
   * Duplicate-safe matching and lifecycle preservation.
   */
  parseAndMapLaserMonitorJson(
    jsonText: string,
    existingFsosMachines: any[],
    existingCustomers: any[]
  ): {
    machinesFound: number;
    laserHeadsFound: number;
    existingMatched: number;
    newMachines: number;
    warnings: string[];
    mappedMachines: any[];
    importedMachineList: any[];
  } {
    const warnings: string[] = [];
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err: any) {
      throw new Error("Failed to parse JSON file. Please ensure it is a valid JSON export from Laser Hour Monitor.");
    }

    let rawList: any[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.machines)) rawList = parsed.machines;
      else if (Array.isArray(parsed.fleet)) rawList = parsed.fleet;
      else if (Array.isArray(parsed.data)) rawList = parsed.data;
      else if (parsed.id || parsed.machineNo || parsed.machineNumber) rawList = [parsed];
    }

    if (rawList.length === 0) {
      throw new Error("No machine records were detected in the uploaded JSON file.");
    }

    let laserHeadsFoundCount = 0;
    let existingMatchedCount = 0;
    let newMachinesCount = 0;

    // Map of current FSOS machines keyed by ID & Machine Number for O(1) lookup
    const resultMap = new Map<string, any>();
    existingFsosMachines.forEach(m => {
      const norm = LaserEngine.normalizeMachine(m);
      resultMap.set(norm.id, norm);
    });

    const importedMachineList: any[] = [];

    rawList.forEach((rawItem: any, idx: number) => {
      if (!rawItem || typeof rawItem !== 'object') {
        warnings.push(`Item #${idx + 1}: Skipped invalid non-object record.`);
        return;
      }

      const normalizedRaw = LaserEngine.normalizeMachine(rawItem);
      const rawLasers: any[] = normalizedRaw.lasers || [];
      laserHeadsFoundCount += rawLasers.length;

      // Find match in existing FSOS machines
      let existingMatchKey: string | null = null;

      if (resultMap.has(normalizedRaw.id)) {
        existingMatchKey = normalizedRaw.id;
      } else {
        const rawNo = (normalizedRaw.machineNo || normalizedRaw.machineNumber || '').trim().toLowerCase();
        const rawSerial = (normalizedRaw.serialNo || '').trim().toLowerCase();

        for (const [key, existingM] of resultMap.entries()) {
          const exNo = (existingM.machineNo || existingM.machineNumber || '').trim().toLowerCase();
          const exSerial = (existingM.serialNo || '').trim().toLowerCase();

          if (rawNo && exNo && rawNo === exNo) {
            existingMatchKey = key;
            break;
          }
          if (rawSerial && exSerial && rawSerial === exSerial) {
            existingMatchKey = key;
            break;
          }
        }
      }

      if (existingMatchKey) {
        // MATCHED -> MERGE DUPLICATE SAFELY
        existingMatchedCount++;
        const targetFsosMachine = resultMap.get(existingMatchKey)!;
        const targetLasers: any[] = [...(targetFsosMachine.lasers || [])];

        rawLasers.forEach((impL: any) => {
          const exLIdx = targetLasers.findIndex(
            (tl: any) => tl.id === impL.id || 
              (tl.serialNo && impL.serialNo && tl.serialNo.trim().toLowerCase() === impL.serialNo.trim().toLowerCase()) ||
              (tl.name && impL.name && tl.name.trim().toLowerCase() === impL.name.trim().toLowerCase())
          );

          if (exLIdx >= 0) {
            const exL = targetLasers[exLIdx];
            const mergedCalHist = [...(exL.calibrationHistory || [])];
            (impL.calibrationHistory || []).forEach((ch: any) => {
              const duplicate = mergedCalHist.some(
                (existingCh: any) => existingCh.date === ch.date && existingCh.actualHour === ch.actualHour
              );
              if (!duplicate) {
                mergedCalHist.push(ch);
              }
            });

            targetLasers[exLIdx] = {
              ...exL,
              name: impL.name || exL.name,
              serialNo: impL.serialNo || exL.serialNo,
              baseLaserHour: impL.baseLaserHour !== null && impL.baseLaserHour !== undefined ? impL.baseLaserHour : exL.baseLaserHour,
              baseTimestamp: impL.baseTimestamp || exL.baseTimestamp,
              ratedLife: impL.ratedLife || exL.ratedLife,
              warningLife: impL.warningLife || exL.warningLife,
              contingencyCeiling: impL.contingencyCeiling || exL.contingencyCeiling,
              calibrationHistory: mergedCalHist
            };
          } else {
            targetLasers.push(impL);
          }
        });

        const mergedMachine = {
          ...targetFsosMachine,
          model: normalizedRaw.model || targetFsosMachine.model,
          serialNo: targetFsosMachine.serialNo || normalizedRaw.serialNo,
          lasers: targetLasers,
          laserHeads: targetLasers,
          lastUpdated: new Date().toISOString()
        };

        resultMap.set(existingMatchKey, mergedMachine);
        importedMachineList.push(mergedMachine);
      } else {
        // NEW MACHINE RECORD
        newMachinesCount++;
        const rawCustName = (normalizedRaw.customerName || normalizedRaw.plantName || '').trim();
        const matchedCust = (existingCustomers || []).find(
          (c: any) => (c.name && rawCustName && c.name.toLowerCase() === rawCustName.toLowerCase()) ||
                      (c.site && rawCustName && c.site.toLowerCase() === rawCustName.toLowerCase())
        );

        const assignedCustName = matchedCust?.name || rawCustName || 'Cleanroom Customer';
        const assignedCustId = matchedCust?.id || normalizedRaw.customerId || `cust-${Date.now()}-${idx}`;

        const newFsosMachine = {
          ...normalizedRaw,
          id: normalizedRaw.id || `mch-imp-${Date.now()}-${idx}`,
          machineNumber: normalizedRaw.machineNo || normalizedRaw.machineNumber || `MCH-IMP-0${idx + 1}`,
          plantName: normalizedRaw.plantName || matchedCust?.site || 'Primary Cleanroom',
          customerName: assignedCustName,
          customerId: assignedCustId,
          lineId: normalizedRaw.lineId || 'line-01',
          contractType: normalizedRaw.contractType || 'STANDARD_SERVICE',
          status: normalizedRaw.status || 'OPERATIONAL',
          installDate: normalizedRaw.installDate || new Date().toISOString().split('T')[0],
          lastServiceDate: normalizedRaw.lastServiceDate || new Date().toISOString().split('T')[0],
          nextServiceDue: normalizedRaw.nextServiceDue || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
          healthScore: typeof normalizedRaw.healthScore === 'number' ? normalizedRaw.healthScore : 95,
          opticalPowerWatts: normalizedRaw.opticalPowerWatts || 250,
          laserModel: normalizedRaw.laserModel || (normalizedRaw.lasers?.[0]?.name || normalizedRaw.model || 'Laser System'),
          lasers: normalizedRaw.lasers || [],
          laserHeads: normalizedRaw.lasers || [],
          consumables: normalizedRaw.consumables || []
        };

        resultMap.set(newFsosMachine.id, newFsosMachine);
        importedMachineList.push(newFsosMachine);
      }
    });

    return {
      machinesFound: rawList.length,
      laserHeadsFound: laserHeadsFoundCount,
      existingMatched: existingMatchedCount,
      newMachines: newMachinesCount,
      warnings,
      mappedMachines: Array.from(resultMap.values()),
      importedMachineList
    };
  },

  /**
   * Export FSOS Machine + Laser Lifecycle source physical truth to JSON
   */
  exportLaserLifecycleJson(machines: any[]) {
    const exportData = {
      version: "0.9.0",
      exportDate: new Date().toISOString(),
      sourceSystem: "FSOS Machine Passport & Laser Lifecycle Engine",
      totalMachines: machines.length,
      machines: machines.map(m => {
        const norm = LaserEngine.normalizeMachine(m);
        return {
          id: norm.id,
          machineNumber: norm.machineNo || norm.machineNumber,
          model: norm.model,
          serialNo: norm.serialNo,
          manufacturer: norm.manufacturer,
          plantName: norm.plantName,
          customerName: norm.customerName,
          customerId: norm.customerId,
          status: norm.status,
          healthScore: norm.healthScore,
          lasers: (norm.lasers || []).map((l: any) => ({
            id: l.id,
            name: l.name,
            serialNo: l.serialNo,
            baseLaserHour: l.baseLaserHour,
            baseTimestamp: l.baseTimestamp,
            ratedLife: l.ratedLife || 25000,
            warningLife: l.warningLife || 20000,
            contingencyCeiling: l.contingencyCeiling || 30000,
            calibrationHistory: l.calibrationHistory || []
          }))
        };
      })
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fsos-laser-monitor-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
