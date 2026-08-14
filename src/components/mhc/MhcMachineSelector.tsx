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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Select Machine for Health Check (MHC)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Choose a cleanroom machine from the fleet to launch or continue an operational MHC inspection session.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search model, serial, customer..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
                  ? 'border-emerald-500/80 bg-slate-900/90 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {m.customerName}
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{m.model}</h3>
                  <div className="font-mono text-xs text-emerald-400 mt-0.5">
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

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span>Status: <strong className={
                    LaserEngine.getMachineHealthStatus(m) === 'PASS'
                      ? 'text-emerald-400'
                      : LaserEngine.getMachineHealthStatus(m) === 'WARNING'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }>{LaserEngine.getMachineHealthStatus(m)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last MHC: {m.lastMhcDate}</span>
                </div>
              </div>

              {activeSess && (
                <div className="mt-3 p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    Incomplete Session ({completedStages}/8)
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">{activeSess.id}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Selected Machine Identity / Passport Summary + Continue Banner */}
      {selectedMachine && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-start gap-4">
              {selectedMachine.photos && selectedMachine.photos[0] ? (
                <img
                  src={selectedMachine.photos[0]}
                  alt={selectedMachine.model}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-700 bg-slate-950"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-slate-600" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                    MACHINE IDENTITY PASSPORT
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedMachine.machineNumber}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-100 mt-1">
                  {selectedMachine.model}
                </h3>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>{selectedMachine.customerName}</span> • <span>{selectedMachine.plantName}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-300 font-mono">
                  <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    SN: {selectedMachine.serialNumber}
                  </span>
                  <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Line: {selectedMachine.productionLineName || 'Cleanroom Line A'}
                  </span>
                  <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
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
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950/50 py-3 text-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Continue MHC Session
                </Button>
              ) : null}

              <Button
                onClick={() => onStartNewSession(selectedMachine.id)}
                variant={activeSessionForSelected ? 'outline' : 'primary'}
                className={!activeSessionForSelected ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 text-sm flex items-center justify-center gap-2' : 'border-slate-700 text-slate-200 hover:bg-slate-800 py-2.5 text-sm flex items-center justify-center gap-2'}
              >
                <PlusIcon />
                Start New MHC Inspection
              </Button>
            </div>
          </div>

          {/* Continue MHC Banner if session exists */}
          {activeSessionForSelected && (
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-900/40 rounded-lg text-emerald-400 border border-emerald-700/50 mt-0.5">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      ACTIVE MHC SESSION IN PROGRESS
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {activeSessionForSelected.id}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 mt-0.5">
                    {getCompletedStagesCount(activeSessionForSelected)} / 8 Stages Completed
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Started: {activeSessionForSelected.startDate} {activeSessionForSelected.startTime} • Last Updated: {activeSessionForSelected.lastUpdated}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => onContinueSession(activeSessionForSelected.id)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 text-xs flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume Session ({getCompletedStagesCount(activeSessionForSelected)}/8)
              </Button>
            </div>
          )}

          {/* Laser Configuration Summary */}
          {selectedMachine.laserHeads && selectedMachine.laserHeads.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                LASER HEAD CONFIGURATION (SINGLE SOURCE OF TRUTH FROM PASSPORT)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedMachine.laserHeads.map((lh, idx) => (
                  <div
                    key={lh.id || idx}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">{lh.model}</div>
                      <div className="text-[11px] font-mono text-slate-400">SN: {lh.serialNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-emerald-400">{lh.powerOutputWatts}W / {lh.ratedPowerWatts}W</div>
                      <div className="text-[11px] font-mono text-slate-400">{lh.runningHours} hrs</div>
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
