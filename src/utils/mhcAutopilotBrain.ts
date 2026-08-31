import { 
  MHCSession, 
  MHCAutopilotSessionProgress, 
  MHCActivityStatus,
  MHCActivityDisposition,
  Machine
} from '../types';

export interface WorkflowActivity {
  code: string;
  title: string;
  day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4';
  parentCode?: string;
  subItems?: { code: string; title: string }[];
}

// Master Workflow Schedule for MHC Autopilot
export const MHC_WORKFLOW_SCHEDULE: WorkflowActivity[] = [
  {
    day: 'DAY 1',
    code: '01',
    title: 'Laser Hours',
    subItems: []
  },
  {
    day: 'DAY 1',
    code: '02',
    title: 'Laser System Calibration',
    subItems: [
      { code: '02_power', title: 'Laser Power (Laser 1 & 2)' },
      { code: '02_beam', title: 'Beam Profile / Mode (Laser 1 & 2)' },
      { code: '02_findings', title: 'Laser Optics & Head Inspection' }
    ]
  },
  {
    day: 'DAY 2',
    code: '04',
    title: 'Stage Calibration',
    subItems: [
      { code: '04_stage1', title: 'Stage 1' },
      { code: '04_stage2', title: 'Stage 2' }
    ]
  },
  {
    day: 'DAY 3',
    code: '05',
    title: 'AGC',
    subItems: [
      { code: '05_agc1', title: 'AGC 1' },
      { code: '05_agc2', title: 'AGC 2' }
    ]
  },
  {
    day: 'DAY 3',
    code: '06',
    title: 'Temperature & Evidence',
    subItems: []
  },
  {
    day: 'DAY 4',
    code: '07',
    title: 'Recommendations & Spare Parts',
    subItems: []
  },
  {
    day: 'DAY 4',
    code: '08',
    title: 'MHC Readiness Review',
    subItems: []
  },
  {
    day: 'DAY 4',
    code: '09',
    title: 'Report Generation',
    subItems: []
  },
  {
    day: 'DAY 4',
    code: '10',
    title: 'Buyoff / Complete',
    subItems: []
  }
];

// Flat list of all atomic actionable activity codes in sequential order
export const ACTIONABLE_ACTIVITIES: { code: string; title: string; day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4'; parentCode?: string }[] = [
  { code: '01', title: 'Laser Hours', day: 'DAY 1' },
  { code: '02_power', title: 'Laser Power (Laser 1 & 2)', day: 'DAY 1', parentCode: '02' },
  { code: '02_beam', title: 'Beam Profile / Mode (Laser 1 & 2)', day: 'DAY 1', parentCode: '02' },
  { code: '02_findings', title: 'Laser Optics & Head Inspection', day: 'DAY 1', parentCode: '02' },
  { code: '04_stage1', title: 'Stage Calibration — Stage 1', day: 'DAY 2', parentCode: '04' },
  { code: '04_stage2', title: 'Stage Calibration — Stage 2', day: 'DAY 2', parentCode: '04' },
  { code: '05_agc1', title: 'AGC — AGC 1', day: 'DAY 3', parentCode: '05' },
  { code: '05_agc2', title: 'AGC — AGC 2', day: 'DAY 3', parentCode: '05' },
  { code: '06', title: 'Temperature & Evidence', day: 'DAY 3' },
  { code: '07', title: 'Recommendations & Spare Parts', day: 'DAY 4' },
  { code: '08', title: 'MHC Readiness Review', day: 'DAY 4' },
  { code: '09', title: 'Report Generation', day: 'DAY 4' },
  { code: '10', title: 'Buyoff / Complete', day: 'DAY 4' }
];

export function createDefaultAutopilotProgress(): MHCAutopilotSessionProgress {
  const activityStatuses: Record<string, MHCActivityStatus> = {};

  // Day 1 initial activity
  activityStatuses['01'] = 'IN_PROGRESS';
  activityStatuses['02_power'] = 'UPCOMING';
  activityStatuses['02_beam'] = 'UPCOMING';
  activityStatuses['02_findings'] = 'UPCOMING';

  // Day 2-4 initially locked
  activityStatuses['04_stage1'] = 'LOCKED';
  activityStatuses['04_stage2'] = 'LOCKED';
  activityStatuses['05_agc1'] = 'LOCKED';
  activityStatuses['05_agc2'] = 'LOCKED';
  activityStatuses['06'] = 'LOCKED';
  activityStatuses['07'] = 'LOCKED';
  activityStatuses['08'] = 'LOCKED';
  activityStatuses['09'] = 'LOCKED';
  activityStatuses['10'] = 'LOCKED';

  return {
    currentDay: 'DAY 1',
    currentActivityCode: '01',
    activityStatuses,
    activityNotes: {},
    dispositions: {},
    readinessScore: 0,
    isReadOnly: false,
    lastActiveTimestamp: new Date().toISOString()
  };
}

