import {
  MHCSession,
  MHCLaserHourItem,
  MHCLaserPowerItem,
  MHCLaserProfileData,
  MHCOpticsBeamData,
  MHCCoolingData,
  MHCProductQualityData,
  MHCSparePartItem,
  MHCEngineerRemarksData,
  MHCHeadInspectionState,
  MHCStageCalibrationResult,
  MHCAgcResult,
  MHCTemperatureEvidenceData,
  MHCEvidenceItem
} from './index';

export type MhcReportSectionCode =
  | '01' // Cover Page
  | '02' // Table of Contents / Report Index
  | '03' // Executive Summary (Old 04)
  | '04' // Laser Hours & Lifecycle (Old 05)
  | '05' // Laser Power & Baseline Comparison (Old 06)
  | '06' // Optical Beam Profile & Spot Quality (Old 07)
  | '07' // Focus Optimization (Old 08)
  | '08' // Power Offset & Calibration (Old 09)
  | '09' // Stage Calibration (Old 10)
  | '10' // AGC / Scanner Calibration (Old 11)
  | '11' // Temperature & Thermal Telemetry (Old 12)
  | '12' // Product Process & Via Quality (Old 13)
  | '13' // Findings & Observations (Old 15)
  | '14' // Spare Parts & Recommendations (Old 17)
  | '15'; // Buyoff & Official Approvals (Old 18)

export type MhcReportSectionStatus =
  | 'COMPLETE'
  | 'INCOMPLETE'
  | 'NEEDS_REVIEW'
  | 'UNAVAILABLE'
  | 'NOT_COLLECTED'
  | 'NOT_APPLICABLE'
  | 'SKIPPED';

export interface MhcReportEvidenceRef {
  id: string;
  category: string;
  title: string;
  url?: string;
  notes?: string;
}

export interface MhcReportSection<T = any> {
  code: MhcReportSectionCode;
  title: string;
  displayOrder: number;
  isVisible: boolean;
  status: MhcReportSectionStatus;
  summaryNote?: string;
  data: T;
  findings?: string[];
  evidenceReferences?: MhcReportEvidenceRef[];
}

// 01 Cover Data
export interface MhcReportCoverData {
  title: string;
  subtitle: string;
  reportNumber: string;
  date: string;
  customerName: string;
  plantName: string;
  productionLine?: string;
  lineName?: string;
  department?: string;
  zone?: string;
  machineModel: string;
  machineSerialNumber: string;
  machineName: string;
  machineNumber?: string;
  baselineDate?: string;
  lastMhcDate?: string;
  engineerName: string;
  engineerTitle: string;
  founderBranding?: {
    companyName?: string;
    tagline?: string;
    logoUrl?: string;
  };
}

// 02 Index Entry
export interface MhcReportIndexEntry {
  code: MhcReportSectionCode;
  title: string;
  displayOrder: number;
  category: string;
  pageNumber: number | null; // Null until assigned by future renderer
  isVisible: boolean;
  status: MhcReportSectionStatus;
}

export interface MhcReportIndexData {
  entries: MhcReportIndexEntry[];
}

// 03 Machine Information
export interface MhcReportMachineInfoData {
  machineId: string;
  machineName: string;
  machineModel: string;
  machineNumber?: string;
  serialNumber: string;
  customerName: string;
  plantName: string;
  department?: string;
  productionLine?: string;
  zone?: string;
  installationDate?: string;
  baselineDate?: string;
  lastMhcDate?: string;
  engineerName: string;
  laserHeads: Array<{
    laserId: string;
    identifier: string;
    serialNumber?: string;
    ratedPowerWatts?: number;
    recordedLaserHour?: number;
    runtimeStatus?: string;
  }>;
}

// 04 Executive Summary
export interface MhcReportExecutiveSummaryData {
  overallStatus: 'PASS' | 'CONDITIONAL_PASS' | 'WARNING' | 'ACTION_REQUIRED' | 'FAIL';
  readinessScore: number; // 0 - 100
  summaryText: string;
  keyFindings: string[];
  majorPassFailResults: Array<{
    component: string;
    verdict: 'PASS' | 'WARNING' | 'FAIL' | 'UNANSWERED' | 'NOT_COLLECTED';
    note: string;
  }>;
  replacementRecommendations: string[];
  importantObservations: string[];
}

