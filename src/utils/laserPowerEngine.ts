import {
  LaserPowerCheckRecord,
  MaskReading,
  MaskSize,
  MASK_SPECS,
  MeterReading
} from '../types/laserPower';

export class LaserPowerEngine {
  /**
   * Evaluate whether a power value (Watts) passes a range spec [min, max]
   */
  static evalRangeSpec(val: number | null, min: number, max: number): boolean {
    if (val === null || isNaN(val)) return false;
    return val >= min && val <= max;
  }

  /**
   * Evaluate whether a power value (Watts) passes a minimum spec (>= min)
   */
  static evalMinSpec(val: number | null, min: number): boolean {
    if (val === null || isNaN(val)) return false;
    return val >= min;
  }

  /**
   * Create a blank or default Laser Power Check Record template
   */
  static createDefaultRecord(dateStr?: string, frequencyKhz = 50): LaserPowerCheckRecord {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const laserSource = {
      specText: '15W ±10% (13.5–16.5W)',
      minWatts: 13.5,
      maxWatts: 16.5,
      headA: null as number | null,
      headB: null as number | null,
      passA: false,
      passB: false,
    };

    const opticsTopHat = {
      specText: '15W ±10% (13.5–16.5W)',
      minWatts: 13.5,
      maxWatts: 16.5,
      headA: null as number | null,
      headB: null as number | null,
      passA: false,
      passB: false,
    };

    const workingZoneMasks: MaskReading[] = MASK_SPECS.map((s) => ({
      maskSize: s.size,
      specText: s.specText,
      minWatts: s.minWatts,
      headA: null,
      headB: null,
      passA: false,
      passB: false,
    }));

    return {
      id: `LPR-${Date.now()}`,
      date: today,
      frequencyKhz,
      laserSource,
      opticsTopHat,
      workingZoneMasks,
      overallResult: 'FAIL',
      engineerRemarks: '',
    };
  }

  /**
   * Evaluate and recalculate PASS/FAIL statuses for a Laser Power Record
   */
  static evaluateRecord(record: Partial<LaserPowerCheckRecord>): LaserPowerCheckRecord {
    const date = record.date || new Date().toISOString().split('T')[0];
    const frequencyKhz = typeof record.frequencyKhz === 'number' ? record.frequencyKhz : 50;

    // Laser Source Spec (15W ± 10% -> 13.5W - 16.5W)
    const lsHeadA = record.laserSource?.headA ?? null;
    const lsHeadB = record.laserSource?.headB ?? null;
    const lsPassA = this.evalRangeSpec(lsHeadA, 13.5, 16.5);
    const lsPassB = this.evalRangeSpec(lsHeadB, 13.5, 16.5);

    const laserSource = {
      specText: '15W ±10% (13.5–16.5W)',
      minWatts: 13.5,
      maxWatts: 16.5,
      headA: lsHeadA,
      headB: lsHeadB,
      passA: lsPassA,
      passB: lsPassB,
    };

    // Optics / Top Hat Spec (15W ± 10% -> 13.5W - 16.5W)
    const optHeadA = record.opticsTopHat?.headA ?? null;
    const optHeadB = record.opticsTopHat?.headB ?? null;
    const optPassA = this.evalRangeSpec(optHeadA, 13.5, 16.5);
    const optPassB = this.evalRangeSpec(optHeadB, 13.5, 16.5);

    const opticsTopHat = {
      specText: '15W ±10% (13.5–16.5W)',
      minWatts: 13.5,
      maxWatts: 16.5,
      headA: optHeadA,
      headB: optHeadB,
      passA: optPassA,
      passB: optPassB,
    };

    // Working Zone Masks
    const inputMasks = record.workingZoneMasks || [];
    const workingZoneMasks: MaskReading[] = MASK_SPECS.map((s) => {
      const match = inputMasks.find((m) => m.maskSize === s.size);
      const headA = match?.headA ?? null;
      const headB = match?.headB ?? null;
      const passA = this.evalMinSpec(headA, s.minWatts);
      const passB = this.evalMinSpec(headB, s.minWatts);

      return {
        maskSize: s.size,
        specText: s.specText,
        minWatts: s.minWatts,
        headA,
        headB,
        passA,
        passB,
      };
    });

    // Determine overall PASS / FAIL
    // All items must have non-null measured values AND pass their specs
    let allPassed = true;

    if (!lsPassA || !lsPassB || !optPassA || !optPassB) {
      allPassed = false;
    }

    for (const m of workingZoneMasks) {
      if (!m.passA || !m.passB) {
        allPassed = false;
        break;
      }
    }

    return {
      id: record.id || `LPR-${Date.now()}`,
      date,
      frequencyKhz,
      laserSource,
      opticsTopHat,
      workingZoneMasks,
      overallResult: allPassed ? 'PASS' : 'FAIL',
      engineerRemarks: record.engineerRemarks || '',
    };
  }
}
