import { MaskSize } from './laserPower';

export type CheckpointId =
  | '6A'
  | '6B'
  | '6C-2.2mm'
  | '6C-2.0mm'
  | '6C-1.8mm'
  | '6C-1.3mm'
  | '6C-1.1mm'
  | '6C-0.9mm'
  | '7A'
  | '7B'
  | '7C-2.2mm'
  | '7C-2.0mm'
  | '7C-1.8mm'
  | '7C-1.3mm'
  | '7C-1.1mm'
  | '7C-0.9mm';

export interface BeamCheckpointSpec {
  id: CheckpointId;
  laser: 'Laser 1' | 'Laser 2';
  code: '6A' | '6B' | '6C' | '7A' | '7B' | '7C';
  stageLabel: string;
  maskSize?: MaskSize;
  specText: string;
  minMm: number;
  maxMm?: number;
}

export const CHECKPOINT_SPECS: BeamCheckpointSpec[] = [
  // Laser 1
  { id: '6A', laser: 'Laser 1', code: '6A', stageLabel: '6A — Laser Source', specText: '3.5mm ±10% (3.15–3.85mm)', minMm: 3.15, maxMm: 3.85 },
  { id: '6B', laser: 'Laser 1', code: '6B', stageLabel: '6B — After Top Hat', specText: '4.2mm ±5% (3.99–4.41mm)', minMm: 3.99, maxMm: 4.41 },
  { id: '6C-2.2mm', laser: 'Laser 1', code: '6C', stageLabel: '6C — Mask 2.2mm', maskSize: '2.2mm', specText: '≥2.2mm', minMm: 2.2 },
  { id: '6C-2.0mm', laser: 'Laser 1', code: '6C', stageLabel: '6C — Mask 2.0mm', maskSize: '2.0mm', specText: '≥2.0mm', minMm: 2.0 },
  { id: '6C-1.8mm', laser: 'Laser 1', code: '6C', stageLabel: '6C — Mask 1.8mm', maskSize: '1.8mm', specText: '≥1.8mm', minMm: 1.8 },
  { id: '6C-1.3mm', laser: 'Laser 1', code: '6C', stageLabel: '6C — Mask 1.3mm', maskSize: '1.3mm', specText: '≥1.3mm', minMm: 1.3 },
  { id: '6C-1.1mm', laser: 'Laser 1', code: '6C', stageLabel: '6C — Mask 1.1mm', maskSize: '1.1mm', specText: '≥1.1mm', minMm: 1.1 },
  { id: '6C-0.9mm', laser: 'Laser 1', code: '6C', stageLabel: '6C — Mask 0.9mm', maskSize: '0.9mm', specText: '≥0.9mm', minMm: 0.9 },

  // Laser 2
  { id: '7A', laser: 'Laser 2', code: '7A', stageLabel: '7A — Laser Source', specText: '3.5mm ±10% (3.15–3.85mm)', minMm: 3.15, maxMm: 3.85 },
  { id: '7B', laser: 'Laser 2', code: '7B', stageLabel: '7B — After Top Hat', specText: '4.2mm ±5% (3.99–4.41mm)', minMm: 3.99, maxMm: 4.41 },
  { id: '7C-2.2mm', laser: 'Laser 2', code: '7C', stageLabel: '7C — Mask 2.2mm', maskSize: '2.2mm', specText: '≥2.2mm', minMm: 2.2 },
  { id: '7C-2.0mm', laser: 'Laser 2', code: '7C', stageLabel: '7C — Mask 2.0mm', maskSize: '2.0mm', specText: '≥2.0mm', minMm: 2.0 },
  { id: '7C-1.8mm', laser: 'Laser 2', code: '7C', stageLabel: '7C — Mask 1.8mm', maskSize: '1.8mm', specText: '≥1.8mm', minMm: 1.8 },
  { id: '7C-1.3mm', laser: 'Laser 2', code: '7C', stageLabel: '7C — Mask 1.3mm', maskSize: '1.3mm', specText: '≥1.3mm', minMm: 1.3 },
  { id: '7C-1.1mm', laser: 'Laser 2', code: '7C', stageLabel: '7C — Mask 1.1mm', maskSize: '1.1mm', specText: '≥1.1mm', minMm: 1.1 },
  { id: '7C-0.9mm', laser: 'Laser 2', code: '7C', stageLabel: '7C — Mask 0.9mm', maskSize: '0.9mm', specText: '≥0.9mm', minMm: 0.9 },
];

export interface BeamCheckpointReading {
  checkpointId: CheckpointId;
  measuredDiameterMm: number | null;
  imageDataUrl?: string;
  pass: boolean;
}

export interface BeamProfileCheckRecord {
  id: string;
  date: string; // YYYY-MM-DD
  engineerRemarks?: string;
  readings: Record<CheckpointId, BeamCheckpointReading>;
  overallResult: 'PASS' | 'FAIL';
}

export const DEFAULT_EVIDENCE_CHECKPOINTS: CheckpointId[] = [
  '6A',
  '6B',
  '6C-1.3mm',
  '7A',
  '7B',
  '7C-1.3mm',
];