// 05 Laser Hours
export interface MhcReportLaserHourHeadDetail {
  laserId: string;
  laserIdentifier: string;
  serialNumber?: string;
  recordedLaserHour?: number;
  verifiedHour?: number;
  calculatedCurrentHour: number;
  currentLaserHour: number;
  warningThreshold: number;
  criticalThreshold: number;
  errorEolLimit: number;
  warningLimit: number;
  lifeRemainingPercent: number;
  remainingHours: number;
  remainingDays: number;
  estimatedEolDate: string;
  verdict: 'PASS' | 'WARNING' | 'FAIL';
  runtimeStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  readingDate: string;
  isVerified: boolean;
  notes?: string;
  aiRecommendation?: string;
}

export interface MhcReportLaserHoursData {
  laserHours: MhcReportLaserHourHeadDetail[];
  summaryText: string;
  aiAdvisoryNotes?: string[];
}

// Comparison Structure for Power
export interface MhcPowerComparisonItem {
  headId: string;
  headName: string;
  specification: string;
  hasPreviousBaseline: boolean;
  current: {
    ratedPowerWatts: number;
    referenceValueWatts: number;
    measuredWatts: number;
    stabilityPercent: number;
    measurementDate: string;
    verdict: 'PASS' | 'WARNING' | 'FAIL';
    notes?: string;
    // Complete authoritative measurement breakdown
    laserSourceWatts?: number | null;
    opticsTopHatWatts?: number | null;
    maskReadings?: Array<{
      maskSize: string;
      minWatts: number;
      measuredWatts: number | null;
      prevMeasuredWatts?: number | null;
      deltaWatts?: number | null;
      deltaPercent?: number | null;
      pass: boolean;
    }>;
  };
  previous: {
    recordedDate: string;
    measuredWatts: number;
    stabilityPercent: number;
    verdict?: string;
    laserSourceWatts?: number | null;
    opticsTopHatWatts?: number | null;
  } | null;
  comparison: {
    deltaWatts: number | null;
    deltaPercent: number | null;
    statusText: string; // e.g., "-1.2 W (-1.8%)" or "No previous baseline"
  };
  evidenceImages: string[];
}

// 06 Laser Power Data
export interface MhcReportLaserPowerData {
  hasPreviousBaseline: boolean;
  comparisonNote: string;
  heads: MhcPowerComparisonItem[];
}

// 07 Beam Profile Comparison Item
export interface MhcBeamProfileComparisonItem {
  headId: string;
  headName: string;
  specification: string;
  hasPreviousBaseline: boolean;
  measurementStation: string;
  current: {
    beamSizeMm?: number;
    focusOffsetMm?: number;
    symmetryRatio?: number;
    m2Value?: number;
    modeQuality?: string;
    overallResult?: string;
    notes?: string;
    // Complete authoritative checkpoint readings
    checkpoints?: Array<{
      checkpointId: string;
      stageLabel?: string;
      measuredDiameterMm: number | null;
      specText?: string;
      pass: boolean;
      imageDataUrl?: string;
    }>;
  };
  previous: {
    recordedDate: string;
    beamSizeMm?: number;
    symmetryRatio?: number;
    overallResult?: string;
  } | null;
  comparison: {
    deltaBeamSizeMm: number | null;
    deltaPercent: number | null;
    statusText: string; // e.g., "+0.02 mm (+1.5%)" or "No previous baseline"
  };
  beamImages: string[];
}

// 07 Beam Profile Data
export interface MhcReportBeamProfileData {
  hasPreviousBaseline: boolean;
  comparisonNote: string;
  measurementStation: string;
  heads: MhcBeamProfileComparisonItem[];
}

// 08 Focus Optimization
export interface MhcFocusImagePosition {
  key: '+3' | '+2' | '+1' | '0' | '-1' | '-2' | '-3';
  positionMm: string; // '+0.300 mm', '+0.200 mm', '+0.100 mm', '0.000 mm', '-0.100 mm', '-0.200 mm', '-0.300 mm'
  isBaseline: boolean; // true for -0.300 mm
  imageDataUrl?: string;
  drillDiameterUm?: number | null;
  notes?: string;
}

export interface MhcFocusLaserHeadRecord {
  laserHeadId: 'laser1' | 'laser2';
  laserLabel: string; // 'Laser Head 1' | 'Laser Head 2'
  date: string;
  adjustmentReason: string; // e.g. "Laser source replacement" or "Beam re-alignment"
  baseline: string; // "-0.300 mm"
  evaluation: string; // e.g. "Verified"
  reason?: string;
  positions: MhcFocusImagePosition[];
}