// Compute aggregate status for parent codes (e.g. '02', '03', '04', '05')
export function getParentActivityStatus(
  parentCode: string, 
  activityStatuses: Record<string, MHCActivityStatus>
): MHCActivityStatus {
  const children = ACTIONABLE_ACTIVITIES.filter(a => a.parentCode === parentCode);
  if (children.length === 0) return activityStatuses[parentCode] || 'LOCKED';

  const childStatuses = children.map(c => activityStatuses[c.code] || 'LOCKED');
  
  if (childStatuses.every(s => s === 'COMPLETED')) return 'COMPLETED';
  if (childStatuses.some(s => s === 'NEEDS_REVIEW')) return 'NEEDS_REVIEW';
  if (childStatuses.some(s => s === 'IN_PROGRESS')) return 'IN_PROGRESS';
  if (childStatuses.some(s => s === 'COMPLETED')) return 'IN_PROGRESS';
  if (childStatuses.every(s => s === 'LOCKED')) return 'LOCKED';
  return 'UPCOMING';
}

/**
 * Checks whether an activity has an acknowledged engineer disposition.
 */
export function isActivityDispositioned(session?: MHCSession | null, code?: string): boolean {
  if (!session || !code) return false;
  const disp = session.autopilotProgress?.dispositions?.[code];
  if (!disp) return false;
  if (typeof disp === 'boolean') return disp;
  return Boolean(disp.acknowledged);
}

/**
 * Retrieves the structured disposition object for an activity if present.
 */
export function getActivityDisposition(session?: MHCSession | null, code?: string): MHCActivityDisposition | null {
  if (!session || !code) return null;
  const disp = session.autopilotProgress?.dispositions?.[code];
  if (!disp) return null;
  if (typeof disp === 'boolean') {
    return {
      acknowledged: disp,
      dispositionedAt: new Date().toISOString(),
      engineerNote: 'Review Complete — Continued with Finding'
    };
  }
  return disp;
}

/**
 * Records an explicit engineer disposition for an activity without altering its underlying status or findings.
 */
export function dispositionAutopilotActivity(
  session: MHCSession,
  code: string,
  rationaleOrNote?: string,
  engineerName?: string,
  actionTaken?: string,
  verdict?: import('../types').MHCEngineerDispositionVerdict
): MHCSession {
  if (!session) return session;
  const currProgress = session.autopilotProgress || createDefaultAutopilotProgress();
  const existingDispositions = currProgress.dispositions || {};
  const newDisposition: MHCActivityDisposition = {
    acknowledged: true,
    verdict: verdict || 'ACCEPTED_DEVIATION',
    dispositionedAt: new Date().toISOString(),
    dispositionedBy: engineerName || session.engineerName || 'Lead Field Engineer',
    rationale: rationaleOrNote || 'Review Complete — Continued with Finding',
    engineerNote: rationaleOrNote || 'Review Complete — Continued with Finding',
    actionTaken: actionTaken || 'Acknowledged for report generation'
  };

  return {
    ...session,
    autopilotProgress: {
      ...currProgress,
      dispositions: {
        ...existingDispositions,
        [code]: newDisposition
      },
      lastActiveTimestamp: new Date().toISOString()
    }
  };
}

/**
 * Revokes an engineer disposition if re-opening for review.
 */
export function revokeActivityDisposition(
  session: MHCSession,
  code: string
): MHCSession {
  if (!session) return session;
  const currProgress = session.autopilotProgress || createDefaultAutopilotProgress();
  const existingDispositions = { ...(currProgress.dispositions || {}) };
  delete existingDispositions[code];

  return {
    ...session,
    autopilotProgress: {
      ...currProgress,
      dispositions: existingDispositions,
      lastActiveTimestamp: new Date().toISOString()
    }
  };
}

