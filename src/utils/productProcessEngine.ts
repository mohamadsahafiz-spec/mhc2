import { ProductProcessRecord, ViaQualityReading, TOP_VIA_SPEC, BOTTOM_VIA_SPEC } from '../types/productProcess';

export class ProductProcessEngine {
  static evalTopWidth(val: number | null): boolean {
    if (val === null || isNaN(val)) return false;
    return val >= TOP_VIA_SPEC.min && val <= TOP_VIA_SPEC.max;
  }

  static evalBottomWidth(val: number | null): boolean {
    if (val === null || isNaN(val)) return false;
    return val >= BOTTOM_VIA_SPEC.min && val <= BOTTOM_VIA_SPEC.max;
  }

  static evaluateVia(topWidthUm: number | null, bottomWidthUm: number | null, imageDataUrl?: string): ViaQualityReading {
    const topPass = this.evalTopWidth(topWidthUm);
    const bottomPass = this.evalBottomWidth(bottomWidthUm);
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
    phase1?: { powerWatts?: number | null; frequencyKhz?: number | null; shotCount?: number | null; maskMm?: number | null; defocusMm?: number | null };
    phase2?: { powerWatts?: number | null; frequencyKhz?: number | null; shotCount?: number | null; maskMm?: number | null; defocusMm?: number | null };
    laser1Via?: { topWidthUm?: number | null; bottomWidthUm?: number | null; viaImageDataUrl?: string };
    laser2Via?: { topWidthUm?: number | null; bottomWidthUm?: number | null; viaImageDataUrl?: string };
  }): ProductProcessRecord {
    const l1Top = draft.laser1Via?.topWidthUm ?? null;
    const l1Bottom = draft.laser1Via?.bottomWidthUm ?? null;
    const l1 = this.evaluateVia(l1Top, l1Bottom, draft.laser1Via?.viaImageDataUrl);

    const l2Top = draft.laser2Via?.topWidthUm ?? null;
    const l2Bottom = draft.laser2Via?.bottomWidthUm ?? null;
    const l2 = this.evaluateVia(l2Top, l2Bottom, draft.laser2Via?.viaImageDataUrl);

    const overallResult = (l1.overallPass && l2.overallPass) ? 'PASS' : 'FAIL';

    return {
      id: draft.id || `pp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: draft.date || new Date().toISOString().split('T')[0],
      productName: draft.productName || '',
      recipeName: draft.recipeName || '',
      lotPanel: draft.lotPanel || '',
      engineerRemarks: draft.engineerRemarks || '',
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
