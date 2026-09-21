import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Thermometer, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  ArrowRight, 
  RefreshCw, 
  Cpu,
  LineChart as LineChartIcon,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  Machine, 
  MHCSession, 
  MHCTemperatureEvidenceData 
} from '../../../types';
import { SavedTemperatureRecord, ChannelStats } from '../../../types/temperature';
import { TemperatureEngine } from '../../../utils/temperatureEngine';
import { TempRawStore } from '../../../utils/tempRawStore';
import { StorageService } from '../../../utils/persistence';
import { advanceAutopilotActivity, flagDownstreamNeedsReview } from '../../../utils/mhcAutopilotBrain';
import { TemperatureGraph } from '../../common/TemperatureGraph';

export interface MhcTemperatureEvidenceActivityProps {
  session: MHCSession;
  machine: Machine;
  isReadOnly: boolean;
  onUpdateSession: (updatedSession: MHCSession) => void;
  onUpdateMachine?: (updatedMachine: Machine) => void;
  onCompleteActivity: () => void;
  onSwitchToCanvas?: () => void;
  isDark: boolean;
  showNotification?: (msg: string) => void;
  activeCode?: string; // '06'
}

export const MhcTemperatureEvidenceActivity: React.FC<MhcTemperatureEvidenceActivityProps> = ({
  session,
  machine,
  isReadOnly,
  onUpdateSession,
  onUpdateMachine,
  onCompleteActivity,
  onSwitchToCanvas,
  isDark,
  showNotification
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Existing saved temperature records for this machine
  const savedTempRecords = useMemo(() => {
    return machine?.temperatureRecords || [];
  }, [machine?.temperatureRecords]);

  // Current session temperature data
  const tempEvidenceData = useMemo<MHCTemperatureEvidenceData | undefined>(() => {
    return session.temperatureEvidenceData;
  }, [session.temperatureEvidenceData]);

  // Find active record from saved records
  const activeRecord = useMemo(() => {
    if (tempEvidenceData?.temperatureRecordId) {
      return savedTempRecords.find(r => r.id === tempEvidenceData.temperatureRecordId);
    }
    return savedTempRecords.length === 1 ? savedTempRecords[0] : undefined;
  }, [tempEvidenceData?.temperatureRecordId, savedTempRecords]);

  // Authoritative channel data for graph rendering
  const effectiveChannelData = useMemo(() => {
    return activeRecord?.channelData || tempEvidenceData?.channelData;
  }, [activeRecord?.channelData, tempEvidenceData?.channelData]);

  // Local state for uploading / processing
  const [isProcessingLog, setIsProcessingLog] = useState(false);
  const [engineerNote, setEngineerNote] = useState<string>(tempEvidenceData?.engineerNote || '');

  useEffect(() => {
    if (tempEvidenceData?.engineerNote !== undefined) {
      setEngineerNote(tempEvidenceData.engineerNote);
    }
  }, [tempEvidenceData?.engineerNote]);

  // Handle uploading raw .log / .txt files using TemperatureEngine
  const handleLogFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingLog(true);

    try {
      const fileArray = Array.from(files);
      const textPromises = fileArray.map(f => f.text());
      const rawTexts = await Promise.all(textPromises);

      // 1. Run authoritative Temperature Engine analysis
      const analysisResult = TemperatureEngine.analyzeTemperatureLogs(rawTexts);
      if (!analysisResult || !analysisResult.resampledChannels || Object.keys(analysisResult.resampledChannels).length === 0) {
        if (showNotification) showNotification('Error: No valid temperature data found in uploaded files.');
        setIsProcessingLog(false);
        return;
      }

      // 2. Downsample and calculate stats
      const channelDataMap = analysisResult.resampledChannels;
      const downsampledChannelData: Record<number, Array<{ ts: Date; val: number }>> = {};
      if (channelDataMap) {
        Object.entries(channelDataMap).forEach(([chStr, pts]) => {
          const ch = parseInt(chStr, 10);
          downsampledChannelData[ch] = TemperatureEngine.downsamplePoints(pts, 1500);
        });
      }

      const stats = TemperatureEngine.calculateGlobalStats(downsampledChannelData);
      const existingSessionRecordId = session.temperatureEvidenceData?.temperatureRecordId;
      const recordId = existingSessionRecordId || `TR-${Date.now()}`;
      const title = fileArray.map(f => f.name).join(', ');

      const existingRecord = (machine.temperatureRecords || []).find(r => r.id === recordId);

      // 3. Create SavedTemperatureRecord
      const newRecord: SavedTemperatureRecord = {
        id: recordId,
        machineId: machine.id,
        title,
        createdAt: existingRecord?.createdAt || new Date().toISOString(),
        sourceFileNames: fileArray.map(f => f.name),
        rawRecordsCount: analysisResult.rawRecords.length,
        intervalSec: 10,
        stats: stats || { min: 0, max: 0, avg: 0, range: 0, points: 0 },
        channelStats: analysisResult.channelStats,
        dayBoundaries: analysisResult.dayBoundaries,
        channelData: downsampledChannelData,
        records: []
      };

      // 4. Save raw records to IndexedDB without loss
      TempRawStore.saveRawRecords(recordId, analysisResult.rawRecords);

      // 5. Update Machine records
      const existingRecords = (machine.temperatureRecords || []).filter(r => r.id !== recordId);
      const updatedRecords = [newRecord, ...existingRecords];
      const updatedMachine = { ...machine, temperatureRecords: updatedRecords };

      if (onUpdateMachine) {
        onUpdateMachine(updatedMachine);
      }
      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);

      // 6. Attach to session
      attachRecordToSession(newRecord);

      if (showNotification) {
        showNotification(`Temperature log parsed successfully! ${analysisResult.rawRecords.length.toLocaleString()} points processed.`);
      }
    } catch (err) {
      console.error('Error processing temperature log:', err);
      if (showNotification) showNotification('Failed to parse temperature log file.');
    } finally {
      setIsProcessingLog(false);
    }
  };

  // Attach a SavedTemperatureRecord to the session
  const attachRecordToSession = (rec: SavedTemperatureRecord) => {
    const updatedData: MHCTemperatureEvidenceData = {
      ...session.temperatureEvidenceData,
      temperatureRecordId: rec.id,
      temperatureRecordTitle: rec.title,
      temperatureLogFileName: rec.sourceFileNames.join(', '),
      rawRecordsCount: rec.rawRecordsCount,
      stats: rec.stats,
      channelStats: rec.channelStats,
      channelData: rec.channelData,
      hasValidTemperatureAnalysis: true,
      updatedAt: new Date().toISOString()
    };

    const updatedSession: MHCSession = {
      ...session,
      temperatureEvidenceData: updatedData
    };

    onUpdateSession(updatedSession);
  };

  // Select an existing record from Machine Passport
  const handleSelectExistingRecord = (recordId: string) => {
    const found = savedTempRecords.find(r => r.id === recordId);
    if (found) {
      attachRecordToSession(found);
      if (showNotification) showNotification(`Selected record "${found.title}" attached to MHC session.`);
    }
  };

  // Save Activity 06 & Complete
  const handleCompleteActivity06 = () => {
    if (!tempEvidenceData?.hasValidTemperatureAnalysis || !tempEvidenceData?.stats) {
      if (showNotification) showNotification('Valid temperature analysis log is required before completing Activity 06.');
      return;
    }

    const currentCode = '06';

    let updatedSession: MHCSession = {
      ...session,
      temperatureEvidenceData: {
        ...session.temperatureEvidenceData,
        hasValidTemperatureAnalysis: true,
        engineerNote: engineerNote || undefined,
        updatedAt: new Date().toISOString()
      }
    };

    // Flag downstream if editing previously completed
    if (session.autopilotProgress?.activityStatuses?.[currentCode] === 'COMPLETED') {
      updatedSession = flagDownstreamNeedsReview(updatedSession, currentCode);
    }

    // Advance autopilot state for Activity 06 -> COMPLETED
    updatedSession = advanceAutopilotActivity(
      updatedSession,
      currentCode,
      'COMPLETED',
      engineerNote
    );

    onUpdateSession(updatedSession);

    if (showNotification) {
      showNotification('Activity 06 Temperature Telemetry COMPLETED! Advanced to Activity 07 Product & Process / Via.');
    }
    // Note: onUpdateSession has already persisted the session with currentActivityCode = '06_via' (IN_PROGRESS).
  };

  const hasValidAnalysis = Boolean(tempEvidenceData?.hasValidTemperatureAnalysis && tempEvidenceData?.stats);
  const stats = tempEvidenceData?.stats;
  const channelStats = tempEvidenceData?.channelStats;

  // Authoritative MHC Temperature Spec Limits (USL & ASL)
  const mhcCoolingSpec = session.mhcSpecs?.temperatureCooling || machine?.mhcSpecs?.temperatureCooling;
  const targetTemp = (mhcCoolingSpec?.targetTempCelsius !== undefined && mhcCoolingSpec?.targetTempCelsius !== null)
    ? mhcCoolingSpec.targetTempCelsius
    : undefined;
  const tempTolerance = (mhcCoolingSpec?.tempToleranceCelsius !== undefined && mhcCoolingSpec?.tempToleranceCelsius !== null)
    ? mhcCoolingSpec.tempToleranceCelsius
    : undefined;
  const hasSpecLimits = targetTemp !== undefined && tempTolerance !== undefined;
  const usl = hasSpecLimits ? targetTemp + tempTolerance : undefined;
  const asl = hasSpecLimits ? targetTemp - tempTolerance : undefined;

  // Table sorting state for 5-column Engineering Table
  type TableSortKey = 'ch' | 'min' | 'max' | 'avg' | 'range';
  const [tableSortKey, setTableSortKey] = useState<TableSortKey>('ch');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc');

  const handleTableSort = (key: TableSortKey) => {
    if (tableSortKey === key) {
      setTableSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortKey(key);
      setTableSortDir(key === 'ch' ? 'asc' : 'desc');
    }
  };

  const channelEntries = useMemo(() => {
    if (!channelStats) return [];
    return Object.entries(channelStats).map(([chStr, s]) => ({
      ch: parseInt(chStr, 10),
      stat: s as ChannelStats
    }));
  }, [channelStats]);

  const sortedChannelEntries = useMemo(() => {
    return [...channelEntries].sort((a, b) => {
      let comparison = 0;
      if (tableSortKey === 'ch') comparison = a.ch - b.ch;
      else if (tableSortKey === 'min') comparison = a.stat.min - b.stat.min;
      else if (tableSortKey === 'max') comparison = a.stat.max - b.stat.max;
      else if (tableSortKey === 'avg') comparison = a.stat.avg - b.stat.avg;
      else if (tableSortKey === 'range') comparison = a.stat.range - b.stat.range;
      return tableSortDir === 'asc' ? comparison : -comparison;
    });
  }, [channelEntries, tableSortKey, tableSortDir]);

  const minMin = useMemo(() => channelEntries.length > 0 ? Math.min(...channelEntries.map(e => e.stat.min)) : 0, [channelEntries]);
  const maxMin = useMemo(() => channelEntries.length > 0 ? Math.max(...channelEntries.map(e => e.stat.min)) : 0, [channelEntries]);
  const minMax = useMemo(() => channelEntries.length > 0 ? Math.min(...channelEntries.map(e => e.stat.max)) : 0, [channelEntries]);
  const maxMax = useMemo(() => channelEntries.length > 0 ? Math.max(...channelEntries.map(e => e.stat.max)) : 0, [channelEntries]);
  const minAvg = useMemo(() => channelEntries.length > 0 ? Math.min(...channelEntries.map(e => e.stat.avg)) : 0, [channelEntries]);
  const maxAvg = useMemo(() => channelEntries.length > 0 ? Math.max(...channelEntries.map(e => e.stat.avg)) : 0, [channelEntries]);
  const maxRange = useMemo(() => channelEntries.length > 0 ? Math.max(...channelEntries.map(e => e.stat.range), 0.1) : 0.1, [channelEntries]);

  const calcMinPct = (val: number) => (maxMin === minMin ? 50 : Math.max(12, Math.min(100, ((val - minMin) / (maxMin - minMin)) * 80 + 20)));
  const calcMaxPct = (val: number) => (maxMax === minMax ? 50 : Math.max(12, Math.min(100, ((val - minMax) / (maxMax - minMax)) * 80 + 20)));
  const calcAvgPct = (val: number) => (maxAvg === minAvg ? 50 : Math.max(12, Math.min(100, ((val - minAvg) / (maxAvg - minAvg)) * 80 + 20)));
  const calcRangePct = (val: number) => Math.max(8, Math.min(100, (val / maxRange) * 100));

  return (
    <div className="p-4 sm:p-6 rounded-2xl border space-y-6 bg-[var(--surface-surface)] border-[var(--border-default)] shadow-xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                DAY 3 • 06
              </span>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Machine Temperature Telemetry Integration</h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Machine thermal telemetry log analysis, station equilibrium, and real-time visualization
            </p>
          </div>
        </div>

        {/* Workspace Canvas Jump Button */}
        {onSwitchToCanvas && (
          <button
            type="button"
            onClick={onSwitchToCanvas}
            className="px-3.5 py-2 rounded-xl bg-[var(--surface-workspace)] hover:bg-[var(--surface-raised)] text-[var(--color-primary)] font-semibold text-xs border border-[var(--border-default)] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Open Interactive Temperature Canvas</span>
          </button>
        )}
      </div>

      {/* 1. TEMPERATURE LOG IMPORT / SELECTION WORKSPACE */}
      <div className="p-5 rounded-xl border space-y-5 bg-[var(--surface-workspace)] border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Machine Temperature Telemetry Log Integration</span>
          </h3>

          {hasValidAnalysis && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Valid Analysis Attached</span>
            </span>
          )}
        </div>

        {/* Upload / Select Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Upload Box */}
          <div className="p-4 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 text-center transition-colors bg-[var(--surface-surface)] border-[var(--border-default)] hover:border-[var(--border-strong)]">
            <Upload className="w-6 h-6 text-[var(--color-primary)]" />
            <div className="text-xs font-semibold text-[var(--text-primary)]">Import Raw Machine Log File (.log / .txt)</div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Parses machine stations &amp; thermal sensors using the engine
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isReadOnly || isProcessingLog}
              className="mt-1 px-3.5 py-1.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isProcessingLog ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Log...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse .log / .txt Files</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.txt"
              multiple
              onChange={(e) => handleLogFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Select Saved Record from Machine Passport */}
          <div className="p-4 rounded-xl border flex flex-col justify-between gap-3 bg-[var(--surface-surface)] border-[var(--border-default)]">
            <div>
              <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Or Select from Saved Machine Records</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                Attach an existing temperature record saved under {machine.model} ({machine.machineNumber || machine.serialNumber}).
              </p>
            </div>

            {savedTempRecords.length > 0 ? (
              <select
                onChange={(e) => {
                  if (e.target.value) handleSelectExistingRecord(e.target.value);
                }}
                value={tempEvidenceData?.temperatureRecordId || ''}
                disabled={isReadOnly}
                className="w-full px-3 py-2 rounded-lg border text-xs font-mono transition-all bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)]"
              >
                <option value="">-- Choose Saved Record --</option>
                {savedTempRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({new Date(r.createdAt).toLocaleDateString()}) - {r.stats.avg.toFixed(1)}°C avg
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[11px] text-[var(--text-muted)] italic">
                No saved temperature records in Machine Passport yet. Upload a log file above.
              </div>
            )}
          </div>
        </div>

        {/* DISPLAY CONCISE TEMPERATURE SUMMARY & AUTHORITATIVE GRAPH */}
        {hasValidAnalysis && stats && (
          <div className="space-y-5 pt-3 border-t border-[var(--border-subtle)]">
            {/* Active Record Banner */}
            <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-raised)] border-[var(--border-default)] text-[var(--text-primary)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 flex items-center justify-center text-[var(--color-primary)] shrink-0">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold border border-[var(--color-primary)]/30">
                      ACTIVE TEMPERATURE SOURCE
                    </span>
                    <strong className="text-xs text-[var(--text-primary)]">
                      {tempEvidenceData?.temperatureRecordTitle || 'Temperature Telemetry Record'}
                    </strong>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-mono">
                    File: <span className="text-[var(--color-primary)]">{tempEvidenceData?.temperatureLogFileName || 'Raw Log Feed'}</span>
                    {tempEvidenceData?.rawRecordsCount && (
                      <span className="ml-2 text-[var(--text-muted)]">
                        • {tempEvidenceData.rawRecordsCount.toLocaleString()} parsed points
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {onSwitchToCanvas && (
                <button
                  type="button"
                  onClick={onSwitchToCanvas}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center shadow-xs cursor-pointer"
                >
                  <span>Interactive Canvas</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Global Thermal Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-subtle)] shadow-xs">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Min Temperature</div>
                <div className="text-lg font-mono font-bold text-sky-600 dark:text-cyan-300 mt-0.5">{stats.min.toFixed(2)} °C</div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-subtle)] shadow-xs">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Max Temperature</div>
                <div className="text-lg font-mono font-bold text-amber-600 dark:text-amber-300 mt-0.5">{stats.max.toFixed(2)} °C</div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-subtle)] shadow-xs">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Average Temperature</div>
                <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-300 mt-0.5">{stats.avg.toFixed(2)} °C</div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-subtle)] shadow-xs">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Thermal Delta (Range)</div>
                <div className="text-lg font-mono font-bold text-[var(--text-primary)] mt-0.5">{stats.range.toFixed(2)} °C</div>
              </div>
            </div>

            {/* AUTHORITATIVE MULTI-CHANNEL TEMPERATURE GRAPH */}
            {effectiveChannelData && Object.keys(effectiveChannelData).length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="w-4 h-4 text-[var(--color-primary)]" />
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                      Thermal Telemetry Visualization
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {stats.points ? stats.points.toLocaleString() : '1,500'} Data Points • Multi-Station Thermal Equilibrium
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-workspace)] shadow-xs">
                  <TemperatureGraph
                    channelData={effectiveChannelData}
                    stats={stats}
                    preset="engineering"
                    height={320}
                    showGrid={true}
                    showLegend={true}
                    showStatsBanner={false}
                    showYAxisControls={false}
                    usl={usl}
                    asl={asl}
                    showSpecBand={true}
                  />
                </div>
              </div>
            )}

            {/* 5-Column Engineering Summary Table: CH | MIN | MAX | AVG | RANGE */}
            {channelStats && Object.keys(channelStats).length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase">
                    Per-Channel Engineering Summary
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    MIN (Blue) · MAX (Red) · AVG (Green) · RANGE (Purple) · Click header to sort
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border font-mono text-xs border-[var(--border-default)] bg-[var(--surface-surface)]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[var(--surface-workspace)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
                      <tr>
                        <th className="py-2.5 px-3 font-mono font-medium text-[11px] w-28">
                          <button
                            type="button"
                            onClick={() => handleTableSort('ch')}
                            className="flex items-center gap-1.5 uppercase font-mono tracking-wider transition-colors select-none text-[var(--text-primary)] hover:text-[var(--color-primary)] cursor-pointer"
                            title="Sort by Channel"
                          >
                            <span>CH</span>
                            {tableSortKey === 'ch' ? (
                              tableSortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[var(--color-primary)]" /> : <ChevronDown className="w-3 h-3 text-[var(--color-primary)]" />
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)] opacity-40">↕</span>
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-mono font-medium text-[11px] min-w-[120px]">
                          <button
                            type="button"
                            onClick={() => handleTableSort('min')}
                            className="flex items-center gap-1.5 uppercase font-mono tracking-wider transition-colors select-none text-[var(--text-primary)] hover:text-[var(--color-primary)] cursor-pointer"
                            title="Sort by Min Temperature"
                          >
                            <span>MIN</span>
                            {tableSortKey === 'min' ? (
                              tableSortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[var(--color-primary)]" /> : <ChevronDown className="w-3 h-3 text-[var(--color-primary)]" />
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)] opacity-40">↕</span>
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-mono font-medium text-[11px] min-w-[120px]">
                          <button
                            type="button"
                            onClick={() => handleTableSort('max')}
                            className="flex items-center gap-1.5 uppercase font-mono tracking-wider transition-colors select-none text-[var(--text-primary)] hover:text-[var(--color-primary)] cursor-pointer"
                            title="Sort by Max Temperature"
                          >
                            <span>MAX</span>
                            {tableSortKey === 'max' ? (
                              tableSortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[var(--color-primary)]" /> : <ChevronDown className="w-3 h-3 text-[var(--color-primary)]" />
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)] opacity-40">↕</span>
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-mono font-medium text-[11px] min-w-[120px]">
                          <button
                            type="button"
                            onClick={() => handleTableSort('avg')}
                            className="flex items-center gap-1.5 uppercase font-mono tracking-wider transition-colors select-none text-[var(--text-primary)] hover:text-[var(--color-primary)] cursor-pointer"
                            title="Sort by Average Temperature"
                          >
                            <span>AVG</span>
                            {tableSortKey === 'avg' ? (
                              tableSortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[var(--color-primary)]" /> : <ChevronDown className="w-3 h-3 text-[var(--color-primary)]" />
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)] opacity-40">↕</span>
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-mono font-medium text-[11px] min-w-[120px]">
                          <button
                            type="button"
                            onClick={() => handleTableSort('range')}
                            className="flex items-center gap-1.5 uppercase font-mono tracking-wider transition-colors select-none text-[var(--text-primary)] hover:text-[var(--color-primary)] cursor-pointer"
                            title="Sort by Thermal Delta / Range"
                          >
                            <span>RANGE</span>
                            {tableSortKey === 'range' ? (
                              tableSortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[var(--color-primary)]" /> : <ChevronDown className="w-3 h-3 text-[var(--color-primary)]" />
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)] opacity-40">↕</span>
                            )}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {sortedChannelEntries.map(({ ch, stat: chStat }) => {
                        const markboxName = ch === 1 || ch === 4 ? 'MB1' : ch === 2 || ch === 5 ? 'MB2' : 'MB3';
                        return (
                          <tr key={ch} className="hover:bg-[var(--surface-workspace)] transition-colors">
                            {/* CH */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                                <span className="font-bold text-[var(--text-primary)]">CH{ch}</span>
                                <span className="text-[10px] text-[var(--text-muted)] font-normal">({markboxName})</span>
                              </div>
                            </td>

                            {/* MIN (Subdued Blue proportional cell-background fill) */}
                            <td className="p-0 relative">
                              <div className="relative h-9 px-3 flex items-center overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 bg-sky-500/[0.08] dark:bg-sky-500/[0.045] border-r border-sky-400/20 pointer-events-none transition-all duration-200"
                                  style={{ width: `${calcMinPct(chStat.min)}%` }}
                                />
                                <div className="relative z-10 flex items-baseline gap-1 font-mono text-xs">
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {chStat.min.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)] font-normal">°C</span>
                                </div>
                              </div>
                            </td>

                            {/* MAX (Subdued Red proportional cell-background fill) */}
                            <td className="p-0 relative">
                              <div className="relative h-9 px-3 flex items-center overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 bg-rose-500/[0.08] dark:bg-rose-500/[0.045] border-r border-rose-400/20 pointer-events-none transition-all duration-200"
                                  style={{ width: `${calcMaxPct(chStat.max)}%` }}
                                />
                                <div className="relative z-10 flex items-baseline gap-1 font-mono text-xs">
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {chStat.max.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)] font-normal">°C</span>
                                </div>
                              </div>
                            </td>

                            {/* AVG (Subdued Green proportional cell-background fill) */}
                            <td className="p-0 relative">
                              <div className="relative h-9 px-3 flex items-center overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.045] border-r border-emerald-400/20 pointer-events-none transition-all duration-200"
                                  style={{ width: `${calcAvgPct(chStat.avg)}%` }}
                                />
                                <div className="relative z-10 flex items-baseline gap-1 font-mono text-xs">
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {chStat.avg.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)] font-normal">°C</span>
                                </div>
                              </div>
                            </td>

                            {/* RANGE (Subdued Purple proportional cell-background fill) */}
                            <td className="p-0 relative">
                              <div className="relative h-9 px-3 flex items-center overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 bg-purple-500/[0.08] dark:bg-purple-500/[0.045] border-r border-purple-400/20 pointer-events-none transition-all duration-200"
                                  style={{ width: `${calcRangePct(chStat.range)}%` }}
                                />
                                <div className="relative z-10 flex items-baseline gap-1 font-mono text-xs">
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {chStat.range.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)] font-normal">°C</span>
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
            )}
          </div>
        )}

        {/* Warning if no valid analysis */}
        {!hasValidAnalysis && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-200 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Machine temperature telemetry log file required to complete Activity 06. Upload or select a saved record above.</span>
          </div>
        )}
      </div>

      {/* Engineer Remarks & Activity Completion Footer */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            Activity 06 Engineer Observations &amp; Remarks
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Thermal equilibrium verified at 24.2°C across 4-hour test run."
            value={engineerNote}
            onChange={(e) => setEngineerNote(e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 rounded-lg border text-xs transition-all bg-[var(--surface-workspace)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-strong)]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Target Activity: <span className="font-bold text-[var(--text-primary)]">06 Machine Temperature Telemetry</span>
          </div>

          {hasValidAnalysis && !isReadOnly ? (
            <button
              type="button"
              onClick={handleCompleteActivity06}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm &amp; Complete Activity 06</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--surface-surface)] text-[var(--text-subtle)] font-bold text-xs border border-[var(--border-default)] cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Import Valid Temperature Log to Complete Activity 06</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
