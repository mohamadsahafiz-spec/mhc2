import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Cpu, 
  Play, 
  Search, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  Trash2, 
  Sparkles 
} from 'lucide-react';
import { Customer, Machine, MHCSession } from '../../../types';
import { SetupStep } from '../MhcAutopilot';
import { computeAutopilotReadiness, hasMeaningfulMhcProgress } from '../../../utils/mhcAutopilotBrain';

export interface MhcWorkstationSetupFlowProps {
  currentStep: SetupStep;
  setCurrentStep: (step: SetupStep) => void;
  latestResumableSession: MHCSession | null;
  latestResumableMachine: Machine | null;
  latestResumableCustomer: Customer | null;
  confirmingWelcomeComplete: boolean;
  setConfirmingWelcomeComplete: (val: boolean) => void;
  handleContinueLatestActivity: () => void;
  handleConfirmWelcomeComplete: () => void;
  setSessionToDiscard: (s: MHCSession | null) => void;
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer) => void;
  customerSearch: string;
  setCustomerSearch: (s: string) => void;
  filteredCustomers: Customer[];
  machines: Machine[];
  localSelectedMachine: Machine | undefined;
  setLocalSelectedMachine: (m: Machine) => void;
  onSelectMachine: (m: Machine) => void;
  machineSearch: string;
  setMachineSearch: (s: string) => void;
  filteredMachines: Machine[];
  mhcSessions: MHCSession[];
  existingIncompleteSession: MHCSession | undefined;
  handleContinueExisting: () => void;
  handleStartNew: () => void;
  handleReviewProgress: () => void;
  isDark: boolean;
}

