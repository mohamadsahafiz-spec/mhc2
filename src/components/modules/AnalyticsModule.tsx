import React from 'react';
import { LineChart, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, Bar } from 'recharts';
import { Card } from '../common/Card';
import { Machine } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface AnalyticsProps {
  machines: Machine[];
}

export const AnalyticsModule: React.FC<AnalyticsProps> = ({ machines }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const mtbfData = [
    { month: 'Q1 2025', mtbfHours: 1420 },
    { month: 'Q2 2025', mtbfHours: 1580 },
    { month: 'Q3 2025', mtbfHours: 1640 },
    { month: 'Q4 2025', mtbfHours: 1710 },
    { month: 'Q1 2026', mtbfHours: 1850 },
    { month: 'Q2 2026', mtbfHours: 1980 }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Mean Time Between Failures (MTBF) Growth" subtitle="Fleet Reliability Index">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mtbfData}>
                <XAxis dataKey="month" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} domain={[1200, 2200]} />
                <Tooltip contentStyle={{
                  backgroundColor: isDark ? '#111315' : '#ffffff',
                  borderColor: isDark ? '#2B323A' : '#cbd5e1',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} />
                <Area type="monotone" dataKey="mtbfHours" stroke={isDark ? '#7FD4A6' : '#10b981'} fill={isDark ? '#7FD4A620' : '#10b98120'} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Consumables Replacement Lifecycle Forecast" subtitle="Estimated Days to Swap">
          <div className="space-y-3">
            {(() => {
              const liveConsumables = machines.flatMap((m) =>
                (m.consumables || []).map((c) => ({
                  name: `${c.name} (${m.machineNumber})`,
                  days: c.estimatedDaysRemaining ?? Math.round((c.currentLifePercent || 50) * 1.8),
                  critical: (c.estimatedDaysRemaining ?? 30) < 15 || (c.currentLifePercent || 50) < 20
                }))
              );

              if (liveConsumables.length === 0) {
                return (
                  <div className={`p-8 text-center rounded-lg border ${
                    isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <p className="text-xs">No active consumables tracked in registered equipment fleet.</p>
                  </div>
                );
              }

              return liveConsumables.map((item, i) => (
                <div key={i} className={`p-3 rounded-lg border flex justify-between items-center text-xs ${
                  isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</span>
                  <span className={`font-mono font-bold ${item.critical ? (isDark ? 'text-[#E98A8A]' : 'text-rose-700') : (isDark ? 'text-[#8ECDF7]' : 'text-sky-800')}`}>
                    {item.days} Days Left
                  </span>
                </div>
              ));
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
};
