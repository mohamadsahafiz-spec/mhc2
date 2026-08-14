import React from 'react';
import { SlidersHorizontal, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { BaselineCheck, Machine } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useTheme } from '../../context/ThemeContext';

interface BaselineCheckProps {
  baselines: BaselineCheck[];
  machines: Machine[];
}

export const BaselineCheckModule: React.FC<BaselineCheckProps> = ({ baselines, machines }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <div className="space-y-6 pb-12">
      <Card title="Factory Baseline Verification & Operational Drift Tracking">
        <div className="space-y-4">
          {baselines.length === 0 ? (
            <div className={`p-10 text-center rounded-xl border ${
              isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-300' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <Cpu className="w-10 h-10 text-sky-500 mx-auto mb-2 opacity-70" />
              <h4 className="text-sm font-bold">No Factory Baselines Recorded</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                No baseline verification records or optical drift calibration snapshots are logged.
              </p>
            </div>
          ) : (
            baselines.map((bl) => (
              <div key={bl.id} className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{bl.machineName}</h3>
                    <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Captured: {bl.date} by {bl.engineerName}</p>
                  </div>
                  <Badge variant={bl.passed ? 'emerald' : 'rose'}>{bl.passed ? 'BASELINE PASSED' : 'DRIFT EXCEEDED'}</Badge>
                </div>

                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border text-xs font-mono ${
                  isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <span className={`block ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Baseline Power</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{bl.laserPowerBaselineWatts} W</span>
                  </div>
                  <div>
                    <span className={`block ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Beam Diameter</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{bl.beamDiameterMm} mm</span>
                  </div>
                  <div>
                    <span className={`block ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Cooling Flow Rate</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{bl.coolingFlowRateLpm} LPM</span>
                  </div>
                  <div>
                    <span className={`block ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Stage Repeatability</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>±{bl.stageRepeatabilityMm} mm</span>
                  </div>
                </div>

                <p className={`text-xs italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{bl.notes}"</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