export interface MhcReportFocusOptimizationData {
  status: MhcReportSectionStatus;
  hasRecord: boolean;
  topViaImpactNote: string;
  heads: MhcFocusLaserHeadRecord[];
  notes?: string;
}

// 09 Power Offset
export interface MhcLaserPowerOffsetHead {
  laserHeadId: 'laser1' | 'laser2';
  laserLabel: string;
  
  // Phase 1 Process Power
  phase1RecipePowerWatts: number | null;
  phase1AdjustedPowerWatts: number | null;

  // Phase 2 Process Power
  phase2RecipePowerWatts: number | null;
  phase2AdjustedPowerWatts: number | null;

  // Offset Evaluation
  appliedOffsetPercent: number | null;
  previousOffsetPercent: number | null;
  currentOffsetPercent: number | null;
  adjustmentReason?: string;

  // Backwards compatibility fields
  recipePowerWatts?: number | null;
  resultingPowerWatts?: number | null;
}

export interface MhcReportPowerOffsetData {
  status: MhcReportSectionStatus;
  productName?: string;
  recipeName?: string;
  powerOffsetRangeText?: string;
  bottomViaImpactNote?: string;
  laser1: MhcLaserPowerOffsetHead;
  laser2: MhcLaserPowerOffsetHead;
  adjustmentReason?: string;
  notes?: string;

  // Backwards compatibility fields for engine tests & legacy consumers
  head1PowerOffsetWatts?: number | null;
  head2PowerOffsetWatts?: number | null;
  head1OffsetPercent?: number | null;
  head2OffsetPercent?: number | null;
  head1NominalWatts?: number | null;
  head1MeasuredWatts?: number | null;
  head2NominalWatts?: number | null;
  head2MeasuredWatts?: number | null;
  head1TransmissionPercent?: number | null;
  head2TransmissionPercent?: number | null;
  stabilityPercent?: number | null;
  offsetCorrectionApplied?: boolean;
  linearityTolerancePercent?: number;
  verdict?: 'PASS' | 'WARNING' | 'FAIL' | 'NOT_COLLECTED';
}

// 10 Stage Calibration Data
export interface MhcReportStageCalibrationData {
  specToleranceUm: number; // 2.0
  overallVerdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED' | 'NOT_COLLECTED';
  overallDisposition?: string;
  notes?: string;
  stages: Array<{
    stageId: string;
    stageName: string;
    xMinUm: number | null;
    xMaxUm: number | null;
    yMinUm: number | null;
    yMaxUm: number | null;
    maxAbsXUm?: number;
    maxAbsYUm?: number;
    overallMaxDevUm?: number;
    specToleranceUm?: number;
    systemVerdict?: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
    engineerDisposition?: string;
    verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
    evidenceImage?: string;
    engineerNote?: string;
  }>;
}

// 11 AGC / Scanner Calibration Data
export interface MhcReportAgcData {
  specToleranceUm: number; // 3.0
  overallVerdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED' | 'NOT_COLLECTED';
  overallDisposition?: string;
  notes?: string;
  scannerAttentionRequired: boolean;
  agcs: Array<{
    agcId: string;
    agcName: string;
    indices: Array<{
      indexNum: number;
      xUm: number | null;
      yUm: number | null;
      verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
    }>;
    xMinUm?: number;
    xMaxUm?: number;
    yMinUm?: number;
    yMaxUm?: number;
    maxAbsXUm?: number;
    maxAbsYUm?: number;
    overallMaxDevUm?: number;
    specToleranceUm?: number;
    systemVerdict?: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
    engineerDisposition?: string;
    verdict: 'PASS' | 'OUT_OF_SPEC' | 'UNANSWERED';
    scannerConditionFlag?: boolean;
    evidenceImage?: string;
    engineerNote?: string;
  }>;
}

// 12 Temperature Monitoring Data
export interface MhcReportTemperatureData {
  hasValidTemperatureAnalysis: boolean;
  temperatureRecordId?: string;
  temperatureRecordTitle?: string;
  temperatureLogFileName?: string;
  targetTempCelsius?: number;
  tempToleranceCelsius?: number;
  rawRecordsCount?: number;
  stats?: {
    min: number;
    max: number;
    avg: number;
    range: number;
    points: number;
  };
  channelStats?: Record<number, { min: number; max: number; avg: number; range: number; points: number }>;
  channelData?: Record<number, Array<{ ts: Date | string | number; val: number }>>;
  chillerTempCelsius?: number;
  chillerFlowLpm?: number;
  diConductivityUs?: number;
  coolingResult?: 'PASS' | 'ATTENTION' | 'FAIL' | 'NOT_COLLECTED';
  engineerNote?: string;
  notes?: string;
}

