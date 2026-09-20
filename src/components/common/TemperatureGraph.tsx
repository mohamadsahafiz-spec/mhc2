import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { ChannelDataMap, ChannelStats, DayBoundary } from '../../types/temperature';

export type GraphPreset = 'engineering' | 'clean' | 'report';

interface TemperatureGraphProps {
  channelData: ChannelDataMap;
  activeChannels?: number[];
  stats?: ChannelStats | null;
  dayBoundaries?: DayBoundary[] | null;
  usl?: number | null;
  asl?: number | null;
  showSpecBand?: boolean;
  thresholdTemp?: number | null;
  thresholdLabel?: string;
  yStep?: number | null;
  xTickDensity?: 'auto' | 'dense' | 'sparse';
  preset?: GraphPreset;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showStatsBanner?: boolean;
  title?: string;
  className?: string;
  showYAxisControls?: boolean;
  showDayBoundaries?: boolean;
  yMinOverride?: number | null;
  yMaxOverride?: number | null;
}

const SpecReferenceArea = ReferenceArea as any;

const CHANNEL_COLORS: Record<number, string> = {
  1: '#E63946',
  2: '#2A9D8F',
  3: '#E9C46A',
  4: '#457B9D',
  5: '#F4A261',
  6: '#6A4C93'
};

