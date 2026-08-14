import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AlertItem } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { getThemeClasses } from '../../theme/tokens';

interface OperationalPrerequisitesProps {
  alerts: AlertItem[];
}

export const OperationalPrerequisites: React.FC<OperationalPrerequisitesProps> = ({ alerts }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const themeCls = getThemeClasses(isDark);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Facility & Safety Prerequisites */}
      <div className={`p-5 rounded-2xl border transition-all duration-250 space-y-4 ${
        isDark 
          ? 'bg-[#20252B] border-[#2B323A]/80 text-[#F3F4F6]' 
          : 'bg-white border-slate-300/80 text-slate-900 shadow-sm'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#2B323A]/50' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#8ECDF7]' : 'text-sky-700'}`} />
            <h3 className="text-sm font-bold">Cleanroom & Safety Prerequisites</h3>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
            isDark 
              ? 'bg-[#8ECDF7]/10 text-[#8ECDF7] border border-[#8ECDF7]/30' 
              : 'bg-sky-50 text-sky-800 border border-sky-300'
          }`}>
            ISO 4 VERIFIED
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
            <div>
              <p className="font-bold">ISO Class 4 Wafer Cleanroom Protocol</p>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Full gowning, ESD wristband grounding, airborne particle count &lt;10/m³.</p>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
            <div>
              <p className="font-bold">Class 4 High-Power Optical Safety</p>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>OD 7+ laser safety eyewear rated for 1030nm femtosecond pulses required.</p>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]/60' : 'bg-slate-50 border-slate-300/70'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
            <div>
              <p className="font-bold">Required Engineering Toolkit</p>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>0.2µm filter canister spanner, thermal beam profiler, 9-point quartz grid target.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Risks & Telemetry Alerts */}
      <div className={`p-5 rounded-2xl border transition-all duration-250 space-y-4 ${
        isDark 
          ? 'bg-[#20252B] border-[#2B323A]/80 text-[#F3F4F6]' 
          : 'bg-white border-slate-300/80 text-slate-900 shadow-sm'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#2B323A]/50' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-[#EFCB7A]' : 'text-amber-700'}`} />
            <h3 className="text-sm font-bold">Machine Health & Risk Telemetry</h3>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
            isDark 
              ? 'bg-[#EFCB7A]/10 text-[#EFCB7A] border border-[#EFCB7A]/30' 
              : 'bg-amber-50 text-amber-800 border border-amber-300'
          }`}>
            2 ACTIVE RISKS
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isDark ? 'bg-[#EFCB7A]/10 border-[#EFCB7A]/25 text-slate-200' : 'bg-amber-50 border-amber-300 text-slate-900'
          }`}>
            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-[#EFCB7A]' : 'text-amber-800'}`} />
            <div>
              <p className={`font-bold ${isDark ? 'text-[#EFCB7A]' : 'text-amber-900'}`}>Cooling DI Water Filter Capacity Critical</p>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                Filter life at 18% (12 days estimated). Flow delta dropped by 0.8 LPM. Swap filter in Stage 2.
              </p>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isDark ? 'bg-[#E98A8A]/10 border-[#E98A8A]/25 text-slate-200' : 'bg-rose-50 border-rose-300 text-slate-900'
          }`}>
            <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-[#E98A8A]' : 'text-rose-800'}`} />
            <div>
              <p className={`font-bold ${isDark ? 'text-[#E98A8A]' : 'text-rose-900'}`}>Laser Diode Module Head B Runtime Warning</p>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                Logged 9,680 running hours (threshold: 10,000 hrs). Schedule diode stack swap for Q3 SLA cycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

