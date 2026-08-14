import React from 'react';
import { FileText } from 'lucide-react';
import { MHCRecord, NavigationTab } from '../../types';
import { Button } from '../common/Button';
import { UserAvatar } from '../common/UserAvatar';
import { useTheme } from '../../context/ThemeContext';
import { getThemeClasses } from '../../theme/tokens';

interface TodayActivityLogProps {
  recentMhcs: MHCRecord[];
  onNavigate: (tab: NavigationTab) => void;
  engineerName?: string;
}

export const TodayActivityLog: React.FC<TodayActivityLogProps> = ({
  recentMhcs,
  onNavigate,
  engineerName = 'Sahafiz'
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const themeCls = getThemeClasses(isDark);

  const todayLogs = [
    {
      time: '08:50 AM UTC',
      title: 'Galvo Servo Gain Test Diode Fired (635nm @ 1% Power)',
      engineer: engineerName,
      details: 'Mounted 9-point quartz target grid. Detected 2.1µs step latency delta on X-galvo motor.',
      type: 'CALIBRATION'
    },
    {
      time: '08:35 AM UTC',
      title: 'DI Water Cooling Filter Cartridge Swapped & System Bled',
      engineer: engineerName,
      details: 'Replaced spent 0.2µm filter. De-aerated laser head cooling jacket. Pressure stable at 3.2 bar.',
      type: 'MAINTENANCE'
    },
    {
      time: '08:10 AM UTC',
      title: 'ISO Class 4 Cleanroom Gowning & Safety Interlock Verified',
      engineer: engineerName,
      details: 'Air shower cycle complete. Particle count 4/m³. Class 4 laser safety curtains secured.',
      type: 'SAFETY'
    }
  ];

  return (
    <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-250 space-y-4 ${
      isDark 
        ? 'bg-[#20252B] border-[#2B323A]/80 text-[#F3F4F6]' 
        : 'bg-white border-slate-300/80 text-slate-900 shadow-sm'
    }`}>
      <div className={`flex items-center justify-between border-b pb-3 ${
        isDark ? 'border-[#2B323A]/50' : 'border-slate-200'
      }`}>
        <div>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5 ${
            isDark ? 'text-[#8B9DFF]' : 'text-indigo-700'
          }`}>
            AUDIT & ACTIVITY LOG
          </span>
          <h3 className="text-base font-bold">
            Today's On-Site Operational Trace (2026-07-29)
          </h3>
        </div>
        <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>3 Logs Today</span>
      </div>

      {/* Chronological Timeline */}
      <div className={`space-y-3.5 pl-2 border-l ${isDark ? 'border-[#2B323A]' : 'border-slate-300'}`}>
        {todayLogs.map((log, index) => (
          <div key={index} className="relative pl-4 space-y-0.5">
            <span className={`absolute -left-[11px] top-1.5 w-2 h-2 rounded-full ${isDark ? 'bg-[#8B9DFF]' : 'bg-indigo-600'}`} />
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{log.title}</span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>{log.time}</span>
            </div>
            <p className={`text-xs font-sans leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>{log.details}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <UserAvatar user={{ fullName: log.engineer }} size="xs" />
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                {log.engineer}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Historical MHC Reports Link */}
      <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${
        isDark ? 'border-[#2B323A]/50' : 'border-slate-200'
      }`}>
        <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}>
          Previous Q2 MHC Audit Score: <strong className={`font-bold ${isDark ? 'text-[#7FD4A6]' : 'text-emerald-800'}`}>96/100</strong>
        </span>
        <Button variant="ghost" size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => onNavigate('reports')}>
          View Archived Reports
        </Button>
      </div>
    </div>
  );
};

