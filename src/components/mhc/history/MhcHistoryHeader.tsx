import React from 'react';
import { Cpu, ExternalLink, Filter, Building2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Machine } from '../../../types';

interface MhcHistoryHeaderProps {
  machines: Machine[];
  selectedMachineId: string | null;
  onSelectMachineId: (id: string | null) => void;
  onNavigate?: (tab: any) => void;
  totalSessionsCount: number;
  completedSessionsCount: number;
  isDark: boolean;
}

export const MhcHistoryHeader: React.FC<MhcHistoryHeaderProps> = ({
  machines,
  selectedMachineId,
  onSelectMachineId,
  onNavigate,
  totalSessionsCount,
  completedSessionsCount,
  isDark
}) => {
  const activeMachine = machines.find(m => m.id === selectedMachineId) || null;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-badge text-[11px] font-mono tracking-wider font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            OPERATIONAL
          </span>
        );
      case 'NEEDS_CALIBRATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-badge text-[11px] font-mono tracking-wider font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            CALIBRATION DUE
          </span>
        );
      case 'MAINTENANCE_DUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-badge text-[11px] font-mono tracking-wider font-semibold border bg-rose-500/10 text-rose-400 border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            MAINTENANCE DUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-badge text-[11px] font-mono tracking-wider font-semibold border bg-canvas text-theme-secondary border-theme-default">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {status || 'REGISTERED'}
          </span>
        );
    }
  };

  return (
    <div
      id="mhc-history-machine-header"
      className="p-5 rounded-card border transition-all bg-surface border-theme-default text-theme-primary shadow-theme-card"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Machine Identity Display */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-badge uppercase border bg-canvas text-theme-muted border-theme-default">
              MHC SERVICE LOG RECORD
            </span>

            {activeMachine ? (
              <>
                <span className="text-xs font-mono text-theme-muted">
                  S/N: <strong className="text-theme-primary">{activeMachine.serialNumber || '—'}</strong>
                </span>
                {getStatusBadge(activeMachine.status)}
              </>
            ) : (
              <span className="text-xs font-mono text-theme-muted">
                SCOPE: <strong className="text-theme-primary">ALL FLEET ASSETS</strong>
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight font-theme-heading text-theme-primary">
              {activeMachine ? activeMachine.model : 'Equipment Fleet Health History'}
            </h1>
            {activeMachine && activeMachine.machineNumber && (
              <span className="text-sm font-mono text-theme-muted">
                ({activeMachine.machineNumber})
              </span>
            )}
          </div>

          <div className="flex items-center gap-x-4 gap-y-1 text-xs text-theme-muted flex-wrap">
            {activeMachine ? (
              <>
                <span className="flex items-center gap-1.5 text-theme-secondary">
                  <Building2 className="w-3.5 h-3.5 text-theme-muted" />
                  <span>{activeMachine.customerName}</span>
                  {activeMachine.plantName && <span>• {activeMachine.plantName}</span>}
                  {activeMachine.productionLineName && <span>({activeMachine.productionLineName})</span>}
                </span>

                {activeMachine.installationDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-theme-muted" />
                    <span>Commissioned: {activeMachine.installationDate}</span>
                  </span>
                )}

                {activeMachine.lastMhcDate && (
                  <span>Last Checked: {activeMachine.lastMhcDate}</span>
                )}
              </>
            ) : (
              <span>
                Historical inspection audit trail for all {machines.length} registered equipment units across client facilities.
              </span>
            )}
          </div>
        </div>

        {/* Machine Filter & Passport Link Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-theme-muted shrink-0" />
            <select
              id="mhc-history-machine-select"
              value={selectedMachineId || ''}
              onChange={(e) => onSelectMachineId(e.target.value ? e.target.value : null)}
              className="text-xs font-mono rounded-button px-3 py-1.5 border outline-none w-full sm:w-56 transition-colors bg-canvas border-theme-default text-theme-primary hover:border-theme-hover focus:border-cyan-500/50"
            >
              <option value="">All Fleet Machines ({machines.length})</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.model} • {m.serialNumber} ({m.customerName})
                </option>
              ))}
            </select>
          </div>

          {activeMachine && onNavigate && (
            <button
              id="btn-mhc-view-passport"
              onClick={() => onNavigate('machines')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-mono font-medium border transition-colors cursor-pointer bg-canvas hover:bg-surface-hover text-theme-secondary hover:text-theme-primary border-theme-default shadow-2xs"
            >
              <span>Machine Passport</span>
              <ExternalLink className="w-3 h-3 text-theme-muted" />
            </button>
          )}
        </div>
      </div>

      {/* Quiet Record Counter Strip */}
      <div className="mt-4 pt-3 border-t border-theme-subtle flex items-center justify-between text-xs font-mono text-theme-muted">
        <div className="flex items-center gap-4">
          <span>Total Records: <strong className="text-theme-primary">{totalSessionsCount}</strong></span>
          <span>Finalized Buyoff: <strong className="text-emerald-400">{completedSessionsCount}</strong></span>
          <span>In Progress: <strong className="text-amber-400">{totalSessionsCount - completedSessionsCount}</strong></span>
        </div>
        <div className="text-[11px] text-theme-muted hidden sm:block">
          FSOS Machine Health Check Records Authority
        </div>
      </div>
    </div>
  );
};
