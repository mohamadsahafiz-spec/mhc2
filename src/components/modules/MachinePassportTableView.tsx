import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Zap,
  Thermometer,
  Aperture,
  Crosshair,
  Layers,
  Package,
  ShieldCheck,
  Activity,
  ArrowRight,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders
} from 'lucide-react';
import { Machine, MHCRecord } from '../../types';
import { MachineMetrics, LaserEngine } from '../../utils/laserEngine';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { mechanicalPressConfig, motionTimings, motionEasings } from '../../theme/motion';

export type PassportSubjectId =
  | 'lifecycle'
  | 'temperature'
  | 'laser_power'
  | 'beam_profile'
  | 'focus_optimization'
  | 'product_process'
  | 'recommended_parts';

interface MachinePassportTableViewProps {
  machine: Machine;
  machineMetrics: MachineMetrics;
  machineMhcs: MHCRecord[];
  onSelectSubject: (subject: PassportSubjectId) => void;
  isDark: boolean;
  onOpenMhc?: () => void;
}

interface SubjectCardDef {
  id: PassportSubjectId;
  name: string;
  categoryTag: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
  badgeVariant?: 'emerald' | 'amber' | 'rose' | 'gray';
}

export const MachinePassportTableView: React.FC<MachinePassportTableViewProps> = ({
  machine,
  machineMetrics,
  machineMhcs,
  onSelectSubject,
  isDark,
  onOpenMhc
}) => {
  const shouldReduceMotion = !!useReducedMotion();
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Define the seven flat subject cards with restrained industrial styling
  const subjects: SubjectCardDef[] = [
    {
      id: 'lifecycle',
      name: 'Lifecycle & Health',
      categoryTag: 'LMS v2 Core',
      icon: Zap,
      badgeText: machineMetrics.status === 'BASELINE_REQUIRED' ? 'Baseline Required' : machineMetrics.status,
      badgeVariant:
        machineMetrics.status === 'SAFE'
          ? 'emerald'
          : machineMetrics.status === 'WARNING'
          ? 'amber'
          : machineMetrics.status === 'ALARM'
          ? 'rose'
          : 'gray'
    },
    {
      id: 'temperature',
      name: 'Temperature',
      categoryTag: 'Thermal Spec',
      icon: Thermometer,
      badgeText: `${(machine.temperatureRecords?.length || 0) + (machine.manualTemperatureReadings?.length || 0)} Logs`,
      badgeVariant: 'gray'
    },
    {
      id: 'laser_power',
      name: 'Laser Power',
      categoryTag: 'Optical Power',
      icon: Zap,
      badgeText: `${machine.laserPowerRecords?.length || 0} Records`,
      badgeVariant: 'gray'
    },
    {
      id: 'beam_profile',
      name: 'Beam Profile',
      categoryTag: 'Spatial Mode',
      icon: Aperture,
      badgeText: `${machine.beamProfileRecords?.length || 0} Records`,
      badgeVariant: 'gray'
    },
    {
      id: 'focus_optimization',
      name: 'Focus Optimization',
      categoryTag: 'Focal Alignment',
      icon: Crosshair,
      badgeText: `${machine.focusOptimizationRecords?.length || 0} Scans`,
      badgeVariant: 'gray'
    },
    {
      id: 'product_process',
      name: 'Product & Process',
      categoryTag: 'Process Verification',
      icon: Layers,
      badgeText: `${machine.productProcessRecords?.length || 0} Records`,
      badgeVariant: 'gray'
    },
    {
      id: 'recommended_parts',
      name: 'Recommended Items',
      categoryTag: 'Parts & Consumables',
      icon: Package,
      badgeText: `${machine.consumables?.length || 0} Items`,
      badgeVariant: 'gray'
    }
  ];

  // Helper renderers for Front Content
  const renderCardFrontContent = (subject: SubjectCardDef) => {
    switch (subject.id) {
      case 'lifecycle': {
        const lowestLifeLaser = machineMetrics.laserMetricsList[0];
        const minLifePct = lowestLifeLaser ? lowestLifeLaser.lifeRemainingPercent : 100;
        return (
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Operating Health
              </span>
              <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {machine.healthScore}%
              </span>
            </div>

            {/* Operating Hours Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  {lowestLifeLaser ? lowestLifeLaser.name : 'Main Head'}
                </span>
                <span className={`font-bold ${minLifePct < 20 ? 'text-rose-500' : minLifePct < 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {minLifePct.toFixed(1)}% remaining
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className={`h-full rounded-full transition-all ${
                    minLifePct < 20 ? 'bg-rose-500' : minLifePct < 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, minLifePct))}%` }}
                />
              </div>
            </div>

            <div className={`pt-2 border-t grid grid-cols-2 gap-2 text-[10px] font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
              <div>
                <span className="block opacity-75">Laser Heads:</span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                  {machineMetrics.totalLasers} Active
                </strong>
              </div>
              <div>
                <span className="block opacity-75">MHC Audits:</span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                  {machineMhcs.length} Logged
                </strong>
              </div>
            </div>
          </div>
        );
      }

      case 'temperature': {
        const coolingSpec = machine.mhcSpecs?.temperatureCooling;
        const hasCoolingSpec = coolingSpec?.targetTempCelsius !== undefined && coolingSpec?.targetTempCelsius !== null;
        const totalLogs = (machine.temperatureRecords?.length || 0) + (machine.manualTemperatureReadings?.length || 0);
        return (
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                MHC Cooling Target
              </span>
              <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {hasCoolingSpec ? `${coolingSpec.targetTempCelsius}°C` : '—'}
              </span>
            </div>

            <div className={`p-2 rounded-lg text-[11px] font-mono ${isDark ? 'bg-slate-900/60 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tolerance Window:</span>
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {hasCoolingSpec ? `±${coolingSpec.tempToleranceCelsius ?? 1.0}°C` : 'Unconfigured'}
                </span>
              </div>
            </div>

            <div className={`pt-2 border-t grid grid-cols-2 gap-2 text-[10px] font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
              <div>
                <span className="block opacity-75">Telemetry Logs:</span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{totalLogs} Available</strong>
              </div>
              <div>
                <span className="block opacity-75">Status:</span>
                <strong className={totalLogs > 0 ? 'text-emerald-500' : 'text-slate-400'}>
                  {totalLogs > 0 ? 'Synchronized' : 'No Data'}
                </strong>
              </div>
            </div>
          </div>
        );
      }

      case 'laser_power': {
        const powerSpec = machine.mhcSpecs?.laserPower;
        const hasPowerSpec = powerSpec?.targetPowerWatts !== undefined && powerSpec?.targetPowerWatts !== null;
        const totalLogs = machine.laserPowerRecords?.length || 0;
        return (
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Target Laser Power
              </span>
              <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {hasPowerSpec ? `${powerSpec.targetPowerWatts} W` : '—'}
              </span>
            </div>

            <div className={`p-2 rounded-lg text-[11px] font-mono ${isDark ? 'bg-slate-900/60 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Power Tolerance:</span>
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {hasPowerSpec ? `±${powerSpec.powerTolerancePercent ?? 10}%` : 'Unconfigured'}
                </span>
              </div>
            </div>

            <div className={`pt-2 border-t grid grid-cols-2 gap-2 text-[10px] font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
              <div>
                <span className="block opacity-75">Calibration Logs:</span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{totalLogs} Logged</strong>
              </div>
              <div>
                <span className="block opacity-75">Baseline:</span>
                <strong className={hasPowerSpec ? 'text-emerald-500' : 'text-amber-500'}>
                  {hasPowerSpec ? 'Established' : 'Pending'}
                </strong>
              </div>
            </div>
          </div>
        );
      }

      case 'beam_profile': {
        const beamMode = machine.mhcSpecs?.beamProfile?.profileMode;
        const totalLogs = machine.beamProfileRecords?.length || 0;
        return (
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Spatial Mode
              </span>
              <span className={`text-xs font-bold font-mono truncate max-w-[140px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {beamMode || 'Gaussian (TEM00)'}
              </span>
            </div>

            <div className={`p-2 rounded-lg text-[11px] font-mono ${isDark ? 'bg-slate-900/60 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Camera Inspection:</span>
                <span className={`font-bold ${totalLogs > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {totalLogs > 0 ? `${totalLogs} Frames` : 'No Captures'}
                </span>
              </div>
            </div>

            <div className={`pt-2 border-t grid grid-cols-2 gap-2 text-[10px] font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
              <div>
                <span className="block opacity-75">Records:</span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{totalLogs} Profiles</strong>
              </div>
              <div>
                <span className="block opacity-75">M² Status:</span>
                <strong className={totalLogs > 0 ? 'text-emerald-500' : 'text-slate-400'}>
                  {totalLogs > 0 ? 'Verified' : 'Unchecked'}
                </strong>
              </div>
            </div>
          </div>
        );
      }

      case 'focus_optimization': {
        const stageTol = machine.mhcSpecs?.stageCalibration?.toleranceUm;
        const agcTol = machine.mhcSpecs?.agcCalibration?.toleranceUm;
        const totalLogs = machine.focusOptimizationRecords?.length || 0;
        return (
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Stage Tolerance
              </span>
              <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {stageTol !== undefined && stageTol !== null ? `±${stageTol} µm` : '—'}
              </span>
            </div>

            <div className={`p-2 rounded-lg text-[11px] font-mono ${isDark ? 'bg-slate-900/60 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>AGC / Galvo Tol:</span>
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {agcTol !== undefined && agcTol !== null ? `±${agcTol} µm` : 'Unconfigured'}
                </span>
              </div>
            </div>

            <div className={`pt-2 border-t grid grid-cols-2 gap-2 text-[10px] font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
              <div>
                <span className="block opacity-75">Focus Scans:</span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{totalLogs} Scans</strong>
              </div>
              <div>
                <span className="block opacity-75">Rayleigh Margin:</span>
                <strong className={totalLogs > 0 ? 'text-emerald-500' : 'text-slate-400'}>
                  {totalLogs > 0 ? 'Calibrated' : 'Pending'}
                </strong>
              </div>
            </div>
          </div>
        );
      }

      case 'product_process': {
        const totalLogs = machine.productProcessRecords?.length || 0;
        const latestRec = machine.productProcessRecords?.[0];
        return (
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Active Process
              </span>
              <span className={`text-xs font-bold font-mono truncate max-w-[140px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {latestRec?.productName || latestRec?.recipeName || 'Production Job'}
              </span>
            </div>

            <div className={`p-2 rounded-lg text-[11px] font-mono ${isDark ? 'bg-slate-900/60 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Recipe Matrix:</span>
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {latestRec?.recipeName ? latestRec.recipeName : `${totalLogs} Configured`}
                </span>
              </div>
            </div>

            <div className={`pt-2 border-t grid grid-cols-2 gap-2 text-[10px] font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
              <div>
                <span className="block opacity-75">Audit History:</span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{totalLogs} Records</strong>
              </div>
              <div>
                <span className="block opacity-75">Via Quality:</span>
                <strong className={latestRec?.overallVerdict === 'PASS' ? 'text-emerald-500' : 'text-slate-400'}>
                  {latestRec?.overallVerdict || 'Standard'}
                </strong>
              </div>
            </div>
          </div>
        );
      }

      case 'recommended_parts': {
        const consumables = machine.consumables || [];
        const familyName = machine.model?.toUpperCase().includes('302')
          ? 'BMD302W'
          : machine.model?.toUpperCase().includes('250')
          ? 'BMD250WM'
          : 'Universal';
        const lowestConsumable = consumables.length > 0
          ? consumables.reduce((min, c) => (c.currentLifePercent < min.currentLifePercent ? c : min), consumables[0])
          : null;

        return (
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Machine Family
              </span>
              <span className={`text-xs font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {familyName}
              </span>
            </div>

            <div className={`p-2 rounded-lg text-[11px] font-mono ${isDark ? 'bg-slate-900/60 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Lowest Consumable:</span>
                <span className={`font-bold ${lowestConsumable && lowestConsumable.currentLifePercent < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {lowestConsumable ? `${lowestConsumable.name.slice(0, 14)} (${lowestConsumable.currentLifePercent}%)` : 'All Optimal'}
                </span>
              </div>
            </div>

            <div className={`pt-2 border-t grid grid-cols-2 gap-2 text-[10px] font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
              <div>
                <span className="block opacity-75">Tracked Parts:</span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{consumables.length} Items</strong>
              </div>
              <div>
                <span className="block opacity-75">Stock Status:</span>
                <strong className="text-emerald-500">Available</strong>
              </div>
            </div>
          </div>
        );
      }
    }
  };

  // Helper renderers for Back Content (Engineering Specs & Actions)
  const renderCardBackContent = (subject: SubjectCardDef) => {
    return (
      <div className="flex flex-col justify-between h-full space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Technical Specs
              </span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                • {subject.categoryTag}
              </span>
            </div>

            {/* Flip back to front button */}
            <button
              type="button"
              aria-label={`Flip back to ${subject.name} overview`}
              onClick={(e) => toggleFlip(subject.id, e)}
              title="Flip back to front"
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-[#1C2026] border-[#2B323A] text-slate-400 hover:text-white hover:bg-[#242A32]'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`text-xs space-y-1.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {subject.id === 'lifecycle' && (
              <>
                <p className="text-[11px] leading-relaxed">
                  LMS v2 Runtime Engine: {machineMetrics.laserMetricsList.length} laser head(s) evaluated against rated operating lifecycle limits.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Last MHC date: {machine.lastMhcDate || 'None recorded'}
                </div>
              </>
            )}

            {subject.id === 'temperature' && (
              <>
                <p className="text-[11px] leading-relaxed">
                  Multi-channel thermal sensors & chiller monitoring. Authoritative USL/ASL tolerance boundary verification.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Target: {machine.mhcSpecs?.temperatureCooling?.targetTempCelsius ? `${machine.mhcSpecs.temperatureCooling.targetTempCelsius}°C` : 'Not set'}
                </div>
              </>
            )}

            {subject.id === 'laser_power' && (
              <>
                <p className="text-[11px] leading-relaxed">
                  Laser power meter sensor audit, power degradation curve tracking, and multi-point calibration logs.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Target: {machine.mhcSpecs?.laserPower?.targetPowerWatts ? `${machine.mhcSpecs.laserPower.targetPowerWatts} W` : 'Not set'}
                </div>
              </>
            )}

            {subject.id === 'beam_profile' && (
              <>
                <p className="text-[11px] leading-relaxed">
                  Spatial beam intensity profiling, CCD camera frame evidence, ellipticity, and Gaussian distribution tests.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Mode: {machine.mhcSpecs?.beamProfile?.profileMode || 'Standard'}
                </div>
              </>
            )}

            {subject.id === 'focus_optimization' && (
              <>
                <p className="text-[11px] leading-relaxed">
                  Focal depth sweep analysis, Rayleigh length margin, stage positioning, and AGC scanner alignment.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Tolerance: ±{machine.mhcSpecs?.stageCalibration?.toleranceUm ?? 2} µm
                </div>
              </>
            )}

            {subject.id === 'product_process' && (
              <>
                <p className="text-[11px] leading-relaxed">
                  Production recipe parameter validation, substrate via geometry inspection, and offset compensation.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Active jobs: {machine.productProcessRecords?.length || 0}
                </div>
              </>
            )}

            {subject.id === 'recommended_parts' && (
              <>
                <p className="text-[11px] leading-relaxed">
                  Authoritative spare parts catalog, optical window replacements, filtration elements, and maintenance kits.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Family: {machine.model}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions on back of card */}
        <div className="space-y-1.5">
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSubject(subject.id);
            }}
            className="w-full text-xs font-sans font-semibold justify-center"
          >
            Open {subject.name} Workspace
          </Button>
          <button
            type="button"
            onClick={(e) => toggleFlip(subject.id, e)}
            className={`w-full py-1 text-[10px] font-mono text-center transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ← Return to Overview
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Machine Table Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-[#2B323A]">
        <div>
          <h2 className={`text-base font-bold font-mono tracking-tight flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Activity className="w-4 h-4 text-slate-400" />
            Engineering Inspection Table
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Select an engineering subject card to inspect telemetry, configure baselines, or review inspection records.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`px-2.5 py-1 rounded-lg border font-bold ${
            isDark ? 'bg-[#1C2026] border-[#2B323A] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            7 Systems Active
          </span>
        </div>
      </div>

      {/* The 7 Spatial Engineering Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {subjects.map((subject, index) => {
          const isFlipped = !!flippedCards[subject.id];
          const Icon = subject.icon;

          return (
            <motion.div
              key={subject.id}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionTimings.quick,
                delay: shouldReduceMotion ? 0 : index * 0.04,
                ease: motionEasings.responsive
              }}
              whileHover={shouldReduceMotion ? undefined : { y: -3, transition: { duration: 0.15 } }}
              className="group relative cursor-pointer"
              style={{ perspective: 1000 }}
              onClick={() => {
                if (!isFlipped) {
                  onSelectSubject(subject.id);
                }
              }}
            >
              {/* Card Surface with 3D Flip capability */}
              <div
                className={`relative min-h-[250px] w-full rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between ${
                  isDark
                    ? 'bg-[#16191D] border-[#2B323A] hover:border-slate-500 hover:shadow-lg hover:shadow-black/30'
                    : 'bg-white border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-md'
                }`}
              >
                {!isFlipped ? (
                  /* Front Face */
                  <div className="flex flex-col justify-between h-full space-y-3">
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                            isDark ? 'bg-[#1C2026] border-[#2B323A] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider block truncate ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {subject.categoryTag}
                            </span>
                            <h3 className={`text-sm font-bold font-mono tracking-tight truncate ${
                              isDark ? 'text-slate-100' : 'text-slate-900'
                            }`}>
                              {subject.name}
                            </h3>
                          </div>
                        </div>

                        {/* Flip action toggle */}
                        <button
                          type="button"
                          aria-label={`Flip ${subject.name} card`}
                          onClick={(e) => toggleFlip(subject.id, e)}
                          title="Flip card for specs & actions"
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isDark
                              ? 'bg-[#1C2026] border-[#2B323A] text-slate-400 hover:text-white hover:bg-[#242A32]'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Badge / Status Indicator */}
                      {subject.badgeText && (
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <Badge variant={subject.badgeVariant || 'gray'} size="sm">
                            {subject.badgeText}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Middle Telemetry / Status Data */}
                    <div className="flex-1">
                      {renderCardFrontContent(subject)}
                    </div>

                    {/* Card Footer: Subtle Enter affordance */}
                    <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono font-medium ${
                      isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
                    }`}>
                      <span className={`text-[11px] transition-colors ${
                        isDark ? 'group-hover:text-slate-200' : 'group-hover:text-slate-900'
                      }`}>
                        Open workspace →
                      </span>
                      <ArrowRight className={`w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                        isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-900'
                      }`} />
                    </div>
                  </div>
                ) : (
                  /* Back Face */
                  renderCardBackContent(subject)
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