export const MhcWorkstationSetupFlow: React.FC<MhcWorkstationSetupFlowProps> = ({
  currentStep,
  setCurrentStep,
  latestResumableSession,
  latestResumableMachine,
  latestResumableCustomer,
  confirmingWelcomeComplete,
  setConfirmingWelcomeComplete,
  handleContinueLatestActivity,
  handleConfirmWelcomeComplete,
  setSessionToDiscard,
  selectedCustomer,
  setSelectedCustomer,
  customerSearch,
  setCustomerSearch,
  filteredCustomers,
  machines,
  localSelectedMachine,
  setLocalSelectedMachine,
  onSelectMachine,
  machineSearch,
  setMachineSearch,
  filteredMachines,
  mhcSessions,
  existingIncompleteSession,
  handleContinueExisting,
  handleStartNew,
  handleReviewProgress,
  isDark
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 flex-1 flex flex-col justify-center">
      {/* STEP 1: WELCOME & OVERVIEW */}
      {currentStep === 'welcome' && (
        <motion.div
          key="welcome"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* Workstation Preparation Header */}
          <div className="space-y-2 border-b border-[var(--border-default)] pb-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[var(--border-default)] bg-[var(--surface-workspace)] text-[var(--text-secondary)] text-xs font-mono">
              <span>FSOS // MHC WORKSTATION INITIALIZER</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Machine Health Check Inspection
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-2xl">
              Precision inspection environment for optical laser profiling, 2-axis stage calibration, thermal validation, and authoritative buyoff sign-off.
            </p>
          </div>

          {/* ACTIVE DRAFT SESSION RECOVERY DESK (IF RESUMABLE ACTIVITY EXISTS) */}
          {latestResumableSession && latestResumableMachine && (
            <div className={`p-4 sm:p-5 rounded-xl border space-y-4 transition-all ${
              isDark ? 'bg-[var(--surface-raised)] border-[var(--border-strong)]' : 'bg-slate-50 border-slate-300 shadow-xs'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Active Draft Session Detected
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                  {latestResumableSession.id}
                </span>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <span>{latestResumableMachine.model}</span>
                    <span className="text-xs font-mono font-normal text-[var(--text-muted)]">
                      ({latestResumableMachine.machineNumber || latestResumableMachine.serialNumber})
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] truncate mt-1 font-mono">
                    {latestResumableCustomer?.name || latestResumableSession.customerName || latestResumableMachine.customerName || 'Customer'} • {latestResumableMachine.plantName} • {latestResumableSession.autopilotProgress?.currentDay || 'DAY 1'} — {latestResumableSession.autopilotProgress?.currentActivityCode || '01'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    id="mhc-autopilot-continue-last-btn"
                    onClick={handleContinueLatestActivity}
                    className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Continue Last Activity</span>
                  </button>

                  <button
                    id="mhc-autopilot-welcome-complete-btn"
                    onClick={() => setConfirmingWelcomeComplete(true)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-mono font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete MHC</span>
                  </button>

                  <button
                    id="mhc-autopilot-welcome-discard-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDiscard(latestResumableSession);
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-mono font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Discard this unwanted draft session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>
                </div>
              </div>

              {/* Inline Explicit Confirmation for Welcome Complete */}
              {confirmingWelcomeComplete && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Confirm Completion for Session {latestResumableSession.id}?</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    This will finalize Activity 09 Buyoff, set status to <strong className="text-emerald-400">COMPLETED</strong>, and archive it from active resume detection. All inspection records, logs, and historical data remain safely preserved.
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      id="btn-welcome-confirm-complete-yes"
                      onClick={handleConfirmWelcomeComplete}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Yes, Complete MHC</span>
                    </button>
                    <button
                      onClick={() => setConfirmingWelcomeComplete(false)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border-default)] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* PRIMARY ACTION */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-mono">Step 1 of 4 • Welcome</span>
            <button
              onClick={() => setCurrentStep('customer')}
              className={`px-5 py-2.5 rounded-lg font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                latestResumableSession
                  ? isDark
                    ? 'bg-[var(--surface-raised)] hover:bg-[var(--surface-workspace)] text-[var(--text-primary)] border border-[var(--border-default)]'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                  : 'bg-[var(--color-primary)] hover:opacity-90 text-white shadow-xs'
              }`}
            >
              <span>{latestResumableSession ? 'Manual Setup / New Machine' : 'Start Autopilot Setup'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: SELECT CUSTOMER */}
      {currentStep === 'customer' && (
        <motion.div
          key="customer"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-5"
        >
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Step 2 of 4 • Customer Account
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Select Customer Account
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Choose a Customer Passport account to view associated machine assets.
            </p>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search by customer name, industry, or contact..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-xs outline-none transition-all ${
                isDark 
                  ? 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-strong)]' 
                  : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
              }`}
            />
          </div>

          {/* CUSTOMER SELECTION LIST */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              const custMachines = machines.filter(m => m.customerId === c.id || m.customerName === c.name);
              const machineCount = custMachines.length;
              const hasActiveSessions = custMachines.some(m => 
                mhcSessions.some(s => s.machineId === m.id && hasMeaningfulMhcProgress(s))
              );
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    if (custMachines.length > 0) {
                      if (!localSelectedMachine || !custMachines.some(m => m.id === localSelectedMachine.id)) {
                        setLocalSelectedMachine(custMachines[0]);
                        onSelectMachine(custMachines[0]);
                      }
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-[var(--surface-raised)] border-[var(--border-strong)] text-[var(--text-primary)] ring-1 ring-slate-600'
                        : 'bg-slate-100 border-slate-400 text-slate-900'
                      : isDark
                      ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:border-[var(--border-default)]'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${
                      isSelected 
                        ? 'bg-[var(--surface-surface)] border-[var(--border-strong)] text-[var(--text-primary)]' 
                        : 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-muted)]'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{c.industry} • {c.contactPerson}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono flex items-center gap-2">
                    {hasActiveSessions && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Active Job</span>
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                      {machineCount} Assets
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* NEXT ACTION */}
          <div className="pt-3 flex items-center justify-between border-t border-[var(--border-default)]">
            <button
              onClick={() => setCurrentStep('welcome')}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[var(--text-muted)] hidden sm:inline">
                Selected: <strong className="text-[var(--text-primary)]">{selectedCustomer?.name || 'None'}</strong>
              </span>
              <button
                disabled={!selectedCustomer}
                onClick={() => setCurrentStep('machine')}
                className="px-5 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-40 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Next: Select Machine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 3: SELECT MACHINE */}
      {currentStep === 'machine' && (
        <motion.div
          key="machine"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-5"
        >
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Step 3 of 4 • Target Equipment
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Select Target Machine for {selectedCustomer?.name || 'Customer'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Choose the specific machine asset to inspect or continue an active Autopilot session.
            </p>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={machineSearch}
              onChange={(e) => setMachineSearch(e.target.value)}
              placeholder="Search by model, serial number, plant..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-xs outline-none transition-all ${
                isDark 
                  ? 'bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-strong)]' 
                  : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
              }`}
            />
          </div>

          {/* MACHINE SELECTION LIST */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredMachines.map((m) => {
              const isSelected = localSelectedMachine?.id === m.id;
              const hasActiveSession = mhcSessions.some(s => s.machineId === m.id && hasMeaningfulMhcProgress(s));
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setLocalSelectedMachine(m);
                    onSelectMachine(m);
                  }}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-[var(--surface-raised)] border-[var(--border-strong)] text-[var(--text-primary)] ring-1 ring-slate-600'
                        : 'bg-slate-100 border-slate-400 text-slate-900'
                      : isDark
                      ? 'bg-[var(--surface-workspace)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:border-[var(--border-default)]'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${
                      isSelected 
                        ? 'bg-[var(--surface-surface)] border-[var(--border-strong)] text-[var(--text-primary)]' 
                        : 'bg-[var(--surface-surface)] border-[var(--border-default)] text-[var(--text-muted)]'
                    }`}>
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">{m.model}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        SN: {m.serialNumber} • Plant: {m.plantName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2 font-mono">
                    {hasActiveSession ? (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Active Session</span>
                      </span>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        m.status === 'OPERATIONAL' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {m.status}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* NEXT ACTION */}
          <div className="pt-3 flex items-center justify-between border-t border-[var(--border-default)]">
            <button
              onClick={() => setCurrentStep('customer')}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              ← Back: Customers
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[var(--text-muted)] hidden sm:inline">
                Selected: <strong className="text-[var(--text-primary)]">{localSelectedMachine?.model} ({localSelectedMachine?.serialNumber})</strong>
              </span>
              <button
                disabled={!localSelectedMachine}
                onClick={() => setCurrentStep('session_check')}
                className="px-5 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-40 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Check Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 4: SESSION RECOVERY & DETECTION */}
      {currentStep === 'session_check' && (
        <motion.div
          key="session_check"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-5"
        >
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Step 4 of 4 • Session State Verification
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Session Detection &amp; Recovery
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Inspecting active history for {localSelectedMachine?.model} ({localSelectedMachine?.machineNumber || localSelectedMachine?.serialNumber}) — {selectedCustomer?.name || localSelectedMachine?.customerName}.
            </p>
          </div>

          {/* IF INCOMPLETE SESSION EXISTS */}
          {existingIncompleteSession ? (
            <div className={`p-4 rounded-lg border space-y-4 ${
              isDark ? 'bg-[var(--surface-raised)] border-[var(--border-strong)]' : 'bg-slate-50 border-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="font-mono font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">Incomplete Session Found</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                  {existingIncompleteSession.id}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">Start Date</div>
                  <div className="font-semibold text-[var(--text-primary)]">{existingIncompleteSession.startDate}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">Last Updated</div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {new Date(existingIncompleteSession.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">Engineer</div>
                  <div className="font-semibold text-[var(--text-primary)]">{existingIncompleteSession.engineerName || 'Field Engineer'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)]">Readiness</div>
                  <div className="font-semibold text-cyan-400">
                    {computeAutopilotReadiness(existingIncompleteSession.autopilotProgress).readinessScore}% Complete
                  </div>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                An active inspection session was detected for this machine. You can continue the existing session without losing data or start a new clean session.
              </p>

              {/* ACTIONS */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleContinueExisting}
                  className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Continue Existing Session</span>
                </button>

                <button
                  onClick={handleStartNew}
                  className={`px-3.5 py-2 rounded-lg font-mono font-semibold text-xs border transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-primary)] border-[var(--border-default)]' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  <span>Start New Session</span>
                </button>

                <button
                  onClick={() => setCurrentStep('machine')}
                  className={`px-3 py-2 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <span>Change Machine</span>
                </button>

                <button
                  onClick={() => setCurrentStep('customer')}
                  className={`px-3 py-2 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <span>Change Customer</span>
                </button>

                <button
                  id="mhc-session-check-discard-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionToDiscard(existingIncompleteSession);
                  }}
                  className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-mono font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Discard this draft session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard Draft</span>
                </button>

                <button
                  onClick={handleReviewProgress}
                  className="px-3 py-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-auto flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Review Progress (Read-Only)</span>
                </button>
              </div>
            </div>
          ) : (
            /* IF NO INCOMPLETE SESSION FOUND */
            <div className={`p-4 rounded-lg border space-y-4 ${
              isDark ? 'bg-[var(--surface-workspace)] border-[var(--border-default)]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <Clock className="w-5 h-5 text-[var(--text-muted)]" />
                <div>
                  <div className="font-bold text-xs text-[var(--text-primary)]">No Active Session Found for {localSelectedMachine?.model}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">Ready to launch a new Machine Health Check inspection for this equipment.</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleStartNew}
                  className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-mono font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create &amp; Start New MHC Session</span>
                </button>

                <button
                  onClick={() => setCurrentStep('machine')}
                  className={`px-3.5 py-2.5 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] border-[var(--border-default)]' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  <span>Select Other Machine</span>
                </button>

                <button
                  onClick={() => setCurrentStep('customer')}
                  className={`px-3.5 py-2.5 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-[var(--surface-surface)] hover:bg-[var(--surface-workspace)] text-[var(--text-secondary)] border-[var(--border-default)]' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  <span>Change Customer</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
