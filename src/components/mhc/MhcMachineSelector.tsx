import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  Building2, 
  Calendar, 
  Clock, 
  Activity, 
  Play, 
  ChevronRight, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Machine, MHCSession } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { LaserEngine } from '../../utils/laserEngine';
import { hasMeaningfulMhcProgress } from '../../utils/mhcAutopilotBrain';

interface MhcMachineSelectorProps {
  machines: Machine[];
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  mhcSessions: MHCSession[];
  onStartNewSession: (machineId: string) => void;
  onContinueSession: (sessionId: string) => void;
}

export const MhcMachineSelector: React.FC<MhcMachineSelectorProps> = ({
  machines,
  selectedMachineId,
  onSelectMachine,
  mhcSessions,
  onStartNewSession,
  onContinueSession
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sortedMachines = useMemo(() => {
    return LaserEngine.normalizeMachines(machines);
  }, [machines]);

  const selectedMachine = sortedMachines.find((m) => m.id === selectedMachineId) || sortedMachines[0] || machines[0];

  const filteredMachines = sortedMachines.filter(
    (m) =>
      m.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.machineNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.plantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Active / Incomplete sessions for selected machine
  const activeSessionForSelected = mhcSessions.find(
    (s) => s.machineId === selectedMachineId && s.completionStatus !== 'COMPLETED'
  );

  // Count completed stages for session
  const getCompletedStagesCount = (session: MHCSession) => {
    return Object.values(session.sectionStatuses).filter((st) => st === 'COMPLETED').length;
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-card border border-theme-default shadow-theme-card">
        <div>
          <h2 className="text-xl font-bold text-theme-primary flex items-center gap-2 font-theme-heading">
            <Activity className="w-5 h-5 text-emerald-500" />
            Select Machine for Health Check (MHC)
          </h2>
          <p className="text-sm text-theme-muted mt-1">
            Choose a cleanroom machine from the fleet to launch or continue an operational MHC inspection session.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search model, serial, customer..."
            className="w-full bg-canvas border border-theme-default rounded-input pl-9 pr-3 py-2 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Machine Selection Grid (Card / List - NO Dropdown) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMachines.map((m) => {
          const isSelected = m.id === selectedMachineId;
          const activeSess = mhcSessions.find(
            (s) => s.machineId === m.id && s.completionStatus !== 'COMPLETED'
          );
          const completedStages = activeSess ? getCompletedStagesCount(activeSess) : 0;

          return (
            <Card
              key={m.id}
              onClick={() => onSelectMachine(m.id)}
              className={`cursor-pointer transition-all border ${
                isSelected
                  ? 'border-emerald-500/80 bg-surface shadow-lg shadow-emerald-950/10 ring-2 ring-emerald-500/40'
                  : 'border-theme-default bg-surface hover:border-theme-strong hover:bg-surface'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-theme-muted" />
                    {m.customerName}
                  </div>
                  <h3 className="text-base font-bold text-theme-primary font-theme-heading">{m.model}</h3>
                  <div className="font-mono text-xs text-emerald-500 dark:text-emerald-400 mt-0.5">
                    SN: {m.serialNumber} • {m.machineNumber}
                  </div>
                </div>
                <Badge
                  variant={
                    m.status === 'OPERATIONAL'
                      ? 'success'
                      : m.status === 'NEEDS_MAINTENANCE'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {m.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-theme-subtle flex items-center justify-between text-xs text-theme-muted">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-theme-muted" />
                  <span>Status: <strong className={
                    LaserEngine.getMachineHealthStatus(m) === 'PASS'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : LaserEngine.getMachineHealthStatus(m) === 'WARNING'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }>{LaserEngine.getMachineHealthStatus(m)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-theme-muted" />
                  <span>Last MHC: {m.lastMhcDate}</span>
                </div>
              </div>

              {activeSess && hasMeaningfulMhcProgress(activeSess) && (
                <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Incomplete Session ({completedStages}/8)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">{activeSess.id}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Selected Machine Identity / Passport Summary + Continue Banner */}
      {selectedMachine && (
        <div className="bg-surface border border-theme-default rounded-card p-6 space-y-6 shadow-theme-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-theme-subtle">
            <div className="flex items-start gap-4">
              {selectedMachine.photos && selectedMachine.photos[0] ? (
                <img
                  src={selectedMachine.photos[0]}
                  alt={selectedMachine.model}
                  className="w-20 h-20 rounded-xl object-cover border border-theme-default bg-canvas"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-canvas border border-theme-default flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-theme-muted" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-badge bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    MACHINE IDENTITY PASSPORT
                  </span>
                  <span className="text-xs text-theme-muted font-mono">
                    {selectedMachine.machineNumber}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-theme-primary mt-1 font-theme-heading">
                  {selectedMachine.model}
                </h3>
                <p className="text-sm text-theme-muted mt-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-theme-muted" />
                  <span>{selectedMachine.customerName}</span> • <span>{selectedMachine.plantName}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-theme-secondary font-mono">
                  <span className="bg-canvas px-2.5 py-1 rounded-badge border border-theme-default">
                    SN: {selectedMachine.serialNumber}
                  </span>
                  <span className="bg-canvas px-2.5 py-1 rounded-badge border border-theme-default">
                    Line: {selectedMachine.productionLineName || 'Cleanroom Line A'}
                  </span>
                  <span className="bg-canvas px-2.5 py-1 rounded-badge border border-theme-default">
                    Lasers: {selectedMachine.laserHeads?.length || 2} Heads
                  </span>
                </div>
              </div>
            </div>

            {/* Session Action Area */}
            <div className="flex flex-col sm:flex-row lg:flex-col justify-center gap-3 min-w-[220px]">
              {activeSessionForSelected ? (
                <Button
                  onClick={() => onContinueSession(activeSessionForSelected.id)}
                  variant="primary"
                  className="py-3 text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Continue MHC Session
                </Button>
              ) : null}

              <Button
                onClick={() => onStartNewSession(selectedMachine.id)}
                variant={activeSessionForSelected ? 'outline' : 'primary'}
                className="py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <PlusIcon />
                Start New MHC Inspection
              </Button>
            </div>
          </div>

          {/* Continue MHC Banner if session exists */}
          {activeSessionForSelected && (
            <div className="bg-surface border border-emerald-500/40 rounded-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/15 rounded-lg text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mt-0.5">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      ACTIVE MHC SESSION IN PROGRESS
                    </span>
                    <span className="text-xs font-mono text-theme-muted">
                      ID: {activeSessionForSelected.id}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-theme-primary mt-0.5">
                    {getCompletedStagesCount(activeSessionForSelected)} / 8 Stages Completed
                  </h4>
                  <p className="text-xs text-theme-muted mt-0.5">
                    Started: {activeSessionForSelected.startDate} {activeSessionForSelected.startTime} • Last Updated: {activeSessionForSelected.lastUpdated}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => onContinueSession(activeSessionForSelected.id)}
                variant="primary"
                className="font-bold px-5 py-2 text-xs flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume Session ({getCompletedStagesCount(activeSessionForSelected)}/8)
              </Button>
            </div>
          )}

          {/* Laser Configuration Summary */}
          {selectedMachine.laserHeads && selectedMachine.laserHeads.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-3">
                LASER HEAD CONFIGURATION (SINGLE SOURCE OF TRUTH FROM PASSPORT)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedMachine.laserHeads.map((lh, idx) => (
                  <div
                    key={lh.id || idx}
                    className="bg-canvas border border-theme-default rounded-card p-3.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-theme-primary">{lh.model}</div>
                      <div className="text-[11px] font-mono text-theme-muted">SN: {lh.serialNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{lh.powerOutputWatts}W / {lh.ratedPowerWatts}W</div>
                      <div className="text-[11px] font-mono text-theme-muted">{lh.runningHours} hrs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