export const TemperatureGraph: React.FC<TemperatureGraphProps> = ({
  channelData,
  activeChannels = [1, 2, 3, 4, 5, 6],
  stats,
  dayBoundaries = null,
  usl = null,
  asl = null,
  showSpecBand = true,
  thresholdTemp = null,
  thresholdLabel = 'Target Spec',
  yStep = null,
  xTickDensity: propXTickDensity,
  preset = 'engineering',
  height = 360,
  showGrid = true,
  showLegend = true,
  showStatsBanner = false,
  title,
  className = '',
  showYAxisControls = false,
  showDayBoundaries = true,
  yMinOverride = null,
  yMaxOverride = null
}) => {
  const [isAutoY, setIsAutoY] = useState<boolean>(yMinOverride === null && yMaxOverride === null);
  const [customMinStr, setCustomMinStr] = useState<string>(yMinOverride !== null && yMinOverride !== undefined ? String(yMinOverride) : '');
  const [customMaxStr, setCustomMaxStr] = useState<string>(yMaxOverride !== null && yMaxOverride !== undefined ? String(yMaxOverride) : '');
  
  // Explicit Y-Axis Step state
  const [selectedYStep, setSelectedYStep] = useState<number | null>(yStep ?? null);

  useEffect(() => {
    if (yStep !== undefined) {
      setSelectedYStep(yStep);
    }
  }, [yStep]);

  // X-Axis Tick Density state
  const [xTickDensity, setXTickDensity] = useState<'auto' | 'dense' | 'sparse'>(propXTickDensity || 'auto');

  useEffect(() => {
    if (propXTickDensity) {
      setXTickDensity(propXTickDensity);
    }
  }, [propXTickDensity]);

  const minTickGap = xTickDensity === 'dense' ? 15 : xTickDensity === 'sparse' ? 50 : 25;

  // Day boundaries toggle state
  const [isDayLinesVisible, setIsDayLinesVisible] = useState<boolean>(showDayBoundaries);

  // Threshold visual reference line state (legacy fallback if USL/ASL not supplied)
  const [isThresholdActive, setIsThresholdActive] = useState<boolean>(thresholdTemp !== null && thresholdTemp !== undefined);
  const [thresholdInput, setThresholdInput] = useState<string>(
    thresholdTemp !== null && thresholdTemp !== undefined ? String(thresholdTemp) : '24.0'
  );

  // Merge channel data into chart-compatible time-series points
  const { chartData, minVal, maxVal } = useMemo(() => {
    let globalMin = Infinity;
    let globalMax = -Infinity;

    if (!channelData) {
      return { chartData: [], minVal: 0, maxVal: 50 };
    }

    // Fast helper to parse time string / Date / number to ms timestamp
    const getMs = (p: any): number => {
      if (!p) return NaN;
      const raw = p.ts ?? p.x ?? p.timestamp ?? p.time ?? p.date ?? p.t ?? (Array.isArray(p) ? p[0] : p);
      if (typeof raw === 'number') {
        return raw < 1e11 ? raw * 1000 : raw;
      }
      if (raw instanceof Date) {
        return raw.getTime();
      }
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) return NaN;
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          const num = Number(trimmed);
          return num < 1e11 ? num * 1000 : num;
        }
        const normalized = trimmed.includes(' ') && !trimmed.includes('T')
          ? trimmed.replace(' ', 'T')
          : trimmed;
        const parsed = new Date(normalized).getTime();
        if (!isNaN(parsed)) return parsed;
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
          const today = new Date().toISOString().slice(0, 10);
          const timeParsed = new Date(`${today}T${trimmed}`).getTime();
          if (!isNaN(timeParsed)) return timeParsed;
        }
      }
      return NaN;
    };

    const getVal = (p: any): number => {
      if (!p) return 0;
      if (typeof p.val === 'number') return p.val;
      if (typeof p.y === 'number') return p.y;
      if (typeof p.value === 'number') return p.value;
      if (typeof p.temp === 'number') return p.temp;
      if (typeof p.temperature === 'number') return p.temperature;
      if (Array.isArray(p) && typeof p[1] === 'number') return p[1];
      const num = Number(p.val ?? p.y ?? p.value ?? p.temp ?? p.temperature ?? (typeof p === 'number' ? p : 0));
      return isNaN(num) ? 0 : num;
    };

    const formatTime = (tsMs: number): string => {
      if (isNaN(tsMs)) return '--:--:--';
      const d = new Date(tsMs);
      if (isNaN(d.getTime())) return '--:--:--';
      const h = d.getHours();
      const m = d.getMinutes();
      const s = d.getSeconds();
      return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // 1. Collect all valid points from active channels into unified time records
    const timeMap = new Map<number, Record<string, any>>();

    activeChannels.forEach((ch) => {
      const rawPts = (channelData as any)[ch] || (channelData as any)[`CH${ch}`];
      if (!rawPts || rawPts.length === 0) return;

      for (let i = 0; i < rawPts.length; i++) {
        const p = rawPts[i];
        const tsMs = getMs(p);
        if (isNaN(tsMs)) continue;
        const val = getVal(p);
        if (val < globalMin) globalMin = val;
        if (val > globalMax) globalMax = val;

        let rec = timeMap.get(tsMs);
        if (!rec) {
          rec = { timeKey: tsMs, timeStr: formatTime(tsMs) };
          timeMap.set(tsMs, rec);
        }
        rec[`CH${ch}`] = val;
      }
    });

    const sortedData = Array.from(timeMap.values()).sort((a, b) => a.timeKey - b.timeKey);

    // 2. Synchronously downsample along the shared timeline if total records exceed targetMax
    const targetMax = preset === 'report' ? 120 : 400;
    let finalData: Array<Record<string, any>> = sortedData;
    const total = sortedData.length;

    if (total > targetMax) {
      const step = Math.ceil(total / targetMax);
      const sampled: Array<Record<string, any>> = [];

      for (let i = 0; i < total; i += step) {
        sampled.push(sortedData[i]);
      }
      // Ensure the very last record is always included so the full timeline extent is represented
      if (sampled[sampled.length - 1] !== sortedData[total - 1]) {
        sampled.push(sortedData[total - 1]);
      }
      finalData = sampled;
    }

    return {
      chartData: finalData,
      minVal: globalMin === Infinity ? 0 : globalMin,
      maxVal: globalMax === -Infinity ? 50 : globalMax
    };
  }, [channelData, activeChannels, preset]);

  // Compute matched day-boundary positions along categorical timeStr X-axis
  const boundaryReferenceLines = useMemo(() => {
    if (!dayBoundaries || dayBoundaries.length === 0 || !chartData || chartData.length === 0) return [];
    const lines: Array<{ timeStr: string; date: string }> = [];

    dayBoundaries.forEach((b) => {
      const bDate = typeof b.ts === 'string' ? new Date(b.ts) : b.ts;
      const bMs = bDate.getTime();
      if (isNaN(bMs)) return;

      const matched = chartData.find((pt) => pt.timeKey >= bMs);
      if (matched && matched.timeStr) {
        lines.push({ timeStr: matched.timeStr, date: b.date });
      }
    });

    return lines;
  }, [dayBoundaries, chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 rounded-xl border border-dashed text-slate-400 font-mono text-xs ${className}`}>
        <span>No temperature data recorded.</span>
      </div>
    );
  }

  const autoYMin = Math.max(0, Math.floor(minVal - 2));
  const autoYMax = Math.ceil(maxVal + 2);

  const parsedCustomMin = parseFloat(customMinStr);
  const parsedCustomMax = parseFloat(customMaxStr);

  const yMin = yMinOverride !== null && yMinOverride !== undefined
    ? yMinOverride
    : (!isAutoY && !isNaN(parsedCustomMin) ? parsedCustomMin : autoYMin);

  const yMax = yMaxOverride !== null && yMaxOverride !== undefined
    ? yMaxOverride
    : (!isAutoY && !isNaN(parsedCustomMax) ? parsedCustomMax : autoYMax);

  const activeYStep = yStep !== null && yStep !== undefined ? yStep : selectedYStep;

  // Calculate explicit Y-Axis ticks if activeYStep is active
  const yTicks = useMemo(() => {
    if (!activeYStep || activeYStep <= 0) return undefined;
    const ticks: number[] = [];
    const start = Math.floor(yMin / activeYStep) * activeYStep;
    const end = Math.ceil(yMax / activeYStep) * activeYStep;
    const stepCount = Math.round((end - start) / activeYStep);

    if (stepCount > 60 || stepCount <= 0) return undefined;

    for (let val = start; val <= end + 0.0001; val += activeYStep) {
      ticks.push(Math.round(val * 100) / 100);
    }
    return ticks.length > 1 ? ticks : undefined;
  }, [yMin, yMax, activeYStep]);

  // Calculate parsed visual threshold line value
  const parsedThreshold = parseFloat(thresholdInput);
  const effectiveThreshold = thresholdTemp !== null && thresholdTemp !== undefined
    ? thresholdTemp
    : (isThresholdActive && !isNaN(parsedThreshold) ? parsedThreshold : null);

  const effectiveShowDayLines = showDayBoundaries !== undefined ? showDayBoundaries : isDayLinesVisible;

  const showDots = chartData.length <= 100;

  if (preset === 'report') {
    return (
      <div className={`space-y-2 text-slate-900 ${className}`}>
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-800">{title}</span>
            {stats && (
              <span className="text-[10px] font-mono text-slate-600">
                MIN: <strong>{stats.min}°C</strong> | AVG: <strong>{stats.avg}°C</strong> | MAX: <strong>{stats.max}°C</strong>
              </span>
            )}
          </div>
        )}
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
              <XAxis dataKey="timeStr" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" minTickGap={minTickGap} />
              <YAxis domain={[yMin, yMax]} ticks={yTicks} tick={{ fontSize: 9, fill: '#475569' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', color: '#0f172a' }}
              />
              {showLegend && (
                <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', paddingTop: '4px' }} />
              )}
              {/* Acceptable Spec Region & Limits (ASL & USL) */}
              {showSpecBand && usl !== null && asl !== null && asl < usl && (
                <SpecReferenceArea
                  y1={asl}
                  y2={usl}
                  fill="#10b981"
                  fillOpacity={0.08}
                  stroke="#10b981"
                  strokeOpacity={0.3}
                  strokeDasharray="2 2"
                />
              )}
              {usl !== null && (
                <ReferenceLine
                  y={usl}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: `USL (${usl.toFixed(1)}°C)`, position: 'right', fill: '#ef4444', fontSize: 9, fontFamily: 'monospace' }}
                />
              )}
              {asl !== null && (
                <ReferenceLine
                  y={asl}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: `ASL (${asl.toFixed(1)}°C)`, position: 'right', fill: '#3b82f6', fontSize: 9, fontFamily: 'monospace' }}
                />
              )}
              {/* Day boundaries */}
              {effectiveShowDayLines && boundaryReferenceLines.map((b) => (
                <ReferenceLine
                  key={b.date}
                  x={b.timeStr}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{ value: b.date, position: 'insideTopLeft', fill: '#64748b', fontSize: 8 }}
                />
              ))}
              {/* Visual threshold line fallback */}
              {effectiveThreshold !== null && (
                <ReferenceLine
                  y={effectiveThreshold}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{ value: `${thresholdLabel} (${effectiveThreshold}°C)`, fill: '#d97706', fontSize: 9, position: 'right' }}
                />
              )}
              {activeChannels.map((ch) => {
                const markboxName = ch === 1 || ch === 4 ? 'Markbox 1' : ch === 2 || ch === 5 ? 'Markbox 2' : 'Markbox 3';
                return (
                  <Line
                    key={ch}
                    type="monotone"
                    dataKey={`CH${ch}`}
                    name={`CH${ch} (${markboxName})`}
                    stroke={CHANNEL_COLORS[ch] || '#3b82f6'}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={true}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (preset === 'clean') {
    return (
      <div className={`space-y-3 ${className}`}>
        {title && <h4 className="text-xs font-bold text-slate-200">{title}</h4>}
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" opacity={0.5} />
              <XAxis dataKey="timeStr" tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={minTickGap} />
              <YAxis domain={[yMin, yMax]} ticks={yTicks} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
              {/* Acceptable Spec Region & Limits (ASL & USL) */}
              {showSpecBand && usl !== null && asl !== null && asl < usl && (
                <SpecReferenceArea
                  y1={asl}
                  y2={usl}
                  fill="#10b981"
                  fillOpacity={0.08}
                  stroke="#10b981"
                  strokeOpacity={0.25}
                  strokeDasharray="2 2"
                />
              )}
              {usl !== null && (
                <ReferenceLine
                  y={usl}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: `USL (${usl.toFixed(1)}°C)`, position: 'right', fill: '#ef4444', fontSize: 10, fontFamily: 'monospace' }}
                />
              )}
              {asl !== null && (
                <ReferenceLine
                  y={asl}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: `ASL (${asl.toFixed(1)}°C)`, position: 'right', fill: '#3b82f6', fontSize: 10, fontFamily: 'monospace' }}
                />
              )}
              {/* Day boundaries */}
              {effectiveShowDayLines && boundaryReferenceLines.map((b) => (
                <ReferenceLine
                  key={b.date}
                  x={b.timeStr}
                  stroke="#64748b"
                  strokeDasharray="3 3"
                  label={{ value: b.date, position: 'insideTopLeft', fill: '#94a3b8', fontSize: 9 }}
                />
              ))}
              {/* Visual threshold line fallback */}
              {effectiveThreshold !== null && (
                <ReferenceLine
                  y={effectiveThreshold}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{ value: `${thresholdLabel} (${effectiveThreshold}°C)`, fill: '#f59e0b', fontSize: 10, position: 'right' }}
                />
              )}
              {activeChannels.map((ch) => (
                <Line
                  key={ch}
                  type="monotone"
                  dataKey={`CH${ch}`}
                  stroke={CHANNEL_COLORS[ch] || '#38bdf8'}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Default: Engineering preset with full interactive controls
  return (
    <div className={`space-y-3 ${className}`}>
      {showYAxisControls && (
        <div className="space-y-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300">
          {/* Row 1: Scale Bounds & Step Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-400">Y-Axis Scale:</span>
              <button
                type="button"
                onClick={() => setIsAutoY(true)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                  isAutoY
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Auto ({autoYMin}°C – {autoYMax}°C)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAutoY(false);
                  if (!customMinStr) setCustomMinStr(String(autoYMin));
                  if (!customMaxStr) setCustomMaxStr(String(autoYMax));
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                  !isAutoY
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Manual Bounds
              </button>

              {!isAutoY && (
                <div className="flex items-center gap-2 ml-1">
                  <label className="flex items-center gap-1 text-[11px] text-slate-300">
                    <span className="text-slate-400">Min:</span>
                    <input
                      type="number"
                      value={customMinStr}
                      onChange={(e) => setCustomMinStr(e.target.value)}
                      placeholder={String(autoYMin)}
                      className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                    <span>°C</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-300">
                    <span className="text-slate-400">Max:</span>
                    <input
                      type="number"
                      value={customMaxStr}
                      onChange={(e) => setCustomMaxStr(e.target.value)}
                      placeholder={String(autoYMax)}
                      className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                    <span>°C</span>
                  </label>
                </div>
              )}
            </div>

            {/* Major Step Increments */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-400">Major Step:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                {[
                  { label: 'Auto', val: null },
                  { label: '0.5°', val: 0.5 },
                  { label: '1.0°', val: 1.0 },
                  { label: '2.0°', val: 2.0 },
                  { label: '5.0°', val: 5.0 }
                ].map((st) => (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => setSelectedYStep(st.val)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                      selectedYStep === st.val
                        ? 'bg-sky-500/25 text-sky-300 font-bold border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Visual Guides (Day Boundaries, Ref Line, X-Ticks) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
            {/* Visual Threshold Line Guide */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isThresholdActive}
                  onChange={(e) => setIsThresholdActive(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 bg-slate-950"
                />
                <span className="text-[11px] text-amber-300 font-medium">Visual Ref Line:</span>
              </label>

              {isThresholdActive && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                    placeholder="24.0"
                  />
                  <span className="text-[11px] text-slate-400">°C</span>
                  <span className="text-[9.5px] text-slate-500 italic ml-1">(Visual guide only)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Day Boundary Line Toggle */}
              {boundaryReferenceLines.length > 0 && (
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDayLinesVisible}
                    onChange={(e) => setIsDayLinesVisible(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-0 w-3.5 h-3.5 bg-slate-950"
                  />
                  <span className="text-[10.5px] text-slate-300">
                    Day Boundaries ({boundaryReferenceLines.length})
                  </span>
                </label>
              )}

              {/* X-Axis Tick Density */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">X-Ticks:</span>
                <select
                  value={xTickDensity}
                  onChange={(e) => setXTickDensity(e.target.value as any)}
                  className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 font-mono text-[10px] focus:outline-none"
                >
                  <option value="auto">Auto</option>
                  <option value="dense">Dense</option>
                  <option value="sparse">Sparse</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatsBanner && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">MIN</span>
            <strong className="text-sky-400 font-bold">{stats.min}°C</strong>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">MAX</span>
            <strong className="text-rose-400 font-bold">{stats.max}°C</strong>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">AVG</span>
            <strong className="text-emerald-400 font-bold">{stats.avg}°C</strong>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block uppercase">RANGE</span>
            <strong className="text-amber-400 font-bold">{stats.range}°C</strong>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block uppercase">POINTS</span>
            <strong className="text-indigo-400 font-bold">{stats.points}</strong>
          </div>
        </div>
      )}

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#2B323A" />}
            <XAxis dataKey="timeStr" tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={minTickGap} />
            <YAxis domain={[yMin, yMax]} ticks={yTicks} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="°C" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#14171A',
                borderColor: '#2B323A',
                borderRadius: '10px',
                color: '#F1F5F9',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }}
              />
            )}
            {/* Acceptable Spec Region & Limits (ASL & USL) */}
            {showSpecBand && usl !== null && asl !== null && asl < usl && (
              <SpecReferenceArea
                y1={asl}
                y2={usl}
                fill="#10b981"
                fillOpacity={0.08}
                stroke="#10b981"
                strokeOpacity={0.25}
                strokeDasharray="2 2"
              />
            )}
            {usl !== null && (
              <ReferenceLine
                y={usl}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `USL (${usl.toFixed(1)}°C)`,
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontFamily: 'monospace'
                }}
              />
            )}
            {asl !== null && (
              <ReferenceLine
                y={asl}
                stroke="#3b82f6"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `ASL (${asl.toFixed(1)}°C)`,
                  position: 'right',
                  fill: '#3b82f6',
                  fontSize: 10,
                  fontFamily: 'monospace'
                }}
              />
            )}
            {/* Day Boundaries Reference Lines */}
            {effectiveShowDayLines && boundaryReferenceLines.map((b) => (
              <ReferenceLine
                key={b.date}
                x={b.timeStr}
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Day: ${b.date}`,
                  position: 'insideTopLeft',
                  fill: '#94a3b8',
                  fontSize: 10,
                  fontFamily: 'monospace'
                }}
              />
            ))}
            {/* Visual Threshold Reference Line (Fallback) */}
            {effectiveThreshold !== null && (
              <ReferenceLine
                y={effectiveThreshold}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `${thresholdLabel} (${effectiveThreshold}°C)`,
                  position: 'right',
                  fill: '#f59e0b',
                  fontSize: 10,
                  fontFamily: 'monospace'
                }}
              />
            )}
            {/* Overall Dataset Average Reference Line */}
            {stats && (
              <ReferenceLine
                y={stats.avg}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: `Avg ${stats.avg}°C`, fill: '#10b981', fontSize: 10, position: 'right', fontFamily: 'monospace' }}
              />
            )}
            {activeChannels.map((ch) => (
              <Line
                key={ch}
                type="monotone"
                dataKey={`CH${ch}`}
                name={`CH${ch}`}
                stroke={CHANNEL_COLORS[ch] || '#38bdf8'}
                strokeWidth={2}
                dot={showDots ? { r: 1 } : false}
                activeDot={{ r: 4 }}
                connectNulls={true}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
