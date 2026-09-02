import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { ChannelDataMap, ChannelStats } from '../../types/temperature';

export type GraphPreset = 'engineering' | 'clean' | 'report';

interface TemperatureGraphProps {
  channelData: ChannelDataMap;
  activeChannels?: number[];
  stats?: ChannelStats | null;
  preset?: GraphPreset;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showStatsBanner?: boolean;
  title?: string;
  className?: string;
  showYAxisControls?: boolean;
  yMinOverride?: number | null;
  yMaxOverride?: number | null;
}

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
  preset = 'engineering',
  height = 320,
  showGrid = true,
  showLegend = true,
  showStatsBanner = true,
  title,
  className = '',
  showYAxisControls = true,
  yMinOverride = null,
  yMaxOverride = null
}) => {
  const [isAutoY, setIsAutoY] = React.useState<boolean>(yMinOverride === null && yMaxOverride === null);
  const [customMinStr, setCustomMinStr] = React.useState<string>(yMinOverride !== null && yMinOverride !== undefined ? String(yMinOverride) : '');
  const [customMaxStr, setCustomMaxStr] = React.useState<string>(yMaxOverride !== null && yMaxOverride !== undefined ? String(yMaxOverride) : '');
  // Merge channel data into chart-compatible time-series points with target max 1500 points per channel
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

  const yMin = !isAutoY && !isNaN(parsedCustomMin) ? parsedCustomMin : autoYMin;
  const yMax = !isAutoY && !isNaN(parsedCustomMax) ? parsedCustomMax : autoYMax;

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
              <XAxis dataKey="timeStr" tick={{ fontSize: 9, fill: '#475569' }} interval="preserveStartEnd" minTickGap={25} />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 9, fill: '#475569' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', color: '#0f172a' }}
              />
              {showLegend && (
                <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', paddingTop: '4px' }} />
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
              <XAxis dataKey="timeStr" tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={25} />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
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

  // Default: Engineering preset
  return (
    <div className={`space-y-3 ${className}`}>
      {showYAxisControls && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 font-mono text-xs">
          <div className="flex items-center gap-2">
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
          </div>

          {!isAutoY && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-slate-300">
                <span>Min:</span>
                <input
                  type="number"
                  value={customMinStr}
                  onChange={(e) => setCustomMinStr(e.target.value)}
                  placeholder={String(autoYMin)}
                  className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
                <span>°C</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] text-slate-300">
                <span>Max:</span>
                <input
                  type="number"
                  value={customMaxStr}
                  onChange={(e) => setCustomMaxStr(e.target.value)}
                  placeholder={String(autoYMax)}
                  className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
                <span>°C</span>
              </label>
            </div>
          )}
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
            <XAxis dataKey="timeStr" tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={25} />
            <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="°C" />
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
            {stats && (
              <ReferenceLine
                y={stats.avg}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: `Avg ${stats.avg}°C`, fill: '#10b981', fontSize: 10, position: 'right' }}
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
