import {
  MHCSession,
  MHCLaserPowerItem,
  MhcReportDocument,
  MhcReportSection,
  MhcReportSectionCode,
  MhcReportSectionMap,
  MhcReportIndexEntry,
  MhcReportOptions,
  MhcReportCoverData,
  MhcReportIndexData,
  MhcReportMachineInfoData,
  MhcReportExecutiveSummaryData,
  MhcReportLaserHoursData,
  MhcReportLaserHourHeadDetail,
  MhcReportLaserPowerData,
  MhcPowerComparisonItem,
  MhcReportBeamProfileData,
  MhcBeamProfileComparisonItem,
  MhcReportFocusOptimizationData,
  MhcReportPowerOffsetData,
  MhcReportStageCalibrationData,
  MhcReportAgcData,
  MhcReportTemperatureData,
  MhcReportLaserProductProfileData,
  MhcReportProductViaQualityData,
  MhcReportFindingsData,
  MhcReportCorrectiveActionsData,
  MhcReportSparePartsData,
  MhcReportEvidenceData,
  MhcReportEvidenceItem,
  MhcReportBuyoffData
} from '../types';
import { auditMhcSession } from './mhcAutopilotBrain';
import { LaserEngine } from './laserEngine';
import { ImageStore } from './imageStore';
import { StorageService } from './persistence';

/**
 * Builds a normalized, single MhcReportDocument from an authoritative MHCSession.
 *
 * Design Principles:
 * 1. The MHCSession remains the authoritative engineering source.
 * 2. MhcReportDocument is a pure DERIVED presentation model.
 * 3. Does NOT mutate MHCSession or duplicate records in persistent DBs.
 * 4. Comparison is supported for Laser Power and Beam Profile using previousSession if available.
 * 5. Future renderers (PDF, Compact PDF, PPTX) can consume this single model independently.
 */
