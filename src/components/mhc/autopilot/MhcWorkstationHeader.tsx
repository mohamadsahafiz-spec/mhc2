import React from 'react';
import { Bot, CheckCircle2, Eye, Edit3, Trash2, LogOut, Cpu, Building2 } from 'lucide-react';
import { Customer, Machine, MHCSession } from '../../../types';
import { SetupStep } from '../MhcAutopilot';

export interface MhcWorkstationHeaderProps {
  currentStep: SetupStep;
  effectiveSession?: MHCSession | null;
  selectedMachine?: Machine;
  selectedCustomer?: Customer | null;
  isReadOnlyMode: boolean;
  setIsReadOnlyMode: (val: boolean) => void;
  onSwitchMachine: () => void;
  onExitWorkstation: () => void;
  onDiscardSession?: (session: MHCSession) => void;
  isDark: boolean;
}

export const MhcWorkstationHeader: React.FC<MhcWorkstationHeaderProps> = ({
  currentStep,
  effectiveSession,
  selectedMachine,
  selectedCustomer,
  isReadOnlyMode,
  setIsReadOnlyMode,
  onSwitchMachine,
  onExitWorkstation,
  onDiscardSession,
  isDark
}) => {
  const isSessionActive = currentStep === 'session_active';

  return (
    <header className="px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 bg-[var(--surface-workspace)] border-[var(--border-default)]">
      {/* Left: Station Identity & Status */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 bg-[var(--surface-raised)] border-[var(--border-strong)] text-[var(--color-primary)] shadow-xs">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              MHC Workstation
            </h1>
            {isSessionActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>INSPECTION ACTIVE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                <span>SETUP SEQUENCE</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-mono">
            {isSessionActive ? 'Laser & Stage Engineering Cockpit' : 'Inspection Preparation & Equipment Binding'}
          </p>
        </div>
      </div>

      {/* Center: Authoritative Machine & Customer Context */}
      {selectedMachine && (
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg border bg-[var(--surface-surface)] border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Cpu className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="font-bold text-[var(--text-primary)]">{selectedMachine.model}</span>
            <span className="text-[var(--text-muted)]">({selectedMachine.machineNumber || selectedMachine.serialNumber})</span>
          </div>
          <span className="text-[var(--border-strong)]">|</span>
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
            <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="truncate max-w-[140px]">{selectedCustomer?.name || selectedMachine.customerName}</span>
            <span className="text-[10px] text-[var(--text-muted)]">• {selectedMachine.plantName}</span>
          </div>
          {isSessionActive && (
            <button
              onClick={onSwitchMachine}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            >
              Switch
            </button>
          )}
        </div>
      )}

      {/* Right: Controls & Exit */}
      <div className="flex items-center gap-2 shrink-0">
        {isSessionActive && (
          <>
            <button
              onClick={() => setIsReadOnlyMode(!isReadOnlyMode)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isReadOnlyMode
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                  : 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-workspace)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isReadOnlyMode ? (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Enable Editing</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Read-Only</span>
                </>
              )}
            </button>

            {effectiveSession && effectiveSession.completionStatus !== 'COMPLETED' && onDiscardSession && (
              <button
                id="mhc-autopilot-discard-draft-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDiscardSession(effectiveSession);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                title="Discard this unwanted draft session"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span className="hidden sm:inline">Discard</span>
              </button>
            )}
          </>
        )}

        <button
          id="mhc-autopilot-exit-btn"
          onClick={onExitWorkstation}
          title="Exit Workstation and return to Daily Work"
          className="px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-[var(--surface-surface)] hover:bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
};