export interface AutopilotReadinessReport {
  completedCount: number;
  totalCount: number;
  readinessScore: number;
  completedList: { code: string; title: string; day: string }[];
  incompleteList: { code: string; title: string; day: string }[];
  needsReviewList: { code: string; title: string; day: string }[];
  nextActionableActivity: { code: string; title: string; day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4' } | null;
  isReadyForReport: boolean;
}

export interface MhcAuditItem {
  code: string;
  title: string;
  day: 'DAY 1' | 'DAY 2' | 'DAY 3';
  status: 'COMPLETE' | 'NEEDS_REVIEW' | 'INCOMPLETE' | 'LOCKED' | 'OPTIONAL';
  statusSymbol: '✓' | '⚠' | '○' | '🔒' | '—';
  detail: string;
  isBlocker: boolean;
  blockerReason: string | null;
  isDispositioned?: boolean;
  disposition?: MHCActivityDisposition | null;
}

export interface MhcReadinessAuditResult {
  isReadyForReport: boolean;
  statusCategory: 'READY_FOR_REPORT' | 'ATTENTION_REQUIRED';
  statusText: string;
  auditItems: MhcAuditItem[];
  blockers: { id: string; code: string; title: string; reason: string }[];
  nextAction: { text: string; targetCode: string };
  completedRequiredCount: number;
  totalRequiredCount: number;
  readinessScore: number;
}

export function auditMhcSession(session?: MHCSession | null): MhcReadinessAuditResult {
  if (!session) {
    return {
      isReadyForReport: false,
      statusCategory: 'ATTENTION_REQUIRED',
      statusText: '🟠 ATTENTION REQUIRED',
      auditItems: [],
      blockers: [{ id: 'B-1', code: '01', title: 'Session', reason: 'No active session loaded.' }],
      nextAction: { text: 'Start Session', targetCode: '01' },
      completedRequiredCount: 0,
      totalRequiredCount: 12,
      readinessScore: 0
    };
  }

  const statuses = session.autopilotProgress?.activityStatuses || {};
  const auditItems: MhcAuditItem[] = [];

  const addItem = (
    code: string,
    title: string,
    day: 'DAY 1' | 'DAY 2' | 'DAY 3',
    evaluate: () => {
      status: 'COMPLETE' | 'NEEDS_REVIEW' | 'INCOMPLETE' | 'LOCKED' | 'OPTIONAL';
      statusSymbol: '✓' | '⚠' | '○' | '🔒' | '—';
      detail: string;
      isBlocker: boolean;
      blockerReason: string | null;
      isDispositioned?: boolean;
      disposition?: MHCActivityDisposition | null;
    }
  ) => {
    const res = evaluate();
    const isDisp = res.isDispositioned ?? isActivityDispositioned(session, code);
    const dispObj = res.disposition ?? getActivityDisposition(session, code);
    auditItems.push({
      code,
      title,
      day,
      ...res,
      isDispositioned: isDisp,
      disposition: dispObj
    });
  };

  // 1. Laser Hours (01)
  addItem('01', 'Laser Hours', 'DAY 1', () => {
    const st = statuses['01'];
    const isDisp = isActivityDispositioned(session, '01');
    const hrsItem = session.stage01_laserHours?.[0];
    if (st === 'COMPLETED' || (session.stage01_laserHours && session.stage01_laserHours.length > 0)) {
      const displayHrs = hrsItem ? (hrsItem.verifiedHour || hrsItem.calculatedCurrentHour || hrsItem.recordedLaserHour) : null;
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: displayHrs ? `${displayHrs.toLocaleString()} laser hrs` : 'Laser hours recorded',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Laser hours flagged for review (Reviewed & Acknowledged)' : 'Laser hours flagged for review',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'Laser hours record requires review.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Laser hours missing',
      isBlocker: true,
      blockerReason: 'Laser Hours record is incomplete.'
    };
  });

  // 2. Laser Power (02_power) — Laser 1 & 2
  addItem('02_power', 'Laser Power (Laser 1 & 2)', 'DAY 1', () => {
    const st = statuses['02_power'];
    const isDisp = isActivityDispositioned(session, '02_power');
    const power1 = session.stage03_laserPower?.find(p => p.laserId === 'lh1' || p.laserId === 'head1' || p.laserIdentifier?.includes('1'));
    const power2 = session.stage03_laserPower?.find(p => p.laserId === 'lh2' || p.laserId === 'head2' || p.laserIdentifier?.includes('2'));
    const hasFail = (power1 && power1.result === 'FAIL') || (power2 && power2.result === 'FAIL');

    if (hasFail) {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp 
          ? 'Laser power out of specification (Reviewed & Acknowledged)' 
          : 'Laser power out of specification on one or more heads',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'Laser power measurement contains out-of-spec points.'
      };
    }
    if (st === 'COMPLETED' || (session.stage03_laserPower && session.stage03_laserPower.length > 0 && !hasFail)) {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'Laser 1 & Laser 2 power verified (Pass)',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Flagged for review (Reviewed & Acknowledged)' : 'Flagged for review',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'Laser power measurement requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Laser power measurement is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Power measurement missing',
      isBlocker: true,
      blockerReason: 'Laser power measurement is incomplete.'
    };
  });

