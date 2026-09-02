import { ProductProcessRecord, ViaQualityReading, ViaSpecification, TOP_VIA_SPEC, BOTTOM_VIA_SPEC } from '../types/productProcess';

export class ProductProcessEngine {
  static evalTopWidth(val: number | null, spec?: ViaSpecification | null): boolean {
    if (val === null || isNaN(val)) return false;
    let min = TOP_VIA_SPEC.min;
    let max = TOP_VIA_SPEC.max;
    if (spec) {
      if (spec.topMinUm !== undefined && spec.topMinUm !== null) {
        min = spec.topMinUm;
      } else if (spec.topTargetUm !== undefined && spec.topTargetUm !== null && spec.topToleranceUm !== undefined && spec.topToleranceUm !== null) {
        min = spec.topTargetUm - spec.topToleranceUm;
      }
      if (spec.topMaxUm !== undefined && spec.topMaxUm !== null) {
        max = spec.topMaxUm;
      } else if (spec.topTargetUm !== undefined && spec.topTargetUm !== null && spec.topToleranceUm !== undefined && spec.topToleranceUm !== null) {
        max = spec.topTargetUm + spec.topToleranceUm;
      }
    }
    return val >= min && val <= max;
  }

  static evalBottomWidth(val: number | null, spec?: ViaSpecification | null): boolean {
    if (val === null || isNaN(val)) return false;
    let min = BOTTOM_VIA_SPEC.min;
    let max = BOTTOM_VIA_SPEC.max;
    if (spec) {
      if (spec.bottomMinUm !== undefined && spec.bottomMinUm !== null) {
        min = spec.bottomMinUm;
      } else if (spec.bottomTargetUm !== undefined && spec.bottomTargetUm !== null && spec.bottomToleranceUm !== undefined && spec.bottomToleranceUm !== null) {
        min = spec.bottomTargetUm - spec.bottomToleranceUm;
      }
      if (spec.bottomMaxUm !== undefined && spec.bottomMaxUm !== null) {
        max = spec.bottomMaxUm;
      } else if (spec.bottomTargetUm !== undefined && spec.bottomTargetUm !== null && spec.bottomToleranceUm !== undefined && spec.bottomToleranceUm !== null) {
        max = spec.bottomTargetUm + spec.bottomToleranceUm;
      }
    }
    return val >= min && val <= max;
  }

  static getFormattedTopSpec(spec?: ViaSpecification | null): string {
    if (!spec) return `${TOP_VIA_SPEC.target}±${TOP_VIA_SPEC.tolerance} µm`;
    if (spec.topTargetUm !== undefined && spec.topTargetUm !== null) {
      if (spec.topToleranceUm !== undefined && spec.topToleranceUm !== null) {
        return `${spec.topTargetUm}±${spec.topToleranceUm} µm`;
      }
      return `${spec.topTargetUm} µm`;
    }
    if (spec.topMinUm !== undefined && spec.topMinUm !== null && spec.topMaxUm !== undefined && spec.topMaxUm !== null) {
      return `${spec.topMinUm}–${spec.topMaxUm} µm`;
    }
    return `${TOP_VIA_SPEC.target}±${TOP_VIA_SPEC.tolerance} µm`;
  }

  static getFormattedBottomSpec(spec?: ViaSpecification | null): string {
    if (!spec) return `${BOTTOM_VIA_SPEC.target}±${BOTTOM_VIA_SPEC.tolerance} µm`;
    if (spec.bottomTargetUm !== undefined && spec.bottomTargetUm !== null) {
      if (spec.bottomToleranceUm !== undefined && spec.bottomToleranceUm !== null) {
        return `${spec.bottomTargetUm}±${spec.bottomToleranceUm} µm`;
      }
      return `${spec.bottomTargetUm} µm`;
    }
    if (spec.bottomMinUm !== undefined && spec.bottomMinUm !== null && spec.bottomMaxUm !== undefined && spec.bottomMaxUm !== null) {
      return `${spec.bottomMinUm}–${spec.bottomMaxUm} µm`;
    }
    return `${BOTTOM_VIA_SPEC.target}±${BOTTOM_VIA_SPEC.tolerance} µm`;
  }

  static getFormattedTaperSpec(spec?: ViaSpecification | null): string {
    if (!spec) return '—';
    if (spec.taperSpecText) return spec.taperSpecText;
    if (spec.minTaperPercent !== undefined && spec.minTaperPercent !== null) {
      if (spec.maxTaperPercent !== undefined && spec.maxTaperPercent !== null) {
        return `${spec.minTaperPercent}%–${spec.maxTaperPercent}%`;
      }
      return `≥ ${spec.minTaperPercent}%`;
    }
    return '—';
  }

  static evaluateVia(
    topWidthUm: number | null,
    bottomWidthUm: number | null,
    imageDataUrl?: string,
    spec?: ViaSpecification | null
  ): ViaQualityReading {
    const topPass = this.evalTopWidth(topWidthUm, spec);
    const bottomPass = this.evalBottomWidth(bottomWidthUm, spec);
    const overallPass = topPass && bottomPass;

    return {
      viaImageDataUrl: imageDataUrl,
      topWidthUm,
      bottomWidthUm,
      topPass,
      bottomPass,
      overallPass
    };
  }

