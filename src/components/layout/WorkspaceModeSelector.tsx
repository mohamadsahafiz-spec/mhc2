import React, { useState, useRef, useEffect } from 'react';
import { Activity, Crown, ChevronDown, Check, Zap, FileBarChart } from 'lucide-react';
import { WorkspaceMode, UserRole } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface WorkspaceModeSelectorProps {
  currentMode: WorkspaceMode;
  onModeChange: (newMode: WorkspaceMode) => void;
  userRole: UserRole;
  compact?: boolean;
}

export const WorkspaceModeSelector: React.FC<WorkspaceModeSelectorProps> = ({
  currentMode,
  onModeChange,
  userRole,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (mode: WorkspaceMode) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  const isMhc = currentMode === 'MHC_MODE';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-button border text-xs font-theme-label transition-all duration-150 bg-raised border-theme-default text-theme-primary hover:bg-surface hover:border-theme-strong shadow-2xs"
      >
        <div className="flex items-center gap-1.5">
          {isMhc ? (
            <Activity className="w-3.5 h-3.5 text-theme-muted" />
          ) : (
            <Crown className="w-3.5 h-3.5 text-theme-muted" />
          )}
          <span className="font-mono text-[10px] tracking-wider uppercase text-theme-muted hidden sm:inline">MODE:</span>
          <span className="font-semibold text-xs text-theme-primary">{isMhc ? 'MHC Cleanroom' : 'Founder Suite'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-theme-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-modal border shadow-theme-popover backdrop-theme-surface p-2 z-50 animate-in fade-in zoom-in-95 bg-raised border-theme-default text-theme-primary">
          <div className="px-2.5 py-1.5 border-b border-theme-subtle mb-1">
            <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-theme-muted">
              Workspace Profile
            </p>
            <p className="text-[11px] text-theme-muted mt-0.5">
              Select tailored view for current workflow
            </p>
          </div>

          <div className="space-y-1">
            {/* MHC Mode */}
            <button
              type="button"
              onClick={() => handleSelect('MHC_MODE')}
              className={`w-full text-left p-2 rounded-button border transition-all flex items-start gap-2.5 ${
                currentMode === 'MHC_MODE'
                  ? 'bg-surface border-theme-strong text-theme-primary'
                  : 'border-transparent hover:bg-surface text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <div className="p-1 rounded-badge bg-surface text-theme-secondary border border-theme-subtle shrink-0 mt-0.5">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-theme-primary font-theme-heading">MHC Mode</span>
                  {currentMode === 'MHC_MODE' && <Check className="w-3.5 h-3.5 text-theme-primary" />}
                </div>
                <p className="text-[10px] text-theme-muted mt-0.5 leading-tight">
                  Focused cleanroom execution for Machine Health Checks and inspection reporting.
                </p>
              </div>
            </button>

            {/* Founder Mode */}
            <button
              type="button"
              onClick={() => handleSelect('FOUNDER_MODE')}
              className={`w-full text-left p-2 rounded-button border transition-all flex items-start gap-2.5 ${
                currentMode === 'FOUNDER_MODE'
                  ? 'bg-surface border-theme-strong text-theme-primary'
                  : 'border-transparent hover:bg-surface text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <div className="p-1 rounded-badge bg-surface text-theme-secondary border border-theme-subtle shrink-0 mt-0.5">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-theme-primary font-theme-heading">Founder Mode</span>
                  {currentMode === 'FOUNDER_MODE' && <Check className="w-3.5 h-3.5 text-theme-primary" />}
                </div>
                <p className="text-[10px] text-theme-muted mt-0.5 leading-tight">
                  Unrestricted access to all contracts, planning, multi-user directory, and analytics.
                </p>
              </div>
            </button>
          </div>

          {/* Future Workspace Modes */}
          <div className="pt-2 mt-2 border-t border-theme-subtle px-2 space-y-1">
            <p className="text-[9px] font-mono font-medium uppercase tracking-wider text-theme-muted mb-1">
              Future Operational Modes
            </p>

            <div className="flex items-center justify-between text-[11px] text-theme-muted py-1 px-1 opacity-60">
              <span className="flex items-center gap-1.5 font-theme-label">
                <Zap className="w-3 h-3 text-theme-muted" />
                Calibration Mode
              </span>
              <span className="text-[9px] font-mono px-1 rounded-badge bg-surface text-theme-muted border border-theme-subtle">PLANNED</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-theme-muted py-1 px-1 opacity-60">
              <span className="flex items-center gap-1.5 font-theme-label">
                <FileBarChart className="w-3 h-3 text-theme-muted" />
                Reporting Mode
              </span>
              <span className="text-[9px] font-mono px-1 rounded-badge bg-surface text-theme-muted border border-theme-subtle">PLANNED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