  // 3. Beam Profile / Mode (02_beam) — Laser 1 & 2
  addItem('02_beam', 'Beam Profile / Mode (Laser 1 & 2)', 'DAY 1', () => {
    const st = statuses['02_beam'];
    const isDisp = isActivityDispositioned(session, '02_beam');
    const beamRecord = session.stage02_laserProfile?.beamProfileRecord;
    if (st === 'COMPLETED' || beamRecord?.overallResult === 'PASS') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: beamRecord?.overallResult ? `Beam profile & mode verified (${beamRecord.overallResult})` : 'Beam profile & mode captured (Pass)',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW' || beamRecord?.overallResult === 'FAIL') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp 
          ? 'Beam profile out of specification (Reviewed & Acknowledged)' 
          : 'Beam profile flagged for review',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'Beam profile contains out-of-spec measurement points.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Beam Profile measurement is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Beam profile missing',
      isBlocker: true,
      blockerReason: 'Beam profile measurement is incomplete.'
    };
  });

  // 4. Laser Optics & Head Inspection (02_findings)
  addItem('02_findings', 'Laser Optics & Head Inspection', 'DAY 1', () => {
    const st = statuses['02_findings'];
    const isDisp = isActivityDispositioned(session, '02_findings');
    const insp1 = session.inspectionFindings?.['lh1'] || session.inspectionFindings?.['head1'];
    const insp2 = session.inspectionFindings?.['lh2'] || session.inspectionFindings?.['head2'];
    const allFindings = [...(insp1?.findings || []), ...(insp2?.findings || [])];
    const isCompleted = st === 'COMPLETED' || (insp1?.status === 'COMPLETED' || insp2?.status === 'COMPLETED') || (allFindings.length > 0);

    if (isCompleted) {
      const hasReplacement = allFindings.some(f => f.actionRecommendation === 'Replacement required' || f.actionRecommendation === 'Recommended replacement');
      return {
        status: hasReplacement ? 'NEEDS_REVIEW' : 'COMPLETE',
        statusSymbol: hasReplacement ? '⚠' : '✓',
        detail: hasReplacement 
          ? `${allFindings.length} Finding(s) — Recommendation / Replacement recorded${isDisp ? ' (Reviewed)' : ''}` 
          : allFindings.length > 0 
          ? `${allFindings.length} Finding(s) recorded` 
          : 'Optics & head inspections passed',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW' || insp1?.status === 'NEEDS_REVIEW' || insp2?.status === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp 
          ? 'Inspection finding recorded (Reviewed & Acknowledged)' 
          : 'Inspection finding recorded (requires review)',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Laser Optics & Head Inspection is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Inspection missing',
      isBlocker: true,
      blockerReason: 'Laser Optics & Head Inspection is incomplete.'
    };
  });

  // 8. Stage 1 Calibration (04_stage1)
  addItem('04_stage1', 'Stage 1 Calibration', 'DAY 2', () => {
    const st = statuses['04_stage1'];
    const isDisp = isActivityDispositioned(session, '04_stage1');
    const stageData = session.stageCalibrationData?.['stage1'];
    if (stageData && stageData.verdict === 'OUT_OF_SPEC') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Out of specification (Reviewed & Acknowledged)' : 'Out of specification',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'Stage 1 calibration result is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'Stage 1 calibration passed',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Flagged for review (Reviewed & Acknowledged)' : 'Flagged for review',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'Stage 1 calibration requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Stage 1 calibration is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Calibration missing',
      isBlocker: true,
      blockerReason: 'Stage 1 calibration is incomplete.'
    };
  });

  // 9. Stage 2 Calibration (04_stage2)
  addItem('04_stage2', 'Stage 2 Calibration', 'DAY 2', () => {
    const st = statuses['04_stage2'];
    const isDisp = isActivityDispositioned(session, '04_stage2');
    const stageData = session.stageCalibrationData?.['stage2'];
    if (stageData && stageData.verdict === 'OUT_OF_SPEC') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Out of specification (Reviewed & Acknowledged)' : 'Out of specification',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'Stage 2 calibration result is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'Stage 2 calibration passed',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Flagged for review (Reviewed & Acknowledged)' : 'Flagged for review',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'Stage 2 calibration requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Stage 2 calibration is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Calibration missing',
      isBlocker: true,
      blockerReason: 'Stage 2 calibration is incomplete.'
    };
  });

  // 10. AGC 1 (05_agc1)
  addItem('05_agc1', 'AGC 1', 'DAY 3', () => {
    const st = statuses['05_agc1'];
    const isDisp = isActivityDispositioned(session, '05_agc1');
    const agcData = session.agcData?.['agc1'];
    if (agcData && agcData.verdict === 'OUT_OF_SPEC') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Out of specification (Reviewed & Acknowledged)' : 'Out of specification',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'AGC 1 measurement is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'AGC 1 verified (Pass)',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Flagged for review (Reviewed & Acknowledged)' : 'Flagged for review',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'AGC 1 requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'AGC 1 is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Measurement missing',
      isBlocker: true,
      blockerReason: 'AGC 1 measurement is incomplete.'
    };
  });

  // 11. AGC 2 (05_agc2)
  addItem('05_agc2', 'AGC 2', 'DAY 3', () => {
    const st = statuses['05_agc2'];
    const isDisp = isActivityDispositioned(session, '05_agc2');
    const agcData = session.agcData?.['agc2'];
    if (agcData && agcData.verdict === 'OUT_OF_SPEC') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Out of specification (Reviewed & Acknowledged)' : 'Out of specification',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'AGC 2 measurement is out of specification.'
      };
    }
    if (st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: 'AGC 2 verified (Pass)',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Flagged for review (Reviewed & Acknowledged)' : 'Flagged for review',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'AGC 2 requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'AGC 2 is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Measurement missing',
      isBlocker: true,
      blockerReason: 'AGC 2 measurement is incomplete.'
    };
  });

  // 12. Temperature & Evidence (06)
  addItem('06', 'Temperature & Evidence', 'DAY 3', () => {
    const st = statuses['06'];
    const isDisp = isActivityDispositioned(session, '06');
    const tempData = session.temperatureEvidenceData;
    const hasValidTemp = Boolean(tempData?.hasValidTemperatureAnalysis && tempData?.stats);
    if (hasValidTemp && st === 'COMPLETED') {
      return {
        status: 'COMPLETE',
        statusSymbol: '✓',
        detail: tempData?.stats ? `Log parsed (${tempData.stats.avg.toFixed(1)}°C avg)` : 'Temperature log verified',
        isBlocker: false,
        blockerReason: null
      };
    }
    if (st === 'NEEDS_REVIEW') {
      return {
        status: 'NEEDS_REVIEW',
        statusSymbol: '⚠',
        detail: isDisp ? 'Flagged for review (Reviewed & Acknowledged)' : 'Flagged for review',
        isBlocker: !isDisp,
        blockerReason: isDisp ? null : 'Temperature log requires review.'
      };
    }
    if (st === 'LOCKED') {
      return {
        status: 'LOCKED',
        statusSymbol: '🔒',
        detail: 'Activity locked',
        isBlocker: true,
        blockerReason: 'Temperature log analysis is locked and incomplete.'
      };
    }
    return {
      status: 'INCOMPLETE',
      statusSymbol: '○',
      detail: 'Temperature analysis missing',
      isBlocker: true,
      blockerReason: 'Machine temperature telemetry log analysis is missing.'
    };
  });

  const blockers = auditItems
    .filter(i => i.isBlocker)
    .map((i, idx) => ({
      id: `B-${idx + 1}`,
      code: i.code,
      title: i.title,
      reason: i.blockerReason || `${i.title} is incomplete or requires review.`
    }));

  const isReadyForReport = blockers.length === 0;
  const statusCategory = isReadyForReport ? 'READY_FOR_REPORT' : 'ATTENTION_REQUIRED';
  const hasNeedsReview = auditItems.some(i => i.status === 'NEEDS_REVIEW');
  const statusText = isReadyForReport 
    ? (hasNeedsReview ? '🟢 READY FOR REPORT (WITH FINDINGS)' : '🟢 READY FOR REPORT') 
    : '🟠 ATTENTION REQUIRED';

  const completedRequiredCount = auditItems.filter(i => i.status === 'COMPLETE' || (i.status === 'NEEDS_REVIEW' && i.isDispositioned)).length;
  const totalRequiredCount = auditItems.length;
  const readinessScore = Math.round((completedRequiredCount / totalRequiredCount) * 100);

  let nextAction = { text: 'Generate Report', targetCode: '09' };
  if (!isReadyForReport && blockers.length > 0) {
    const firstBlocker = blockers[0];
    nextAction = {
      text: `Review ${firstBlocker.title}`,
      targetCode: firstBlocker.code
    };
  }

  return {
    isReadyForReport,
    statusCategory,
    statusText,
    auditItems,
    blockers,
    nextAction,
    completedRequiredCount,
    totalRequiredCount,
    readinessScore
  };
}

