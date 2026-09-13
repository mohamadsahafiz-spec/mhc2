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
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all duration-150 ${
          isDark
            ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 hover:bg-[#22272E] hover:border-[#3D4754]'
            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {isMhc ? (
            <Activity className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <Crown className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="font-mono text-[10px] tracking-wider uppercase text-slate-500 hidden sm:inline">MODE:</span>
          <span className="font-semibold text-xs">{isMhc ? 'MHC Cleanroom' : 'Founder Suite'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-1.5 w-64 rounded-lg border shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 ${
          isDark ? 'bg-[#181B1E] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="px-2.5 py-1.5 border-b border-slate-200/10 mb-1">
            <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
              Workspace Profile
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select tailored view for current workflow
            </p>
          </div>

          <div className="space-y-1">
            {/* MHC Mode */}
            <button
              type="button"
              onClick={() => handleSelect('MHC_MODE')}
              className={`w-full text-left p-2 rounded-md border transition-all flex items-start gap-2.5 ${
                currentMode === 'MHC_MODE'
                  ? isDark
                    ? 'bg-[#1C2026] border-[#3D4754] text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                  : isDark
                    ? 'border-transparent hover:bg-[#1C2026]/70 text-slate-300'
                    : 'border-transparent hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="p-1 rounded bg-slate-800 text-slate-300 shrink-0 mt-0.5">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">MHC Mode</span>
                  {currentMode === 'MHC_MODE' && <Check className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Focused cleanroom execution for Machine Health Checks and inspection reporting.
                </p>
              </div>
            </button>

            {/* Founder Mode */}
            <button
              type="button"
              onClick={() => handleSelect('FOUNDER_MODE')}
              className={`w-full text-left p-2 rounded-md border transition-all flex items-start gap-2.5 ${
                currentMode === 'FOUNDER_MODE'
                  ? isDark
                    ? 'bg-[#1C2026] border-[#3D4754] text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                  : isDark
                    ? 'border-transparent hover:bg-[#1C2026]/70 text-slate-300'
                    : 'border-transparent hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="p-1 rounded bg-slate-800 text-slate-300 shrink-0 mt-0.5">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Founder Mode</span>
                  {currentMode === 'FOUNDER_MODE' && <Check className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Unrestricted access to all contracts, planning, multi-user directory, and analytics.
                </p>
              </div>
            </button>
          </div>

          {/* Future Workspace Modes */}
          <div className="pt-2 mt-2 border-t border-slate-200/10 px-2 space-y-1">
            <p className="text-[9px] font-mono font-medium uppercase tracking-wider text-slate-500 mb-1">
              Future Operational Modes
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 py-1 px-1 opacity-60">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-slate-400" />
                Calibration Mode
              </span>
              <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">PLANNED</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 py-1 px-1 opacity-60">
              <span className="flex items-center gap-1.5">
                <FileBarChart className="w-3 h-3 text-slate-400" />
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
