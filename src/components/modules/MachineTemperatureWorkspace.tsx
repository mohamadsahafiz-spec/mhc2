import React, { useState, useRef, useMemo } from 'react';
import {
  Thermometer,
  Upload,
  Save,
  Plus,
  Trash2,
  FileText,
  Clock,
  BarChart2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Sliders,
  Eye,
  ArrowRight,
  Database,
  X
} from 'lucide-react';
import { Machine } from '../../types';
import {
  SavedTemperatureRecord,
  ManualTemperatureReading,
  ParsedTempPoint,
  ChannelDataMap,
  DayBoundary,
  ChannelStats
} from '../../types/temperature';
import { TemperatureEngine } from '../../utils/temperatureEngine';
import { TempRawStore } from '../../utils/tempRawStore';
import { StorageService } from '../../utils/persistence';
import { TemperatureGraph, GraphPreset } from '../common/TemperatureGraph';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

interface MachineTemperatureWorkspaceProps {
  machine: Machine;
  onUpdateMachine: (updatedMachine: Machine) => void;
}

const CHANNEL_COLORS: Record<number, string> = {
  1: '#E63946',
  2: '#2A9D8F',
  3: '#E9C46A',
  4: '#457B9D',
  5: '#F4A261',
  6: '#6A4C93'
};

// Visual per-channel engineering summary table with proportional cell-background fills
// Hierarchy: CH | MIN (Blue) | MAX (Red) | AVG (Green) | RANGE (Purple)
export interface ChannelSummaryTableProps {
  channelStats: Record<number, ChannelStats>;
  activeChannels?: number[];
  onToggleChannel?: (ch: number) => void;
  isDark?: boolean;
}

type TableSortKey = 'ch' | 'min' | 'max' | 'avg' | 'range';
type TableSortDirection = 'asc' | 'desc';