export function computeAutopilotReadiness(
  progress?: MHCAutopilotSessionProgress,
  session?: MHCSession | null
): AutopilotReadinessReport {
  if (session) {
    const audit = auditMhcSession(session);
    const completedList = audit.auditItems
      .filter(i => i.status === 'COMPLETE')
      .map(i => ({ code: i.code, title: i.title, day: i.day }));
    const incompleteList = audit.auditItems
      .filter(i => i.status !== 'COMPLETE')
      .map(i => ({ code: i.code, title: i.title, day: i.day }));
    const needsReviewList = audit.auditItems
      .filter(i => i.status === 'NEEDS_REVIEW')
      .map(i => ({ code: i.code, title: i.title, day: i.day }));

    let nextActionableActivity: { code: string; title: string; day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4' } | null = null;
    const nextItem = ACTIONABLE_ACTIVITIES.find(a => a.code === audit.nextAction.targetCode);
    if (nextItem) {
      nextActionableActivity = nextItem;
    }

    return {
      completedCount: audit.completedRequiredCount,
      totalCount: audit.totalRequiredCount,
      readinessScore: audit.readinessScore,
      completedList,
      incompleteList,
      needsReviewList,
      nextActionableActivity,
      isReadyForReport: audit.isReadyForReport
    };
  }

  const currentProgress = progress || createDefaultAutopilotProgress();
  const statuses = currentProgress.activityStatuses || {};

  const completedList: { code: string; title: string; day: string }[] = [];
  const incompleteList: { code: string; title: string; day: string }[] = [];
  const needsReviewList: { code: string; title: string; day: string }[] = [];

  let nextActionableActivity: { code: string; title: string; day: 'DAY 1' | 'DAY 2' | 'DAY 3' | 'DAY 4' } | null = null;

  for (const item of ACTIONABLE_ACTIVITIES) {
    const st = statuses[item.code] || 'LOCKED';
    if (st === 'COMPLETED') {
      completedList.push({ code: item.code, title: item.title, day: item.day });
    } else if (st === 'NEEDS_REVIEW') {
      needsReviewList.push({ code: item.code, title: item.title, day: item.day });
      incompleteList.push({ code: item.code, title: item.title, day: item.day });
      if (!nextActionableActivity) nextActionableActivity = item;
    } else {
      incompleteList.push({ code: item.code, title: item.title, day: item.day });
      if (!nextActionableActivity && st !== 'LOCKED') {
        nextActionableActivity = item;
      }
    }
  }

  const completedCount = completedList.length;
  const totalCount = ACTIONABLE_ACTIVITIES.length;
  const readinessScore = Math.round((completedCount / totalCount) * 100);

  const coreEngineeringItems = ACTIONABLE_ACTIVITIES.filter(a => ['DAY 1', 'DAY 2', 'DAY 3'].includes(a.day));
  const undispositionedNeedsReview = needsReviewList.filter(item => {
    const disp = currentProgress.dispositions?.[item.code];
    if (!disp) return true;
    if (typeof disp === 'boolean') return !disp;
    return !disp.acknowledged;
  });
  const coreCompleted = coreEngineeringItems.every(a => {
    const st = statuses[a.code];
    if (st === 'COMPLETED') return true;
    if (st === 'NEEDS_REVIEW') {
      const disp = currentProgress.dispositions?.[a.code];
      if (typeof disp === 'boolean') return disp;
      return Boolean(disp?.acknowledged);
    }
    return false;
  });
  const isReadyForReport = coreCompleted && undispositionedNeedsReview.length === 0;

  return {
    completedCount,
    totalCount,
    readinessScore,
    completedList,
    incompleteList,
    needsReviewList,
    nextActionableActivity,
    isReadyForReport
  };
}

export function advanceAutopilotActivity(
  session: MHCSession,
  targetCode: string,
  newStatus: 'COMPLETED' | 'NEEDS_REVIEW' | 'IN_PROGRESS',
  note?: string
): MHCSession {
  if (!session || typeof session !== 'object') {
    return session;
  }
  // Strip any accidental DOM / React Event properties if present
  const {
    _reactName,
    nativeEvent,
    target,
    currentTarget,
    view,
    ...cleanSession
  } = session as any;

  const currentProgress = cleanSession.autopilotProgress || createDefaultAutopilotProgress();
  const activityStatuses = { ...currentProgress.activityStatuses };
  const activityNotes = { ...(currentProgress.activityNotes || {}) };

  activityStatuses[targetCode] = newStatus;
  if (note !== undefined) {
    activityNotes[targetCode] = note;
  }

  let nextCode = targetCode;
  let nextDay = currentProgress.currentDay;

  if (newStatus === 'COMPLETED' || newStatus === 'NEEDS_REVIEW') {
    // Find next actionable activity index that is not already completed/finalized
    const currIndex = ACTIONABLE_ACTIVITIES.findIndex(a => a.code === targetCode);
    if (currIndex >= 0 && currIndex < ACTIONABLE_ACTIVITIES.length - 1) {
      let nextIndex = currIndex + 1;
      while (
        nextIndex < ACTIONABLE_ACTIVITIES.length &&
        (activityStatuses[ACTIONABLE_ACTIVITIES[nextIndex].code] === 'COMPLETED' ||
         activityStatuses[ACTIONABLE_ACTIVITIES[nextIndex].code] === 'NEEDS_REVIEW')
      ) {
        nextIndex++;
      }

      if (nextIndex < ACTIONABLE_ACTIVITIES.length) {
        const candidate = ACTIONABLE_ACTIVITIES[nextIndex];
        nextCode = candidate.code;
        nextDay = candidate.day;

        // Unlock candidate if it was locked or upcoming
        if (activityStatuses[candidate.code] === 'LOCKED' || activityStatuses[candidate.code] === 'UPCOMING' || !activityStatuses[candidate.code]) {
          activityStatuses[candidate.code] = 'IN_PROGRESS';
        }

        // Unlock same-day activities as upcoming
        ACTIONABLE_ACTIVITIES.forEach((act, idx) => {
          if (idx > nextIndex && act.day === candidate.day && activityStatuses[act.code] === 'LOCKED') {
            activityStatuses[act.code] = 'UPCOMING';
          }
        });
      }
    }
  }

  // Recalculate readiness
  const updatedProgress: MHCAutopilotSessionProgress = {
    ...currentProgress,
    currentDay: nextDay,
    currentActivityCode: nextCode,
    activityStatuses,
    activityNotes,
    lastActiveTimestamp: new Date().toISOString()
  };

  const readiness = computeAutopilotReadiness(updatedProgress);
  updatedProgress.readinessScore = readiness.readinessScore;

  const isAllResolved = ACTIONABLE_ACTIVITIES.every(a => {
    const st = activityStatuses[a.code];
    if (st === 'COMPLETED') return true;
    if (st === 'NEEDS_REVIEW') {
      const disp = updatedProgress.dispositions?.[a.code];
      if (typeof disp === 'boolean') return disp;
      return Boolean(disp?.acknowledged);
    }
    return false;
  });

  const isDirectFinalization = targetCode === '10' && newStatus === 'COMPLETED';

  const isAllComplete = isDirectFinalization || (
    isAllResolved &&
    activityStatuses['07'] === 'COMPLETED' &&
    activityStatuses['08'] === 'COMPLETED' &&
    activityStatuses['09'] === 'COMPLETED' &&
    activityStatuses['10'] === 'COMPLETED'
  );

  return {
    ...cleanSession,
    lastUpdated: new Date().toISOString(),
    completionStatus: isAllComplete ? 'COMPLETED' : 'IN_PROGRESS',
    autopilotProgress: updatedProgress
  };
}

export function flagDownstreamNeedsReview(
  session: MHCSession,
  editedCode: string
): MHCSession {
  if (!session || typeof session !== 'object') {
    return session;
  }
  const {
    _reactName,
    nativeEvent,
    target,
    currentTarget,
    view,
    ...cleanSession
  } = session as any;

  const currentProgress = cleanSession.autopilotProgress || createDefaultAutopilotProgress();
  const activityStatuses = { ...currentProgress.activityStatuses };

  const editIndex = ACTIONABLE_ACTIVITIES.findIndex(a => a.code === editedCode);
  if (editIndex >= 0) {
    // Flag completed downstream activities in the same phase/day as NEEDS_REVIEW
    ACTIONABLE_ACTIVITIES.forEach((act, idx) => {
      if (idx > editIndex && activityStatuses[act.code] === 'COMPLETED' && act.day === currentProgress.currentDay) {
        activityStatuses[act.code] = 'NEEDS_REVIEW';
      }
    });
  }

  const updatedProgress: MHCAutopilotSessionProgress = {
    ...currentProgress,
    activityStatuses,
    lastActiveTimestamp: new Date().toISOString()
  };

  const readiness = computeAutopilotReadiness(updatedProgress);
  updatedProgress.readinessScore = readiness.readinessScore;

  return {
    ...cleanSession,
    lastUpdated: new Date().toISOString(),
    autopilotProgress: updatedProgress
  };
}

/**
 * Safely extracts the most recent numerical timestamp for an MHC session.
 */
export function getMhcSessionTimestamp(session?: MHCSession | null): number {
  if (!session || typeof session !== 'object') return 0;
  if (session.autopilotProgress?.lastActiveTimestamp) {
    const t = new Date(session.autopilotProgress.lastActiveTimestamp).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (session.lastUpdated) {
    const t = new Date(session.lastUpdated).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (session.startDate) {
    const dateTimeStr = session.startTime ? `${session.startDate}T${session.startTime}` : session.startDate;
    const t = new Date(dateTimeStr).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (typeof session.id === 'string') {
    const match = session.id.match(/(\d{10,})/);
    if (match) {
      const t = parseInt(match[1], 10);
      if (!isNaN(t) && t > 0) return t;
    }
  }
  return 0;
}

export interface ResumableMhcSessionResult {
  session: MHCSession;
  machine: Machine;
}

/**
 * Finds the latest valid, incomplete, and resumable MHC session across all recorded sessions.
 * Strictly verifies that the session corresponds to an existing registered machine.
 */
export function findLatestResumableMhcSession(
  sessions: MHCSession[],
  machines: Machine[]
): ResumableMhcSessionResult | null {
  if (!Array.isArray(sessions) || !Array.isArray(machines) || sessions.length === 0 || machines.length === 0) {
    return null;
  }

  const validResumables: { session: MHCSession; machine: Machine; timestamp: number }[] = [];

  for (const s of sessions) {
    if (!s || typeof s !== 'object' || !s.id || typeof s.id !== 'string') continue;
    // Exclude completed sessions
    if (s.completionStatus === 'COMPLETED') continue;

    // Must match an existing machine in the fleet
    const matchedMachine = machines.find(
      m => m && (m.id === s.machineId || (Boolean(s.machineSerialNumber) && m.serialNumber === s.machineSerialNumber))
    );
    if (!matchedMachine) continue;

    const timestamp = getMhcSessionTimestamp(s);
    validResumables.push({ session: s, machine: matchedMachine, timestamp });
  }

  if (validResumables.length === 0) return null;

  validResumables.sort((a, b) => b.timestamp - a.timestamp);
  return {
    session: validResumables[0].session,
    machine: validResumables[0].machine
  };
}
