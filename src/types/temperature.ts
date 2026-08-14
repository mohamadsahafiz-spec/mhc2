export interface ParsedTempPoint {
  ts: Date;
  ch: number; // Station / Channel 1-6
  val: number; // Converted °C (raw ÷ 10)
  rawVal: number; // Raw integer reading
}

export interface ParseOptions {
  cmdFilter?: string | number; // Filter for "Commnad No:" or "Command No:"
  filterMin?: number; // Raw minimum threshold (default 0)
  filterMax?: number; // Raw maximum threshold (default 9999)
}

export interface ResampleOptions {
  intervalSec: number; // Resampling interval in seconds (e.g. 10, 30, 60, 300)
}

export type ChannelDataMap = Record<number, Array<{ ts: Date; val: number }>>;

export interface DayBoundary {
  date: string; // YYYY-MM-DD
  ts: Date; // Midnight Date object for the boundary
}

export interface ChannelStats {
  min: number;
  max: number;
  avg: number;
  range: number;
  points: number;
}

export interface TemperatureAnalysisResult {
  rawRecords: ParsedTempPoint[];
  resampledChannels: ChannelDataMap;
  dayBoundaries: DayBoundary[];
  channelStats: Record<number, ChannelStats>;
  combinedStats: ChannelStats | null;
  timeRange: { start: Date; end: Date } | null;
}

export interface SavedTemperatureRecord {
  id: string;
  machineId: string;
  title: string;
  createdAt: string; // ISO timestamp
  sourceFileNames: string[];
  rawRecordsCount: number;
  intervalSec: number;
  stats: ChannelStats;
  channelStats: Record<number, ChannelStats>;
  dayBoundaries: DayBoundary[];
  channelData: ChannelDataMap;
  records: ParsedTempPoint[];
}

export interface ManualTemperatureReading {
  id: string;
  machineId: string;
  timestamp: string; // ISO string
  temperature: number; // °C
  channel: number; // 1-6
  note?: string;
  createdAt: string;
}

export interface ChartDataset {
  label: string;
  channel: number;
  data: Array<{ x: Date; y: number }>;
}

