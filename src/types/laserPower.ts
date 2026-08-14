export type MaskSize = '2.2mm' | '2.0mm' | '1.8mm' | '1.3mm' | '1.1mm' | '0.9mm';

export interface MaskSpec {
  size: MaskSize;
  specText: string;
  minWatts: number;
}

export const MASK_SPECS: MaskSpec[] = [
  { size: '2.2mm', specText: '≥3.1W', minWatts: 3.1 },
  { size: '2.0mm', specText: '≥2.5W', minWatts: 2.5 },
  { size: '1.8mm', specText: '≥1.9W', minWatts: 1.9 },
  { size: '1.3mm', specText: '≥1.0W', minWatts: 1.0 },
  { size: '1.1mm', specText: '≥0.7W', minWatts: 0.7 },
  { size: '0.9mm', specText: '≥0.4W', minWatts: 0.4 },
];

export interface MeterReading {
  specText: string;
  headA: number | null;
  headB: number | null;
  passA: boolean;
  passB: boolean;
}

export interface MaskReading extends MeterReading {
  maskSize: MaskSize;
  minWatts: number;
}

export interface LaserPowerCheckRecord {
  id: string;
  date: string; // YYYY-MM-DD
  frequencyKhz: number; // default 50
  engineerRemarks?: string;

  // External Power Meter
  laserSource: MeterReading & { minWatts: number; maxWatts: number };
  opticsTopHat: MeterReading & { minWatts: number; maxWatts: number };

  // Internal Power Meter
  workingZoneMasks: MaskReading[];

  // Overall derived result
  overallResult: 'PASS' | 'FAIL';
}