export const ChannelSummaryTable: React.FC<ChannelSummaryTableProps> = ({
  channelStats,
  activeChannels,
  onToggleChannel,
  isDark = true
}) => {
  const [sortKey, setSortKey] = useState<TableSortKey>('ch');
  const [sortDirection, setSortDirection] = useState<TableSortDirection>('asc');

  const channels = Object.keys(channelStats)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);

  if (channels.length === 0) return null;

  const handleSort = (key: TableSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedChannels = useMemo(() => {
    const list = [...channels];
    list.sort((a, b) => {
      const stA = channelStats[a];
      const stB = channelStats[b];
      if (!stA && !stB) return 0;
      if (!stA) return 1;
      if (!stB) return -1;

      let valA = 0;
      let valB = 0;
      if (sortKey === 'ch') {
        valA = a;
        valB = b;
      } else if (sortKey === 'min') {
        valA = stA.min;
        valB = stB.min;
      } else if (sortKey === 'max') {
        valA = stA.max;
        valB = stB.max;
      } else if (sortKey === 'avg') {
        valA = stA.avg;
        valB = stB.avg;
      } else if (sortKey === 'range') {
        valA = stA.range;
        valB = stB.range;
      }

      if (valA === valB) return a - b;
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
    return list;
  }, [channels, channelStats, sortKey, sortDirection]);

  // Extents across channels for relative magnitude comparison
  const minMin = Math.min(...channels.map((ch) => channelStats[ch]?.min ?? 0));
  const maxMin = Math.max(...channels.map((ch) => channelStats[ch]?.min ?? 0));

  const minMax = Math.min(...channels.map((ch) => channelStats[ch]?.max ?? 0));
  const maxMax = Math.max(...channels.map((ch) => channelStats[ch]?.max ?? 0));

  const minAvg = Math.min(...channels.map((ch) => channelStats[ch]?.avg ?? 0));
  const maxAvg = Math.max(...channels.map((ch) => channelStats[ch]?.avg ?? 0));

  const maxRange = Math.max(...channels.map((ch) => channelStats[ch]?.range ?? 0), 0.1);

  // Proportional magnitude fill calculations (relative extent within matrix)
  const calcMinPct = (val: number) => {
    if (maxMin === minMin) return 50;
    return Math.max(12, Math.min(100, ((val - minMin) / (maxMin - minMin)) * 80 + 20));
  };

  const calcMaxPct = (val: number) => {
    if (maxMax === minMax) return 50;
    return Math.max(12, Math.min(100, ((val - minMax) / (maxMax - minMax)) * 80 + 20));
  };

  const calcAvgPct = (val: number) => {
    if (maxAvg === minAvg) return 50;
    return Math.max(12, Math.min(100, ((val - minAvg) / (maxAvg - minAvg)) * 80 + 20));
  };

  const calcRangePct = (val: number) => {
    return Math.max(8, Math.min(100, (val / maxRange) * 100));
  };

  const renderSortHeader = (key: TableSortKey, label: string, minWidth: string = 'min-w-[130px]') => {
    const isSorted = sortKey === key;
    return (
      <th className={`py-2.5 px-3 font-mono font-medium text-[11px] ${minWidth}`}>
        <button
          type="button"
          onClick={() => handleSort(key)}
          className={`flex items-center gap-1.5 uppercase font-mono tracking-wider transition-colors select-none ${
            isSorted
              ? isDark ? 'text-sky-400 font-bold' : 'text-sky-600 font-bold'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
          title={`Sort by ${label} (${isSorted && sortDirection === 'asc' ? 'descending' : 'ascending'})`}
        >
          <span>{label}</span>
          <span className="shrink-0 flex items-center">
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ChevronUp className="w-3 h-3 text-sky-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-sky-400" />
              )
            ) : (
              <span className="text-[10px] text-slate-500 opacity-40">↕</span>
            )}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Per-Channel Engineering Summary
        </h4>
        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          MIN (Blue) · MAX (Red) · AVG (Green) · RANGE (Purple) · Click header to sort
        </span>
      </div>

      <div className={`overflow-x-auto rounded-xl border font-mono text-xs ${
        isDark ? 'border-[#242A32] bg-[#111315]' : 'border-slate-200 bg-white'
      }`}>
        <table className="w-full text-left border-collapse">
          <thead className={isDark ? 'bg-[#14171A] text-slate-400 border-b border-[#242A32]' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}>
            <tr>
              {renderSortHeader('ch', 'CH', 'w-24')}
              {renderSortHeader('min', 'MIN', 'min-w-[130px]')}
              {renderSortHeader('max', 'MAX', 'min-w-[130px]')}
              {renderSortHeader('avg', 'AVG', 'min-w-[130px]')}
              {renderSortHeader('range', 'RANGE', 'min-w-[130px]')}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#1E232B]' : 'divide-slate-100'}`}>
            {sortedChannels.map((ch) => {
              const st = channelStats[ch];
              const isActive = !activeChannels || activeChannels.includes(ch);
              if (!st) return null;

              const markboxName = ch === 1 || ch === 4 ? 'MB1' : ch === 2 || ch === 5 ? 'MB2' : 'MB3';

              return (
                <tr
                  key={ch}
                  className={`transition-colors ${
                    isActive
                      ? isDark
                        ? 'hover:bg-[#16191D]'
                        : 'hover:bg-slate-50/80'
                      : isDark
                      ? 'opacity-35 hover:opacity-60 bg-[#111315]'
                      : 'opacity-35 hover:opacity-60 bg-slate-50'
                  }`}
                >
                  {/* CH */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    {onToggleChannel ? (
                      <button
                        type="button"
                        onClick={() => onToggleChannel(ch)}
                        className={`inline-flex items-center gap-1.5 font-mono text-xs transition-opacity ${
                          isActive
                            ? isDark ? 'text-slate-200 hover:text-white font-bold' : 'text-slate-900 hover:text-black font-bold'
                            : isDark ? 'text-slate-500 opacity-40 hover:opacity-70 font-normal' : 'text-slate-400 opacity-40 hover:opacity-70 font-normal'
                        }`}
                        title={isActive ? 'Click to hide channel from graph' : 'Click to show channel in graph'}
                      >
                        <span>CH{ch}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({markboxName})</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                        <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>CH{ch}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({markboxName})</span>
                      </div>
                    )}
                  </td>

                  {/* MIN (Muted Blue proportional cell-background fill) */}
                  <td className="p-0 relative">
                    <div className="relative h-9 px-3 flex items-center overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-500/15 border-r border-blue-400/25 pointer-events-none transition-all duration-200"
                        style={{ width: `${calcMinPct(st.min)}%` }}
                      />
                      <div className="relative z-10 flex items-baseline gap-1 font-mono text-xs">
                        <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {st.min.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">°C</span>
                      </div>
                    </div>
                  </td>

                  {/* MAX (Muted Red proportional cell-background fill) */}
                  <td className="p-0 relative">
                    <div className="relative h-9 px-3 flex items-center overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-red-500/15 border-r border-red-400/25 pointer-events-none transition-all duration-200"
                        style={{ width: `${calcMaxPct(st.max)}%` }}
                      />
                      <div className="relative z-10 flex items-baseline gap-1 font-mono text-xs">
                        <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {st.max.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">°C</span>
                      </div>
                    </div>
                  </td>

                  {/* AVG (Muted Green proportional cell-background fill) */}
                  <td className="p-0 relative">
                    <div className="relative h-9 px-3 flex items-center overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-emerald-500/15 border-r border-emerald-400/25 pointer-events-none transition-all duration-200"
                        style={{ width: `${calcAvgPct(st.avg)}%` }}
                      />
                      <div className="relative z-10 flex items-baseline gap-1 font-mono text-xs">
                        <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {st.avg.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">°C</span>
                      </div>
                    </div>
                  </td>

                  {/* RANGE (Muted Purple proportional cell-background fill) */}
                  <td className="p-0 relative">
                    <div className="relative h-9 px-3 flex items-center overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-purple-500/15 border-r border-purple-400/25 pointer-events-none transition-all duration-200"
                        style={{ width: `${calcRangePct(st.range)}%` }}
                      />
                      <div className="relative z-10 flex items-baseline gap-1 font-mono text-xs">
                        <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {st.range.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">°C</span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// In-memory cache for unsaved imported temperature drafts per machine
const tempDraftCache: Record<string, {
  selectedFiles: { name: string; text: string }[];
  analysisResult: any;
}> = {};

export const MachineTemperatureWorkspace: React.FC<MachineTemperatureWorkspaceProps> = ({
  machine,
  onUpdateMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const cachedDraft = machine?.id ? tempDraftCache[machine.id] : undefined;

  // State for raw log processing
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; text: string }[]>(cachedDraft?.selectedFiles || []);
  const [cmdFilter, setCmdFilter] = useState<string>('1');
  const [intervalSec, setIntervalSec] = useState<number>(30);
  const [filterMin, setFilterMin] = useState<number>(0);
  const [filterMax, setFilterMax] = useState<number>(9999);

  // Active temperature inspection session state
  const [analysisResult, setAnalysisResult] = useState<{
    rawRecords: ParsedTempPoint[];
    resampledChannels: ChannelDataMap;
    dayBoundaries: DayBoundary[];
    stats: ChannelStats | null;
    channelStats: Record<number, ChannelStats>;
    sourceFileNames: string[];
  } | null>(cachedDraft?.analysisResult || null);

  const [activeChannels, setActiveChannels] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [graphPreset, setGraphPreset] = useState<GraphPreset>('engineering');

  // Display & Axis custom settings
  const [isAutoY, setIsAutoY] = useState<boolean>(true);
  const [customMinStr, setCustomMinStr] = useState<string>('');
  const [customMaxStr, setCustomMaxStr] = useState<string>('');
  const [selectedYStep, setSelectedYStep] = useState<number | null>(null);
  const [showDayBoundaries, setShowDayBoundaries] = useState<boolean>(true);
  const [showSpecBand, setShowSpecBand] = useState<boolean>(true);
  const [xTickDensity, setXTickDensity] = useState<'auto' | 'dense' | 'sparse'>('auto');

  // Unified engineering controls toggle
  const [showAdvancedControls, setShowAdvancedControls] = useState<boolean>(false);

  // Modal / Detail state
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<SavedTemperatureRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<SavedTemperatureRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!machine) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${
        isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <Thermometer className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-50" />
        <p className="text-sm font-semibold">No machine selected for temperature telemetry.</p>
      </div>
    );
  }

  // File Upload Handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const filePromises = files.map(
      (file) =>
        new Promise<{ name: string; text: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve({ name: file.name, text: (evt.target?.result as string) || '' });
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsText(file);
        })
    );

    Promise.all(filePromises)
      .then((readFiles) => {
        const updatedFiles = [...selectedFiles, ...readFiles];
        setSelectedFiles(updatedFiles);
        runEngineAnalysis(updatedFiles, cmdFilter, intervalSec, filterMin, filterMax);
      })
      .catch((err) => alert(err.message));
  };

  const runEngineAnalysis = (
    files: { name: string; text: string }[],
    cmd: string,
    interval: number,
    fMin: number,
    fMax: number
  ) => {
    if (!files.length) {
      setAnalysisResult(null);
      return;
    }

    const rawTexts = files.map((f) => f.text);
    const result = TemperatureEngine.analyzeTemperatureLogs(rawTexts, {
      cmdFilter: cmd,
      intervalSec: interval,
      filterMin: fMin,
      filterMax: fMax
    });

    const resData = {
      rawRecords: result.rawRecords,
      resampledChannels: result.resampledChannels,
      dayBoundaries: result.dayBoundaries,
      stats: result.combinedStats,
      channelStats: result.channelStats,
      sourceFileNames: files.map((f) => f.name)
    };

    setAnalysisResult(resData);
    tempDraftCache[machine.id] = { selectedFiles: files, analysisResult: resData };
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setAnalysisResult(null);
    delete tempDraftCache[machine.id];
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleChannel = (ch: number) => {
    setActiveChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch].sort((a, b) => a - b)
    );
  };

  // Save current temperature analysis session to Machine Passport
  const handleSaveTemperatureRecord = () => {
    if (!analysisResult || !analysisResult.stats) return;

    const recordId = `TR-${Date.now()}`;

    // Downsample channelData points for each channel
    const downsampledChannelData: ChannelDataMap = {};
    if (analysisResult.resampledChannels) {
      Object.entries(analysisResult.resampledChannels).forEach(([chStr, pts]) => {
        const ch = parseInt(chStr, 10);
        if (Array.isArray(pts)) {
          downsampledChannelData[ch] = TemperatureEngine.downsamplePoints(pts, 1500);
        }
      });
    }

    const newRecord: SavedTemperatureRecord = {
      id: recordId,
      machineId: machine.id,
      title: `${machine.model} Temperature Inspection (${analysisResult.sourceFileNames.length} log file${
        analysisResult.sourceFileNames.length > 1 ? 's' : ''
      })`,
      createdAt: new Date().toISOString(),
      sourceFileNames: analysisResult.sourceFileNames,
      rawRecordsCount: analysisResult.rawRecords.length,
      intervalSec,
      stats: analysisResult.stats,
      channelStats: analysisResult.channelStats,
      dayBoundaries: analysisResult.dayBoundaries,
      channelData: downsampledChannelData,
      records: []
    };

    // Store full raw records in IndexedDB
    TempRawStore.saveRawRecords(recordId, analysisResult.rawRecords);

    const existingRecords = machine.temperatureRecords || [];
    const updatedRecords = [newRecord, ...existingRecords].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const updatedMachine: Machine = {
      ...machine,
      temperatureRecords: updatedRecords
    };

    onUpdateMachine(updatedMachine);
    const allMachines = StorageService.getMachines();
    const otherMachines = allMachines.filter((m) => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...otherMachines]);

    delete tempDraftCache[machine.id];
    setSelectedFiles([]);
    setAnalysisResult(null);
  };

  const handleRequestDeleteSavedRecord = (record: SavedTemperatureRecord) => {
    setRecordToDelete(record);
  };

  const confirmDeleteSavedRecord = () => {
    if (!recordToDelete) return;
    const recordId = recordToDelete.id;
    TempRawStore.deleteRawRecords(recordId);
    const updatedRecords = (machine.temperatureRecords || []).filter((r) => r.id !== recordId);
    const updatedMachine: Machine = {
      ...machine,
      temperatureRecords: updatedRecords
    };
    onUpdateMachine(updatedMachine);
    const allMachines = StorageService.getMachines();
    const otherMachines = allMachines.filter((m) => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...otherMachines]);

    if (selectedRecordForDetail?.id === recordId) {
      setSelectedRecordForDetail(null);
    }
    setRecordToDelete(null);
  };

  const handleDeleteManualReading = (id: string) => {
    const updatedReadings = (machine.manualTemperatureReadings || []).filter((r) => r.id !== id);
    const updatedMachine: Machine = {
      ...machine,
      manualTemperatureReadings: updatedReadings
    };
    onUpdateMachine(updatedMachine);
    const allMachines = StorageService.getMachines();
    const otherMachines = allMachines.filter((m) => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...otherMachines]);
  };

  const savedRecords = useMemo(() => {
    const list = machine.temperatureRecords || [];
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [machine.temperatureRecords]);

  const manualReadings = useMemo(() => {
    const list = machine.manualTemperatureReadings || [];
    return [...list].sort((a, b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime());
  }, [machine.manualTemperatureReadings]);

  // Derive Authoritative MHC Temperature Spec Limits (USL & ASL)
  const mhcCoolingSpec = machine.mhcSpecs?.temperatureCooling;
  const targetTemp = (mhcCoolingSpec?.targetTempCelsius !== undefined && mhcCoolingSpec?.targetTempCelsius !== null)
    ? mhcCoolingSpec.targetTempCelsius
    : null;
  const tempTolerance = (mhcCoolingSpec?.tempToleranceCelsius !== undefined && mhcCoolingSpec?.tempToleranceCelsius !== null)
    ? mhcCoolingSpec.tempToleranceCelsius
    : null;
  const hasAuthoritativeSpec = targetTemp !== null;
  const authoritativeUsl = hasAuthoritativeSpec ? targetTemp + (tempTolerance ?? 0) : null;
  const authoritativeAsl = hasAuthoritativeSpec ? targetTemp - (tempTolerance ?? 0) : null;

  // Derived overrides for chart display
  const yMinOverride = !isAutoY && customMinStr !== '' && !isNaN(parseFloat(customMinStr)) ? parseFloat(customMinStr) : null;
  const yMaxOverride = !isAutoY && customMaxStr !== '' && !isNaN(parseFloat(customMaxStr)) ? parseFloat(customMaxStr) : null;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800/80 text-sky-400 border border-slate-700/50' : 'bg-slate-100 text-sky-600 border border-slate-200'}`}>
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Machine Temperature Telemetry
                </h2>
                <Badge variant="cyan" size="sm">
                  {machine.machineNumber}
                </Badge>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {machine.model}
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Native Temperature Telemetry Engine · {savedRecords.length} Saved Inspections
                {hasAuthoritativeSpec && (
                  <span className="ml-2 text-slate-400 font-semibold">
                    · Spec: {targetTemp}°C ±{(tempTolerance ?? 0)}°C (USL: {authoritativeUsl}°C, ASL: {authoritativeAsl}°C)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-mono"
            >
              Import Log Files
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".log,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* 2. ACTIVE LOG ANALYSIS VIEW (If files uploaded) */}
      {analysisResult ? (
        <div className={`rounded-2xl border p-6 space-y-6 ${
          isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {/* LEVEL 1: RECORD IDENTITY */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
                  isDark ? 'bg-slate-800 text-sky-400 border border-slate-700' : 'bg-slate-200 text-slate-800 border border-slate-300'
                }`}>
                  Active Ingestion Session
                </span>
                <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {machine.model} ({machine.machineNumber})
                </h3>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}>
                  {analysisResult.rawRecords.length.toLocaleString()} raw pts
                </span>
              </div>
              <p className={`text-xs font-mono flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Bucket: {intervalSec}s</span>
                <span>•</span>
                <span>Files ({analysisResult.sourceFileNames.length}): {analysisResult.sourceFileNames.join(', ')}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={<X className="w-3.5 h-3.5" />}
                onClick={handleClearFiles}
                className="text-xs"
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<Save className="w-3.5 h-3.5" />}
                onClick={handleSaveTemperatureRecord}
                className="text-xs"
              >
                Save to Machine Passport
              </Button>
            </div>
          </div>

          {/* LEVEL 2: KEY ENGINEERING SUMMARY */}
          {analysisResult.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className={`p-3.5 rounded-xl border font-mono ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase block font-semibold text-sky-400">MIN TEMP</span>
                <strong className="text-xl text-sky-400 font-bold block mt-0.5">{analysisResult.stats.min.toFixed(1)}°C</strong>
              </div>
              <div className={`p-3.5 rounded-xl border font-mono ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase block font-semibold text-rose-400">MAX TEMP</span>
                <strong className="text-xl text-rose-400 font-bold block mt-0.5">{analysisResult.stats.max.toFixed(1)}°C</strong>
              </div>
              <div className={`p-3.5 rounded-xl border font-mono ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase block font-semibold text-emerald-400">AVG TEMP</span>
                <strong className="text-xl text-emerald-400 font-bold block mt-0.5">{analysisResult.stats.avg.toFixed(1)}°C</strong>
              </div>
              <div className={`p-3.5 rounded-xl border font-mono ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase block font-semibold text-purple-400">RANGE (SPREAD)</span>
                <strong className="text-xl text-purple-400 font-bold block mt-0.5">{analysisResult.stats.range.toFixed(1)}°C</strong>
              </div>
              <div className={`p-3.5 rounded-xl border font-mono col-span-2 sm:col-span-1 ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase block font-semibold text-indigo-400">TOTAL POINTS</span>
                <strong className="text-xl text-indigo-400 font-bold block mt-0.5">{analysisResult.stats.points.toLocaleString()}</strong>
              </div>
            </div>
          )}

          {/* LEVEL 3: UNIFIED ENGINEERING SETTINGS & CONTROLS (Moved above graph) */}
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              className={`w-full p-3 flex items-center justify-between text-xs font-bold font-mono transition-colors ${
                isDark ? 'hover:bg-[#1A1D21] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <span>Unified Engineering Display Settings & Telemetry Controls</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-normal text-[11px]">
                <span>{showAdvancedControls ? 'Hide Settings' : 'Expand Settings'}</span>
                {showAdvancedControls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvancedControls && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                  {/* GROUP 1: Y AXIS */}
                  <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Y Axis</span>
                      <span className="text-[10px] text-slate-500">Scaling</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Bounds</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsAutoY(true)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                            isAutoY
                              ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                              : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                          }`}
                        >
                          Auto
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAutoY(false)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                            !isAutoY
                              ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                              : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                          }`}
                        >
                          Manual
                        </button>
                      </div>
                      {!isAutoY && (
                        <div className="flex items-center gap-1 pt-1">
                          <input
                            type="number"
                            placeholder="Min °C"
                            value={customMinStr}
                            onChange={(e) => setCustomMinStr(e.target.value)}
                            className={`w-16 px-1.5 py-0.5 rounded border text-[11px] ${
                              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                            }`}
                          />
                          <span className="text-slate-500">-</span>
                          <input
                            type="number"
                            placeholder="Max °C"
                            value={customMaxStr}
                            onChange={(e) => setCustomMaxStr(e.target.value)}
                            className={`w-16 px-1.5 py-0.5 rounded border text-[11px] ${
                              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Major Step</span>
                      <select
                        value={selectedYStep === null ? 'auto' : String(selectedYStep)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedYStep(val === 'auto' ? null : parseFloat(val));
                        }}
                        className={`w-full px-2 py-1 rounded border text-[11px] font-mono ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="auto">Auto Steps</option>
                        <option value="0.5">0.5 °C</option>
                        <option value="1.0">1.0 °C</option>
                        <option value="2.0">2.0 °C</option>
                        <option value="5.0">5.0 °C</option>
                      </select>
                    </div>
                  </div>

                  {/* GROUP 2: X AXIS */}
                  <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">X Axis</span>
                      <span className="text-[10px] text-slate-500">Time & Density</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Resample Interval</span>
                      <select
                        value={intervalSec}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setIntervalSec(val);
                          runEngineAnalysis(selectedFiles, cmdFilter, val, filterMin, filterMax);
                        }}
                        className={`w-full px-2 py-1 rounded border text-[11px] font-mono ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value={10}>10 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={300}>5 minutes</option>
                        <option value={600}>10 minutes</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="cfg-day-lines"
                          checked={showDayBoundaries}
                          onChange={(e) => setShowDayBoundaries(e.target.checked)}
                          className="rounded text-sky-500"
                        />
                        <label htmlFor="cfg-day-lines" className="text-[11px] text-slate-300 cursor-pointer">
                          Day Lines ({analysisResult.dayBoundaries.length})
                        </label>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Tick Density</span>
                        <select
                          value={xTickDensity}
                          onChange={(e) => setXTickDensity(e.target.value as any)}
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                            isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="auto">Auto</option>
                          <option value="dense">Dense</option>
                          <option value="sparse">Sparse</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 3: SPECIFICATION (USL / ASL) */}
                  <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Specification</span>
                      <span className="text-[10px] text-slate-500">MHC Limits</span>
                    </div>

                    {hasAuthoritativeSpec ? (
                      <div className="space-y-2">
                        <div className="text-[10.5px] text-slate-300 font-mono">
                          <span className="text-slate-400">Target:</span> <strong>{targetTemp?.toFixed(1)}°C</strong> ±{(tempTolerance ?? 0).toFixed(1)}°C
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono">
                          <div className={`p-1.5 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <span className="text-[9px] text-rose-400 font-bold block uppercase">USL (Upper)</span>
                            <span className="font-bold text-rose-400">{authoritativeUsl?.toFixed(1)}°C</span>
                          </div>
                          <div className={`p-1.5 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <span className="text-[9px] text-sky-400 font-bold block uppercase">ASL (Lower)</span>
                            <span className="font-bold text-sky-400">{authoritativeAsl?.toFixed(1)}°C</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-0.5">
                          <input
                            type="checkbox"
                            id="cfg-spec-band"
                            checked={showSpecBand}
                            onChange={(e) => setShowSpecBand(e.target.checked)}
                            className="rounded text-emerald-500"
                          />
                          <label htmlFor="cfg-spec-band" className="text-[10.5px] text-emerald-300 cursor-pointer">
                            Show Spec Band (ASL–USL)
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-[10px] text-slate-400">
                        <p className="text-amber-400 font-semibold">No MHC cooling spec configured.</p>
                        <p className="text-[9.5px] text-slate-500">
                          Configure target temp & tolerance in Machine Passport to display authoritative USL & ASL boundaries.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* GROUP 4: DATA / FILTERING */}
                  <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Data Filters</span>
                      <span className="text-[10px] text-slate-500">Parsing</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Command No</span>
                      <input
                        type="text"
                        value={cmdFilter}
                        onChange={(e) => {
                          setCmdFilter(e.target.value);
                          runEngineAnalysis(selectedFiles, e.target.value, intervalSec, filterMin, filterMax);
                        }}
                        className={`w-full px-2 py-1 rounded border text-[11px] font-mono ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                        placeholder="e.g. 1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Min Cutoff</span>
                        <input
                          type="number"
                          value={filterMin}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFilterMin(val);
                            runEngineAnalysis(selectedFiles, cmdFilter, intervalSec, val, filterMax);
                          }}
                          className={`w-full px-1.5 py-1 rounded border text-[11px] font-mono ${
                            isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Cutoff</span>
                        <input
                          type="number"
                          value={filterMax}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 9999;
                            setFilterMax(val);
                            runEngineAnalysis(selectedFiles, cmdFilter, intervalSec, filterMin, val);
                          }}
                          className={`w-full px-1.5 py-1 rounded border text-[11px] font-mono ${
                            isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LEVEL 4: CHANNEL FILTER BUTTONS & LARGE TEMPERATURE TREND */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Restored channel filter buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Channels:
                </span>
                {[1, 2, 3, 4, 5, 6].map((ch) => {
                  const isActive = activeChannels.includes(ch);
                  const st = analysisResult.channelStats[ch];
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                        isActive
                          ? 'border-transparent text-white shadow-xs'
                          : isDark
                          ? 'bg-[#1A1D21] border-[#2B323A] text-slate-500 opacity-50'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                      style={{
                        backgroundColor: isActive ? CHANNEL_COLORS[ch] : undefined
                      }}
                    >
                      <span>CH{ch}</span>
                      {st && <span className="text-[10.5px] opacity-90 font-normal">({st.avg.toFixed(1)}°C)</span>}
                    </button>
                  );
                })}
              </div>

              {/* Graph presets */}
              <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
                {(['engineering', 'clean', 'report'] as GraphPreset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setGraphPreset(p)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono capitalize transition-all ${
                      graphPreset === p
                        ? 'bg-slate-700 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* DOMINANT ANALYTICAL GRAPH (Expansive view) */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
              <TemperatureGraph
                channelData={analysisResult.resampledChannels}
                activeChannels={activeChannels}
                stats={analysisResult.stats}
                dayBoundaries={analysisResult.dayBoundaries}
                usl={showSpecBand ? authoritativeUsl : null}
                asl={showSpecBand ? authoritativeAsl : null}
                showSpecBand={showSpecBand}
                yStep={selectedYStep}
                xTickDensity={xTickDensity}
                preset={graphPreset}
                height={460}
                showDayBoundaries={showDayBoundaries}
                yMinOverride={yMinOverride}
                yMaxOverride={yMaxOverride}
                showYAxisControls={false}
                showStatsBanner={false}
              />
            </div>
          </div>

          {/* LEVEL 5: PER-CHANNEL ENGINEERING SUMMARY (Magnitude bars) */}
          {analysisResult.channelStats && Object.keys(analysisResult.channelStats).length > 0 && (
            <div>
              <ChannelSummaryTable
                channelStats={analysisResult.channelStats}
                activeChannels={activeChannels}
                onToggleChannel={toggleChannel}
                isDark={isDark}
              />
            </div>
          )}
        </div>
      ) : (
        /* Log Import Dropzone if no active session */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
            isDark
              ? 'border-[#2B323A] hover:border-slate-500 bg-[#14171A]/60 hover:bg-[#1A1D21]'
              : 'border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Upload className="w-6 h-6 text-sky-400 opacity-80 shrink-0" />
            <div className="text-center sm:text-left">
              <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Import Machine Temperature Log Files (.log / .txt)
              </p>
              <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Drag and drop raw log files or click to browse. Instant 6-channel trend extraction and telemetry parsing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SAVED TEMPERATURE INSPECTIONS (PRIMARY WORKSPACE HISTORY) */}
      <Card title={`Saved Machine Temperature History (${savedRecords.length})`}>
        {savedRecords.length === 0 ? (
          <div className={`p-8 text-center rounded-xl border border-dashed font-mono text-xs ${
            isDark ? 'border-[#2B323A] text-slate-500' : 'border-slate-200 text-slate-500'
          }`}>
            <span>No temperature data recorded for this machine. Upload log files above to generate telemetry and save history records.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {savedRecords.map((rec) => (
              <div
                key={rec.id}
                className={`p-5 rounded-xl border transition-all ${
                  isDark ? 'bg-[#14171A] border-[#2B323A] hover:border-slate-700' : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* ZONE 1 & 2: PRIMARY IDENTITY + METADATA */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {rec.title}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                        isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-200/80 border-slate-300 text-slate-700'
                      }`}>
                        {rec.rawRecordsCount.toLocaleString()} pts
                      </span>
                    </div>

                    <div className={`flex items-center gap-2 text-xs flex-wrap font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        {new Date(rec.createdAt).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>{rec.intervalSec}s bucket</span>
                      <span>•</span>
                      <span className="truncate max-w-xs" title={rec.sourceFileNames.join(', ')}>
                        {rec.sourceFileNames.join(', ')}
                      </span>
                    </div>

                    {/* Channel tags with their avg temps */}
                    {rec.channelStats && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {Object.entries(rec.channelStats).map(([chStr, statVal]) => {
                          const ch = parseInt(chStr, 10);
                          const st = statVal as ChannelStats;
                          if (!st || typeof st.avg !== 'number') return null;
                          return (
                            <span
                              key={ch}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                isDark ? 'bg-[#181B1F] border-[#2B323A] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: CHANNEL_COLORS[ch] }}
                              />
                              <span>CH{ch}: {st.avg.toFixed(1)}°C</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ZONE 3: VISUAL STATISTICS CARDS & ACTIONS */}
                  <div className="flex items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap">
                    {/* Visual 4-metric summary strip */}
                    <div className="grid grid-cols-4 gap-2 text-center font-mono">
                      <div className={`px-2.5 py-1.5 rounded-lg border ${
                        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <span className="text-[9px] font-semibold block uppercase tracking-wider text-sky-400">MIN</span>
                        <strong className="text-xs sm:text-sm font-bold text-sky-400">{rec.stats.min.toFixed(1)}°C</strong>
                      </div>
                      <div className={`px-2.5 py-1.5 rounded-lg border ${
                        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <span className="text-[9px] font-semibold block uppercase tracking-wider text-rose-400">MAX</span>
                        <strong className="text-xs sm:text-sm font-bold text-rose-400">{rec.stats.max.toFixed(1)}°C</strong>
                      </div>
                      <div className={`px-2.5 py-1.5 rounded-lg border ${
                        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <span className="text-[9px] font-semibold block uppercase tracking-wider text-emerald-400">AVG</span>
                        <strong className="text-xs sm:text-sm font-bold text-emerald-400">{rec.stats.avg.toFixed(1)}°C</strong>
                      </div>
                      <div className={`px-2.5 py-1.5 rounded-lg border ${
                        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <span className="text-[9px] font-semibold block uppercase tracking-wider text-purple-400">RANGE</span>
                        <strong className="text-xs sm:text-sm font-bold text-purple-400">{rec.stats.range.toFixed(1)}°C</strong>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 border-l pl-3 border-slate-700/40 dark:border-slate-800">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedRecordForDetail(rec)}
                        className="text-xs flex items-center gap-1.5 py-1.5 px-3"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Open Analysis</span>
                        <ArrowRight className="w-3 h-3 opacity-70" />
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleRequestDeleteSavedRecord(rec)}
                        className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 4. MANUAL SPOT READINGS */}
      <Card title={`Manual Spot Readings (${manualReadings.length})`}>
        {manualReadings.length === 0 ? (
          <p className={`text-xs py-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            No manual spot readings recorded.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {manualReadings.map((r) => (
              <div
                key={r.id}
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHANNEL_COLORS[r.channel] || '#888' }}
                    />
                    CH{r.channel}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{r.temperature}°C</span>
                </div>
                <div className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {new Date(r.timestamp).toLocaleString()}
                </div>
                {r.note && <p className={`text-[11px] italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{r.note}</p>}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteManualReading(r.id)}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* SAVED RECORD FULL ENGINEERING ANALYSIS MODAL (Expanded 7xl) */}
      {selectedRecordForDetail && (
        <Modal
          isOpen={!!selectedRecordForDetail}
          onClose={() => setSelectedRecordForDetail(null)}
          title={selectedRecordForDetail.title}
          maxWidth="7xl"
        >
          <div className="space-y-5">
            {/* LEVEL 1: RECORD IDENTITY */}
            <div className={`p-4 rounded-xl border flex flex-wrap justify-between items-center text-xs font-mono gap-2 ${
              isDark ? 'bg-[#111315] border-[#2B323A] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{machine.model} ({machine.machineNumber})</span>
                  <span>•</span>
                  <span>Recorded: {new Date(selectedRecordForDetail.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedRecordForDetail.rawRecordsCount.toLocaleString()} points · {selectedRecordForDetail.intervalSec}s bucket · Source: {selectedRecordForDetail.sourceFileNames.join(', ')}
                </div>
              </div>
            </div>

            {/* LEVEL 2: KEY ENGINEERING SUMMARY */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
              <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-semibold text-sky-400 block">MIN TEMP</span>
                <strong className="text-base text-sky-400 font-bold block mt-0.5">{selectedRecordForDetail.stats.min.toFixed(1)}°C</strong>
              </div>
              <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-semibold text-rose-400 block">MAX TEMP</span>
                <strong className="text-base text-rose-400 font-bold block mt-0.5">{selectedRecordForDetail.stats.max.toFixed(1)}°C</strong>
              </div>
              <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-semibold text-emerald-400 block">AVG TEMP</span>
                <strong className="text-base text-emerald-400 font-bold block mt-0.5">{selectedRecordForDetail.stats.avg.toFixed(1)}°C</strong>
              </div>
              <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-semibold text-purple-400 block">RANGE</span>
                <strong className="text-base text-purple-400 font-bold block mt-0.5">{selectedRecordForDetail.stats.range.toFixed(1)}°C</strong>
              </div>
              <div className={`p-3 rounded-xl border text-center col-span-2 sm:col-span-1 ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-semibold text-indigo-400 block">POINTS</span>
                <strong className="text-base text-indigo-400 font-bold block mt-0.5">{selectedRecordForDetail.stats.points.toLocaleString()}</strong>
              </div>
            </div>

            {/* LEVEL 3: LARGE TEMPERATURE TREND GRAPH (460px height) */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between pb-3">
                <span className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Temperature Trend Telemetry
                </span>
                <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
                  {(['engineering', 'clean', 'report'] as GraphPreset[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setGraphPreset(p)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono capitalize transition-all ${
                        graphPreset === p
                          ? 'bg-slate-700 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <TemperatureGraph
                channelData={selectedRecordForDetail.channelData}
                activeChannels={[1, 2, 3, 4, 5, 6]}
                stats={selectedRecordForDetail.stats}
                dayBoundaries={selectedRecordForDetail.dayBoundaries}
                usl={showSpecBand ? authoritativeUsl : null}
                asl={showSpecBand ? authoritativeAsl : null}
                showSpecBand={showSpecBand}
                yStep={selectedYStep}
                xTickDensity={xTickDensity}
                preset={graphPreset}
                height={460}
                showDayBoundaries={showDayBoundaries}
                yMinOverride={yMinOverride}
                yMaxOverride={yMaxOverride}
                showYAxisControls={false}
                showStatsBanner={false}
              />
            </div>

            {/* LEVEL 4: PER-CHANNEL ENGINEERING SUMMARY */}
            {selectedRecordForDetail.channelStats && Object.keys(selectedRecordForDetail.channelStats).length > 0 && (
              <div>
                <ChannelSummaryTable
                  channelStats={selectedRecordForDetail.channelStats}
                  isDark={isDark}
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleRequestDeleteSavedRecord(selectedRecordForDetail)}
                className="text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Record
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedRecordForDetail(null)}>
                Close Analysis
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {recordToDelete && (
        <Modal
          isOpen={!!recordToDelete}
          onClose={() => setRecordToDelete(null)}
          title="Confirm Delete Temperature Record"
          subtitle="This action is permanent and cannot be undone."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Are you sure you want to delete this temperature record?</p>
                <p>
                  Record: <strong className="font-mono">{recordToDelete.title}</strong>
                </p>
                <p className="text-[11px] opacity-80 pt-1">
                  Recorded: {new Date(recordToDelete.createdAt).toLocaleString()} • {recordToDelete.rawRecordsCount} data points
                </p>
              </div>
            </div>

            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Deleting this record will permanently remove its downsampled channel telemetry, temperature statistics, and raw telemetry from this machine's passport history.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRecordToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={confirmDeleteSavedRecord}
              >
                Delete Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
