export interface ProcessPhaseParams {
  powerWatts: number | null;
  frequencyKhz: number | null;
  shotCount: number | null;
  maskMm: number | null;
  defocusMm: number | null;
}

export interface ViaQualityReading {
  viaImageDataUrl?: string;
  topWidthUm: number | null;
  bottomWidthUm: number | null;
  topPass: boolean;
  bottomPass: boolean;
  overallPass: boolean;
}

export interface ProductProcessRecord {
  id: string;
  date: string;
  productName?: string;
  recipeName?: string;
  lotPanel?: string;
  engineerRemarks?: string;

  phase1: ProcessPhaseParams;
  phase2: ProcessPhaseParams;

  laser1Via: ViaQualityReading;
  laser2Via: ViaQualityReading;

  overallResult: 'PASS' | 'FAIL';
}

export const TOP_VIA_SPEC = { target: 51, tolerance: 10, min: 41, max: 61 };
export const BOTTOM_VIA_SPEC = { target: 23, tolerance: 10, min: 13, max: 33 };
