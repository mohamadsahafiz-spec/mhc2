import React from 'react';
import { HeartPulse } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Machine } from '../../types';
import { getThemeClasses } from '../../theme/tokens';

interface MachineSnapshotPanelProps {
  machine?: Machine;
}

export const MachineSnapshotPanel: React.FC<MachineSnapshotPanelProps> = ({ machine }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const themeCls = getThemeClasses(isDark);

  const healthScore = machine ? machine.healthScore : 94;
  const status = machine ? machine.status : 'HEALTHY';

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-250 ${
      isDark 
        ? 'bg-[#20252B] border-[#2B323A]/80 text-[#F3F4F6]' 
        : 'bg-white border-slate-300/80 text-slate-900 shadow-sm'
    }`}>
      {/* Title & Overall Health Pill */}
      <div className={`flex items-center justify-between pb-3.5 border-b ${
        isDark ? 'border-[#2B323A]/50' : 'border-slate-200'
      }`}>
        <div>
          <span className={`text-[10px] font-mono uppercase tracking-wider block mb-0.5 font-bold ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            MACHINE SNAPSHOT
          </span>
          <h3 className="text-base font-bold tracking-tight">
            TRUMPF TruMicro 7000 Series
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
            isDark 
              ? 'text-[#7FD4A6] bg-[#7FD4A6]/10 border-[#7FD4A6]/30' 
              : 'text-emerald-800 bg-emerald-50 border-emerald-300'
          }`}>
            <HeartPulse className="w-3.5 h-3.5" />
            {healthScore} / 100 ({status})
          </span>
        </div>
      </div>

      {/* Snapshot Subsystems Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3.5 text-xs font-mono">
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'}`}>
          <span className={`text-[10px] uppercase block mb-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Laser Head 1</span>
          <span className={`font-bold ${isDark ? 'text-[#7FD4A6]' : 'text-emerald-700'}`}>98% Nominal</span>
        </div>

        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'}`}>
          <span className={`text-[10px] uppercase block mb-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Laser Head 2</span>
          <span className={`font-bold ${isDark ? 'text-[#7FD4A6]' : 'text-emerald-700'}`}>91% Nominal</span>
        </div>

        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'}`}>
          <span className={`text-[10px] uppercase block mb-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Cooling Loop</span>
          <span className={`font-bold ${isDark ? 'text-[#EFCB7A]' : 'text-amber-700'}`}>84% (Servicing)</span>
        </div>

        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'}`}>
          <span className={`text-[10px] uppercase block mb-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Runtime</span>
          <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>9,680 / 10k hrs</span>
        </div>

        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'}`}>
          <span className={`text-[10px] uppercase block mb-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Service Life</span>
          <span className={`font-bold ${isDark ? 'text-[#8ECDF7]' : 'text-sky-700'}`}>320 Operating Hrs</span>
        </div>

        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'}`}>
          <span className={`text-[10px] uppercase block mb-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Contract SLA</span>
          <span className={`font-bold ${isDark ? 'text-[#8B9DFF]' : 'text-indigo-700'}`}>Month 8 / 12</span>
        </div>

        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'}`}>
          <span className={`text-[10px] uppercase block mb-1 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Next SLA Cycle</span>
          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>August 2026</span>
        </div>
      </div>
    </div>
  );
};

