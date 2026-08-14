import React, { useState, useRef, useEffect } from 'react';
import { Layers, Activity, Crown, ChevronDown, Check, ShieldAlert, Zap, FileBarChart, Compass } from 'lucide-react';
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
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
          isMhc
            ? isDark
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
            : isDark
              ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25'
              : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {isMhc ? (
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Crown className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span className="font-mono text-[10px] tracking-wider uppercase opacity-75 hidden sm:inline">WORKSPACE:</span>
          <span className="font-bold">{isMhc ? 'MHC Mode' : 'Founder Mode'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 ${
          isDark ? 'bg-[#181B1E] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="px-2.5 py-2 border-b border-slate-200/20 mb-1">
            <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
              Select Workspace Mode
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Adapts UI visibility around your current job
            </p>
          </div>

          <div className="space-y-1">
            {/* MHC Mode */}
            <button
              type="button"
              onClick={() => handleSelect('MHC_MODE')}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                currentMode === 'MHC_MODE'
                  ? isDark
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-indigo-50 border-indigo-300 text-indigo-900'
                  : isDark
                    ? 'border-transparent hover:bg-[#20252B] text-slate-300'
                    : 'border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">MHC Mode</span>
                  {currentMode === 'MHC_MODE' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Focused cleanroom workspace for Health Check execution & customer report.
                </p>
              </div>
            </button>

            {/* Founder Mode */}
            <button
              type="button"
              onClick={() => handleSelect('FOUNDER_MODE')}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                currentMode === 'FOUNDER_MODE'
                  ? isDark
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                    : 'bg-purple-50 border-purple-300 text-purple-900'
                  : isDark
                    ? 'border-transparent hover:bg-[#20252B] text-slate-300'
                    : 'border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                <Crown className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Founder Mode</span>
                  {currentMode === 'FOUNDER_MODE' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Complete platform access: Contracts, Planner, Users, Analytics, Settings.
                </p>
              </div>
            </button>
          </div>

          {/* Future Workspace Modes (Prepared Architecture) */}
          <div className="pt-2 mt-2 border-t border-slate-200/20 px-2 space-y-1">
            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
              Future Operational Modes
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 py-1 px-1.5 opacity-60">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-500" />
                Calibration Mode
              </span>
              <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">PLANNED</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 py-1 px-1.5 opacity-60">
              <span className="flex items-center gap-1.5">
                <FileBarChart className="w-3 h-3 text-sky-500" />
                Reporting Mode
              </span>
              <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">PLANNED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