  static evaluateRecord(draft: {
    id?: string;
    date?: string;
    productName?: string;
    recipeName?: string;
    lotPanel?: string;
    engineerRemarks?: string;
    laser1PowerOffsetPercent?: number | null;
    laser2PowerOffsetPercent?: number | null;
    viaSpec?: ViaSpecification;
    phase1?: { powerWatts?: number | null; frequencyKhz?: number | null; shotCount?: number | null; maskMm?: number | null; defocusMm?: number | null };
    phase2?: { powerWatts?: number | null; frequencyKhz?: number | null; shotCount?: number | null; maskMm?: number | null; defocusMm?: number | null };
    laser1Via?: { topWidthUm?: number | null; bottomWidthUm?: number | null; viaImageDataUrl?: string; topPass?: boolean; bottomPass?: boolean; overallPass?: boolean };
    laser2Via?: { topWidthUm?: number | null; bottomWidthUm?: number | null; viaImageDataUrl?: string; topPass?: boolean; bottomPass?: boolean; overallPass?: boolean };
    overallResult?: 'PASS' | 'FAIL';
  }): ProductProcessRecord {
    const spec = draft.viaSpec;
    const l1Top = draft.laser1Via?.topWidthUm ?? null;
    const l1Bottom = draft.laser1Via?.bottomWidthUm ?? null;
    const l1 = this.evaluateVia(l1Top, l1Bottom, draft.laser1Via?.viaImageDataUrl, spec);

    const l2Top = draft.laser2Via?.topWidthUm ?? null;
    const l2Bottom = draft.laser2Via?.bottomWidthUm ?? null;
    const l2 = this.evaluateVia(l2Top, l2Bottom, draft.laser2Via?.viaImageDataUrl, spec);

    const overallResult = draft.overallResult || ((l1.overallPass && l2.overallPass) ? 'PASS' : 'FAIL');

    return {
      id: draft.id || `pp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: draft.date || new Date().toISOString().split('T')[0],
      productName: draft.productName || '',
      recipeName: draft.recipeName || '',
      lotPanel: draft.lotPanel || '',
      engineerRemarks: draft.engineerRemarks || '',
      laser1PowerOffsetPercent: draft.laser1PowerOffsetPercent !== undefined ? draft.laser1PowerOffsetPercent : null,
      laser2PowerOffsetPercent: draft.laser2PowerOffsetPercent !== undefined ? draft.laser2PowerOffsetPercent : null,
      viaSpec: spec,
      phase1: {
        powerWatts: draft.phase1?.powerWatts ?? null,
        frequencyKhz: draft.phase1?.frequencyKhz ?? null,
        shotCount: draft.phase1?.shotCount ?? null,
        maskMm: draft.phase1?.maskMm ?? null,
        defocusMm: draft.phase1?.defocusMm ?? null
      },
      phase2: {
        powerWatts: draft.phase2?.powerWatts ?? null,
        frequencyKhz: draft.phase2?.frequencyKhz ?? null,
        shotCount: draft.phase2?.shotCount ?? null,
        maskMm: draft.phase2?.maskMm ?? null,
        defocusMm: draft.phase2?.defocusMm ?? null
      },
      laser1Via: l1,
      laser2Via: l2,
      overallResult
    };
  }

  static generateSyntheticViaSvg(laserName: string, topUm: number, bottomUm: number, ringColor: string = '#06b6d4'): string {
    const topRadius = Math.max(12, Math.min(32, (topUm / 60) * 28));
    const bottomRadius = Math.max(6, Math.min(20, (bottomUm / 30) * 16));

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" fill="#030712"/>
      <circle cx="80" cy="80" r="74" fill="none" stroke="#1e293b" stroke-width="2"/>
      <!-- Concentric Grid Circles -->
      <circle cx="80" cy="80" r="55" fill="none" stroke="#334155" stroke-dasharray="3,3" stroke-width="1"/>
      <circle cx="80" cy="80" r="35" fill="none" stroke="#334155" stroke-dasharray="3,3" stroke-width="1"/>
      <circle cx="80" cy="80" r="18" fill="none" stroke="#334155" stroke-dasharray="3,3" stroke-width="1"/>
      <!-- Crosshairs -->
      <line x1="80" y1="10" x2="80" y2="150" stroke="#475569" stroke-width="1" stroke-dasharray="2,2"/>
      <line x1="10" y1="80" x2="150" y2="80" stroke="#475569" stroke-width="1" stroke-dasharray="2,2"/>
      <!-- Top Via Hole Ring -->
      <circle cx="80" cy="80" r="${topRadius}" fill="${ringColor}" fill-opacity="0.25" stroke="${ringColor}" stroke-width="2.5"/>
      <!-- Bottom Via Hole Core -->
      <circle cx="80" cy="80" r="${bottomRadius}" fill="${ringColor}" fill-opacity="0.65" stroke="#ffffff" stroke-width="1.5"/>
      <!-- Text Labels -->
      <text x="12" y="22" fill="#94a3b8" font-family="monospace" font-size="10" font-weight="bold">${laserName}</text>
      <text x="12" y="146" fill="#64748b" font-family="monospace" font-size="9">T:${topUm}µm B:${bottomUm}µm</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }

  static getInitialMockRecords(_machineNumber: string): ProductProcessRecord[] {
    return [];
  }
}
