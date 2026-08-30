export type FocusWaferPosition = '+3' | '+2' | '+1' | '0' | '-1' | '-2' | '-3';

export const FOCUS_WAFER_POSITIONS: readonly FocusWaferPosition[] = [
  '+3',
  '+2',
  '+1',
  '0',
  '-1',
  '-2',
  '-3'
] as const;

export interface WaferPositionEvidence {
  position: FocusWaferPosition;
  imageDataUrl?: string;
  drillDiameterUm?: number | null;
  notes?: string;
  capturedAt?: string;
}

export interface LaserFocusEvidence {
  laserHeadId: 'laser1' | 'laser2';
  laserLabel: 'Laser 1' | 'Laser 2' | 'Laser Head 1' | 'Laser Head 2' | string;
  maskName: string; // e.g. "Width Square Mask"
  performParam: string; // e.g. "2W@50kHz (Working zone) + 2 shots"
  selectedBestFocusPosition?: FocusWaferPosition;
  positions: Record<FocusWaferPosition, WaferPositionEvidence>;
}

export interface FocusOptimizationRecord {
  id: string;
  date: string;
  engineerName?: string;
  serviceRecord?: string;
  reason?: 'LASER_REPLACEMENT' | 'BEAM_REALIGNMENT' | 'ROUTINE_ENGINEERING' | string;
  procedure: string; // "Drill on using wafer (Dummy)"
  specificationText: string; // "None — This item is for checking and setting machining focus. No numerical specification."
  
  laser1: LaserFocusEvidence;
  laser2: LaserFocusEvidence;

  overallResult?: 'COMPLETED' | 'VERIFIED' | 'PASS';
  createdAt?: string;
}
