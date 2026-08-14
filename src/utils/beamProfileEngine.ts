import {
  BeamCheckpointReading,
  BeamCheckpointSpec,
  BeamProfileCheckRecord,
  CHECKPOINT_SPECS,
  CheckpointId
} from '../types/beamProfile';

export class BeamProfileEngine {
  /**
   * Evaluate a diameter value against min and optional max specs
   */
  static evalSpec(val: number | null, minMm: number, maxMm?: number): boolean {
    if (val === null || isNaN(val)) return false;
    if (val < minMm) return false;
    if (maxMm !== undefined && val > maxMm) return false;
    return true;
  }

  /**
   * Generate default sample beam SVG data URLs so default/new records have visual beam profiles
   */
  static generateSyntheticBeamSvg(label: string, color: string = '#38bdf8'): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <radialGradient id="g_${label.replace(/[^a-zA-Z0-9]/g, '_')}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="35%" stop-color="${color}" stop-opacity="0.9"/>
          <stop offset="70%" stop-color="${color}" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="#090d16"/>
      <circle cx="50" cy="50" r="45" stroke="#1e293b" stroke-width="1" fill="none"/>
      <line x1="50" y1="5" x2="50" y2="95" stroke="#334155" stroke-dasharray="2 2" stroke-width="0.8"/>
      <line x1="5" y1="50" x2="95" y2="50" stroke="#334155" stroke-dasharray="2 2" stroke-width="0.8"/>
      <circle cx="50" cy="50" r="35" fill="url(#g_${label.replace(/[^a-zA-Z0-9]/g, '_')})"/>
      <text x="50" y="90" text-anchor="middle" fill="#94a3b8" font-size="7" font-family="monospace">${label}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Create a default Beam Profile record with template values and synthetic beam profile images
   */
  static createDefaultRecord(dateStr?: string): BeamProfileCheckRecord {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const readings: Partial<Record<CheckpointId, BeamCheckpointReading>> = {};

    CHECKPOINT_SPECS.forEach((s) => {
      let defaultVal: number = s.minMm;
      let color = '#38bdf8'; // cyan

      if (s.id.startsWith('6A') || s.id.startsWith('7A')) {
        defaultVal = 3.5;
        color = '#f59e0b'; // amber
      } else if (s.id.startsWith('6B') || s.id.startsWith('7B')) {
        defaultVal = 4.15;
        color = '#06b6d4'; // cyan
      } else if (s.maskSize) {
        defaultVal = s.minMm + 0.1;
        color = '#10b981'; // emerald
      }

      const pass = this.evalSpec(defaultVal, s.minMm, s.maxMm);
      readings[s.id] = {
        checkpointId: s.id,
        measuredDiameterMm: defaultVal,
        imageDataUrl: this.generateSyntheticBeamSvg(`${s.id}`, color),
        pass
      };
    });

    return {
      id: `BPR-${Date.now()}`,
      date: today,
      readings: readings as Record<CheckpointId, BeamCheckpointReading>,
      overallResult: 'PASS',
      engineerRemarks: 'Initial baseline beam profile & diameter check complete.'
    };
  }

  /**
   * Evaluate a partial or full Beam Profile record and calculate PASS/FAIL for each checkpoint and overall
   */
  static evaluateRecord(record: Partial<BeamProfileCheckRecord>): BeamProfileCheckRecord {
    const date = record.date || new Date().toISOString().split('T')[0];
    const inputReadings = record.readings || {};
    const finalReadings: Partial<Record<CheckpointId, BeamCheckpointReading>> = {};

    let allPass = true;

    CHECKPOINT_SPECS.forEach((s) => {
      const existing = inputReadings[s.id];
      const val = existing?.measuredDiameterMm ?? null;
      const pass = this.evalSpec(val, s.minMm, s.maxMm);

      if (!pass) {
        allPass = false;
      }

      finalReadings[s.id] = {
        checkpointId: s.id,
        measuredDiameterMm: val,
        imageDataUrl: existing?.imageDataUrl || undefined,
        pass
      };
    });

    return {
      id: record.id || `BPR-${Date.now()}`,
      date,
      readings: finalReadings as Record<CheckpointId, BeamCheckpointReading>,
      overallResult: allPass ? 'PASS' : 'FAIL',
      engineerRemarks: record.engineerRemarks || ''
    };
  }

  /**
   * Compare previous vs current diameter for a specific checkpoint
   */
  static calculateComparison(
    prev: BeamCheckpointReading | undefined,
    curr: BeamCheckpointReading | undefined
  ) {
    const prevVal = prev?.measuredDiameterMm ?? null;
    const currVal = curr?.measuredDiameterMm ?? null;

    if (prevVal === null || currVal === null) {
      return {
        deltaMm: null,
        deltaPct: null,
        verdict: 'NO_DATA' as const
      };
    }

    const deltaMm = Number((currVal - prevVal).toFixed(3));
    const deltaPct = prevVal !== 0 ? Number(((deltaMm / prevVal) * 100).toFixed(2)) : 0;

    return {
      deltaMm,
      deltaPct,
      verdict: curr?.pass ? ('PASS' as const) : ('FAIL' as const)
    };
  }
}