// 12 Laser / Product Process & Via Quality Data
export interface MhcReportLaserProductProfileData {
  status: 'NOT_COLLECTED' | 'AVAILABLE' | 'COMPLETE' | 'NEEDS_REVIEW';
  laserId?: string;
  productName?: string;
  recipeProgram?: string;
  recipeName?: string;
  lotPanel?: string;
  profileInfo?: string;
  measurementInfo?: string;
  supportingEvidence?: string;
  images?: string[];
  engineerRemarks?: string;
  phase1?: {
    powerWatts?: number | null;
    frequencyKhz?: number | null;
    shotCount?: number | null;
    maskMm?: number | null;
    defocusMm?: number | null;
  };
  phase2?: {
    powerWatts?: number | null;
    frequencyKhz?: number | null;
    shotCount?: number | null;
    maskMm?: number | null;
    defocusMm?: number | null;
  };
  hasProcessRecord?: boolean;

  // Microvia Quality Fields
  sampleId?: string;
  viaDiameterUm?: number;
  viaShape?: string;
  viaOffsetUm?: number;
  padQuality?: string;
  visualVerification?: string;
  result?: 'PASS' | 'ATTENTION' | 'FAIL' | 'NOT_COLLECTED';
  overallResult?: 'PASS' | 'FAIL' | 'NOT_COLLECTED';
  laser1Via?: {
    topWidthUm?: number | null;
    bottomWidthUm?: number | null;
    topPass?: boolean;
    bottomPass?: boolean;
    overallPass?: boolean;
    viaImageDataUrl?: string;
  };
  laser2Via?: {
    topWidthUm?: number | null;
    bottomWidthUm?: number | null;
    topPass?: boolean;
    bottomPass?: boolean;
    overallPass?: boolean;
    viaImageDataUrl?: string;
  };
  hasViaRecord?: boolean;
  notes?: string;
}

// 14 Product Via Quality Data
export interface MhcReportProductViaQualityData {
  status: 'NOT_COLLECTED' | 'AVAILABLE' | 'COMPLETE' | 'NEEDS_REVIEW';
  sampleId?: string;
  viaDiameterUm?: number;
  viaShape?: string;
  viaOffsetUm?: number;
  padQuality?: string;
  visualVerification?: string;
  result?: 'PASS' | 'ATTENTION' | 'FAIL' | 'NOT_COLLECTED';
  overallResult?: 'PASS' | 'FAIL' | 'NOT_COLLECTED';
  beforeImages?: string[];
  afterImages?: string[];
  notes?: string;
  engineerRemarks?: string;
  laser1Via?: {
    topWidthUm?: number | null;
    bottomWidthUm?: number | null;
    topPass?: boolean;
    bottomPass?: boolean;
    overallPass?: boolean;
    viaImageDataUrl?: string;
  };
  laser2Via?: {
    topWidthUm?: number | null;
    bottomWidthUm?: number | null;
    topPass?: boolean;
    bottomPass?: boolean;
    overallPass?: boolean;
    viaImageDataUrl?: string;
  };
  hasViaRecord?: boolean;
}

// 15 Findings Data
export interface MhcReportFindingsData {
  totalFindingsCount: number;
  generalFindingsNote?: string;
  observedIssues?: string;
  heads: Array<{
    headId: string;
    headName: string;
    decision: 'UNANSWERED' | 'NO_ISSUE' | 'ISSUE_FOUND';
    findingsList: Array<{
      id: string;
      component: string;
      conditions: string[];
      actionRecommendation: string;
      engineerNote?: string;
      evidenceImage?: string;
      aiGeneratedWording?: string;
    }>;
  }>;
}

// 16 Corrective Actions Data
export interface MhcReportCorrectiveActionsData {
  actionsList: Array<{
    id: string;
    source: string;
    findingComponent?: string;
    actionText: string;
    recommendationLevel?: string;
    status: 'COMPLETED' | 'RECOMMENDED' | 'PENDING';
  }>;
  generalCorrectiveActionsText?: string;
}

