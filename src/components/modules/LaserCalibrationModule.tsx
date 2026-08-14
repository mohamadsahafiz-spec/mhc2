import React, { useState } from 'react';
import { Zap, Activity, Gauge, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';
import { Machine } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface LaserCalibrationProps {
  machines: Machine[];
}

export const LaserCalibrationModule: React.FC<LaserCalibrationProps> = ({ machines }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  const [currentWatts, setCurrentWatts] = useState(248);
  const [targetWatts, setTargetWatts] = useState(250);
  const [galvoGainX, setGalvoGainX] = useState(1.002);
  const [galvoGainY, setGalvoGainY] = useState(0.998);
  const [calibrated, setCalibrated] = useState(false);

  const handleCalibrate = () => {
    setCurrentWatts(targetWatts);
    setCalibrated(true);
    setTimeout(() => setCalibrated(false), 3000);
  };

  if (!selectedMachine) {
    return (
      <div className={`p-8 text-center rounded-2xl border ${
        isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <Zap className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h2 className="text-base font-bold">No Machines Available for Calibration</h2>
        <p className="text-xs text-slate-500 mt-1">Please register a machine in the Machine Passport module first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Machine Selector */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div>
          <span className={`text-xs font-mono font-bold uppercase ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>Laser Calibration Workbench</span>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedMachine?.model || 'Laser System'} ({selectedMachine?.serialNumber || 'N/A'})</h2>
        </div>

        <select
          value={selectedMachineId}
          onChange={(e) => setSelectedMachineId(e.target.value)}
          className={`text-xs rounded-lg p-2 border transition-all ${
            isDark ? 'bg-[#111315] text-slate-100 border-[#2B323A]' : 'bg-white text-slate-900 border-slate-300'
          }`}
        >
          {machines.map((m) => (
            <option key={m.id} value={m.id}>{m.model} ({m.machineNumber})</option>
          ))}
        </select>
      </div>

      {/* Interactive Calibration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Laser Power Output & Offset Recalibration">
          <div className="space-y-4 text-xs">
            <div className={`grid grid-cols-2 gap-3 p-3 rounded-lg border ${
              isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className={`block font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Current Measured:</span>
                <span className={`text-lg font-bold font-mono ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{currentWatts} W</span>
              </div>
              <div>
                <span className={`block font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Target Nominal:</span>
                <span className={`text-lg font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{targetWatts} W</span>
              </div>
            </div>

            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Adjust Laser Driver Power Offset Target (W)</label>
              <input
                type="number"
                value={targetWatts}
                onChange={(e) => setTargetWatts(parseFloat(e.target.value) || 0)}
                className={`w-full border rounded-lg p-2.5 font-mono font-bold transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <Button
              variant="primary"
              size="md"
              icon={<Zap className="w-4 h-4" />}
              onClick={handleCalibrate}
              className="w-full"
            >
              Execute Power Offset Calibration
            </Button>

            {calibrated && (
              <p className={`text-xs font-mono font-bold text-center p-2 rounded border ${
                isDark ? 'text-[#7FD4A6] bg-[#7FD4A6]/10 border-[#7FD4A6]/30' : 'text-emerald-800 bg-emerald-50 border-emerald-200'
              }`}>
                ✓ Laser power offset calibrated to {targetWatts}W!
              </p>
            )}
          </div>
        </Card>

        <Card title="Galvo Scanning Motor Gains & Beam Alignment">
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}>Galvo X Motor Gain Offset:</span>
                <span className={`font-bold ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{galvoGainX}</span>
              </div>
              <input
                type="range"
                min="0.95"
                max="1.05"
                step="0.001"
                value={galvoGainX}
                onChange={(e) => setGalvoGainX(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-[#8B9DFF] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}>Galvo Y Motor Gain Offset:</span>
                <span className={`font-bold ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{galvoGainY}</span>
              </div>
              <input
                type="range"
                min="0.95"
                max="1.05"
                step="0.001"
                value={galvoGainY}
                onChange={(e) => setGalvoGainY(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-[#8B9DFF] cursor-pointer"
              />
            </div>

            <div className={`p-3 rounded-lg border space-y-1 font-mono text-[11px] ${
              isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className={isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}>Calculated Beam Spot Symmetry Ratio: <strong className={isDark ? 'text-[#7FD4A6]' : 'text-emerald-700'}>0.982 (TEM00)</strong></p>
              <p className={isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}>Galvanometer Response Latency: <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>12 µs</strong></p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
