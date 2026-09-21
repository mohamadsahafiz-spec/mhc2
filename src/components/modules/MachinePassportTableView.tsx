import React, { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  Zap,
  Thermometer,
  Aperture,
  Crosshair,
  Layers,
  Package,
  Activity,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Machine, MHCRecord } from '../../types';
import { MachineMetrics } from '../../utils/laserEngine';
import { ImageStore } from '../../utils/imageStore';
import { BeamProfileEngine } from '../../utils/beamProfileEngine';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { FlipCard } from '../common/FlipCard';
import { ProgressBar } from '../common/ProgressBar';

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
              <ProgressBar
                value={Math.min(100, Math.max(0, minLifePct))}
                variant={minLifePct < 20 ? 'danger' : minLifePct < 40 ? 'warning' : 'success'}
                size="xs"
                animated={true}
              />
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

  // Helper renderers for Back Content (Engineering Preview & Actions)
  const renderCardBackContent = (subject: SubjectCardDef) => {
    return (
      <div className="flex flex-col justify-between h-full">
        {/* Card Back Header */}
        <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-xs font-mono font-bold tracking-tight truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {subject.name}
            </span>
          </div>

          {/* Flip back to front button */}
          <button
            type="button"
            aria-label={`Flip back to ${subject.name} overview`}
            onClick={(e) => toggleFlip(subject.id, e)}
            title="Flip back to front"
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              isDark
                ? 'bg-[#1C2026] border-[#2B323A] text-slate-400 hover:text-white hover:bg-[#242A32]'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subsystem Bold Visual Hero Preview */}
        <div className="flex-1 flex flex-col justify-center py-1 min-h-0">
            {subject.id === 'lifecycle' && (() => {
              const healthScore = machine.healthScore ?? Math.round(machineMetrics.healthPercent) ?? 95;
              const lasers = machineMetrics.laserMetricsList || [];
              const firstLaser = lasers[0];
              const hours = firstLaser ? (firstLaser.currentHour ?? firstLaser.estimatedCurrentHour ?? firstLaser.baseLaserHour ?? 642) : 642;
              const rated = firstLaser?.ratedLife ?? 10000;
              const radius = 38;
              const circumference = 2 * Math.PI * radius;
              const progressOffset = circumference - (healthScore / 100) * circumference;

              return (
                <div className="flex flex-col items-center justify-center space-y-2.5 py-1">
                  {/* Circular Health Arc Hero */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                      {/* Background Track */}
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        fill="none"
                        stroke={isDark ? '#1E242C' : '#E2E8F0'}
                        strokeWidth="7"
                      />
                      {/* Active Health Arc */}
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        fill="none"
                        stroke={healthScore >= 90 ? (isDark ? '#34D399' : '#10B981') : '#F59E0B'}
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>

                    {/* Centered Health Score */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-black font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {healthScore}%
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-widest text-slate-400 -mt-0.5">
                        HEALTH
                      </span>
                    </div>
                  </div>

                  {/* Supporting Minimal Meta */}
                  <div className="text-center space-y-0.5">
                    <div className={`text-[11px] font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {firstLaser?.name || 'Laser Head A'} • {hours.toLocaleString()} / {rated.toLocaleString()} h
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      LMS v2 Runtime • {machineMetrics.status === 'SAFE' ? 'OPTIMAL' : machineMetrics.status}
                    </div>
                  </div>
                </div>
              );
            })()}

            {subject.id === 'temperature' && (() => {
              const cooling = machine.mhcSpecs?.temperatureCooling;
              const target = cooling?.targetTempCelsius ?? 23.0;
              const tol = cooling?.tempToleranceCelsius ?? 1.0;
              const latestRec = machine.temperatureRecords?.[0];
              const avg = latestRec?.stats?.avg ?? target;

              // Sample telemetry points for the hero waveform
              const rawPoints = latestRec?.channelData?.[1] || latestRec?.channelData?.[0] || [];
              const sampleCount = 20;
              const sampled = rawPoints.length > 0
                ? rawPoints.filter((_, i) => i % Math.max(1, Math.floor(rawPoints.length / sampleCount))).slice(0, sampleCount).map(p => p.val)
                : [22.95, 23.02, 23.08, 22.98, 23.04, 23.12, 23.01, 22.96, 23.05, 23.10, 23.02, 22.97, 23.04, 23.08, 23.00, 22.98, 23.05, 23.02, 22.99, 23.01];

              const ptMin = Math.min(...sampled, target - tol * 0.8);
              const ptMax = Math.max(...sampled, target + tol * 0.8);
              const range = (ptMax - ptMin) || 1;

              const svgPoints = sampled.map((val, idx) => {
                const x = (idx / (sampled.length - 1)) * 200;
                const y = 48 - ((val - ptMin) / range) * 36;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');

              const targetY = 48 - ((target - ptMin) / range) * 36;

              return (
                <div className="space-y-2 py-0.5">
                  {/* Large Hero Temperature Display */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className={`text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {avg.toFixed(1)}°C
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                        / {target.toFixed(1)}°C (±{tol}°C)
                      </span>
                    </div>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold">
                      STABLE
                    </span>
                  </div>

                  {/* Thermal Waveform Graph Hero */}
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#0E1114] border-[#222830]' : 'bg-slate-50 border-slate-200'}`}>
                    <svg viewBox="0 0 200 56" className="w-full h-16 overflow-visible">
                      <defs>
                        <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isDark ? '#38BDF8' : '#0EA5E9'} stopOpacity="0.25" />
                          <stop offset="100%" stopColor={isDark ? '#38BDF8' : '#0EA5E9'} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Target dashed center guide */}
                      <line x1="0" y1={targetY} x2="200" y2={targetY} stroke={isDark ? '#475569' : '#CBD5E1'} strokeWidth="1" strokeDasharray="3 3" />

                      {/* Area Fill */}
                      <polygon
                        fill="url(#tempAreaGrad)"
                        points={`0,54 ${svgPoints} 200,54`}
                      />

                      {/* Waveform Line */}
                      <polyline
                        fill="none"
                        stroke={isDark ? '#E2E8F0' : '#334155'}
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={svgPoints}
                      />
                    </svg>

                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span>CH1 COOLING LOOP</span>
                      <span>60 MIN TELEMETRY</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {subject.id === 'laser_power' && (() => {
              const records = [...(machine.laserPowerRecords || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const latestRec = records[0];
              const target = machine.mhcSpecs?.laserPower?.targetPowerWatts ?? 15.0;
              const powerA = latestRec?.laserSource?.headA ?? target;
              const powerB = latestRec?.laserSource?.headB ?? target;
              const freq = latestRec?.frequencyKhz ?? 50;

              return (
                <div className="space-y-2 py-0.5">
                  {/* Dual Head Laser Power Display Hero */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Head A Power Block */}
                    <div className={`p-2 rounded-lg border flex flex-col justify-between ${isDark ? 'bg-[#0E1114] border-[#222830]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-[9px] font-mono text-slate-400 font-semibold flex items-center justify-between">
                        <span>HEAD A</span>
                        <span className="text-emerald-500 font-bold">PASS</span>
                      </div>
                      <div className="py-0.5">
                        <div className={`text-xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {powerA.toFixed(1)} <span className="text-[11px] font-normal text-slate-400">W</span>
                        </div>
                      </div>
                      {/* Optical Pulse Waveform */}
                      <svg viewBox="0 0 100 18" className="w-full h-4 overflow-visible">
                        <line x1="0" y1="14" x2="100" y2="14" stroke={isDark ? '#2B323A' : '#CBD5E1'} strokeWidth="1" />
                        <polyline
                          fill="none"
                          stroke={isDark ? '#38BDF8' : '#0284C7'}
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points="0,14 8,14 12,3 16,14 26,14 30,3 34,14 44,14 48,3 52,14 62,14 66,3 70,14 80,14 84,3 88,14 100,14"
                        />
                      </svg>
                      <div className="text-[8px] font-mono text-slate-500 pt-0.5 flex justify-between">
                        <span>SOURCE</span>
                        <span>{freq} kHz</span>
                      </div>
                    </div>

                    {/* Head B Power Block */}
                    <div className={`p-2 rounded-lg border flex flex-col justify-between ${isDark ? 'bg-[#0E1114] border-[#222830]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-[9px] font-mono text-slate-400 font-semibold flex items-center justify-between">
                        <span>HEAD B</span>
                        <span className="text-emerald-500 font-bold">PASS</span>
                      </div>
                      <div className="py-0.5">
                        <div className={`text-xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {powerB.toFixed(1)} <span className="text-[11px] font-normal text-slate-400">W</span>
                        </div>
                      </div>
                      {/* Optical Pulse Waveform */}
                      <svg viewBox="0 0 100 18" className="w-full h-4 overflow-visible">
                        <line x1="0" y1="14" x2="100" y2="14" stroke={isDark ? '#2B323A' : '#CBD5E1'} strokeWidth="1" />
                        <polyline
                          fill="none"
                          stroke={isDark ? '#38BDF8' : '#0284C7'}
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points="0,14 8,14 12,3 16,14 26,14 30,3 34,14 44,14 48,3 52,14 62,14 66,3 70,14 80,14 84,3 88,14 100,14"
                        />
                      </svg>
                      <div className="text-[8px] font-mono text-slate-500 pt-0.5 flex justify-between">
                        <span>SOURCE</span>
                        <span>{freq} kHz</span>
                      </div>
                    </div>
                  </div>

                  {/* Optical Calibration Status Footer */}
                  <div className={`px-2 py-1.5 rounded border flex items-center justify-between text-[9px] font-mono ${isDark ? 'bg-[#111418] border-[#222830] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>TARGET: {target.toFixed(1)} W</span>
                    </div>
                    <span className="text-emerald-500 font-bold">CALIBRATED</span>
                  </div>
                </div>
              );
            })()}

            {subject.id === 'beam_profile' && (() => {
              const latestRec = machine.beamProfileRecords?.[0];
              const rawImg6A = latestRec?.readings?.['6A']?.imageDataUrl;
              const img6A = ImageStore.resolveImage(rawImg6A) || rawImg6A || BeamProfileEngine.generateSyntheticBeamSvg('6A', '#f59e0b');
              const dia6A = latestRec?.readings?.['6A']?.measuredDiameterMm ?? 3.5;

              return (
                <div className="space-y-1.5 py-0.5">
                  {/* Large Dominant Beam Profile Viewport */}
                  <div className="relative w-full h-28 rounded-lg bg-[#050708] border border-slate-700/80 overflow-hidden flex items-center justify-center shadow-inner">
                    {/* Real Beam Capture Image */}
                    <img
                      src={img6A}
                      alt="Beam Profile Camera Snapshot"
                      className="w-full h-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />

                    {/* Optical Crosshair & Reticle Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line x1="50" y1="0" x2="50" y2="100" stroke="#00ffff" strokeWidth="0.5" strokeDasharray="2 2" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#00ffff" strokeWidth="0.5" strokeDasharray="2 2" />
                      <circle cx="50" cy="50" r="25" fill="none" stroke="#00ffff" strokeWidth="0.5" strokeDasharray="1 3" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#00ffff" strokeWidth="0.5" strokeDasharray="1 4" />
                    </svg>

                    {/* Corner Reticle Watermark */}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-slate-700 text-[8px] font-mono text-slate-300">
                      CCD CAM • 6A
                    </div>

                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-slate-700 text-[9px] font-mono font-bold text-slate-200">
                      Ø {dia6A.toFixed(2)} mm
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 px-0.5">
                    <span>M² SPATIAL GAUSSIAN MODE</span>
                    <span className="text-emerald-500 font-semibold">M² &lt; 1.15</span>
                  </div>
                </div>
              );
            })()}

            {subject.id === 'focus_optimization' && (() => {
              const latestRec = machine.focusOptimizationRecords?.[0];
              const bestPos = latestRec?.laser1?.selectedBestFocusPosition || '0';

              return (
                <div className="space-y-2 py-0.5">
                  {/* Focal Depth Sweep Curve SVG Hero */}
                  <div className={`p-2 rounded-lg border space-y-1.5 ${isDark ? 'bg-[#0E1114] border-[#222830]' : 'bg-slate-50 border-slate-200'}`}>
                    <svg viewBox="0 0 200 52" className="w-full h-14 overflow-visible">
                      <defs>
                        <linearGradient id="focusBeamGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#64748B" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#64748B" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>

                      {/* Upper & Lower Rayleigh Parabolic Envelope */}
                      <path
                        d="M 0,6 Q 100,24 200,6 L 200,46 Q 100,28 0,46 Z"
                        fill="url(#focusBeamGrad)"
                        opacity={isDark ? '0.4' : '0.2'}
                      />
                      <path d="M 0,6 Q 100,24 200,6" fill="none" stroke={isDark ? '#94A3B8' : '#475569'} strokeWidth="1.25" />
                      <path d="M 0,46 Q 100,28 200,46" fill="none" stroke={isDark ? '#94A3B8' : '#475569'} strokeWidth="1.25" />

                      {/* Center Focal Axis Line */}
                      <line x1="0" y1="26" x2="200" y2="26" stroke={isDark ? '#334155' : '#CBD5E1'} strokeWidth="0.75" strokeDasharray="2 2" />

                      {/* Best Focus Waist Marker (Pos 0) */}
                      <line x1="100" y1="2" x2="100" y2="50" stroke="#34D399" strokeWidth="1.5" />
                      <circle cx="100" cy="26" r="3.5" fill="#34D399" />
                    </svg>

                    {/* Sweep Step Scale */}
                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-400 px-1 border-t border-slate-200 dark:border-slate-800 pt-1">
                      <span>-3</span>
                      <span>-2</span>
                      <span>-1</span>
                      <span className="font-bold text-emerald-400 text-[9px]">0 (WAIST)</span>
                      <span>+1</span>
                      <span>+2</span>
                      <span>+3</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 px-0.5">
                    <span>OPTIMAL SPOT: POS {bestPos}</span>
                    <span className="text-emerald-500 font-semibold">STAGE ±2 µm</span>
                  </div>
                </div>
              );
            })()}

            {subject.id === 'product_process' && (() => {
              const latestRec = machine.productProcessRecords?.[0];
              const recipeName = latestRec?.recipeName || 'RCP-VIA-50UM-V2';
              const topVia = latestRec?.laser1Via?.topWidthUm ?? 51.2;
              const botVia = latestRec?.laser1Via?.bottomWidthUm ?? 23.4;

              return (
                <div className="space-y-1.5 py-0.5">
                  {/* Micro-via Cross-Section SEM Diagram Hero */}
                  <div className={`p-2 rounded-lg border space-y-1 ${isDark ? 'bg-[#0E1114] border-[#222830]' : 'bg-slate-50 border-slate-200'}`}>
                    <svg viewBox="0 0 200 54" className="w-full h-14">
                      {/* Substrate layer top & bottom */}
                      <rect x="10" y="8" width="180" height="4" fill={isDark ? '#334155' : '#CBD5E1'} rx="1" />
                      <rect x="10" y="42" width="180" height="4" fill={isDark ? '#334155' : '#CBD5E1'} rx="1" />

                      {/* Laser drilled via trapezoid */}
                      <polygon
                        points="60,12 140,12 120,42 80,42"
                        fill={isDark ? '#1E242C' : '#F1F5F9'}
                        stroke={isDark ? '#38BDF8' : '#0284C7'}
                        strokeWidth="1.25"
                      />

                      {/* Laser beam drill arrow */}
                      <line x1="100" y1="0" x2="100" y2="28" stroke="#F59E0B" strokeWidth="1.25" strokeDasharray="2 1" />

                      {/* Top Dimension Text */}
                      <text x="100" y="7" textAnchor="middle" fill={isDark ? '#E2E8F0' : '#1E293B'} fontSize="7" fontFamily="monospace" fontWeight="bold">
                        Ø {topVia.toFixed(1)} µm
                      </text>

                      {/* Bottom Dimension Text */}
                      <text x="100" y="52" textAnchor="middle" fill={isDark ? '#94A3B8' : '#475569'} fontSize="7" fontFamily="monospace">
                        Ø {botVia.toFixed(1)} µm
                      </text>
                    </svg>

                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 pt-0.5 border-t border-slate-200 dark:border-slate-800">
                      <span className="truncate max-w-[120px]">{recipeName}</span>
                      <span className="text-emerald-500 font-bold">PASS (TAPER 81°)</span>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-slate-500 text-center">
                    2.2W • 50kHz • 2 shots / via
                  </div>
                </div>
              );
            })()}

            {subject.id === 'recommended_parts' && (() => {
              const consumables = machine.consumables || [];
              const defaultItem = consumables[0] || { name: 'Optical Protection Glass', currentLifePercent: 85, estimatedDaysRemaining: 180 };
              const lifePct = defaultItem.currentLifePercent ?? 85;

              return (
                <div className="space-y-2 py-0.5">
                  {/* Optical Part Component Blueprint Hero */}
                  <div className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${isDark ? 'bg-[#0E1114] border-[#222830]' : 'bg-slate-50 border-slate-200'}`}>
                    {/* CAD Schematic Lens Element */}
                    <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                      <svg viewBox="0 0 64 64" className="w-full h-full">
                        {/* Outer mount ring */}
                        <circle cx="32" cy="32" r="28" fill="none" stroke={isDark ? '#334155' : '#CBD5E1'} strokeWidth="1.5" strokeDasharray="3 2" />
                        {/* Glass element body */}
                        <circle cx="32" cy="32" r="22" fill={isDark ? '#131920' : '#F1F5F9'} stroke={isDark ? '#94A3B8' : '#475569'} strokeWidth="1.5" />
                        {/* AR coating reflection highlight */}
                        <path d="M 20,20 Q 32,16 44,20" fill="none" stroke={isDark ? '#38BDF8' : '#0284C7'} strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 24,24 Q 32,21 40,24" fill="none" stroke={isDark ? '#38BDF8' : '#0284C7'} strokeWidth="0.75" opacity="0.6" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Component Info & Life */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className={`text-[10px] font-mono font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {defaultItem.name}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold font-mono text-emerald-500">
                          {lifePct}%
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          life remaining
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">
                        ~{defaultItem.estimatedDaysRemaining ?? 180} days service
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 px-0.5">
                    <span>BMD CONSUMABLE CATALOG</span>
                    <span className="text-slate-400">ACTIVE</span>
                  </div>
                </div>
              );
            })()}
          </div>

        {/* Actions on back of card — fixed-height action area anchored to bottom */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSubject(subject.id);
            }}
            className="w-full text-xs font-mono font-semibold justify-center"
          >
            → Open
          </Button>
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
            Click any card to flip for technical specifications, or select Open Workspace to enter subsystem diagnostics.
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
        {subjects.map((subject) => {
          const isFlipped = !!flippedCards[subject.id];
          const Icon = subject.icon;

          const frontContent = (
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
                    title="Flip card for technical specs"
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

              {/* Card Footer: Clear Flip & Open Affordances */}
              <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono font-medium ${
                isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
              }`}>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <RotateCw className="w-3 h-3 text-slate-400" />
                  Click to flip
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSubject(subject.id);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                    isDark
                      ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                      : 'text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50'
                  }`}
                >
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );

          const backContent = renderCardBackContent(subject);

          return (
            <FlipCard
              key={subject.id}
              id={`machine-card-${subject.id}`}
              isFlipped={isFlipped}
              onFlipChange={(flipped) => {
                setFlippedCards((prev) => ({ ...prev, [subject.id]: flipped }));
              }}
              frontContent={frontContent}
              backContent={backContent}
              axis="y"
              tilt={3.5}
              hoverScale={1.01}
              isDark={isDark}
              ariaLabel={`${subject.name} machine inspection card`}
            />
          );
        })}
      </div>
    </div>
  );
};
