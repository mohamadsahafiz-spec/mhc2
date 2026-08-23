import { describe, it, expect } from 'vitest';
import { buildMhcReportDocument } from './mhcReportEngine';
import { MHCSession } from '../types';

describe('mhcReportEngine', () => {
  const createDummySession = (id: string): MHCSession => ({
    id,
    machineId: 'ESI-5330',
    machineModel: 'ESI 5330 Flex',
    machineSerialNumber: 'SN-98765',
    machineName: 'Flex Drill 1',
    customerId: 'CUST-001',
    customerName: 'Acme PCB Corp',
    plantName: 'Plant 2 - Penang',
    engineerName: 'Jane Doe',
    startDate: '2026-08-10',
    startTime: '09:00',
    lastUpdated: '2026-08-10T12:00:00Z',
    completionStatus: 'COMPLETED',
    currentSection: 1,
    sectionStatuses: {},
    stage01_laserHours: [
      {
        laserId: 'lh1',
        laserIdentifier: 'Laser Head 1',
        recordedLaserHour: 12500,
        readingDate: '2026-08-10',
        readingTime: '09:15',
        calculatedCurrentHour: 12500,
        warningThreshold: 18000,
        criticalThreshold: 20000,
        runtimeStatus: 'NORMAL',
        isVerified: true,
        verifiedHour: 12500
      },
      {
        laserId: 'lh2',
        laserIdentifier: 'Laser Head 2',
        recordedLaserHour: 11200,
        readingDate: '2026-08-10',
        readingTime: '09:15',
        calculatedCurrentHour: 11200,
        warningThreshold: 18000,
        criticalThreshold: 20000,
        runtimeStatus: 'NORMAL',
        isVerified: true,
        verifiedHour: 11200
      }
    ],
    stage02_laserProfile: {
      laserId: 'lh1',
      productName: 'Flex Rigid Standard',
      recipeProgram: 'REC-01',
      profileInfo: 'Standard TopHat profile',
      measurementInfo: 'Station 1',
      supportingEvidence: 'Profile OK',
      images: [],
      beamProfileRecord: {
        id: 'BPR-1',
        date: '2026-08-10',
        overallResult: 'PASS',
        readings: {
          '6A': { checkpointId: '6A', measuredDiameterMm: 3.52, pass: true },
          '7A': { checkpointId: '7A', measuredDiameterMm: 3.48, pass: true }
        } as any
      }
    },
    stage03_laserPower: [
      {
        laserId: 'lh1',
        laserIdentifier: 'Laser Head 1',
        ratedPowerWatts: 15.0,
        referenceValueWatts: 15.0,
        beforeValueWatts: 14.8,
        afterValueWatts: 15.1,
        stabilityPercent: 0.8,
        result: 'PASS',
        notes: 'Head 1 Power stable',
        evidenceImages: ['data:image/png;base64,sample1']
      },
      {
        laserId: 'lh2',
        laserIdentifier: 'Laser Head 2',
        ratedPowerWatts: 15.0,
        referenceValueWatts: 15.0,
        beforeValueWatts: 14.6,
        afterValueWatts: 14.9,
        stabilityPercent: 0.9,
        result: 'PASS',
        notes: 'Head 2 Power stable',
        evidenceImages: ['data:image/png;base64,sample2']
      }
    ],
    stage04_opticsBeam: {
      cleanlinessScore: 95,
      beamWaistMm: 2.0,
      focusOffsetMm: 0,
      symmetryRatio: 0.98,
      m2Value: 1.1,
      beforeCondition: 'Clean',
      afterCondition: 'Clean',
      inspectionResult: 'PASS',
      images: [],
      notes: 'Optics pristine'
    },
    stage05_cooling: {
      chillerTempCelsius: 20.1,
      chillerFlowLpm: 4.2,
      diConductivityUs: 0.8,
      coolingCondition: 'Normal',
      thermalCondition: 'Stable',
      beforeCondition: 'OK',
      afterCondition: 'OK',
      result: 'PASS',
      notes: 'Cooling optimal'
    },
    stage06_productQuality: {
      sampleId: 'SMP-100',
      viaDiameterUm: 50,
      viaShape: 'Circular',
      viaOffsetUm: 0.5,
      padQuality: 'Clean',
      visualVerification: 'Verified',
      beforeInspectionNotes: '',
      afterInspectionNotes: '',
      beforeImages: [],
      afterImages: [],
      result: 'PASS',
      notes: 'Quality pass'
    },
    stage07_spareParts: [
      {
        id: 'SP-1',
        partName: 'Air Filter Element',
        partNumber: 'ESI-FLT-01',
        category: 'Filters',
        quantity: 1,
        reason: 'Routine annual replacement',
        action: 'REPLACED',
        costIndicator: 'CUSTOMER_COST',
        notes: 'Replaced during PM'
      }
    ],
    stage08_engineerRemarks: {
      generalFindings: 'System in excellent operating condition.',
      observedIssues: 'None',
      correctiveActions: 'Replaced air filter',
      recommendations: 'Continue quarterly PM schedule',
      followUpRequired: false,
      productionReleaseVerdict: 'APPROVED'
    },
    stageCalibrationData: {
      stage1: {
        stageId: 'stage1',
        stageName: 'Stage 1',
        xMinUm: -0.8,
        xMaxUm: 0.9,
        yMinUm: -1.0,
        yMaxUm: 1.1,
        maxAbsXUm: 0.9,
        maxAbsYUm: 1.1,
        overallMaxDevUm: 1.1,
        specToleranceUm: 2.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      },
      stage2: {
        stageId: 'stage2',
        stageName: 'Stage 2',
        xMinUm: -0.5,
        xMaxUm: 0.6,
        yMinUm: -0.7,
        yMaxUm: 0.8,
        maxAbsXUm: 0.6,
        maxAbsYUm: 0.8,
        overallMaxDevUm: 0.8,
        specToleranceUm: 2.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      }
    },
    agcData: {
      agc1: {
        agcId: 'agc1',
        agcName: 'AGC 1',
        indices: [],
        overallMaxDevUm: 1.2,
        specToleranceUm: 3.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      },
      agc2: {
        agcId: 'agc2',
        agcName: 'AGC 2',
        indices: [],
        overallMaxDevUm: 1.4,
        specToleranceUm: 3.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      }
    },
    temperatureEvidenceData: {
      hasValidTemperatureAnalysis: true,
      temperatureRecordTitle: 'Thermal Run 1',
      stats: { min: 19.8, max: 20.4, avg: 20.1, range: 0.6, points: 60 },
      evidences: [
        {
          id: 'EV-1',
          category: 'temperature_result',
          title: 'Thermal Chart',
          imageDataUrl: 'data:image/png;base64,chart',
          createdAt: '2026-08-10T10:00:00Z'
        }
      ]
    }
  });

  it('should transform an MHCSession into a normalized MhcReportDocument without mutation', () => {
    const session = createDummySession('SESS-1001');
    const sessionCopy = JSON.parse(JSON.stringify(session));

    const doc = buildMhcReportDocument(session);

    // Verify immutability
    expect(session).toEqual(sessionCopy);

    // Verify basic structure
    expect(doc.schemaVersion).toBe('1.0.0');
    expect(doc.sessionId).toBe('SESS-1001');
    expect(doc.machineId).toBe('ESI-5330');
    expect(doc.orderedSections.length).toBe(19);
    expect(doc.indexEntries.length).toBe(18); // Index excludes cover or includes entries

    // Verify cover
    expect(doc.sections['01'].data.customerName).toBe('Acme PCB Corp');
    expect(doc.sections['01'].data.machineSerialNumber).toBe('SN-98765');

    // Verify Laser Power without baseline
    const powerSec = doc.sections['06'].data;
    expect(powerSec.hasPreviousBaseline).toBe(false);
    expect(powerSec.heads[0].comparison.statusText).toBe('No previous baseline');
    expect(powerSec.heads[0].current.measuredWatts).toBe(15.1);

    // Verify Laser Hours
    const hoursSec = doc.sections['05'].data;
    expect(hoursSec.laserHours.length).toBe(2);
    expect(hoursSec.laserHours[0].verifiedHour).toBe(12500);

    // Verify restored sections 08 & 09 and optional placeholder sections are represented safely
    expect(doc.sections['08'].status).toBe('COMPLETE');
    expect(doc.sections['09'].status).toBe('COMPLETE');
    expect(doc.sections['13'].status).toBe('NOT_COLLECTED');
    expect(doc.sections['14'].status).toBe('NOT_COLLECTED');
  });

  it('should calculate previous/current comparison correctly when previousSession exists', () => {
    const currentSession = createDummySession('SESS-CURR');
    const previousSession = createDummySession('SESS-PREV');

    // Modify previous power and beam
    previousSession.stage03_laserPower[0].afterValueWatts = 15.5; // Head 1 previously 15.5 W, now 15.1 W -> -0.4W (-2.6%)
    previousSession.stage03_laserPower[1].afterValueWatts = 15.0; // Head 2 previously 15.0 W, now 14.9 W -> -0.1W (-0.7%)

    previousSession.stage02_laserProfile.beamProfileRecord!.readings['6A'].measuredDiameterMm = 3.60; // Head 1 previously 3.60mm, now 3.52mm -> -0.080mm (-2.2%)

    const doc = buildMhcReportDocument(currentSession, previousSession);

    // Check power comparison
    const powerHead1 = doc.sections['06'].data.heads[0];
    expect(powerHead1.hasPreviousBaseline).toBe(true);
    expect(powerHead1.comparison.deltaWatts).toBeCloseTo(-0.4, 2);
    expect(powerHead1.comparison.statusText).toContain('-0.40 W');

    // Check beam comparison
    const beamHead1 = doc.sections['07'].data.heads[0];
    expect(beamHead1.hasPreviousBaseline).toBe(true);
    expect(beamHead1.comparison.deltaBeamSizeMm).toBeCloseTo(-0.08, 3);
    expect(beamHead1.comparison.statusText).toContain('-0.080 mm');
  });

  it('should correctly calculate partial Stage and AGC status when only 1 item is completed', () => {
    const session = createDummySession('SESS-PARTIAL');
    // Set only stage 1 (stage 2 undefined)
    session.stageCalibrationData = {
      stage1: {
        stageId: 'stage1',
        stageName: 'Stage 1',
        xMinUm: 0.2,
        xMaxUm: 0.5,
        yMinUm: -0.8,
        yMaxUm: 0.4,
        maxAbsXUm: 0.5,
        maxAbsYUm: 0.8,
        overallMaxDevUm: 0.8,
        specToleranceUm: 2.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      }
    };

    // Set only agc 1 (agc 2 undefined)
    session.agcData = {
      agc1: {
        agcId: 'agc1',
        agcName: 'AGC 1',
        indices: [
          { indexNum: 1, xUm: 1.1, yUm: -1.2, specToleranceUm: 3.0, verdict: 'PASS' }
        ],
        xMinUm: 1.1,
        xMaxUm: 1.1,
        yMinUm: -1.2,
        yMaxUm: -1.2,
        maxAbsXUm: 1.1,
        maxAbsYUm: 1.2,
        overallMaxDevUm: 1.2,
        specToleranceUm: 3.0,
        verdict: 'PASS',
        status: 'COMPLETED',
        scannerConditionFlag: false
      }
    };

    const doc = buildMhcReportDocument(session);

    // Section 10 Stage Calibration
    expect(doc.sections['10'].status).toBe('COMPLETE');
    expect(doc.sections['10'].data.overallVerdict).toBe('PASS');
    expect(doc.sections['10'].data.stages[0].verdict).toBe('PASS');
    expect(doc.sections['10'].data.stages[1].verdict).toBe('UNANSWERED');

    // Section 11 AGC Calibration
    expect(doc.sections['11'].status).toBe('COMPLETE');
    expect(doc.sections['11'].data.overallVerdict).toBe('PASS');
    expect(doc.sections['11'].data.agcs[0].verdict).toBe('PASS');
    expect(doc.sections['11'].data.agcs[1].verdict).toBe('UNANSWERED');

    // Evidence aggregation should contain stage03 power images + temp evidence
    expect(doc.sections['18'].data.totalEvidenceItems).toBeGreaterThanOrEqual(2);
    expect(doc.sections['18'].status).toBe('COMPLETE');
  });

  it('should not inject ghost machine or thermal fallbacks when session data is missing', () => {
    const minimalSession = {
      id: 'SESS-MINIMAL',
      machineId: 'M-101',
      machineModel: 'ESI Model X',
      machineSerialNumber: 'SN-001',
      machineName: 'Minimal Machine',
      customerId: 'CUST-001',
      customerName: 'Customer',
      plantName: 'Plant',
      engineerName: 'Engineer',
      startDate: '2026-08-15',
      startTime: '09:00',
      lastUpdated: '2026-08-15T09:00:00Z',
      completionStatus: 'IN_PROGRESS',
      currentSection: 1,
      sectionStatuses: {}
    } as unknown as MHCSession;

    const doc = buildMhcReportDocument(minimalSession);

    // Cover page should not contain WD-44367 or WLVIA#3
    expect(doc.sections['01'].data.machineNumber).toBeUndefined();
    expect(doc.sections['03'].data.machineNumber).toBeUndefined();

    // Section 12 Thermal telemetry should not have fabricated 21.5 or 4.8 values
    expect(doc.sections['12'].data.chillerTempCelsius).toBeUndefined();
    expect(doc.sections['12'].data.chillerFlowLpm).toBeUndefined();
    expect(doc.sections['12'].data.coolingResult).toBe('NOT_COLLECTED');
    expect(doc.sections['12'].data.hasValidTemperatureAnalysis).toBe(false);

    // Section 05 Laser hours should not have fabricated laser heads
    expect(doc.sections['05'].data.laserHours.length).toBe(0);
    expect(doc.sections['05'].status).toBe('NOT_COLLECTED');
  });

  it('should preserve complete Laser Power breakdown (masks, source, optics) from powerRecord', () => {
    const session = createDummySession('SESS-POWER-RECORD');
    session.stage03_laserPower = [
      {
        laserId: 'lh1',
        laserIdentifier: 'Laser Head 1',
        ratedPowerWatts: 15.0,
        referenceValueWatts: 15.0,
        beforeValueWatts: 14.5,
        afterValueWatts: 14.8,
        stabilityPercent: 0.5,
        result: 'PASS',
        notes: 'Head 1 Power stable with complete masks',
        evidenceImages: ['data:image/png;base64,sample1'],
        powerRecord: {
          id: 'PR-1',
          date: '2026-08-10',
          frequencyKhz: 50,
          laserSource: { headA: 15.2, headB: null, minWatts: 14.0, maxWatts: 16.0, specText: '15.0W ±1.0W', passA: true, passB: false },
          opticsTopHat: { headA: 14.8, headB: null, minWatts: 13.5, maxWatts: 15.5, specText: '14.5W ±1.0W', passA: true, passB: false },
          workingZoneMasks: [
            { maskSize: '2.2mm', minWatts: 13.5, headA: 14.2, headB: null, passA: true, passB: false, specText: '>13.5W' },
            { maskSize: '2.0mm', minWatts: 13.0, headA: 13.8, headB: null, passA: true, passB: false, specText: '>13.0W' },
            { maskSize: '1.8mm', minWatts: 12.5, headA: 13.2, headB: null, passA: true, passB: false, specText: '>12.5W' },
            { maskSize: '1.3mm', minWatts: 12.0, headA: 12.6, headB: null, passA: true, passB: false, specText: '>12.0W' },
            { maskSize: '1.1mm', minWatts: 11.5, headA: 12.0, headB: null, passA: true, passB: false, specText: '>11.5W' },
            { maskSize: '0.9mm', minWatts: 11.0, headA: 11.4, headB: null, passA: true, passB: false, specText: '>11.0W' }
          ],
          overallResult: 'PASS'
        }
      }
    ];

    const doc = buildMhcReportDocument(session);
    const head1Power = doc.sections['06'].data.heads[0];

    expect(head1Power.current.laserSourceWatts).toBe(15.2);
    expect(head1Power.current.opticsTopHatWatts).toBe(14.8);
    expect(head1Power.current.maskReadings).toBeDefined();
    expect(head1Power.current.maskReadings?.length).toBe(6);
    expect(head1Power.current.maskReadings?.[0].maskSize).toBe('2.2mm');
    expect(head1Power.current.maskReadings?.[0].measuredWatts).toBe(14.2);
    expect(head1Power.current.maskReadings?.[0].pass).toBe(true);
  });

  it('should reflect truth in Executive Summary when Stage or AGC has OUT_OF_SPEC results', () => {
    const session = createDummySession('SESS-OUT-OF-SPEC');
    session.stageCalibrationData = {
      stage1: {
        stageId: 'stage1',
        stageName: 'Stage 1',
        xMinUm: -2.5,
        xMaxUm: 2.8,
        yMinUm: -1.0,
        yMaxUm: 1.1,
        maxAbsXUm: 2.8,
        maxAbsYUm: 1.1,
        overallMaxDevUm: 2.8,
        specToleranceUm: 2.0,
        verdict: 'OUT_OF_SPEC',
        status: 'COMPLETED'
      }
    };

    const doc = buildMhcReportDocument(session);

    // Section 10 verdict
    expect(doc.sections['10'].data.overallVerdict).toBe('OUT_OF_SPEC');
    expect(doc.sections['10'].status).toBe('NEEDS_REVIEW');

    // Executive summary must NOT show unconditioned pure PASS
    expect(doc.sections['04'].data.overallStatus).not.toBe('PASS');
    expect(['CONDITIONAL_PASS', 'ACTION_REQUIRED', 'FAIL']).toContain(doc.sections['04'].data.overallStatus);

    // Major results table must accurately list Stage as FAIL
    const stageResult = doc.sections['04'].data.majorPassFailResults.find(r => r.component === 'Stage Calibration');
    expect(stageResult?.verdict).toBe('FAIL');
  });

  it('should correctly preserve department, production line and separate evidence and spare parts', () => {
    const session = createDummySession('SESS-DEPT-PARTS');
    (session as any).department = 'Microvia Drilling Dept';
    (session as any).productionLine = 'Line 04 - High Density';

    session.inspectionFindings = {
      lh1: {
        headId: 'lh1',
        headName: 'Laser Head 1',
        status: 'COMPLETED',
        decision: 'ISSUE_FOUND',
        findings: [
          {
            id: 'F-1',
            headId: 'lh1',
            headName: 'Laser Head 1',
            component: 'Turning Mirror 2',
            conditions: ['Coating degradation observed'],
            actionRecommendation: 'Order replacement spare mirror for next PM',
            engineerNote: 'Reflectivity degraded ~3%',
            createdAt: '2026-08-10T10:00:00Z'
          }
        ]
      }
    };

    const doc = buildMhcReportDocument(session);

    // Machine info
    expect(doc.sections['03'].data.department).toBe('Microvia Drilling Dept');
    expect(doc.sections['03'].data.productionLine).toBe('Line 04 - High Density');

    // Spare parts separation
    expect(doc.sections['17'].data.consumedParts.length).toBe(1);
    expect(doc.sections['17'].data.consumedParts[0].partName).toBe('Air Filter Element');
    expect(doc.sections['17'].data.recommendedParts.length).toBe(1);
    expect(doc.sections['17'].data.recommendedParts[0].partName).toContain('Turning Mirror 2');

    // Evidence separation
    expect(doc.sections['18'].data.calibrationEvidence.length).toBeGreaterThan(0);
  });
});
