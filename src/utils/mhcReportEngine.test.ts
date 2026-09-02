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
        xMinUm: -1.0,
        xMaxUm: 1.1,
        yMinUm: -0.9,
        yMaxUm: 1.2,
        maxAbsXUm: 1.1,
        maxAbsYUm: 1.2,
        overallMaxDevUm: 1.2,
        specToleranceUm: 3.0,
        verdict: 'PASS',
        status: 'COMPLETED'
      },
      agc2: {
        agcId: 'agc2',
        agcName: 'AGC 2',
        indices: [],
        xMinUm: -1.2,
        xMaxUm: 1.3,
        yMinUm: -1.4,
        yMaxUm: 1.1,
        maxAbsXUm: 1.3,
        maxAbsYUm: 1.4,
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
    expect(doc.orderedSections.length).toBe(15); // 15 active rendered sections (§01-§02, §04-§13, §15, §17-§18)
    expect(doc.indexEntries.length).toBe(14); // Index entries (§01, §04-§13, §15, §17-§18)

    // Verify cover
    expect(doc.sections['01'].data.customerName).toBe('Acme PCB Corp');
    expect(doc.sections['01'].data.machineSerialNumber).toBe('SN-98765');

    // Verify Laser Power without baseline (Section 05)
    const powerSec = doc.sections['05'].data;
    expect(powerSec.hasPreviousBaseline).toBe(false);
    expect(powerSec.heads[0].comparison.statusText).toBe('No previous baseline');
    expect(powerSec.heads[0].current.measuredWatts).toBe(15.1);

    // Verify Laser Hours (Section 04)
    const hoursSec = doc.sections['04'].data;
    expect(hoursSec.laserHours.length).toBe(2);
    expect(hoursSec.laserHours[0].currentLaserHour).toBe(12500);

    // Verify sections 07 & 08, 12 populated and evaluated
    expect(doc.sections['07'].status).toBe('NOT_COLLECTED');
    expect(doc.sections['08'].status).toBe('COMPLETE');
    expect(doc.sections['12'].status).toBe('COMPLETE');
    expect(doc.sections['12'].data.productName).toBe('Flex Rigid Standard');
    expect(doc.sections['12'].data.recipeProgram).toBe('REC-01');
  });

  it('should calculate previous/current comparison correctly when previousSession exists', () => {
    const currentSession = createDummySession('SESS-CURR');
    const previousSession = createDummySession('SESS-PREV');

    // Modify previous power and beam
    previousSession.stage03_laserPower[0].afterValueWatts = 15.5; // Head 1 previously 15.5 W, now 15.1 W -> -0.4W (-2.6%)
    previousSession.stage03_laserPower[1].afterValueWatts = 15.0; // Head 2 previously 15.0 W, now 14.9 W -> -0.1W (-0.7%)

    // Add previous working zone masks to verify mask comparison columns
    previousSession.stage03_laserPower[0].powerRecord = {
      ...currentSession.stage03_laserPower[0].powerRecord!,
      laserSource: { specText: '≥18.0W', minWatts: 18.0, maxWatts: 22.0, headA: 18.2, headB: 18.0, passA: true, passB: true },
      opticsTopHat: { specText: '≥15.0W', minWatts: 15.0, maxWatts: 18.0, headA: 15.4, headB: 15.2, passA: true, passB: true },
      workingZoneMasks: [
        { maskSize: '2.2mm', specText: '≥3.1W', minWatts: 3.1, headA: 3.5, headB: 3.4, passA: true, passB: true },
        { maskSize: '2.0mm', specText: '≥2.5W', minWatts: 2.5, headA: 2.8, headB: 2.7, passA: true, passB: true }
      ]
    };
    currentSession.stage03_laserPower[0].powerRecord = {
      ...currentSession.stage03_laserPower[0].powerRecord!,
      laserSource: { specText: '≥18.0W', minWatts: 18.0, maxWatts: 22.0, headA: 18.5, headB: 18.1, passA: true, passB: true },
      opticsTopHat: { specText: '≥15.0W', minWatts: 15.0, maxWatts: 18.0, headA: 15.1, headB: 14.9, passA: true, passB: true },
      workingZoneMasks: [
        { maskSize: '2.2mm', specText: '≥3.1W', minWatts: 3.1, headA: 3.4, headB: 3.3, passA: true, passB: true },
        { maskSize: '2.0mm', specText: '≥2.5W', minWatts: 2.5, headA: 2.7, headB: 2.6, passA: true, passB: true }
      ]
    };

    previousSession.stage02_laserProfile.beamProfileRecord!.readings['6A'].measuredDiameterMm = 3.60; // Head 1 previously 3.60mm, now 3.52mm -> -0.080mm (-2.2%)

    const doc = buildMhcReportDocument(currentSession, previousSession);

    // Check power comparison (Section 05)
    const powerHead1 = doc.sections['05'].data.heads[0];
    expect(powerHead1.hasPreviousBaseline).toBe(true);
    expect(powerHead1.comparison.deltaWatts).toBeCloseTo(-0.4, 2);
    expect(powerHead1.comparison.statusText).toContain('-0.40 W');

    // Check mask readings comparison
    expect(powerHead1.current.maskReadings).toBeDefined();
    const mask50 = powerHead1.current.maskReadings?.find(m => m.maskSize === '2.2mm');
    expect(mask50?.prevMeasuredWatts).toBe(3.5);
    expect(mask50?.measuredWatts).toBe(3.4);
    expect(mask50?.deltaWatts).toBeCloseTo(-0.1, 2);
    expect(mask50?.pass).toBe(true);

    // Check beam comparison (Section 06)
    const beamHead1 = doc.sections['06'].data.heads[0];
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

    // Section 09 Stage Calibration
    expect(doc.sections['09'].status).toBe('COMPLETE');
    expect(doc.sections['09'].data.overallVerdict).toBe('PASS');
    expect(doc.sections['09'].data.stages[0].verdict).toBe('PASS');
    expect(doc.sections['09'].data.stages[1].verdict).toBe('UNANSWERED');

    // Section 10 AGC Calibration
    expect(doc.sections['10'].status).toBe('COMPLETE');
    expect(doc.sections['10'].data.overallVerdict).toBe('PASS');
    expect(doc.sections['10'].data.agcs[0].verdict).toBe('PASS');
    expect(doc.sections['10'].data.agcs[1].verdict).toBe('UNANSWERED');

    // Section 15 Buyoff & Approvals
    expect(doc.sections['15'].code).toBe('15');
    expect(doc.sections['15'].title).toBe('Buyoff & Approvals');
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

    // Section 11 Thermal telemetry should not have fabricated 21.5 or 4.8 values
    expect(doc.sections['11'].data.chillerTempCelsius).toBeUndefined();
    expect(doc.sections['11'].data.chillerFlowLpm).toBeUndefined();
    expect(doc.sections['11'].data.coolingResult).toBe('NOT_COLLECTED');
    expect(doc.sections['11'].data.hasValidTemperatureAnalysis).toBe(false);

    // Section 04 Laser hours should not have fabricated laser heads
    expect(doc.sections['04'].data.laserHours.length).toBe(0);
    expect(doc.sections['04'].status).toBe('NOT_COLLECTED');
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
    const head1Power = doc.sections['05'].data.heads[0];

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

    // Section 09 verdict
    expect(doc.sections['09'].data.overallVerdict).toBe('OUT_OF_SPEC');
    expect(doc.sections['09'].status).toBe('NEEDS_REVIEW');

    // Executive summary must NOT show unconditioned pure PASS
    expect(doc.sections['03'].data.overallStatus).not.toBe('PASS');
    expect(['CONDITIONAL_PASS', 'ACTION_REQUIRED', 'FAIL']).toContain(doc.sections['03'].data.overallStatus);

    // Major results table must accurately list Stage as FAIL
    const stageResult = doc.sections['03'].data.majorPassFailResults.find(r => r.component === 'Stage Calibration');
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

    session.stage07_spareParts = [
      {
        id: 'SP-01',
        partName: 'Air Filter Element',
        partNumber: 'AF-900',
        category: 'CONSUMABLES',
        quantity: 1,
        reason: 'Periodic Maintenance replacement',
        action: 'REPLACED',
        costIndicator: 'CUSTOMER_COST',
        notes: 'Routine service'
      },
      {
        id: 'SP-02',
        partName: 'Galvo Mirror Set',
        partNumber: 'GM-200',
        category: 'OPTICS',
        quantity: 2,
        reason: 'Recommended for next PM cycle',
        action: 'RECOMMENDED',
        costIndicator: 'CUSTOMER_COST',
        notes: 'Lead time 4 weeks'
      }
    ];

    const doc = buildMhcReportDocument(session);

    // Spare parts separation - only explicit recorded data, no regex/keyword inference
    expect(doc.sections['14'].data.consumedParts.length).toBe(1);
    expect(doc.sections['14'].data.consumedParts[0].partName).toBe('Air Filter Element');
    expect(doc.sections['14'].data.recommendedParts.length).toBe(1);
    expect(doc.sections['14'].data.recommendedParts[0].partName).toBe('Galvo Mirror Set');

    // Buyoff section verification (§15)
    expect(doc.sections['15'].code).toBe('15');
    expect(doc.sections['15'].title).toBe('Buyoff & Approvals');
    expect(doc.sections['15'].data.engineerSignoff.name).toBe('Jane Doe');

    // §07 Focus Optimization data grounding
    expect(doc.sections['07'].code).toBe('07');
    expect(doc.sections['07'].data.heads.length).toBe(2);
    expect(doc.sections['07'].data.heads[0].laserLabel).toBe('Laser Head 1');
    expect(doc.sections['07'].data.heads[0].baseline).toBe('-0.300 mm');
    expect(doc.sections['07'].data.heads[0].positions.length).toBe(7);
    expect(doc.sections['07'].data.heads[0].positions[0].positionMm).toBe('+0.300 mm');
    expect(doc.sections['07'].data.heads[0].positions[3].positionMm).toBe('0.000 mm');
    expect(doc.sections['07'].data.heads[0].positions[6].positionMm).toBe('-0.300 mm');
    expect(doc.sections['07'].data.heads[0].positions[6].isBaseline).toBe(true);
    expect(doc.sections['07'].data.topViaImpactNote).toContain('Top via impact: Focus adjustment primarily affects top diameter (~90%)');

    // §09 Stage Calibration data grounding
    expect(doc.sections['09'].code).toBe('09');
    expect(doc.sections['09'].data.specToleranceUm).toBe(2.0);
    expect(doc.sections['09'].data.overallVerdict).toBe('PASS');
    expect(doc.sections['09'].data.stages.length).toBe(2);
    expect(doc.sections['09'].data.stages[0].stageName).toBe('Stage 1');
    expect(doc.sections['09'].data.stages[0].xMinUm).toBe(-0.8);
    expect(doc.sections['09'].data.stages[0].xMaxUm).toBe(0.9);
    expect(doc.sections['09'].data.stages[0].yMinUm).toBe(-1.0);
    expect(doc.sections['09'].data.stages[0].yMaxUm).toBe(1.1);
    expect(doc.sections['09'].data.stages[0].maxAbsXUm).toBe(0.9);
    expect(doc.sections['09'].data.stages[0].maxAbsYUm).toBe(1.1);
    expect(doc.sections['09'].data.stages[0].overallMaxDevUm).toBe(1.1);
    expect(doc.sections['09'].data.stages[0].verdict).toBe('PASS');

    // §10 AGC / Scanner Calibration data grounding
    expect(doc.sections['10'].code).toBe('10');
    expect(doc.sections['10'].data.specToleranceUm).toBe(3.0);
    expect(doc.sections['10'].data.overallVerdict).toBe('PASS');
    expect(doc.sections['10'].data.agcs.length).toBe(2);
    expect(doc.sections['10'].data.agcs[0].agcName).toBe('AGC 1');
    expect(doc.sections['10'].data.agcs[0].xMinUm).toBe(-1.0);
    expect(doc.sections['10'].data.agcs[0].xMaxUm).toBe(1.1);
    expect(doc.sections['10'].data.agcs[0].yMinUm).toBe(-0.9);
    expect(doc.sections['10'].data.agcs[0].yMaxUm).toBe(1.2);
    expect(doc.sections['10'].data.agcs[0].maxAbsXUm).toBe(1.1);
    expect(doc.sections['10'].data.agcs[0].maxAbsYUm).toBe(1.2);
    expect(doc.sections['10'].data.agcs[0].overallMaxDevUm).toBe(1.2);
    expect(doc.sections['10'].data.agcs[0].verdict).toBe('PASS');
    expect(doc.sections['10'].data.agcs[1].agcName).toBe('AGC 2');
    expect(doc.sections['10'].data.agcs[1].overallMaxDevUm).toBe(1.4);
    expect(doc.sections['10'].data.agcs[1].verdict).toBe('PASS');
  });

  it('should enforce continuous active numbering §01 to §15', () => {
    const session = createDummySession('SESS-SECTION-FLOW');
    const doc = buildMhcReportDocument(session);

    // Continuous orderedSections 01 to 15
    const orderedCodes = doc.orderedSections.map(s => s.code);
    expect(orderedCodes).toEqual([
      '01', '02', '03', '04', '05', '06', '07', '08', '09',
      '10', '11', '12', '13', '14', '15'
    ]);

    // Exactly 15 active rendered sections total
    expect(doc.orderedSections.length).toBe(15);
    expect(doc.metadata.totalSectionsCount).toBe(15);

    // Index entries must be active rendered sections
    const indexCodes = doc.indexEntries.map(e => e.code);
    expect(indexCodes).toEqual([
      '01', '03', '04', '05', '06', '07', '08', '09',
      '10', '11', '12', '13', '14', '15'
    ]);

    const entry14 = doc.indexEntries.find(e => e.code === '14');
    const entry15 = doc.indexEntries.find(e => e.code === '15');
    expect(entry14?.title).toBe('Spare Parts / Recommendations');
    expect(entry14?.pageNumber).toBe(10);
    expect(entry15?.title).toBe('Buyoff & Approvals');
    expect(entry15?.pageNumber).toBe(10);
    expect(entry15?.category).toBe('Signoff');

    // Position of 14 immediately followed by 15 in indexEntries
    const idx14 = indexCodes.indexOf('14');
    const idx15 = indexCodes.indexOf('15');
    expect(idx15).toBe(idx14 + 1);
  });

  it('should maintain exact physical PDF pagination and TOC mappings for all active sections', () => {
    const session = createDummySession('SESS-PAGINATION-VERIFY');
    const doc = buildMhcReportDocument(session);

    // Total page count
    expect(doc.metadata.totalPagesCount).toBe(10);

    // Expected exact page numbers for each active section
    const expectedPageMap: Record<string, number> = {
      '01': 1,
      '03': 3,
      '04': 3,
      '05': 4,
      '06': 5,
      '07': 6,
      '08': 6,
      '09': 7,
      '10': 7,
      '11': 8,
      '12': 9,
      '13': 10,
      '14': 10,
      '15': 10
    };

    // Check each index entry
    doc.indexEntries.forEach(entry => {
      expect(entry.pageNumber).toBe(expectedPageMap[entry.code]);
    });

    // Verify all pages from 1 to 10 are covered by the physical document flow
    const referencedPages = new Set(doc.indexEntries.map(e => e.pageNumber));
    expect(referencedPages.has(1)).toBe(true); // §01 Cover
    expect(referencedPages.has(3)).toBe(true); // §03, §04 Exec Summary & Lifecycle
    expect(referencedPages.has(4)).toBe(true); // §05 Power
    expect(referencedPages.has(5)).toBe(true); // §06 Beam Profile
    expect(referencedPages.has(6)).toBe(true); // §07, §08 Focus & Offset
    expect(referencedPages.has(7)).toBe(true); // §09, §10 Stage & AGC
    expect(referencedPages.has(8)).toBe(true); // §11 Temperature
    expect(referencedPages.has(9)).toBe(true); // §12 Product Process & Via Quality
    expect(referencedPages.has(10)).toBe(true); // §13, §14, §15 Findings, Parts, Buyoff
  });

  it('should authoritative carry typed session.productionLineName into §01 Cover', () => {
    const session = createDummySession('SESS-PROD-LINE-01');
    session.productionLineName = 'Cleanroom Line A';

    const doc = buildMhcReportDocument(session);

    expect(doc.sections['01'].data.productionLine).toBe('Cleanroom Line A');
    expect(doc.sections['01'].data.lineName).toBe('Cleanroom Line A');
  });

  it('should render neutral "—" when Production Line is unassigned without inventing "Davinci"', () => {
    const session = createDummySession('SESS-UNASSIGNED-LINE');
    session.productionLineName = '';

    const doc = buildMhcReportDocument(session);

    expect(doc.sections['01'].data.productionLine).toBe('—');
    expect(doc.sections['01'].data.productionLine).not.toBe('Davinci');
  });

  it('should authoritative carry typed session.zone into §01 Cover', () => {
    const session = createDummySession('SESS-ZONE-01');
    session.zone = 'Zone C | Backend Processing';

    const doc = buildMhcReportDocument(session);

    expect(doc.sections['01'].data.zone).toBe('Zone C | Backend Processing');
  });

  it('should render neutral "—" when Zone is unassigned without hardcoded "B | Front of Line"', () => {
    const session = createDummySession('SESS-UNASSIGNED-ZONE');
    session.zone = '';

    const doc = buildMhcReportDocument(session);

    expect(doc.sections['01'].data.zone).toBe('—');
    expect(doc.sections['01'].data.zone).not.toBe('B | Front of Line');
  });

  it('should format §03 Executive Summary narrative sentence using Zone when available', () => {
    const session = createDummySession('SESS-EXEC-ZONE');
    session.customerName = 'STMicroelectronics';
    session.plantName = 'P3';
    session.zone = 'Zone 4 - Photolithography Bay';

    const doc = buildMhcReportDocument(session);

    expect(doc.sections['03'].data.summaryText).toContain('at STMicroelectronics - Zone 4 - Photolithography Bay.');
    expect(doc.sections['03'].data.summaryText).not.toContain('at STMicroelectronics - P3.');
  });

  it('should not fabricate missing specifications in §03 and use neutral fallback', () => {
    const session = createDummySession('SESS-EXEC-SPECS');
    const doc = buildMhcReportDocument(session);

    const majorResults = doc.sections['03'].data.majorPassFailResults;
    expect(majorResults.length).toBe(5);

    // Verify stage tolerance derives properly and doesn't use hardcoded text
    const stageRes = majorResults.find(r => r.component === 'Stage Calibration');
    expect(stageRes?.note).toMatch(/^±\d+\.\d+ µm$/);

    const agcRes = majorResults.find(r => r.component === 'AGC / Scanner Calibration');
    expect(agcRes?.note).toMatch(/^±\d+\.\d+ µm$/);
  });

  it('should ground §08 Power Offset in Product Identity / Process Parameters from Machine Passport and compute resulting power', () => {
    const session = createDummySession('SESS-POWER-OFFSET');
    (session as any).productProcessRecords = [
      {
        id: 'pp-01',
        date: '2026-08-30',
        productName: 'HDI Rigid-Flex Rev C',
        recipeName: 'HDI_VIA_MICRO_50UM',
        engineerRemarks: 'Laser replacement',
        laser1PowerOffsetPercent: -12.0,
        laser2PowerOffsetPercent: 2.0,
        phase1: { powerWatts: 0.50, frequencyKhz: 50, shotCount: 26, maskMm: 1.8, defocusMm: -0.3 },
        phase2: { powerWatts: 0.45, frequencyKhz: 50, shotCount: 20, maskMm: 1.3, defocusMm: -0.3 },
        laser1Via: { topWidthUm: 52, bottomWidthUm: 48, overallPass: true },
        laser2Via: { topWidthUm: 51, bottomWidthUm: 47, overallPass: true },
        overallResult: 'PASS'
      },
      {
        id: 'pp-00',
        date: '2026-06-15',
        productName: 'HDI Rigid-Flex Rev C',
        recipeName: 'HDI_VIA_MICRO_50UM',
        laser1PowerOffsetPercent: -10.0,
        laser2PowerOffsetPercent: -8.0,
        phase1: { powerWatts: 0.50, frequencyKhz: 50, shotCount: 26, maskMm: 1.8, defocusMm: -0.3 },
        phase2: { powerWatts: 0.45, frequencyKhz: 50, shotCount: 20, maskMm: 1.3, defocusMm: -0.3 },
        laser1Via: { topWidthUm: 50, bottomWidthUm: 45, overallPass: true },
        laser2Via: { topWidthUm: 50, bottomWidthUm: 45, overallPass: true },
        overallResult: 'PASS'
      }
    ];

    const doc = buildMhcReportDocument(session);

    expect(doc.sections['08'].code).toBe('08');
    expect(doc.sections['08'].data.productName).toBe('HDI Rigid-Flex Rev C');
    expect(doc.sections['08'].data.recipeName).toBe('HDI_VIA_MICRO_50UM');
    expect(doc.sections['08'].data.powerOffsetRangeText).toBe('−20% to +20%');
    expect(doc.sections['08'].data.bottomViaImpactNote).toContain('Power offset primarily influences bottom via diameter');

    // Laser Head 1 (LH1)
    expect(doc.sections['08'].data.laser1.laserLabel).toBe('Laser Head 1 (LH1)');
    expect(doc.sections['08'].data.laser1.phase1RecipePowerWatts).toBe(0.50);
    expect(doc.sections['08'].data.laser1.phase1AdjustedPowerWatts).toBe(0.44);
    expect(doc.sections['08'].data.laser1.phase2RecipePowerWatts).toBe(0.45);
    expect(doc.sections['08'].data.laser2.phase2AdjustedPowerWatts).toBe(0.46);
    expect(doc.sections['08'].data.laser1.appliedOffsetPercent).toBe(-12.0);
    expect(doc.sections['08'].data.laser1.previousOffsetPercent).toBe(-10.0);
    expect(doc.sections['08'].data.laser1.currentOffsetPercent).toBe(-12.0);
    expect(doc.sections['08'].data.laser1.adjustmentReason).toBe('Laser replacement');

    // Laser Head 2 (LH2)
    expect(doc.sections['08'].data.laser2.laserLabel).toBe('Laser Head 2 (LH2)');
    expect(doc.sections['08'].data.laser2.phase1RecipePowerWatts).toBe(0.50);
    expect(doc.sections['08'].data.laser2.phase1AdjustedPowerWatts).toBe(0.51);
    expect(doc.sections['08'].data.laser2.phase2RecipePowerWatts).toBe(0.45);
    expect(doc.sections['08'].data.laser2.appliedOffsetPercent).toBe(2.0);
    expect(doc.sections['08'].data.laser2.previousOffsetPercent).toBe(-8.0);
    expect(doc.sections['08'].data.laser2.currentOffsetPercent).toBe(2.0);
  });

  it('should return null (rendering "—") for §08 Power Offset when no offset exists in Product & Process record', () => {
    const session = createDummySession('SESS-NO-OFFSET');
    (session as any).productProcessRecords = [
      {
        id: 'pp-no-offset',
        date: '2026-08-30',
        productName: 'Sample PCB',
        recipeName: 'SAMPLE_RECIPE',
        phase1: { powerWatts: 0.60, frequencyKhz: 50, shotCount: 20, maskMm: 1.5, defocusMm: -0.2 },
        overallResult: 'PASS'
      }
    ];

    const doc = buildMhcReportDocument(session);
    expect(doc.sections['08'].data.laser1.appliedOffsetPercent).toBeNull();
    expect(doc.sections['08'].data.laser1.resultingPowerWatts).toBeNull();
    expect(doc.sections['08'].data.laser1.previousOffsetPercent).toBeNull();
    expect(doc.sections['08'].data.laser1.adjustmentReason).toBeUndefined();
    expect(doc.sections['08'].data.laser2.appliedOffsetPercent).toBeNull();
    expect(doc.sections['08'].data.laser2.resultingPowerWatts).toBeNull();
    expect(doc.sections['08'].data.laser2.previousOffsetPercent).toBeNull();
    expect(doc.sections['08'].data.laser2.adjustmentReason).toBeUndefined();
  });

  it('should reject verification results and test check activity notes from being used as §08 adjustment reason', () => {
    const session = createDummySession('SESS-VERIFY-REJECT');
    (session as any).productProcessRecords = [
      {
        id: 'pp-test',
        date: '2026-08-30',
        productName: 'Sample PCB',
        recipeName: 'SAMPLE_RECIPE',
        laser1PowerOffsetPercent: -5.0,
        laser2PowerOffsetPercent: 3.0,
        phase1: { powerWatts: 0.50, frequencyKhz: 50, shotCount: 20, maskMm: 1.5, defocusMm: -0.2 },
        phase2: { powerWatts: 0.40, frequencyKhz: 50, shotCount: 15, maskMm: 1.2, defocusMm: -0.2 }
      }
    ];

    const doc = buildMhcReportDocument(session);
    expect(doc.sections['08'].data.laser1.adjustmentReason).toBeUndefined();
    expect(doc.sections['08'].data.laser2.adjustmentReason).toBeUndefined();
    expect(doc.sections['08'].data.adjustmentReason).toBeUndefined();

    // Now supply genuine engineer remarks on the process record
    (session as any).productProcessRecords[0].engineerRemarks = 'New laser installed';
    const docWithRealReason = buildMhcReportDocument(session);
    expect(docWithRealReason.sections['08'].data.laser1.adjustmentReason).toBe('New laser installed');
    expect(docWithRealReason.sections['08'].data.laser2.adjustmentReason).toBe('New laser installed');
    expect(docWithRealReason.sections['08'].data.adjustmentReason).toBe('New laser installed');
  });

  it('should use machine passport temperatureCooling specs as authoritative for Section 11 and derive pass/fail accordingly', () => {
    const session = createDummySession('SESS-TEMP-PASSPORT');
    session.mhcSpecs = {
      temperatureCooling: {
        targetTempCelsius: 24.5,
        tempToleranceCelsius: 0.5
      }
    };
    session.temperatureEvidenceData = {
      hasValidTemperatureAnalysis: true,
      stats: {
        min: 24.1,
        max: 24.8,
        avg: 24.6,
        range: 0.7,
        points: 500
      }
    };

    const doc = buildMhcReportDocument(session);
    expect(doc.sections['11'].data.targetTempCelsius).toBe(24.5);
    expect(doc.sections['11'].data.tempToleranceCelsius).toBe(0.5);
    expect(doc.sections['11'].status).toBe('COMPLETE');

    // Out of spec test: avg 25.2 is outside [24.0, 25.0]
    session.temperatureEvidenceData.stats!.avg = 25.2;
    const docOutOfSpec = buildMhcReportDocument(session);
    expect(docOutOfSpec.sections['11'].status).toBe('NEEDS_REVIEW');
  });

  it('should leave targetTempCelsius and tempToleranceCelsius undefined when unconfigured in Machine Passport', () => {
    const session = createDummySession('SESS-TEMP-UNCONFIGURED');
    session.mhcSpecs = undefined;
    session.temperatureEvidenceData = {
      hasValidTemperatureAnalysis: true,
      stats: {
        min: 21.0,
        max: 23.0,
        avg: 22.0,
        range: 2.0,
        points: 100
      }
    };

    const doc = buildMhcReportDocument(session);
    expect(doc.sections['11'].data.targetTempCelsius).toBeUndefined();
    expect(doc.sections['11'].data.tempToleranceCelsius).toBeUndefined();
    expect(doc.sections['11'].status).toBe('COMPLETE');
  });

  it('should prioritize latestProductProcess for Section 12 Product and Recipe over stage02 placeholder values', () => {
    const session = createDummySession('SESS-SECTION12-PRIORITY');
    // Simulate stage02 initialized with default placeholder
    session.stage02_laserProfile = {
      productName: 'Standard Optical Profile',
      recipeProgram: 'RECIPE-01',
      profileInfo: 'Default Profile Info'
    } as any;

    // Simulate authoritative Machine Passport Product & Process record
    (session as any).productProcessRecord = {
      id: 'pp-authoritative',
      productName: 'PEZ',
      recipeName: 'PEZ_PROD',
      lotPanel: 'LOT-999',
      phase1: { powerWatts: 0.50, frequencyKhz: 60, shotCount: 25, maskMm: 1.6, defocusMm: -0.1 },
      phase2: { powerWatts: 0.40, frequencyKhz: 50, shotCount: 20, maskMm: 1.4, defocusMm: -0.1 },
      overallResult: 'PASS',
      engineerRemarks: 'Nominal microvia verification passed.'
    };

    const doc = buildMhcReportDocument(session);
    expect(doc.sections['12'].data.productName).toBe('PEZ');
    expect(doc.sections['12'].data.recipeProgram).toBe('PEZ_PROD');
    expect(doc.sections['12'].data.recipeName).toBe('PEZ_PROD');
    expect(doc.sections['12'].data.lotPanel).toBe('LOT-999');
    expect(doc.sections['12'].data.phase1?.powerWatts).toBe(0.50);
    expect(doc.sections['12'].data.engineerRemarks).toBe('Nominal microvia verification passed.');
  });

  it('should standardize physical laser head terminology and not construct misleading serial numbers from machineSerialNumber', () => {
    const session = createDummySession('SESS-LASER-TERMINOLOGY');
    session.machineSerialNumber = 'MC230038';
    session.stage01_laserHours = [
      {
        laserId: 'lh1',
        laserIdentifier: 'Laser 1', // Unstandardized input label
        recordedLaserHour: 10000,
        readingDate: '2026-08-10',
        readingTime: '09:15',
        calculatedCurrentHour: 10000,
        warningThreshold: 18000,
        criticalThreshold: 20000,
        runtimeStatus: 'NORMAL',
        isVerified: true
      },
      {
        laserId: 'lh2',
        laserIdentifier: 'LH-2', // Unstandardized input label
        serialNumber: 'COHR-DIAMOND-9941', // Genuine laser serial number
        recordedLaserHour: 8000,
        readingDate: '2026-08-10',
        readingTime: '09:15',
        calculatedCurrentHour: 8000,
        warningThreshold: 18000,
        criticalThreshold: 20000,
        runtimeStatus: 'NORMAL',
        isVerified: true
      }
    ];

    const doc = buildMhcReportDocument(session);

    // Section 03 Executive Summary Major Results must use "Laser Power (Laser Head 1 & 2)"
    const laserPowerResult = doc.sections['03'].data.majorPassFailResults.find(r => r.component.includes('Laser Power'));
    expect(laserPowerResult?.component).toBe('Laser Power (Laser Head 1 & 2)');

    // Section 04 Laser Hours heads must be standardized to "Laser Head 1" and "Laser Head 2"
    expect(doc.sections['04'].data.laserHours[0].laserIdentifier).toBe('Laser Head 1');
    expect(doc.sections['04'].data.laserHours[1].laserIdentifier).toBe('Laser Head 2');

    // Head 1 has no serial number: must be undefined, NEVER fabricated as "MC230038-LH01"
    expect(doc.sections['04'].data.laserHours[0].serialNumber).toBeUndefined();

    // Head 2 has authentic serial number: preserved exactly
    expect(doc.sections['04'].data.laserHours[1].serialNumber).toBe('COHR-DIAMOND-9941');
  });
});