// 17 Spare Parts / Recommendations Data
export interface MhcReportSparePartsData {
  spareParts: Array<{
    id: string;
    partName: string;
    partNumber: string;
    category: string;
    quantity: number;
    reason: string;
    action: 'REPLACED' | 'USED' | 'RECOMMENDED';
    costIndicator: 'CUSTOMER_COST' | 'EO_SUPPORT' | 'WARRANTY';
    notes: string;
  }>;
  consumedParts: Array<{
    id: string;
    partName: string;
    partNumber: string;
    category: string;
    quantity: number;
    reason: string;
    action: 'REPLACED' | 'USED';
    costIndicator: 'CUSTOMER_COST' | 'EO_SUPPORT' | 'WARRANTY';
    notes: string;
  }>;
  recommendedParts: Array<{
    id: string;
    partName: string;
    partNumber?: string;
    category?: string;
    quantity?: number;
    reason: string;
    sourceFinding?: string;
    notes?: string;
  }>;
  recommendations: string[];
  engineerRecommendationsText?: string;
  followUpRequired?: boolean;
  generalFindingsNote?: string;
}

// 18 Evidence Data
export interface MhcReportEvidenceItem {
  id: string;
  category: string;
  evidenceType: 'INSPECTION' | 'CALIBRATION_TELEMETRY';
  title: string;
  sourceSection: string;
  imageDataUrl?: string;
  referenceId?: string;
  notes?: string;
  createdAt?: string;
}

export interface MhcReportEvidenceData {
  totalEvidenceItems: number;
  inspectionEvidence: MhcReportEvidenceItem[];
  calibrationEvidence: MhcReportEvidenceItem[];
  items: MhcReportEvidenceItem[];
}

// 19 Buyoff Data
export interface MhcReportBuyoffData {
  productionReleaseVerdict: 'APPROVED' | 'CONDITIONAL_RELEASE' | 'HALTED' | 'PENDING';
  engineerSignoff: {
    name: string;
    title: string;
    date: string;
    signatureDataUrl?: string;
  };
  customerSignoff: {
    name: string;
    title?: string;
    date: string;
    signatureDataUrl?: string;
    comments?: string;
  };
  nextMhcSchedule?: {
    nextDueDate?: string;
    intervalMonths?: number;
    recommendedWindow?: string;
    targetServiceType?: string;
  };
  founderBranding?: {
    companyName?: string;
    tagline?: string;
    logoUrl?: string;
  };
}

// Map of all sections by section code
export interface MhcReportSectionMap {
  '01': MhcReportSection<MhcReportCoverData>;
  '02': MhcReportSection<MhcReportIndexData>;
  '03': MhcReportSection<MhcReportExecutiveSummaryData>;
  '04': MhcReportSection<MhcReportLaserHoursData>;
  '05': MhcReportSection<MhcReportLaserPowerData>;
  '06': MhcReportSection<MhcReportBeamProfileData>;
  '07': MhcReportSection<MhcReportFocusOptimizationData>;
  '08': MhcReportSection<MhcReportPowerOffsetData>;
  '09': MhcReportSection<MhcReportStageCalibrationData>;
  '10': MhcReportSection<MhcReportAgcData>;
  '11': MhcReportSection<MhcReportTemperatureData>;
  '12': MhcReportSection<MhcReportLaserProductProfileData>;
  '13': MhcReportSection<MhcReportFindingsData>;
  '14': MhcReportSection<MhcReportSparePartsData>;
  '15': MhcReportSection<MhcReportBuyoffData>;
}

export interface MhcReportMetadata {
  reportNumber: string;
  title: string;
  generatedAt: string;
  sessionId: string;
  machineId: string;
  machineModel: string;
  machineSerialNumber: string;
  customerName: string;
  plantName: string;
  engineerName: string;
  hasPreviousBaseline: boolean;
  previousSessionId?: string;
  previousSessionDate?: string;
  totalSectionsCount: number;
  totalPagesCount?: number;
}

export interface MhcReportDocument {
  reportId: string;
  generatedAt: string;
  schemaVersion: '1.0.0';
  sessionId: string;
  machineId: string;
  metadata: MhcReportMetadata;
  indexEntries: MhcReportIndexEntry[];
  sections: MhcReportSectionMap;
  orderedSections: MhcReportSection[];
}

export interface MhcReportOptions {
  reportNumber?: string;
  title?: string;
  engineerTitle?: string;
  founderBranding?: {
    companyName?: string;
    tagline?: string;
    logoUrl?: string;
  };
  sectionVisibilityOverrides?: Record<MhcReportSectionCode, boolean>;
}