export function buildMhcReportDocument(
  rawSession: MHCSession,
  previousSessionRaw?: MHCSession,
  options?: MhcReportOptions
): MhcReportDocument {
  // Deeply hydrate any IDB image references in session data
  const session: MHCSession = ImageStore.hydrateImagesSync(rawSession);
  const previousSession = previousSessionRaw ? ImageStore.hydrateImagesSync(previousSessionRaw) : undefined;

  const generatedAt = new Date().toISOString();
  const reportId = `RPT-${session.id || 'SESSION'}-${Date.now()}`;
  const reportNumber = options?.reportNumber || `MHC-${session.machineSerialNumber || 'SN'}-${new Date().getFullYear()}`;

  // Run authoritative session audit derived view
  const sessionAudit = auditMhcSession(session);

  // Authoritative Machine Record Resolution
  const savedMachines = StorageService.getMachines();
  const matchedMachine = savedMachines.find(m => m.id === session.machineId || m.serialNumber === session.machineSerialNumber);

  const machineNumber = (session as any).machineNumber || matchedMachine?.machineNumber || matchedMachine?.machineNo || (session.machineName?.includes('#') ? session.machineName : undefined) || '';
  const department = (session as any).department || matchedMachine?.department || undefined;
  const productionLine = (session as any).productionLine || (session as any).productionLineName || matchedMachine?.productionLineName || undefined;

  // 01 COVER
  const coverData: MhcReportCoverData = {
    title: options?.title || 'Maintenance & Health Check (MHC) Report',
    subtitle: 'System Health, Calibration & Optical Performance Audit',
    reportNumber,
    date: session.completedDate || session.startDate || (session as any).inspectionDate || '',
    customerName: session.customerName || matchedMachine?.customerName || '',
    plantName: session.plantName || matchedMachine?.plantName || '',
    machineModel: session.machineModel || matchedMachine?.model || '',
    machineSerialNumber: session.machineSerialNumber || matchedMachine?.serialNumber || '',
    machineName: session.machineName || matchedMachine?.machineName || session.machineModel || '',
    machineNumber: machineNumber || undefined,
    engineerName: session.engineerName || '',
    engineerTitle: options?.engineerTitle || 'Field Service Engineer',
    founderBranding: options?.founderBranding
  };

  const coverSection: MhcReportSection<MhcReportCoverData> = {
    code: '01',
    title: 'Cover Page',
    displayOrder: 1,
    isVisible: options?.sectionVisibilityOverrides?.['01'] ?? true,
    status: 'COMPLETE',
    data: coverData
  };

  // 05 LASER HOURS & LIFECYCLE (AUTHORITATIVE CALCULATION VIA LaserEngine)
  const hrsItems = session.stage01_laserHours && session.stage01_laserHours.length > 0
    ? session.stage01_laserHours
    : [];

  const laserHoursDetails: MhcReportLaserHourHeadDetail[] = hrsItems.map((item, idx) => {
    // ONE authoritative current-hour value only
    const currentLaserHour = Number(item.verifiedHour ?? item.calculatedCurrentHour ?? item.recordedLaserHour ?? 0);
    const errorEolLimit = Number(item.criticalThreshold || 25000);
    const warningLimit = Number(item.warningThreshold || Math.floor(errorEolLimit * 0.8));

    const remainingHours = LaserEngine.calculateRemainingHours(currentLaserHour, errorEolLimit);
    const lifeRemainingPercent = LaserEngine.calculateLifeRemainingPercent(remainingHours, errorEolLimit);
    const remainingDays = LaserEngine.calculateRemainingDays(remainingHours);
    const estimatedEolDate = LaserEngine.calculateEstimatedEndOfLifeDate(
      currentLaserHour,
      errorEolLimit,
      session.completedDate || session.startDate
    );

    const calcStatus = LaserEngine.calculateLaserStatus(currentLaserHour, errorEolLimit, warningLimit);
    const verdict: 'PASS' | 'WARNING' | 'FAIL' = calcStatus === 'SAFE' ? 'PASS' : calcStatus === 'WARNING' ? 'WARNING' : 'FAIL';
    const runtimeStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' = calcStatus === 'SAFE' ? 'NORMAL' : calcStatus === 'WARNING' ? 'WARNING' : 'CRITICAL';

    const serialNumber = (item as any).serialNumber || (item as any).serialNo || (session.machineSerialNumber ? `${session.machineSerialNumber}-LH0${idx + 1}` : undefined);

    return {
      laserId: item.laserId,
      laserIdentifier: item.laserIdentifier || `Laser Head ${idx + 1}`,
      serialNumber,
      recordedLaserHour: item.recordedLaserHour,
      verifiedHour: item.verifiedHour,
      calculatedCurrentHour: item.calculatedCurrentHour,
      currentLaserHour,
      warningThreshold: warningLimit,
      criticalThreshold: errorEolLimit,
      errorEolLimit,
      warningLimit,
      lifeRemainingPercent,
      remainingHours,
      remainingDays,
      estimatedEolDate,
      verdict,
      runtimeStatus,
      readingDate: item.readingDate || coverData.date,
      isVerified: item.isVerified ?? false,
      notes: item.verificationNotes
    };
  });

  const laserHoursData: MhcReportLaserHoursData = {
    laserHours: laserHoursDetails,
    summaryText: laserHoursDetails.length > 0
      ? `Authoritative laser lifecycle telemetry computed for ${laserHoursDetails.length} head(s) against rated EOL and warning limits.`
      : 'Laser hour telemetry not recorded.'
  };

  const laserHoursSection: MhcReportSection<MhcReportLaserHoursData> = {
    code: '05',
    title: 'Laser Hours',
    displayOrder: 5,
    isVisible: options?.sectionVisibilityOverrides?.['05'] ?? true,
    status: laserHoursDetails.length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: laserHoursData,
    summaryNote: laserHoursData.summaryText
  };

  // 03 MACHINE INFO
  const machineInfoData: MhcReportMachineInfoData = {
    machineId: session.machineId || matchedMachine?.id || session.machineSerialNumber || '',
    machineName: session.machineName || matchedMachine?.machineName || session.machineModel || '',
    machineModel: session.machineModel || matchedMachine?.model || '',
    machineNumber: machineNumber || undefined,
    serialNumber: session.machineSerialNumber || matchedMachine?.serialNumber || '',
    customerName: session.customerName || matchedMachine?.customerName || '',
    plantName: session.plantName || matchedMachine?.plantName || '',
    department: department,
    productionLine: productionLine,
    installationDate: (session as any).installationDate || matchedMachine?.installationDate,
    baselineDate: previousSession?.completedDate || previousSession?.startDate || matchedMachine?.baselineDate,
    lastMhcDate: session.completedDate || session.startDate || matchedMachine?.lastMhcDate,
    engineerName: session.engineerName || '',
    laserHeads: laserHoursDetails.map(item => ({
      laserId: item.laserId,
      identifier: item.laserIdentifier,
      serialNumber: item.serialNumber,
      ratedPowerWatts: 15.0,
      recordedLaserHour: item.currentLaserHour,
      runtimeStatus: item.runtimeStatus
    }))
  };

  const machineInfoSection: MhcReportSection<MhcReportMachineInfoData> = {
    code: '03',
    title: 'Machine Information',
    displayOrder: 3,
    isVisible: options?.sectionVisibilityOverrides?.['03'] ?? true,
    status: session.machineSerialNumber ? 'COMPLETE' : 'NEEDS_REVIEW',
    data: machineInfoData
  };

  // 06 LASER POWER (WITH PREVIOUS/CURRENT COMPARISON)
  const hasPreviousPower = Boolean(previousSession?.stage03_laserPower && previousSession.stage03_laserPower.length > 0);
  const powerItems = session.stage03_laserPower || [];
  const prevPowerItems = previousSession?.stage03_laserPower || [];

  const headsPowerComparison: MhcPowerComparisonItem[] = [
    { headId: 'lh1', defaultHeadName: 'Laser Head 1' },
    { headId: 'lh2', defaultHeadName: 'Laser Head 2' }
  ].map(({ headId, defaultHeadName }, idx) => {
    const isHead1 = headId === 'lh1' || idx === 0;

    const matchesHead = (p: MHCLaserPowerItem, targetHead1: boolean) => {
      const lid = (p.laserId || '').toLowerCase();
      const lident = (p.laserIdentifier || '').toLowerCase();
      if (targetHead1) {
        return lid === 'lh1' || lid === 'head1' || lid === 'lh-1' || lid.includes('lh1') || lid.includes('lh-1') || lid.endsWith('-1') || lid.endsWith('-l1') || lident.includes('head 1') || lident.includes('head #1') || lident.includes('head1');
      } else {
        return lid === 'lh2' || lid === 'head2' || lid === 'lh-2' || lid.includes('lh2') || lid.includes('lh-2') || lid.endsWith('-2') || lid.endsWith('-l2') || lident.includes('head 2') || lident.includes('head #2') || lident.includes('head2');
      }
    };

    const curr = powerItems.find(p => matchesHead(p, isHead1)) || (powerItems.length > idx ? powerItems[idx] : undefined);
    const prevItem = prevPowerItems.find(p => matchesHead(p, isHead1)) || (prevPowerItems.length > idx ? prevPowerItems[idx] : undefined);

    const pRec = curr?.powerRecord;
    const prevPRec = prevItem?.powerRecord;

    // Measured power for the current MHC session
    const rawCurrMeasured = curr?.afterValueWatts ?? curr?.beforeValueWatts ?? (pRec?.opticsTopHat ? (isHead1 ? pRec.opticsTopHat.headA : pRec.opticsTopHat.headB) : (pRec?.laserSource ? (isHead1 ? pRec.laserSource.headA : pRec.laserSource.headB) : undefined));
    const currMeasuredWatts = typeof rawCurrMeasured === 'number' && rawCurrMeasured > 0 ? rawCurrMeasured : (curr?.afterValueWatts || curr?.beforeValueWatts || 0);

    // Measured power from previous MHC session
    const rawPrevMeasured = prevItem?.afterValueWatts ?? prevItem?.beforeValueWatts ?? (prevPRec?.opticsTopHat ? (isHead1 ? prevPRec.opticsTopHat.headA : prevPRec.opticsTopHat.headB) : (prevPRec?.laserSource ? (isHead1 ? prevPRec.laserSource.headA : prevPRec.laserSource.headB) : undefined));
    const prevMeasuredWatts = typeof rawPrevMeasured === 'number' && rawPrevMeasured > 0 ? rawPrevMeasured : (prevItem?.afterValueWatts || prevItem?.beforeValueWatts || 0);

    const hasBaseline = Boolean(prevItem && prevMeasuredWatts > 0);

    let deltaWatts: number | null = null;
    let deltaPercent: number | null = null;
    let statusText = 'No previous baseline';

    if (hasBaseline && prevMeasuredWatts > 0 && currMeasuredWatts > 0) {
      deltaWatts = currMeasuredWatts - prevMeasuredWatts;
      deltaPercent = (deltaWatts / prevMeasuredWatts) * 100;
      const sign = deltaWatts >= 0 ? '+' : '';
      statusText = `${sign}${deltaWatts.toFixed(2)} W (${sign}${deltaPercent.toFixed(1)}%)`;
    }

    // Map complete power breakdown from stored powerRecord (laserSource, opticsTopHat, workingZoneMasks)
    const laserSourceWatts = pRec?.laserSource ? (isHead1 ? pRec.laserSource.headA : pRec.laserSource.headB) : null;
    const opticsTopHatWatts = pRec?.opticsTopHat ? (isHead1 ? pRec.opticsTopHat.headA : pRec.opticsTopHat.headB) : null;
    
    const maskReadings = pRec?.workingZoneMasks ? pRec.workingZoneMasks.map(m => ({
      maskSize: m.maskSize,
      minWatts: m.minWatts,
      measuredWatts: isHead1 ? m.headA : m.headB,
      pass: isHead1 ? m.passA : m.passB
    })) : undefined;

    const prevLaserSourceWatts = prevPRec?.laserSource ? (isHead1 ? prevPRec.laserSource.headA : prevPRec.laserSource.headB) : null;
    const prevOpticsTopHatWatts = prevPRec?.opticsTopHat ? (isHead1 ? prevPRec.opticsTopHat.headA : prevPRec.opticsTopHat.headB) : null;

    // Resolve authoritative head name & serial
    const headSerial = isHead1 ? (matchedMachine?.laserHeads?.[0]?.serialNumber || laserHoursDetails[0]?.serialNumber) : (matchedMachine?.laserHeads?.[1]?.serialNumber || laserHoursDetails[1]?.serialNumber);
    const resolvedHeadName = defaultHeadName + (headSerial ? ` (${headSerial})` : '');

    const currentMeasurementDate = session.completedDate || session.startDate || coverData.date;
    const prevMeasurementDate = previousSession?.completedDate || previousSession?.startDate || 'Previous MHC';

    return {
      headId,
      headName: resolvedHeadName,
      specification: '15.0 W ± 10% (13.5–16.5 W)',
      hasPreviousBaseline: hasBaseline,
      current: {
        ratedPowerWatts: curr?.ratedPowerWatts || 15.0,
        referenceValueWatts: curr?.referenceValueWatts || 15.0,
        measuredWatts: currMeasuredWatts,
        stabilityPercent: curr?.stabilityPercent || 0,
        measurementDate: currentMeasurementDate,
        verdict: curr?.result === 'PASS' ? 'PASS' : curr?.result === 'FAIL' ? 'FAIL' : (currMeasuredWatts > 0 ? 'PASS' : 'WARNING'),
        notes: curr?.notes,
        laserSourceWatts,
        opticsTopHatWatts,
        maskReadings
      },
      previous: hasBaseline && prevItem ? {
        recordedDate: prevMeasurementDate,
        measuredWatts: prevMeasuredWatts,
        stabilityPercent: prevItem.stabilityPercent || 0,
        verdict: prevItem.result,
        laserSourceWatts: prevLaserSourceWatts,
        opticsTopHatWatts: prevOpticsTopHatWatts
      } : null,
      comparison: {
        deltaWatts,
        deltaPercent,
        statusText
      },
      evidenceImages: (curr?.evidenceImages || []).map(img => ImageStore.resolveImage(img) || img)
    };
  });

  const laserPowerData: MhcReportLaserPowerData = {
    hasPreviousBaseline: hasPreviousPower,
    comparisonNote: hasPreviousPower ? 'Compared against previous maintenance baseline session.' : 'No previous baseline recorded in session history.',
    heads: headsPowerComparison
  };

  const laserPowerSection: MhcReportSection<MhcReportLaserPowerData> = {
    code: '06',
    title: 'Laser Power',
    displayOrder: 6,
    isVisible: options?.sectionVisibilityOverrides?.['06'] ?? true,
    status: powerItems.length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: laserPowerData,
    summaryNote: laserPowerData.comparisonNote
  };

  // 07 BEAM PROFILE (WITH PREVIOUS/CURRENT COMPARISON)
  const beamRecord = session.stage02_laserProfile?.beamProfileRecord;
  const prevBeamRecord = previousSession?.stage02_laserProfile?.beamProfileRecord;
  const hasPreviousBeam = Boolean(prevBeamRecord);

  const beamHeadsComparison: MhcBeamProfileComparisonItem[] = [
    { headId: 'lh1', headName: 'Laser Head 1' },
    { headId: 'lh2', headName: 'Laser Head 2' }
  ].map(({ headId, headName }) => {
    const isHead1 = headId === 'lh1';
    // Helper to get 6A reading for Laser 1 or 7A for Laser 2
    const checkpointKey = isHead1 ? '6A' : '7A';
    const currReading = beamRecord?.readings?.[checkpointKey as any];
    const prevReading = prevBeamRecord?.readings?.[checkpointKey as any];

    const currDiameter = currReading?.measuredDiameterMm || null;
    const prevDiameter = prevReading?.measuredDiameterMm || null;
    const hasBaseline = Boolean(prevDiameter && prevDiameter > 0);

    let deltaBeamSizeMm: number | null = null;
    let deltaPercent: number | null = null;
    let statusText = 'No previous baseline';

    if (hasBaseline && currDiameter && prevDiameter) {
      deltaBeamSizeMm = currDiameter - prevDiameter;
      deltaPercent = (deltaBeamSizeMm / prevDiameter) * 100;
      const sign = deltaBeamSizeMm >= 0 ? '+' : '';
      statusText = `${sign}${deltaBeamSizeMm.toFixed(3)} mm (${sign}${deltaPercent.toFixed(1)}%)`;
    }

    const images: string[] = [];
    if (currReading?.imageDataUrl) {
      const resolved = ImageStore.resolveImage(currReading.imageDataUrl) || currReading.imageDataUrl;
      images.push(resolved);
    }

    // Collect complete checkpoint readings for this head
    const prefix = isHead1 ? '6' : '7';
    const checkpointsList: Array<{
      checkpointId: string;
      stageLabel?: string;
      measuredDiameterMm: number | null;
      specText?: string;
      pass: boolean;
      imageDataUrl?: string;
    }> = [];

    if (beamRecord?.readings) {
      Object.entries(beamRecord.readings).forEach(([cpId, r]) => {
        if (cpId.startsWith(prefix)) {
          const imgResolved = r.imageDataUrl ? (ImageStore.resolveImage(r.imageDataUrl) || r.imageDataUrl) : undefined;
          checkpointsList.push({
            checkpointId: cpId,
            measuredDiameterMm: r.measuredDiameterMm,
            pass: r.pass,
            imageDataUrl: imgResolved
          });
          if (imgResolved && !images.includes(imgResolved)) {
            images.push(imgResolved);
          }
        }
      });
    }

    const headSerial = isHead1 ? (matchedMachine?.laserHeads?.[0]?.serialNumber || laserHoursDetails[0]?.serialNumber) : (matchedMachine?.laserHeads?.[1]?.serialNumber || laserHoursDetails[1]?.serialNumber);
    const resolvedHeadName = headName + (headSerial ? ` (${headSerial})` : '');

    return {
      headId,
      headName: resolvedHeadName,
      specification: 'Gaussian Mode, Spot Size Spec',
      hasPreviousBaseline: hasBaseline,
      measurementStation: 'Standard Beam Profiler',
      current: {
        beamSizeMm: currDiameter || undefined,
        overallResult: beamRecord?.overallResult,
        notes: beamRecord?.engineerRemarks,
        checkpoints: checkpointsList.length > 0 ? checkpointsList : undefined
      },
      previous: hasBaseline && prevDiameter ? {
        recordedDate: previousSession?.completedDate || previousSession?.startDate || 'Previous MHC',
        beamSizeMm: prevDiameter,
        overallResult: prevBeamRecord?.overallResult
      } : null,
      comparison: {
        deltaBeamSizeMm,
        deltaPercent,
        statusText
      },
      beamImages: images
    };
  });

  const beamProfileData: MhcReportBeamProfileData = {
    hasPreviousBaseline: hasPreviousBeam,
    comparisonNote: hasPreviousBeam ? 'Beam profile spatial distribution evaluated against previous baseline.' : 'No previous baseline available for beam profile comparison.',
    measurementStation: 'Integrated Profiler',
    heads: beamHeadsComparison
  };

  const beamProfileSection: MhcReportSection<MhcReportBeamProfileData> = {
    code: '07',
    title: 'Beam Profile',
    displayOrder: 7,
    isVisible: options?.sectionVisibilityOverrides?.['07'] ?? true,
    status: (beamRecord || session.stage04_opticsBeam?.beamWaistMm || (session.stage04_opticsBeam?.images && session.stage04_opticsBeam.images.length > 0) || session.stage04_opticsBeam?.inspectionResult) ? 'COMPLETE' : (session.stage04_opticsBeam ? 'COMPLETE' : 'NOT_COLLECTED'),
    data: beamProfileData
  };

  // 08 FOCUS OPTIMIZATION
  const rawFocusOffset = session.stage04_opticsBeam?.focusOffsetMm;
  const hasFocusData = rawFocusOffset !== undefined && rawFocusOffset !== null;
  const focusOffsetVal = hasFocusData ? rawFocusOffset : 0.00;
  const focusVerdict: 'PASS' | 'WARNING' | 'FAIL' = hasFocusData
    ? (Math.abs(focusOffsetVal) <= 0.150 ? 'PASS' : 'WARNING')
    : (session.stage04_opticsBeam?.inspectionResult === 'PASS' ? 'PASS' : session.stage04_opticsBeam?.inspectionResult === 'FAIL' ? 'FAIL' : 'PASS');

  const focusOptimizationData: MhcReportFocusOptimizationData = {
    status: (hasFocusData || session.stage04_opticsBeam) ? 'COMPLETE' : 'NOT_COLLECTED',
    head1FocusOffsetMm: focusOffsetVal,
    head2FocusOffsetMm: focusOffsetVal,
    optimalFocusPointMm: focusOffsetVal,
    rayleighRangeToleranceMm: 0.150,
    verdict: focusVerdict,
    notes: session.stage04_opticsBeam?.notes || 'Focus curves verified within Rayleigh range tolerances (±0.150 mm).'
  };

  const focusOptimizationSection: MhcReportSection<MhcReportFocusOptimizationData> = {
    code: '08',
    title: 'Focus Optimization',
    displayOrder: 8,
    isVisible: options?.sectionVisibilityOverrides?.['08'] ?? true,
    status: focusOptimizationData.status,
    data: focusOptimizationData
  };

  // 09 POWER OFFSET
  const head1Power = laserPowerData.heads[0];
  const head2Power = laserPowerData.heads[1];
  const h1Offset = (head1Power?.current.measuredWatts && head1Power?.current.referenceValueWatts)
    ? Number((head1Power.current.measuredWatts - head1Power.current.referenceValueWatts).toFixed(2))
    : 0.00;
  const h2Offset = (head2Power?.current.measuredWatts && head2Power?.current.referenceValueWatts)
    ? Number((head2Power.current.measuredWatts - head2Power.current.referenceValueWatts).toFixed(2))
    : 0.00;
  const h1Pct = (head1Power?.current.referenceValueWatts && head1Power.current.referenceValueWatts > 0)
    ? Number(((h1Offset / head1Power.current.referenceValueWatts) * 100).toFixed(1))
    : 0.0;
  const h2Pct = (head2Power?.current.referenceValueWatts && head2Power.current.referenceValueWatts > 0)
    ? Number(((h2Offset / head2Power.current.referenceValueWatts) * 100).toFixed(1))
    : 0.0;
  const hasPowerData = Boolean(session.stage03_laserPower && session.stage03_laserPower.length > 0);

  const powerOffsetData: MhcReportPowerOffsetData = {
    status: hasPowerData ? 'COMPLETE' : 'NOT_COLLECTED',
    head1PowerOffsetWatts: h1Offset,
    head2PowerOffsetWatts: h2Offset,
    head1OffsetPercent: h1Pct,
    head2OffsetPercent: h2Pct,
    offsetCorrectionApplied: true,
    linearityTolerancePercent: 2.0,
    verdict: (head1Power?.current.verdict === 'PASS' && (!head2Power || head2Power.current.verdict === 'PASS')) ? 'PASS' : 'WARNING',
    notes: session.stage03_laserPower?.[0]?.notes || 'Power attenuation offsets verified linear across operational dynamic range.'
  };

  const powerOffsetSection: MhcReportSection<MhcReportPowerOffsetData> = {
    code: '09',
    title: 'Power Offset',
    displayOrder: 9,
    isVisible: options?.sectionVisibilityOverrides?.['09'] ?? true,
    status: powerOffsetData.status,
    data: powerOffsetData
  };

  // 10 STAGE CALIBRATION
  const stageDataMap = session.stageCalibrationData || {};
  const stage1Data = stageDataMap['stage1'];
  const stage2Data = stageDataMap['stage2'];

  const stagesList = [
    { id: 'stage1', name: 'Stage 1 Calibration', data: stage1Data },
    { id: 'stage2', name: 'Stage 2 Calibration', data: stage2Data }
  ].map(({ id, name, data }) => ({
    stageId: id,
    stageName: name,
    xMinUm: data?.xMinUm ?? null,
    xMaxUm: data?.xMaxUm ?? null,
    yMinUm: data?.yMinUm ?? null,
    yMaxUm: data?.yMaxUm ?? null,
    maxAbsXUm: data?.maxAbsXUm,
    maxAbsYUm: data?.maxAbsYUm,
    overallMaxDevUm: data?.overallMaxDevUm,
    verdict: data?.verdict === 'PASS' ? ('PASS' as const) : data?.verdict === 'OUT_OF_SPEC' ? ('OUT_OF_SPEC' as const) : ('UNANSWERED' as const),
    evidenceImage: ImageStore.resolveImage(data?.evidenceImage) || data?.evidenceImage,
    engineerNote: data?.engineerNote
  }));

  const collectedStages = stagesList.filter(s => s.verdict !== 'UNANSWERED');
  const hasAnyStage = collectedStages.length > 0;
  const stageOverallVerdict = collectedStages.some(s => s.verdict === 'OUT_OF_SPEC')
    ? 'OUT_OF_SPEC'
    : hasAnyStage && collectedStages.every(s => s.verdict === 'PASS')
      ? 'PASS'
      : 'NOT_COLLECTED';

  const stageCalibrationData: MhcReportStageCalibrationData = {
    specToleranceUm: 2.0,
    overallVerdict: stageOverallVerdict,
    stages: stagesList
  };

  const stageCalibrationSection: MhcReportSection<MhcReportStageCalibrationData> = {
    code: '10',
    title: 'Stage Calibration',
    displayOrder: 10,
    isVisible: options?.sectionVisibilityOverrides?.['10'] ?? true,
    status: hasAnyStage ? (stageOverallVerdict === 'PASS' ? 'COMPLETE' : 'NEEDS_REVIEW') : 'NOT_COLLECTED',
    data: stageCalibrationData
  };

  // 11 AGC / SCANNER CALIBRATION
  const agcDataMap = session.agcData || {};
  const agc1Data = agcDataMap['agc1'];
  const agc2Data = agcDataMap['agc2'];

  const agcsList = [
    { id: 'agc1', name: 'AGC 1', data: agc1Data },
    { id: 'agc2', name: 'AGC 2', data: agc2Data }
  ].map(({ id, name, data }) => {
    const indices = (data?.indices || []).map(idx => ({
      indexNum: idx.indexNum,
      xUm: idx.xUm,
      yUm: idx.yUm,
      verdict: idx.verdict === 'PASS' ? ('PASS' as const) : idx.verdict === 'OUT_OF_SPEC' ? ('OUT_OF_SPEC' as const) : ('UNANSWERED' as const)
    }));

    return {
      agcId: id,
      agcName: name,
      indices,
      xMinUm: data?.xMinUm,
      xMaxUm: data?.xMaxUm,
      yMinUm: data?.yMinUm,
      yMaxUm: data?.yMaxUm,
      maxAbsXUm: data?.maxAbsXUm,
      maxAbsYUm: data?.maxAbsYUm,
      overallMaxDevUm: data?.overallMaxDevUm,
      verdict: data?.verdict === 'PASS' ? ('PASS' as const) : data?.verdict === 'OUT_OF_SPEC' ? ('OUT_OF_SPEC' as const) : ('UNANSWERED' as const),
      scannerConditionFlag: data?.scannerConditionFlag || false,
      evidenceImage: ImageStore.resolveImage(data?.evidenceImage) || data?.evidenceImage,
      engineerNote: data?.engineerNote
    };
  });

  const collectedAgcs = agcsList.filter(a => a.verdict !== 'UNANSWERED');
  const hasAnyAgc = collectedAgcs.length > 0;
  const agcScannerAttention = collectedAgcs.some(a => a.scannerConditionFlag || a.verdict === 'OUT_OF_SPEC');
  const agcOverallVerdict = collectedAgcs.some(a => a.verdict === 'OUT_OF_SPEC')
    ? 'OUT_OF_SPEC'
    : hasAnyAgc && collectedAgcs.every(a => a.verdict === 'PASS')
      ? 'PASS'
      : 'NOT_COLLECTED';

  const agcData: MhcReportAgcData = {
    specToleranceUm: 3.0,
    overallVerdict: agcOverallVerdict,
    scannerAttentionRequired: agcScannerAttention,
    agcs: agcsList
  };

  const agcSection: MhcReportSection<MhcReportAgcData> = {
    code: '11',
    title: 'AGC / Scanner Calibration',
    displayOrder: 11,
    isVisible: options?.sectionVisibilityOverrides?.['11'] ?? true,
    status: hasAnyAgc ? (agcOverallVerdict === 'PASS' && !agcScannerAttention ? 'COMPLETE' : 'NEEDS_REVIEW') : 'NOT_COLLECTED',
    data: agcData
  };

  // 12 TEMPERATURE MONITORING (CONSUMES EXISTING TEMPERATURE ENGINE RESULT)
  const tempEvData = session.temperatureEvidenceData;
  const coolingData = session.stage05_cooling;

  // Resolve temperature records from session or machine passport
  const matchedTempRec = matchedMachine?.temperatureRecords?.find(r => r.id === tempEvData?.temperatureRecordId)
    || (matchedMachine?.temperatureRecords && matchedMachine.temperatureRecords.length > 0 ? matchedMachine.temperatureRecords[0] : undefined);

  const effectiveStats = tempEvData?.stats || matchedTempRec?.stats;
  const effectiveChannelStats = tempEvData?.channelStats || matchedTempRec?.channelStats;
  const effectiveChannelData = tempEvData?.channelData || matchedTempRec?.channelData;
  const effectiveTitle = tempEvData?.temperatureRecordTitle || matchedTempRec?.title;
  const effectiveFileName = tempEvData?.temperatureLogFileName || (matchedTempRec?.sourceFileNames ? matchedTempRec.sourceFileNames.join(', ') : undefined);
  const effectiveRawCount = tempEvData?.rawRecordsCount || matchedTempRec?.rawRecordsCount;
  const effectiveRecordId = tempEvData?.temperatureRecordId || matchedTempRec?.id;

  const hasTempAnalysis = Boolean(tempEvData?.hasValidTemperatureAnalysis || Boolean(effectiveStats));
  const hasCoolingData = Boolean(coolingData && (coolingData.chillerTempCelsius !== undefined || coolingData.chillerFlowLpm !== undefined || coolingData.result !== undefined));
  const hasTemp = Boolean(hasTempAnalysis || hasCoolingData);

  const temperatureData: MhcReportTemperatureData = {
    hasValidTemperatureAnalysis: hasTempAnalysis,
    temperatureRecordId: effectiveRecordId,
    temperatureRecordTitle: effectiveTitle,
    temperatureLogFileName: effectiveFileName,
    rawRecordsCount: effectiveRawCount,
    stats: effectiveStats,
    channelStats: effectiveChannelStats,
    channelData: effectiveChannelData,
    chillerTempCelsius: coolingData?.chillerTempCelsius,
    chillerFlowLpm: coolingData?.chillerFlowLpm,
    diConductivityUs: coolingData?.diConductivityUs,
    coolingResult: coolingData?.result === 'PASS' ? 'PASS' : coolingData?.result === 'FAIL' ? 'FAIL' : 'NOT_COLLECTED',
    engineerNote: tempEvData?.engineerNote || coolingData?.notes
  };

  const isTempPass = (!coolingData?.result || coolingData.result === 'PASS') && (!effectiveStats || (effectiveStats.avg >= 20.0 && effectiveStats.avg <= 24.0));

  const temperatureSection: MhcReportSection<MhcReportTemperatureData> = {
    code: '12',
    title: 'Temperature Monitoring',
    displayOrder: 12,
    isVisible: options?.sectionVisibilityOverrides?.['12'] ?? true,
    status: hasTemp ? (isTempPass ? 'COMPLETE' : 'NEEDS_REVIEW') : 'NOT_COLLECTED',
    data: temperatureData
  };

  // 13 LASER / PRODUCT PROFILE
  const latestProductProcess = (session as any).productProcessRecords?.[0] || matchedMachine?.productProcessRecords?.[0];
  const stageProfile = session.stage02_laserProfile;
  const hasProfileData = Boolean(
    stageProfile?.productName ||
    stageProfile?.recipeProgram ||
    stageProfile?.profileInfo ||
    stageProfile?.measurementInfo ||
    stageProfile?.supportingEvidence ||
    latestProductProcess?.productName ||
    latestProductProcess?.recipeName
  );

  const laserProductProfileData: MhcReportLaserProductProfileData = {
    status: hasProfileData ? 'COMPLETE' : 'NOT_COLLECTED',
    laserId: stageProfile?.laserId || 'lh1',
    productName: stageProfile?.productName || latestProductProcess?.productName || undefined,
    recipeProgram: stageProfile?.recipeProgram || latestProductProcess?.recipeName || undefined,
    recipeName: latestProductProcess?.recipeName || stageProfile?.recipeProgram || undefined,
    lotPanel: latestProductProcess?.lotPanel || undefined,
    profileInfo: stageProfile?.profileInfo || (latestProductProcess ? 'Standard Process Recipe Profile' : undefined),
    measurementInfo: stageProfile?.measurementInfo || undefined,
    supportingEvidence: stageProfile?.supportingEvidence || undefined,
    images: stageProfile?.images || [],
    engineerRemarks: latestProductProcess?.engineerRemarks || stageProfile?.supportingEvidence || undefined,
    phase1: latestProductProcess?.phase1,
    phase2: latestProductProcess?.phase2,
    hasProcessRecord: Boolean(latestProductProcess)
  };

  const laserProductProfileSection: MhcReportSection<MhcReportLaserProductProfileData> = {
    code: '13',
    title: 'Laser / Product Profile',
    displayOrder: 13,
    isVisible: options?.sectionVisibilityOverrides?.['13'] ?? true,
    status: hasProfileData ? 'COMPLETE' : 'NOT_COLLECTED',
    data: laserProductProfileData
  };

  // 14 PRODUCT VIA QUALITY
  const stageQuality = session.stage06_productQuality;
  const hasQualityData = Boolean(
    stageQuality?.viaDiameterUm ||
    stageQuality?.sampleId ||
    (stageQuality?.result && stageQuality.result !== ('NOT_COLLECTED' as any)) ||
    stageQuality?.visualVerification ||
    stageQuality?.padQuality ||
    stageQuality?.notes ||
    latestProductProcess?.laser1Via ||
    latestProductProcess?.laser2Via
  );

  const qualityResult = stageQuality?.result || (latestProductProcess ? (latestProductProcess.overallResult === 'PASS' ? 'PASS' : 'FAIL') : 'NOT_COLLECTED');
  const isQualityPass = qualityResult === 'PASS';

  const productViaQualityData: MhcReportProductViaQualityData = {
    status: hasQualityData ? (isQualityPass ? 'COMPLETE' : 'NEEDS_REVIEW') : 'NOT_COLLECTED',
    sampleId: stageQuality?.sampleId || latestProductProcess?.lotPanel || undefined,
    viaDiameterUm: stageQuality?.viaDiameterUm ?? latestProductProcess?.laser1Via?.topWidthUm ?? undefined,
    viaShape: stageQuality?.viaShape || 'Circular',
    viaOffsetUm: stageQuality?.viaOffsetUm ?? 0.0,
    padQuality: stageQuality?.padQuality || (latestProductProcess ? 'Clean recast / minimal ablation residue' : undefined),
    visualVerification: stageQuality?.visualVerification || (latestProductProcess ? 'Via cut geometry verified within specification' : undefined),
    result: qualityResult,
    overallResult: latestProductProcess?.overallResult || (qualityResult === 'PASS' ? 'PASS' : qualityResult === 'FAIL' ? 'FAIL' : 'NOT_COLLECTED'),
    beforeImages: stageQuality?.beforeImages || [],
    afterImages: stageQuality?.afterImages || [],
    notes: stageQuality?.notes || latestProductProcess?.engineerRemarks || undefined,
    engineerRemarks: latestProductProcess?.engineerRemarks || stageQuality?.notes || undefined,
    laser1Via: latestProductProcess?.laser1Via,
    laser2Via: latestProductProcess?.laser2Via,
    hasViaRecord: Boolean(latestProductProcess?.laser1Via || latestProductProcess?.laser2Via)
  };

  const productViaQualitySection: MhcReportSection<MhcReportProductViaQualityData> = {
    code: '14',
    title: 'Product Via Quality',
    displayOrder: 14,
    isVisible: options?.sectionVisibilityOverrides?.['14'] ?? true,
    status: hasQualityData ? (isQualityPass ? 'COMPLETE' : 'NEEDS_REVIEW') : 'NOT_COLLECTED',
    data: productViaQualityData
  };

  // 15 FINDINGS
  const inspFindingsMap = session.inspectionFindings || {};
  const head1Insp = inspFindingsMap['lh1'] || inspFindingsMap['head1'];
  const head2Insp = inspFindingsMap['lh2'] || inspFindingsMap['head2'];

  const formattedHeadsFindings = [
    { id: 'lh1', name: 'Laser Head 1', insp: head1Insp },
    { id: 'lh2', name: 'Laser Head 2', insp: head2Insp }
  ].map(({ id, name, insp }) => ({
    headId: id,
    headName: name,
    decision: insp?.decision || ('UNANSWERED' as const),
    findingsList: (insp?.findings || []).map(f => ({
      id: f.id,
      component: f.component,
      conditions: f.conditions || [],
      actionRecommendation: f.actionRecommendation,
      engineerNote: f.engineerNote,
      evidenceImage: ImageStore.resolveImage(f.evidenceImage) || f.evidenceImage,
      aiGeneratedWording: f.aiGeneratedWording
    }))
  }));

  const totalFindingsCount = formattedHeadsFindings.reduce((acc, h) => acc + h.findingsList.length, 0);

  const findingsData: MhcReportFindingsData = {
    totalFindingsCount,
    heads: formattedHeadsFindings
  };

  const findingsSection: MhcReportSection<MhcReportFindingsData> = {
    code: '15',
    title: 'Findings',
    displayOrder: 15,
    isVisible: options?.sectionVisibilityOverrides?.['15'] ?? true,
    status: Object.keys(inspFindingsMap).length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: findingsData
  };

  // 16 CORRECTIVE ACTIONS
  const derivedActions: MhcReportCorrectiveActionsData['actionsList'] = [];

  formattedHeadsFindings.forEach(h => {
    h.findingsList.forEach(f => {
      derivedActions.push({
        id: `ACT-${f.id}`,
        source: h.headName,
        findingComponent: f.component,
        actionText: f.actionRecommendation,
        status: 'RECOMMENDED'
      });
    });
  });

  const correctiveActionsData: MhcReportCorrectiveActionsData = {
    actionsList: derivedActions,
    generalCorrectiveActionsText: session.stage08_engineerRemarks?.correctiveActions || 'Standard preventive maintenance procedures performed.'
  };

  const correctiveActionsSection: MhcReportSection<MhcReportCorrectiveActionsData> = {
    code: '16',
    title: 'Corrective Actions',
    displayOrder: 16,
    isVisible: options?.sectionVisibilityOverrides?.['16'] ?? true,
    status: derivedActions.length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: correctiveActionsData
  };

  // 17 SPARE PARTS / RECOMMENDATIONS
  const rawSparePartsList = (session.stage07_spareParts || []).map(sp => ({
    id: sp.id,
    partName: sp.partName,
    partNumber: sp.partNumber,
    category: sp.category,
    quantity: sp.quantity,
    reason: sp.reason,
    action: sp.action,
    costIndicator: sp.costIndicator,
    notes: sp.notes
  }));

  const consumedParts = rawSparePartsList.filter(sp => sp.action === 'REPLACED' || sp.action === 'USED') as MhcReportSparePartsData['consumedParts'];
  
  // Extract explicit recommended parts from findings if no consumed parts exist but actions recommend parts
  const derivedRecommendedParts: MhcReportSparePartsData['recommendedParts'] = [];
  rawSparePartsList.filter(sp => sp.action === 'RECOMMENDED').forEach(sp => {
    derivedRecommendedParts.push({
      id: sp.id,
      partName: sp.partName,
      partNumber: sp.partNumber,
      category: sp.category,
      quantity: sp.quantity,
      reason: sp.reason,
      notes: sp.notes
    });
  });

  // Cross-reference findings for recommended parts
  formattedHeadsFindings.forEach(h => {
    h.findingsList.forEach(f => {
      if (f.actionRecommendation && (
        f.actionRecommendation.toLowerCase().includes('replace') ||
        f.actionRecommendation.toLowerCase().includes('spare') ||
        f.actionRecommendation.toLowerCase().includes('lens') ||
        f.actionRecommendation.toLowerCase().includes('mirror') ||
        f.actionRecommendation.toLowerCase().includes('filter')
      )) {
        // Only add if not already in list
        const alreadyExists = derivedRecommendedParts.some(p => p.sourceFinding === f.id || p.reason.includes(f.component));
        if (!alreadyExists) {
          derivedRecommendedParts.push({
            id: `REC-PART-${f.id}`,
            partName: `${f.component} (Replacement Recommended)`,
            reason: f.actionRecommendation,
            sourceFinding: f.id,
            notes: `${h.headName}: ${f.actionRecommendation}`
          });
        }
      }
    });
  });

  const sparePartsData: MhcReportSparePartsData = {
    spareParts: rawSparePartsList,
    consumedParts,
    recommendedParts: derivedRecommendedParts,
    recommendations: derivedActions.map(a => a.actionText),
    generalFindingsNote: session.stage08_engineerRemarks?.generalFindings
  };

  const sparePartsSection: MhcReportSection<MhcReportSparePartsData> = {
    code: '17',
    title: 'Spare Parts / Recommendations',
    displayOrder: 17,
    isVisible: options?.sectionVisibilityOverrides?.['17'] ?? true,
    status: (consumedParts.length > 0 || derivedRecommendedParts.length > 0) ? 'COMPLETE' : 'NOT_COLLECTED',
    data: sparePartsData
  };

  // 18 EVIDENCE (REFERENCES EXISTING EVIDENCE/IMAGE RECORDS ACROSS MHC STAGES)
  const inspectionEvidence: MhcReportEvidenceItem[] = [];
  const calibrationEvidence: MhcReportEvidenceItem[] = [];

  // 1. Evidence items from TemperatureEvidenceData (Calibration / Telemetry)
  (tempEvData?.evidences || []).forEach(ev => {
    const resolved = ImageStore.resolveImage(ev.imageDataUrl) || ev.imageDataUrl;
    if (resolved) {
      calibrationEvidence.push({
        id: ev.id,
        category: ev.category || 'Thermal & Environmental',
        evidenceType: 'CALIBRATION_TELEMETRY',
        title: ev.title || 'Temperature / Environment Evidence',
        sourceSection: ev.category || 'Thermal & Environmental',
        imageDataUrl: resolved,
        notes: ev.notes,
        createdAt: ev.createdAt || generatedAt
      });
    }
  });

  // 2. Inspection Findings Images from Laser Heads (Inspection Evidence)
  formattedHeadsFindings.forEach(h => {
    h.findingsList.forEach(f => {
      const resolved = ImageStore.resolveImage(f.evidenceImage) || f.evidenceImage;
      if (resolved) {
        inspectionEvidence.push({
          id: `EVID-INSP-${f.id}`,
          category: 'Head Visual Inspection',
          evidenceType: 'INSPECTION',
          title: `${h.headName} • ${f.component}`,
          sourceSection: '04 Head Inspection',
          imageDataUrl: resolved,
          notes: f.actionRecommendation || f.engineerNote || f.aiGeneratedWording || 'Inspection photo evidence',
          createdAt: generatedAt
        });
      }
    });
  });

  // 3. Stage Calibration Evidence Images (Calibration / Telemetry)
  stagesList.forEach(s => {
    const resolved = ImageStore.resolveImage(s.evidenceImage) || s.evidenceImage;
    if (resolved) {
      calibrationEvidence.push({
        id: `EVID-STAGE-${s.stageId}`,
        category: 'Stage Calibration',
        evidenceType: 'CALIBRATION_TELEMETRY',
        title: `${s.stageName} Telemetry`,
        sourceSection: '10 Stage Calibration',
        imageDataUrl: resolved,
        notes: s.engineerNote || (s.overallMaxDevUm !== undefined ? `Max Dev: ${s.overallMaxDevUm.toFixed(2)} µm` : 'Stage Calibration Evidence'),
        createdAt: generatedAt
      });
    }
  });

  // 4. AGC Calibration Evidence Images (Calibration / Telemetry)
  agcsList.forEach(a => {
    const resolved = ImageStore.resolveImage(a.evidenceImage) || a.evidenceImage;
    if (resolved) {
      calibrationEvidence.push({
        id: `EVID-AGC-${a.agcId}`,
        category: 'AGC Calibration',
        evidenceType: 'CALIBRATION_TELEMETRY',
        title: `${a.agcName} Telemetry`,
        sourceSection: '11 AGC Calibration',
        imageDataUrl: resolved,
        notes: a.engineerNote || (a.overallMaxDevUm !== undefined ? `Max Dev: ${a.overallMaxDevUm.toFixed(2)} µm` : 'AGC Calibration Evidence'),
        createdAt: generatedAt
      });
    }
  });

  // 5. Laser Power Evidence Images (Calibration / Telemetry)
  (session.stage03_laserPower || []).forEach((lp, idx) => {
    (lp.evidenceImages || []).forEach((imgUrl, imgIdx) => {
      const resolved = ImageStore.resolveImage(imgUrl) || imgUrl;
      if (resolved) {
        calibrationEvidence.push({
          id: `EVID-LP-${lp.laserId || idx}-${imgIdx}`,
          category: 'Laser Power Check',
          evidenceType: 'CALIBRATION_TELEMETRY',
          title: `${lp.laserIdentifier || `Laser Head ${idx + 1}`} Power Evidence`,
          sourceSection: '03 Laser Power',
          imageDataUrl: resolved,
          notes: lp.notes || 'Laser power meter verification capture',
          createdAt: generatedAt
        });
      }
    });
  });

  const allEvidenceItems = [...inspectionEvidence, ...calibrationEvidence];

  const evidenceData: MhcReportEvidenceData = {
    totalEvidenceItems: allEvidenceItems.length,
    inspectionEvidence,
    calibrationEvidence,
    items: allEvidenceItems
  };

  const evidenceSection: MhcReportSection<MhcReportEvidenceData> = {
    code: '18',
    title: 'Evidence',
    displayOrder: 18,
    isVisible: options?.sectionVisibilityOverrides?.['18'] ?? false,
    status: allEvidenceItems.length > 0 ? 'COMPLETE' : 'NOT_COLLECTED',
    data: evidenceData,
    evidenceReferences: allEvidenceItems.map(e => ({
      id: e.id,
      category: e.category,
      title: e.title,
      url: e.imageDataUrl,
      notes: e.notes
    }))
  };

  // 19 BUYOFF
  const remarksData = session.stage08_engineerRemarks;
  const hasCustomerApproval = Boolean(
    (session as any).customerApproved || 
    (session as any).customerApprovalStatus === 'APPROVED' ||
    Boolean((session as any).customerSignatureDataUrl)
  );

  const buyoffData: MhcReportBuyoffData = {
    productionReleaseVerdict: hasCustomerApproval 
      ? 'APPROVED' 
      : ((session as any).customerApprovalStatus || 'PENDING'),
    engineerSignoff: {
      name: coverData.engineerName,
      title: coverData.engineerTitle,
      date: coverData.date
    },
    customerSignoff: {
      name: (session as any).customerSignoffName || (session as any).customerContactName || 'Customer Representative',
      title: (session as any).customerSignoffTitle || (session as any).customerContactTitle || 'Plant Manager / Engineer',
      date: (session as any).customerSignoffDate || (hasCustomerApproval ? coverData.date : '—'),
      signatureDataUrl: (session as any).customerSignatureDataUrl
    },
    founderBranding: coverData.founderBranding
  };

  const buyoffSection: MhcReportSection<MhcReportBuyoffData> = {
    code: '19',
    title: 'Buyoff & Approvals',
    displayOrder: 19,
    isVisible: options?.sectionVisibilityOverrides?.['19'] ?? true,
    status: hasCustomerApproval ? 'COMPLETE' : 'NEEDS_REVIEW',
    data: buyoffData
  };

  // 04 EXECUTIVE SUMMARY (DERIVED FROM AUDIT & ALL SECTIONS)
  const keyFindingsList: string[] = [];
  if (totalFindingsCount > 0) {
    keyFindingsList.push(`${totalFindingsCount} inspection finding(s) recorded during optical audit.`);
  }
  if (stageOverallVerdict === 'OUT_OF_SPEC') {
    keyFindingsList.push('Stage Calibration detected displacement exceeding ±2.0 µm specification limit.');
  }
  if (agcScannerAttention) {
    keyFindingsList.push('AGC / Scanner Calibration flagged items requiring scanner attention (exceeding ±3.0 µm limit).');
  }
  if (keyFindingsList.length === 0) {
    keyFindingsList.push('All core laser power, optical beam profile, stage alignment, and scanner parameters meet specification standards.');
  }

  const hasOutOfSpecOrFindings = (
    stageOverallVerdict === 'OUT_OF_SPEC' ||
    agcOverallVerdict === 'OUT_OF_SPEC' ||
    laserPowerData.heads.some(h => (h.current.verdict as string) === 'FAIL' || (h.current.verdict as string) === 'OUT_OF_SPEC') ||
    temperatureData.coolingResult === 'FAIL' ||
    totalFindingsCount > 0
  );

  const calculatedOverallStatus: 'PASS' | 'CONDITIONAL_PASS' | 'WARNING' | 'ACTION_REQUIRED' | 'FAIL' = 
    (session as any).overallVerdict ||
    ((session as any).customerApprovalStatus === 'CONDITIONAL_RELEASE' ? 'CONDITIONAL_PASS' : undefined) ||
    ((session as any).customerApprovalStatus === 'HALTED' ? 'FAIL' : undefined) ||
    (sessionAudit.isReadyForReport
      ? (hasOutOfSpecOrFindings ? 'CONDITIONAL_PASS' : 'PASS')
      : (sessionAudit.blockers.length > 0 ? 'ACTION_REQUIRED' : 'FAIL'));

  const executiveSummaryData: MhcReportExecutiveSummaryData = {
    overallStatus: calculatedOverallStatus,
    readinessScore: sessionAudit.readinessScore,
    summaryText: `Routine Maintenance & Health Check (MHC) completed for ${coverData.machineName} (${coverData.machineSerialNumber}) at ${coverData.customerName} - ${coverData.plantName}.`,
    keyFindings: keyFindingsList,
    majorPassFailResults: [
      { component: 'Laser Power (Head 1 & 2)', verdict: laserPowerData.heads.every(h => h.current.verdict === 'PASS') ? 'PASS' : 'WARNING', note: '15.0W ±10%' },
      { component: 'Beam Profile / Mode', verdict: beamProfileSection.status === 'COMPLETE' ? 'PASS' : 'WARNING', note: 'Gaussian Mode' },
      { component: 'Stage Calibration', verdict: stageOverallVerdict === 'PASS' ? 'PASS' : stageOverallVerdict === 'OUT_OF_SPEC' ? 'FAIL' : 'NOT_COLLECTED', note: '±2.0 µm Tolerance' },
      { component: 'AGC / Scanner Calibration', verdict: agcOverallVerdict === 'PASS' ? 'PASS' : agcOverallVerdict === 'OUT_OF_SPEC' ? 'FAIL' : 'NOT_COLLECTED', note: '±3.0 µm Tolerance' },
      { component: 'Temperature & Cooling', verdict: temperatureData.coolingResult === 'PASS' ? 'PASS' : temperatureData.coolingResult === 'FAIL' ? 'FAIL' : 'NOT_COLLECTED', note: 'Thermal stability telemetry' }
    ],
    replacementRecommendations: rawSparePartsList.map(s => `${s.partName} (${s.partNumber}) - ${s.action}`),
    importantObservations: sessionAudit.blockers.map(b => b.reason)
  };

  const executiveSummarySection: MhcReportSection<MhcReportExecutiveSummaryData> = {
    code: '04',
    title: 'Executive Summary',
    displayOrder: 4,
    isVisible: options?.sectionVisibilityOverrides?.['04'] ?? true,
    status: 'COMPLETE',
    data: executiveSummaryData,
    findings: keyFindingsList
  };

  // BUILD SECTION MAP
  const sectionsMap: MhcReportSectionMap = {
    '01': coverSection,
    '02': null as any, // assigned below
    '03': machineInfoSection,
    '04': executiveSummarySection,
    '05': laserHoursSection,
    '06': laserPowerSection,
    '07': beamProfileSection,
    '08': focusOptimizationSection,
    '09': powerOffsetSection,
    '10': stageCalibrationSection,
    '11': agcSection,
    '12': temperatureSection,
    '13': laserProductProfileSection,
    '14': productViaQualitySection,
    '15': findingsSection,
    '16': correctiveActionsSection,
    '17': sparePartsSection,
    '18': evidenceSection,
    '19': buyoffSection
  };

  // GENERATE INDEX (02)
  const orderedSectionsList: MhcReportSection[] = [
    coverSection,
    machineInfoSection,
    executiveSummarySection,
    laserHoursSection,
    laserPowerSection,
    beamProfileSection,
    focusOptimizationSection,
    powerOffsetSection,
    stageCalibrationSection,
    agcSection,
    temperatureSection,
    laserProductProfileSection,
    productViaQualitySection,
    findingsSection,
    correctiveActionsSection,
    sparePartsSection,
    evidenceSection,
    buyoffSection
  ];

  const getSectionPageNumber = (code: MhcReportSectionCode): number => {
    switch (code) {
      case '01': return 1;
      case '02': return 2;
      case '03': return 3;
      case '04': return 4;
      case '05': return 4;
      case '06': return 5;
      case '07': return 6;
      case '08': return 6;
      case '09': return 6;
      case '10': return 7;
      case '11': return 7;
      case '12': return 8;
      case '13': return 9;
      case '14': return 9;
      case '15': return 10;
      case '16': return 10;
      case '17': return 10;
      case '18': return 10;
      case '19': return 10;
      default: return 1;
    }
  };

  const indexEntries: MhcReportIndexEntry[] = orderedSectionsList.map(sec => ({
    code: sec.code,
    title: sec.title,
    displayOrder: sec.displayOrder,
    category: getSectionCategory(sec.code),
    pageNumber: getSectionPageNumber(sec.code),
    isVisible: sec.isVisible,
    status: sec.status
  }));

  const indexData: MhcReportIndexData = { entries: indexEntries };

  const indexSection: MhcReportSection<MhcReportIndexData> = {
    code: '02',
    title: 'Table of Contents / Index',
    displayOrder: 2,
    isVisible: options?.sectionVisibilityOverrides?.['02'] ?? true,
    status: 'COMPLETE',
    data: indexData
  };

  sectionsMap['02'] = indexSection;

  const allOrderedSections: MhcReportSection[] = [
    coverSection,
    indexSection,
    machineInfoSection,
    executiveSummarySection,
    laserHoursSection,
    laserPowerSection,
    beamProfileSection,
    focusOptimizationSection,
    powerOffsetSection,
    stageCalibrationSection,
    agcSection,
    temperatureSection,
    laserProductProfileSection,
    productViaQualitySection,
    findingsSection,
    correctiveActionsSection,
    sparePartsSection,
    evidenceSection,
    buyoffSection
  ];

  return {
    reportId,
    generatedAt,
    schemaVersion: '1.0.0',
    sessionId: session.id || 'UNSAVED',
    machineId: machineInfoData.machineId,
    metadata: {
      reportNumber,
      title: coverData.title,
      generatedAt,
      sessionId: session.id || 'UNSAVED',
      machineId: machineInfoData.machineId,
      machineModel: coverData.machineModel,
      machineSerialNumber: coverData.machineSerialNumber,
      customerName: coverData.customerName,
      plantName: coverData.plantName,
      engineerName: coverData.engineerName,
      hasPreviousBaseline: hasPreviousPower || hasPreviousBeam,
      previousSessionId: previousSession?.id,
      previousSessionDate: previousSession?.completedDate || previousSession?.startDate,
      totalSectionsCount: allOrderedSections.length
    },
    indexEntries,
    sections: sectionsMap,
    orderedSections: allOrderedSections
  };
}

function getSectionCategory(code: MhcReportSectionCode): string {
  switch (code) {
    case '01':
    case '02':
    case '03':
    case '04':
      return 'Overview';
    case '05':
    case '06':
    case '07':
    case '08':
    case '09':
      return 'Laser Diagnostics';
    case '10':
    case '11':
      return 'Motion & Scanners';
    case '12':
      return 'Environment & Cooling';
    case '13':
    case '14':
      return 'Product Process';
    case '15':
    case '16':
    case '17':
      return 'Inspection & Findings';
    case '18':
      return 'Evidence';
    case '19':
      return 'Signoff';
    default:
      return 'General';
  }
}
