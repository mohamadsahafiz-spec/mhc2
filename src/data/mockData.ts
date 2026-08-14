import { 
  Customer, 
  Plant, 
  ProductionLine, 
  Machine, 
  Contract, 
  ExecutionScheduleItem, 
  MHCRecord, 
  ExecutiveReport, 
  QualityInvestigation, 
  BaselineCheck, 
  FieldEngineerTask, 
  AlertItem,
  EngineerProfile,
  NotificationItem,
  SystemUser,
  MHCSession,
  MHCReportDraftConfig
} from '../types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'TSMC Microelectronics Fab 18',
    industry: 'Semiconductor Wafer Dicing & Annealing',
    contactPerson: 'Dr. Marcus Vance (Director of Litho Ops)',
    email: 'm.vance@tsmc.fab18.com',
    phone: '+886 6 505 1000',
    plantsCount: 2,
    activeContractsCount: 2
  },
  {
    id: 'cust-2',
    name: 'Hyundai Heavy Photonics Division',
    industry: 'Automotive Precision Laser Welding',
    contactPerson: 'Park Jin-Woo (Senior Lead Engineer)',
    email: 'jinwoo.park@hyundai-laser.com',
    phone: '+82 52 202 2114',
    plantsCount: 3,
    activeContractsCount: 1
  },
  {
    id: 'cust-3',
    name: 'ASML Advanced Optics Cleanroom',
    industry: 'EUV & Deep UV Optics Calibration',
    contactPerson: 'Sophie De Vries (Maintenance Manager)',
    email: 's.devries@asml.optics.nl',
    phone: '+31 40 268 3000',
    plantsCount: 1,
    activeContractsCount: 1
  }
];

export const INITIAL_PLANTS: Plant[] = [
  {
    id: 'plant-1',
    customerId: 'cust-1',
    customerName: 'TSMC Microelectronics Fab 18',
    name: 'Tainan Cleanroom Fab 18A',
    location: 'Tainan Science Park, Taiwan',
    timezone: 'Asia/Taipei (UTC+8)',
    linesCount: 4,
    machinesCount: 6
  },
  {
    id: 'plant-2',
    customerId: 'cust-2',
    customerName: 'Hyundai Heavy Photonics Division',
    name: 'Ulsan Plant 3 (EV Chassis Line)',
    location: 'Ulsan, South Korea',
    timezone: 'Asia/Seoul (UTC+9)',
    linesCount: 3,
    machinesCount: 5
  },
  {
    id: 'plant-3',
    customerId: 'cust-3',
    customerName: 'ASML Advanced Optics Cleanroom',
    name: 'Veldhoven Metrology Complex',
    location: 'Veldhoven, Netherlands',
    timezone: 'Europe/Amsterdam (UTC+1)',
    linesCount: 2,
    machinesCount: 4
  }
];

export const INITIAL_LINES: ProductionLine[] = [
  {
    id: 'line-1',
    plantId: 'plant-1',
    plantName: 'Tainan Cleanroom Fab 18A',
    name: 'Line 4 - Sub-3nm Silicon Annealing',
    code: 'LINE-TAI-04',
    description: 'Ultra-high precision 1064nm Fiber Laser Annealing System',
    criticality: 'CRITICAL'
  },
  {
    id: 'line-2',
    plantId: 'plant-2',
    plantName: 'Ulsan Plant 3 (EV Chassis Line)',
    name: 'Line B - Aluminum Battery Tray Welding',
    code: 'LINE-ULS-02',
    description: 'High Power 6kW Disk Laser Robotic Welding Station',
    criticality: 'HIGH'
  },
  {
    id: 'line-3',
    plantId: 'plant-3',
    plantName: 'Veldhoven Metrology Complex',
    name: 'Line 1 - Metrology Mirror Laser Trimming',
    code: 'LINE-VEL-01',
    description: 'Femtosecond Ultrafast Laser Surface Structuring System',
    criticality: 'CRITICAL'
  }
];

export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'mch-101',
    customerId: 'cust-1',
    customerName: 'TSMC Microelectronics Fab 18',
    plantId: 'plant-1',
    plantName: 'Tainan Cleanroom Fab 18A',
    productionLineId: 'line-1',
    productionLineName: 'Line 4 - Sub-3nm Silicon Annealing',
    model: 'TRUMPF TruMicro 7000 Series',
    machineNumber: 'MCH-TSMC-01',
    serialNumber: 'SN-TRU-8849201-A',
    installationDate: '2023-03-15',
    baselineDate: '2023-03-20',
    healthScore: 94,
    status: 'OPERATIONAL',
    photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
    ],
    lastMhcDate: '2026-05-12',
    nextMhcDate: '2026-08-12',
    laserHeads: [
      {
        id: 'lh-101-1',
        model: 'TruMicro 7070 Ultrafast Head A',
        serialNumber: 'LH-9041-A',
        runningHours: 8420,
        maxRecommendedHours: 10000,
        remainingHours: 1580,
        estimatedReplacementDate: '2026-11-15',
        powerOutputWatts: 250,
        ratedPowerWatts: 250,
        wavelengthNm: 1030,
        beamQualityM2: 1.15,
        healthScore: 92
      },
      {
        id: 'lh-101-2',
        model: 'TruMicro 7070 Ultrafast Head B',
        serialNumber: 'LH-9041-B',
        runningHours: 9680,
        maxRecommendedHours: 10000,
        remainingHours: 320,
        estimatedReplacementDate: '2026-08-28',
        powerOutputWatts: 242,
        ratedPowerWatts: 250,
        wavelengthNm: 1030,
        beamQualityM2: 1.22,
        healthScore: 78
      }
    ],
    consumables: [
      {
        id: 'con-1',
        name: 'Quartz Protection Window Cap',
        partNumber: 'P0592-8812',
        currentLifePercent: 88,
        lastReplacedDate: '2026-04-10',
        estimatedDaysRemaining: 110,
        status: 'OPTIMAL'
      },
      {
        id: 'con-2',
        name: 'Deionized Water Cooling Filter Cartridge',
        partNumber: 'FILT-DI-405',
        currentLifePercent: 18,
        lastReplacedDate: '2025-10-15',
        estimatedDaysRemaining: 12,
        status: 'CRITICAL_REPLACE'
      },
      {
        id: 'con-3',
        name: 'N2 Gas Purge Nozzle Assembly',
        partNumber: 'NOZ-PURGE-99',
        currentLifePercent: 64,
        lastReplacedDate: '2026-01-20',
        estimatedDaysRemaining: 75,
        status: 'OPTIMAL'
      }
    ]
  },
  {
    id: 'mch-102',
    customerId: 'cust-2',
    customerName: 'Hyundai Heavy Photonics Division',
    plantId: 'plant-2',
    plantName: 'Ulsan Plant 3 (EV Chassis Line)',
    productionLineId: 'line-2',
    productionLineName: 'Line B - Aluminum Battery Tray Welding',
    model: 'IPG YLS-6000 High Power Fiber Laser',
    machineNumber: 'MCH-HYUN-02',
    serialNumber: 'SN-IPG-6000-881',
    installationDate: '2024-01-10',
    baselineDate: '2024-01-18',
    healthScore: 76,
    status: 'NEEDS_CALIBRATION',
    photos: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
    ],
    lastMhcDate: '2026-04-18',
    nextMhcDate: '2026-07-18',
    laserHeads: [
      {
        id: 'lh-102-1',
        model: 'IPG High-Duty Fiber Cable & Feeding Head',
        serialNumber: 'LH-IPG-8801',
        runningHours: 11200,
        maxRecommendedHours: 12000,
        remainingHours: 800,
        estimatedReplacementDate: '2026-09-30',
        powerOutputWatts: 5780,
        ratedPowerWatts: 6000,
        wavelengthNm: 1070,
        beamQualityM2: 2.1,
        healthScore: 74
      }
    ],
    consumables: [
      {
        id: 'con-201',
        name: 'Cover Slide Protective Glass D30',
        partNumber: 'IPG-CS-30',
        currentLifePercent: 32,
        lastReplacedDate: '2026-03-01',
        estimatedDaysRemaining: 25,
        status: 'WARNING'
      },
      {
        id: 'con-202',
        name: 'Chiller Ion Exchange Resin Filter',
        partNumber: 'RES-CHIL-01',
        currentLifePercent: 70,
        lastReplacedDate: '2026-02-14',
        estimatedDaysRemaining: 95,
        status: 'OPTIMAL'
      }
    ]
  },
  {
    id: 'mch-103',
    customerId: 'cust-3',
    customerName: 'ASML Advanced Optics Cleanroom',
    plantId: 'plant-3',
    plantName: 'Veldhoven Metrology Complex',
    productionLineId: 'line-3',
    productionLineName: 'Line 1 - Metrology Mirror Laser Trimming',
    model: 'Coherent Monaco Industrial Femtosecond',
    machineNumber: 'MCH-ASML-01',
    serialNumber: 'SN-COH-MNC-0091',
    installationDate: '2024-06-01',
    baselineDate: '2024-06-05',
    healthScore: 98,
    status: 'OPERATIONAL',
    photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    ],
    lastMhcDate: '2026-06-02',
    nextMhcDate: '2026-09-02',
    laserHeads: [
      {
        id: 'lh-103-1',
        model: 'Monaco 1034-60 Ultra Precision Beam Box',
        serialNumber: 'LH-COH-002',
        runningHours: 3400,
        maxRecommendedHours: 15000,
        remainingHours: 11600,
        estimatedReplacementDate: '2029-02-10',
        powerOutputWatts: 60,
        ratedPowerWatts: 60,
        wavelengthNm: 1034,
        beamQualityM2: 1.08,
        healthScore: 99
      }
    ],
    consumables: [
      {
        id: 'con-301',
        name: 'Femtosecond Precision Window Unit',
        partNumber: 'COH-PW-1034',
        currentLifePercent: 95,
        lastReplacedDate: '2026-06-01',
        estimatedDaysRemaining: 240,
        status: 'OPTIMAL'
      }
    ]
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'cnt-2026-01',
    contractNumber: 'FSC-2025-TSMC-009',
    customerName: 'TSMC Microelectronics Fab 18',
    plantName: 'Tainan Cleanroom Fab 18A',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    durationMonths: 24,
    totalWorkingDays: 522,
    remainingWorkingDays: 110,
    machinesCoveredIds: ['mch-101'],
    engineerAssigned: 'Senior Engineer Sahafiz, Lead Specialist',
    deliverables: [
      'Quarterly 8-Point Machine Health Check (MHC)',
      'Laser Beam Profiling & Power Stability Calibration',
      'Emergency On-Site Response (< 4 hours guarantee)',
      'Consumables Proactive Lifecycle Replacement'
    ],
    quarterlyScheduleCount: 8,
    terms: 'Enterprise SLA Level 1 with 24/7 Remote Diagnostics and On-Site Spare Parts Vault.',
    customNotes: 'Cleanroom ISO Class 4 gowning protocol strictly required before entering Fab 18A Line 4.',
    status: 'ACTIVE',
    progressPercent: 79,
    riskLevel: 'LOW',
    milestones: [
      { id: 'm1', title: 'Year 1 Q1 Baseline & Optics Audit', dueDate: '2025-03-31', completed: true },
      { id: 'm2', title: 'Year 1 Q2 Power Offset Calibration', dueDate: '2025-06-30', completed: true },
      { id: 'm3', title: 'Year 1 Q3 Major Overhaul & Cooling Purge', dueDate: '2025-09-30', completed: true },
      { id: 'm4', title: 'Year 1 Q4 Annual System Audit', dueDate: '2025-12-31', completed: true },
      { id: 'm5', title: 'Year 2 Q1 Stage Precision Verification', dueDate: '2026-03-31', completed: true },
      { id: 'm6', title: 'Year 2 Q2 Mid-Year Laser Head B Diagnostic', dueDate: '2026-06-30', completed: true },
      { id: 'm7', title: 'Year 2 Q3 Laser Head B Pre-Replacement MHC', dueDate: '2026-09-30', completed: false },
      { id: 'm8', title: 'Year 2 Q4 Final Contract Renewal Audit', dueDate: '2026-12-31', completed: false }
    ]
  },
  {
    id: 'cnt-2026-02',
    contractNumber: 'FSC-2025-HYUN-014',
    customerName: 'Hyundai Heavy Photonics Division',
    plantName: 'Ulsan Plant 3 (EV Chassis Line)',
    startDate: '2025-06-01',
    endDate: '2027-05-31',
    durationMonths: 24,
    totalWorkingDays: 520,
    remainingWorkingDays: 215,
    machinesCoveredIds: ['mch-102'],
    engineerAssigned: 'Field Engineer Park Min-Soo',
    deliverables: [
      'Quarterly High Power Laser Calibration',
      'Automated Optics Chiller & Flow Inspection',
      'Bi-annual Galvanometric Stage Realignment'
    ],
    quarterlyScheduleCount: 8,
    terms: 'Standard Heavy Industry SLA with 12-hour response window and dedicated spare parts buffer.',
    customNotes: 'Requires safety helmet, flame-resistant suit, and high-power laser safety goggles.',
    status: 'ACTIVE',
    progressPercent: 58,
    riskLevel: 'MEDIUM',
    milestones: [
      { id: 'm201', title: 'Contract Commencement & Baseline Calibration', dueDate: '2025-06-30', completed: true },
      { id: 'm202', title: 'Q2 Laser Power Output Audit', dueDate: '2025-09-30', completed: true },
      { id: 'm203', title: 'Q3 Chiller Fluid Refresh & Flow Calibration', dueDate: '2025-12-31', completed: true },
      { id: 'm204', title: 'Q4 Annual Robot Laser Joint Inspection', dueDate: '2026-03-31', completed: true },
      { id: 'm205', title: 'Q5 Laser Cable & Beam Delivery Check', dueDate: '2026-06-30', completed: true },
      { id: 'm206', title: 'Q6 High-Power Power Offset Correction', dueDate: '2026-09-30', completed: false }
    ]
  }
];

export const INITIAL_SCHEDULE_ITEMS: ExecutionScheduleItem[] = [
  {
    id: 'sch-101',
    contractId: 'cnt-2026-01',
    customerName: 'TSMC Microelectronics Fab 18',
    plantName: 'Tainan Cleanroom Fab 18A',
    machineId: 'mch-101',
    machineName: 'TRUMPF TruMicro 7000 Series (MCH-TSMC-01)',
    engineerName: 'Sahafiz',
    title: 'Q3 Machine Health Check & Laser Head B Audit',
    scheduledDate: '2026-08-12', // Wednesday
    quarter: 'Q7',
    type: 'QUARTERLY_MHC',
    status: 'SCHEDULED',
    estimatedHours: 6
  },
  {
    id: 'sch-102',
    contractId: 'cnt-2026-01',
    customerName: 'TSMC Microelectronics Fab 18',
    plantName: 'Tainan Cleanroom Fab 18A',
    machineId: 'mch-101',
    machineName: 'TRUMPF TruMicro 7000 Series (MCH-TSMC-01)',
    engineerName: 'Sahafiz',
    title: 'DI Water Cooling Filter Replacement & Flow Test',
    scheduledDate: '2026-08-05', // Wednesday
    quarter: 'Q7',
    type: 'BASELINE_CHECK',
    status: 'SCHEDULED',
    estimatedHours: 3
  },
  {
    id: 'sch-103',
    contractId: 'cnt-2026-02',
    customerName: 'Hyundai Heavy Photonics Division',
    plantName: 'Ulsan Plant 3 (EV Chassis Line)',
    machineId: 'mch-102',
    machineName: 'IPG YLS-6000 High Power Fiber Laser',
    engineerName: 'Park Min-Soo',
    title: 'Power Offset Calibration & Beam Profiling',
    scheduledDate: '2026-08-18', // Tuesday
    quarter: 'Q5',
    type: 'LASER_CALIBRATION',
    status: 'SCHEDULED',
    estimatedHours: 5
  },
  {
    id: 'sch-104',
    contractId: 'cnt-2026-01',
    customerName: 'ASML Advanced Optics Cleanroom',
    plantName: 'Veldhoven Metrology Complex',
    machineId: 'mch-103',
    machineName: 'Coherent Monaco Industrial Femtosecond',
    engineerName: 'Sophie De Vries',
    title: 'Q3 Metrology Mirror Baseline Trimming Audit',
    scheduledDate: '2026-09-02', // Wednesday
    quarter: 'Q7',
    type: 'QUARTERLY_MHC',
    status: 'SCHEDULED',
    estimatedHours: 4
  }
];

export const INITIAL_MHC_RECORDS: MHCRecord[] = [
  {
    id: 'mhc-rec-8801',
    machineId: 'mch-101',
    machineName: 'TRUMPF TruMicro 7000 Series',
    machineSerialNumber: 'SN-TRU-8849201-A',
    customerName: 'TSMC Microelectronics Fab 18',
    plantName: 'Tainan Cleanroom Fab 18A',
    engineerName: 'Sahafiz',
    date: '2026-05-12',
    healthScores: {
      laserHead1: 94,
      laserHead2: 81,
      cooling: 86,
      optics: 95,
      stage: 98,
      agc: 96,
      powerStability: 93,
      beamQuality: 92,
      overallScore: 94
    },
    inspectionData: {
      laserInspection: { status: 'PASS', note: 'All diode laser bars operating within normal drive currents.' },
      opticsInspection: { status: 'PASS', cleanlinessPercent: 96, note: 'Protective window pristine. Slight particulate build-up on purge nozzle.' },
      coolingInspection: { status: 'WARNING', flowRateLpm: 14.2, tempCelsius: 21.8, note: 'Cooling flow rate dropped by 8% due to DI filter saturation.' },
      powerCheck: { measuredWatts: 248, targetWatts: 250, stabilityPercent: 99.2 },
      beamProfile: { beamSizeMm: 1.12, focusOffsetMm: +0.02, symmetryRatio: 0.98 },
      stageCalibration: { xAccuracymm: 0.0012, yAccuracymm: 0.0011, zAccuracymm: 0.0008 },
      agcCalibration: { responseTimeMs: 14, errorMarginPercent: 0.4 }
    },
    engineerRemarks: 'System operating cleanly. Laser Head B reaching 9,680 hours; recommend replacement during Q3 maintenance window.',
    recommendations: [
      'Replace DI Water Filter Cartridge within 14 days',
      'Schedule Laser Head B diode module swap for August 2026',
      'Re-verify beam focus after filter replacement'
    ],
    productionReleaseStatus: 'APPROVED',
    isReportGenerated: true
  }
];

export const INITIAL_EXECUTIVE_REPORTS: ExecutiveReport[] = [
  {
    id: 'rpt-2026-089',
    reportNumber: 'EXECUTIVE-RPT-2026-089',
    mhcId: 'mhc-rec-8801',
    customerName: 'TSMC Microelectronics Fab 18',
    plantName: 'Tainan Cleanroom Fab 18A',
    machineModel: 'TRUMPF TruMicro 7000 Series',
    serialNumber: 'SN-TRU-8849201-A',
    date: '2026-05-12',
    engineerName: 'Sahafiz (Lead Field Engineer)',
    executiveSummary: 'The TRUMPF TruMicro 7000 system passed all critical operational baseline checks with an overall Machine Health Score of 94/100. Laser power stability and galvo stage positioning remain exceptional for sub-3nm annealing. DI cooling filter replacement is required to maintain laminar thermal control.',
    overallHealthScore: 94,
    productionReleaseStatus: 'APPROVED',
    subsystemHealth: {
      laserHead1: 94,
      laserHead2: 81,
      cooling: 86,
      optics: 95,
      stage: 98,
      agc: 96,
      powerStability: 93,
      beamQuality: 92,
      overallScore: 94
    },
    laserRuntimeSummary: {
      runningHours: 8420,
      maxHours: 10000,
      head1Health: 92,
      head2Health: 78
    },
    coolingStatus: 'OPTIMAL THERMAL DELTA (21.8°C / 14.2 LPM). DI FILTER DUE FOR REPLACEMENT.',
    powerStability: 'STABLE (99.2% POWER CONVERGENCE AT 250W TARGET OUTPUT)',
    beamProfileSummary: 'TEM00 GAUSSIAN PROFILE WITH M² = 1.15, EXCELLENT FOCUS ACCURACY',
    powerComparison: {
      baselinePowerWatts: 250,
      currentPowerWatts: 248,
      deltaPercent: -0.8
    },
    engineerRemarks: 'Laser Head A is performing in peak specifications. Laser Head B shows expected diode aging but remains fully functional for operational release.',
    recommendations: [
      'PROACTIVE DI FILTER SWAP BEFORE AUGUST 2026',
      'PREPARE SPARE LASER HEAD B (LH-9041-B) IN FAB CLEANROOM VAULT',
      'MAINTAIN AUTOMATED PURGE FLOW AT 5.0 L/MIN'
    ],
    signatureName: 'Sahafiz',
    signatureTitle: 'Senior Field Service Engineer, Laser Systems',
    signedDate: '2026-05-12'
  }
];

export const INITIAL_TASKS: FieldEngineerTask[] = [
  {
    id: 'task-1',
    title: 'Replace DI Water Cooling Filter Cartridge (FILT-DI-405)',
    machineName: 'TRUMPF TruMicro 7000 Series (MCH-TSMC-01)',
    customerName: 'TSMC Microelectronics Fab 18',
    priority: 'URGENT',
    dueDate: 'Today (Aug 5)',
    type: 'CONSUMABLE_REPLACE',
    completed: false
  },
  {
    id: 'task-2',
    title: 'Perform Q3 Machine Health Check & Laser Beam Profiling',
    machineName: 'TRUMPF TruMicro 7000 Series (MCH-TSMC-01)',
    customerName: 'TSMC Microelectronics Fab 18',
    priority: 'HIGH',
    dueDate: 'Aug 12, 2026',
    type: 'MHC',
    completed: false
  },
  {
    id: 'task-3',
    title: 'Calibrate Power Offset & Fiber Delivery Cable on Line B',
    machineName: 'IPG YLS-6000 High Power Fiber Laser',
    customerName: 'Hyundai Heavy Photonics Division',
    priority: 'HIGH',
    dueDate: 'Aug 18, 2026',
    type: 'CALIBRATION',
    completed: false
  },
  {
    id: 'task-4',
    title: 'Finalize & Sign Executive Engineering Report #EXECUTIVE-RPT-2026-089',
    machineName: 'TRUMPF TruMicro 7000 Series',
    customerName: 'TSMC Microelectronics Fab 18',
    priority: 'NORMAL',
    dueDate: 'Completed',
    type: 'REPORT_PENDING',
    completed: true
  }
];

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'alt-1',
    type: 'CONSUMABLE',
    severity: 'CRITICAL',
    machineId: 'mch-101',
    machineName: 'TRUMPF TruMicro 7000 (MCH-TSMC-01)',
    customerName: 'TSMC Fab 18',
    message: 'DI Water Filter cartridge life at 18% (12 days estimated remaining). Replace to prevent coolant flow restriction.',
    timestamp: '2 hours ago'
  },
  {
    id: 'alt-2',
    type: 'LASER_RUNTIME',
    severity: 'WARNING',
    machineId: 'mch-101',
    machineName: 'TRUMPF TruMicro 7000 (MCH-TSMC-01)',
    customerName: 'TSMC Fab 18',
    message: 'Laser Head B (LH-9041-B) runtime at 9,680 hrs (320 hrs remaining). Pre-order replacement diode module.',
    timestamp: '5 hours ago'
  },
  {
    id: 'alt-3',
    type: 'HEALTH_CRITICAL',
    severity: 'WARNING',
    machineId: 'mch-102',
    machineName: 'IPG YLS-6000 (MCH-HYUN-02)',
    customerName: 'Hyundai Heavy',
    message: 'Machine status marked NEEDS_CALIBRATION due to power output drift (-3.6% power offset).',
    timestamp: '1 day ago'
  }
];

export const INITIAL_QUALITY_INVESTIGATIONS: QualityInvestigation[] = [
  {
    id: 'qi-101',
    ticketNumber: 'QI-2026-041',
    machineId: 'mch-102',
    machineName: 'IPG YLS-6000 High Power Fiber Laser',
    customerName: 'Hyundai Heavy Photonics Division',
    reportedDate: '2026-07-28',
    issueDescription: 'Minor porosity detected in aluminum seam welds on Battery Tray Line B during high-speed 6m/min automated welding run.',
    rootCauseAnalysis: 'Slight beam alignment shift in galvo mirror motor B combined with protective cover glass thermal blooming.',
    correctiveActionsTaken: 'Cleaned protective cover slide, performed power offset recalibration, adjusted galvo motor gain parameters.',
    status: 'INVESTIGATING',
    severity: 'MAJOR',
    engineerAssigned: 'Park Min-Soo'
  }
];

export const INITIAL_BASELINES: BaselineCheck[] = [
  {
    id: 'bl-101',
    machineId: 'mch-101',
    machineName: 'TRUMPF TruMicro 7000 Series',
    date: '2023-03-20',
    engineerName: 'Sahafiz',
    laserPowerBaselineWatts: 250,
    beamDiameterMm: 1.10,
    coolingFlowRateLpm: 15.5,
    stageRepeatabilityMm: 0.0008,
    notes: 'Factory baseline benchmark captured upon Fab 18 cleanroom commission.',
    passed: true
  }
];

import { ReportSectionConfig, ReportTemplate, FounderBrandingConfig, ReportDraft } from '../types';

export const INITIAL_AVAILABLE_SECTIONS: ReportSectionConfig[] = [
  {
    id: 'sec-machine-info',
    sectionType: 'machine_info',
    title: 'Machine Information',
    description: 'Model name, serial number, runtime hours, and cleanroom cell location.',
    category: 'CORE',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true,
    notes: 'Includes hardware serial hash & installation year.'
  },
  {
    id: 'sec-customer-info',
    sectionType: 'customer_info',
    title: 'Customer Information',
    description: 'Facility name, plant location, lead contact, and active contract ID.',
    category: 'CORE',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true,
    notes: 'Auto-synced with Customer Passport database.'
  },
  {
    id: 'sec-visit-summary',
    sectionType: 'visit_summary',
    title: 'Visit Summary',
    description: 'High-level executive briefing answering health score, cause, and actions.',
    category: 'CORE',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true,
    notes: '3-card immediate verdict breakdown for executive review.'
  },
  {
    id: 'sec-machine-passport',
    sectionType: 'machine_passport',
    title: 'Machine Passport Summary',
    description: 'Laser head hours, remaining SLA, and component life metrics.',
    category: 'CORE',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-mhc',
    sectionType: 'mhc',
    title: 'Machine Health Check (MHC)',
    description: '8-subsystem health telemetry breakdown and release verdict.',
    category: 'INSPECTION',
    visible: true,
    pageBreakBefore: true,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-laser-measurements',
    sectionType: 'laser_measurements',
    title: 'Laser Measurements',
    description: 'Power output watts, M² beam quality, and wavelength stability.',
    category: 'INSPECTION',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-baseline-results',
    sectionType: 'baseline_results',
    title: 'Baseline Results Comparison',
    description: 'Historical drift comparison against commissioning factory benchmarks.',
    category: 'INSPECTION',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-quality-investigation',
    sectionType: 'quality_investigation',
    title: 'Quality Investigation',
    description: 'Root cause analysis and corrective measures for open defect tickets.',
    category: 'INSPECTION',
    visible: false,
    pageBreakBefore: false,
    collapsible: true,
    showSectionNumber: true
  },
  {
    id: 'sec-photos',
    sectionType: 'photos',
    title: 'Inspection Photos Grid',
    description: 'High-resolution before and after optical glass / galvo cleanliness photos.',
    category: 'INSPECTION',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-attachments',
    sectionType: 'attachments',
    title: 'Attachments & Calibration Logs',
    description: 'Raw sensor export logs, beam profiler images, and certificate references.',
    category: 'INSPECTION',
    visible: false,
    pageBreakBefore: false,
    collapsible: true,
    showSectionNumber: true
  },
  {
    id: 'sec-recommendations',
    sectionType: 'recommendations',
    title: 'Field Recommendations',
    description: 'Prioritized engineer preventive maintenance action items.',
    category: 'TIMELINE',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-parts-used',
    sectionType: 'parts_used',
    title: 'Parts Used & Replacements',
    description: 'Itemized spare parts consumed during service visit.',
    category: 'TIMELINE',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-consumables',
    sectionType: 'consumables',
    title: 'Consumables Status',
    description: 'DI filter life %, optics lens condition, and cover glass wear.',
    category: 'INSPECTION',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-downtime',
    sectionType: 'downtime',
    title: 'Downtime & Impact Analysis',
    description: 'Recorded machine downtime hours, root cause, and production recovery.',
    category: 'TIMELINE',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-service-timeline',
    sectionType: 'service_timeline',
    title: 'Service Timeline',
    description: 'Minute-by-minute activity log of engineer work on site.',
    category: 'TIMELINE',
    visible: true,
    pageBreakBefore: false,
    collapsible: true,
    showSectionNumber: true
  },
  {
    id: 'sec-engineer-notes',
    sectionType: 'engineer_notes',
    title: 'Engineer Notes',
    description: 'Internal engineer observations and environmental conditions.',
    category: 'OTHER',
    visible: true,
    pageBreakBefore: false,
    collapsible: true,
    showSectionNumber: true
  },
  {
    id: 'sec-customer-notes',
    sectionType: 'customer_notes',
    title: 'Customer Feedback & Notes',
    description: 'Customer representative comments, feedback, and special requests.',
    category: 'OTHER',
    visible: false,
    pageBreakBefore: false,
    collapsible: true,
    showSectionNumber: true
  },
  {
    id: 'sec-next-maintenance',
    sectionType: 'next_maintenance',
    title: 'Next Scheduled Maintenance',
    description: 'Target date, required scope, and pre-ordered spare parts for next visit.',
    category: 'TIMELINE',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: true
  },
  {
    id: 'sec-engineer-signature',
    sectionType: 'engineer_signature',
    title: 'Engineer Signature Block',
    description: 'Lead engineer name, title, SHA-256 digital stamp, and sign-off date.',
    category: 'SIGNATURES',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: false
  },
  {
    id: 'sec-customer-signature',
    sectionType: 'customer_signature',
    title: 'Customer Sign-off Block',
    description: 'Customer plant manager signature block and acceptance confirmation.',
    category: 'SIGNATURES',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: false
  },
  {
    id: 'sec-company-footer',
    sectionType: 'company_footer',
    title: 'Company Footer & Confidentiality',
    description: 'Legal disclaimer, page numbering, and SLA support phone contact.',
    category: 'SIGNATURES',
    visible: true,
    pageBreakBefore: false,
    collapsible: false,
    showSectionNumber: false
  }
];

export const INITIAL_FOUNDER_BRANDING: FounderBrandingConfig = {
  companyName: 'FIELD OPERATIONS SERVICE SYSTEMS INC.',
  companyLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
  customerLogoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=120&h=120&q=80',
  headerText: 'EXECUTIVE FIELD SERVICE REPORT — ENTERPRISE SLA',
  footerText: 'Confidential & Proprietary — Field Operations Service Systems © 2026',
  showPageNumbers: true,
  primaryColor: '#8B9DFF',
  engineerSignatureBlock: true,
  customerSignatureBlock: true,
  confidentialityBanner: true
};

export const INITIAL_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'tmpl-stm-pm',
    name: 'STM Preventive Maintenance',
    code: 'STM_PM',
    description: 'Standard Preventive Maintenance report layout including health scores, baseline checks, and consumables.',
    category: 'Preventive Maintenance',
    isDefault: true,
    updatedAt: '2026-07-29',
    sections: [
      { id: 'sec-1', sectionType: 'machine_info', title: '1. Machine Information', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-2', sectionType: 'customer_info', title: '2. Customer Facility Details', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-3', sectionType: 'visit_summary', title: '3. Operational Verdict & Health Summary', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-4', sectionType: 'mhc', title: '4. Subsystem Telemetry & Health Check', visible: true, pageBreakBefore: true, collapsible: false, showSectionNumber: true },
      { id: 'sec-5', sectionType: 'laser_measurements', title: '5. Laser Output & Optics Profile', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-6', sectionType: 'baseline_results', title: '6. Factory Baseline Convergence', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-7', sectionType: 'consumables', title: '7. Consumables & DI Filter Health', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-8', sectionType: 'recommendations', title: '8. Action Items & Field Recommendations', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-9', sectionType: 'next_maintenance', title: '9. Next Maintenance Schedule', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-10', sectionType: 'engineer_signature', title: 'Lead Engineer Sign-off', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false },
      { id: 'sec-11', sectionType: 'customer_signature', title: 'Customer Acceptance Sign-off', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false },
      { id: 'sec-12', sectionType: 'company_footer', title: 'Company Footer & Legal Notice', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false }
    ]
  },
  {
    id: 'tmpl-stm-cm',
    name: 'STM Corrective Maintenance',
    code: 'STM_CM',
    description: 'Focused layout for emergency breakdown fixes, root cause investigations, parts consumed, and downtime analysis.',
    category: 'Corrective Maintenance',
    updatedAt: '2026-07-28',
    sections: [
      { id: 'sec-cm-1', sectionType: 'machine_info', title: '1. Machine Identification', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-cm-2', sectionType: 'customer_info', title: '2. Customer Plant & Contact', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-cm-3', sectionType: 'downtime', title: '3. Machine Downtime & Production Impact', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-cm-4', sectionType: 'quality_investigation', title: '4. Root Cause Analysis & Quality Log', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-cm-5', sectionType: 'parts_used', title: '5. Parts Replaced & Consumables Log', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-cm-6', sectionType: 'photos', title: '6. Component Failure Photos', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-cm-7', sectionType: 'engineer_notes', title: '7. Engineer Technical Observations', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-cm-8', sectionType: 'engineer_signature', title: 'Engineer Sign-off', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false },
      { id: 'sec-cm-9', sectionType: 'customer_signature', title: 'Customer Sign-off', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false }
    ]
  },
  {
    id: 'tmpl-installation',
    name: 'Installation & Commissioning',
    code: 'INSTALLATION',
    description: 'Comprehensive initial setup report including cleanroom validation, machine passport baseline, and photos.',
    category: 'Commissioning',
    updatedAt: '2026-07-25',
    sections: [
      { id: 'sec-inst-1', sectionType: 'machine_info', title: '1. Machine Details', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-inst-2', sectionType: 'customer_info', title: '2. Cleanroom Facility Record', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-inst-3', sectionType: 'machine_passport', title: '3. Machine Passport & Factory Specs', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-inst-4', sectionType: 'laser_measurements', title: '4. First Light Laser Measurements', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-inst-5', sectionType: 'baseline_results', title: '5. Factory Baseline Benchmark', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-inst-6', sectionType: 'photos', title: '6. Cleanroom Installation Photos', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-inst-7', sectionType: 'engineer_signature', title: 'Commissioning Engineer Signature', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false },
      { id: 'sec-inst-8', sectionType: 'customer_signature', title: 'Customer Cleanroom Sign-off', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false }
    ]
  },
  {
    id: 'tmpl-acceptance-test',
    name: 'Acceptance Test Report',
    code: 'ACCEPTANCE_TEST',
    description: 'Rigorous formal test protocol validating galvo gain, laser power drift, and sample wafer cut accuracy.',
    category: 'Commissioning',
    updatedAt: '2026-07-22',
    sections: [
      { id: 'sec-acc-1', sectionType: 'machine_info', title: '1. Test Unit Identification', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-acc-2', sectionType: 'customer_info', title: '2. Customer Test Representative', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-acc-3', sectionType: 'laser_measurements', title: '3. Laser Measurement Metrics', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-acc-4', sectionType: 'baseline_results', title: '4. Tolerance Acceptance Results', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-acc-5', sectionType: 'attachments', title: '5. Attached Calibration Certificates', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-acc-6', sectionType: 'engineer_signature', title: 'Test Lead Sign-off', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false },
      { id: 'sec-acc-7', sectionType: 'customer_signature', title: 'Customer Quality Sign-off', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false }
    ]
  },
  {
    id: 'tmpl-emergency-breakdown',
    name: 'Emergency Breakdown Summary',
    code: 'EMERGENCY_BREAKDOWN',
    description: 'Rapid turnaround report for emergency dispatch visits. Focuses on immediate fix and downtime reduction.',
    category: 'Emergency',
    updatedAt: '2026-07-20',
    sections: [
      { id: 'sec-em-1', sectionType: 'machine_info', title: '1. Affected Machine', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-em-2', sectionType: 'downtime', title: '2. Emergency Downtime Log', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-em-3', sectionType: 'visit_summary', title: '3. Rapid Intervention Verdict', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-em-4', sectionType: 'parts_used', title: '4. Emergency Parts Installed', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-em-5', sectionType: 'engineer_signature', title: 'Engineer Sign-off', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false },
      { id: 'sec-em-6', sectionType: 'customer_signature', title: 'Customer Acknowledgment', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false }
    ]
  },
  {
    id: 'tmpl-internal-report',
    name: 'Internal Service Report',
    code: 'INTERNAL_REPORT',
    description: 'Internal engineering audit log for team handovers, component hours tracking, and internal cost reviews.',
    category: 'Internal',
    updatedAt: '2026-07-18',
    sections: [
      { id: 'sec-int-1', sectionType: 'machine_info', title: '1. Machine Asset Code', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-int-2', sectionType: 'service_timeline', title: '2. Chronological On-Site Timeline', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-int-3', sectionType: 'parts_used', title: '3. Internal Spares Allocation', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-int-4', sectionType: 'engineer_notes', title: '4. Internal Technical Notes', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-int-5', sectionType: 'company_footer', title: 'Internal Operations Footer', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false }
    ]
  },
  {
    id: 'tmpl-quick-visit',
    name: 'Quick Visit Brief',
    code: 'QUICK_VISIT',
    description: 'Streamlined 1-page report for quick operational check-ins, routine lens wipes, or minor visual inspections.',
    category: 'Quick Visit',
    updatedAt: '2026-07-15',
    sections: [
      { id: 'sec-qv-1', sectionType: 'machine_info', title: '1. Machine & Customer Brief', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-qv-2', sectionType: 'visit_summary', title: '2. Quick Inspection Summary', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-qv-3', sectionType: 'recommendations', title: '3. Brief Recommendations', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: true },
      { id: 'sec-qv-4', sectionType: 'engineer_signature', title: 'Engineer Signature', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false },
      { id: 'sec-qv-5', sectionType: 'customer_signature', title: 'Customer Sign-off', visible: true, pageBreakBefore: false, collapsible: false, showSectionNumber: false }
    ]
  }
];

export const INITIAL_REPORT_DRAFTS: ReportDraft[] = [
  {
    id: 'draft-101',
    reportTitle: 'TSMC Fab 18A — Quarterly Service & Laser Optics Audit Report',
    templateId: 'tmpl-stm-pm',
    templateName: 'STM Preventive Maintenance',
    customerId: 'cust-1',
    customerName: 'TSMC Microelectronics Fab 18',
    machineId: 'mch-101',
    machineName: 'TRUMPF TruMicro 7000 (MCH-TSMC-01)',
    status: 'DRAFT',
    updatedAt: '2026-07-29 14:30',
    branding: INITIAL_FOUNDER_BRANDING,
    sections: INITIAL_REPORT_TEMPLATES[0].sections
  },
  {
    id: 'draft-102',
    reportTitle: 'Hyundai Ulsan Plant 3 — Battery Tray Welder Corrective Analysis',
    templateId: 'tmpl-stm-cm',
    templateName: 'STM Corrective Maintenance',
    customerId: 'cust-2',
    customerName: 'Hyundai Heavy Photonics Division',
    machineId: 'mch-102',
    machineName: 'IPG YLS-6000 High Power Fiber Laser',
    status: 'READY_FOR_REVIEW',
    updatedAt: '2026-07-28 17:15',
    branding: INITIAL_FOUNDER_BRANDING,
    sections: INITIAL_REPORT_TEMPLATES[1].sections
  }
];

export const INITIAL_ENGINEER_PROFILE: EngineerProfile = {
  name: 'Sahafiz',
  company: 'EO Technics',
  role: 'Field Service Engineer',
  department: 'Service Operations',
  avatarUrl: ''
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Mission Assigned',
    description: 'Quarterly Machine Health Check for STMicroelectronics Muar (ASM Eagle XP-01) assigned.',
    time: '10 mins ago',
    category: 'MISSION_ASSIGNED',
    read: false,
    targetTab: 'start_page'
  },
  {
    id: 'notif-2',
    title: 'Machine Health Check Due',
    description: 'ASM Eagle XP-01 scheduled for 8-Point MHC & Laser Profiling today at 09:00 AM.',
    time: '1 hour ago',
    category: 'MHC_DUE',
    read: false,
    targetTab: 'mhc'
  },
  {
    id: 'notif-3',
    title: 'System Update v0.7.2',
    description: 'FSOS updated to v0.7.2 with Founder Identity & Notification Center.',
    time: '2 hours ago',
    category: 'SYSTEM_UPDATE',
    read: false,
    targetTab: 'settings'
  },
  {
    id: 'notif-4',
    title: 'Contract SLA Reminder',
    description: 'STMicroelectronics Muar contract (FSC-2025-STM-014) has 68 days remaining.',
    time: 'Yesterday',
    category: 'CONTRACT_REMINDER',
    read: true,
    targetTab: 'contracts'
  },
  {
    id: 'notif-5',
    title: 'Pending Report Action',
    description: 'Draft Executive Report for TSMC Fab 18A awaiting final engineer sign-off.',
    time: '2 days ago',
    category: 'PENDING_REPORT',
    read: true,
    targetTab: 'reports'
  }
];

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-101',
    employeeId: 'EMP-EO-8801',
    fullName: 'Sahafiz',
    email: 'sahafiz@eotechnics.com',
    phone: '+60 12-345 6789',
    company: 'EO Technics',
    department: 'Service Operations',
    role: 'Field Service Engineer',
    status: 'Online',
    lastLogin: 'Active now',
    timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: 'Lead Laser Field Engineer specializing in ultra-fast TRUMPF, Coherent, and IPG photonics sources.'
  },
  {
    id: 'usr-102',
    employeeId: 'EMP-EO-8802',
    fullName: 'David Vance',
    email: 'd.vance@eotechnics.com',
    phone: '+886 912 345 678',
    company: 'EO Technics',
    department: 'Laser Optics & Photonics',
    role: 'Senior Engineer',
    status: 'Busy',
    lastLogin: '12 mins ago',
    timezone: 'Asia/Taipei (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: 'Senior Laser Calibration Specialist with 12+ years expertise in galvo beam diagnostics.'
  },
  {
    id: 'usr-103',
    employeeId: 'EMP-EO-8803',
    fullName: 'Elena Rostova',
    email: 'e.rostova@eotechnics.com',
    phone: '+65 9812 3456',
    company: 'EO Technics',
    department: 'APAC Field Operations',
    role: 'Supervisor',
    status: 'Online',
    lastLogin: '45 mins ago',
    timezone: 'Asia/Singapore (UTC+08:00)',
    language: 'English (UK)',
    accountStatus: 'Active',
    bio: 'Regional Service Operations Supervisor overseeing semiconductor SLA compliance and engineer dispatch.'
  },
  {
    id: 'usr-104',
    employeeId: 'EMP-EO-8001',
    fullName: 'Marcus Sterling',
    email: 'm.sterling@eotechnics.com',
    phone: '+1 (408) 555-0192',
    company: 'EO Technics Global',
    department: 'IT & Systems Governance',
    role: 'Administrator',
    status: 'Online',
    lastLogin: '3 mins ago',
    timezone: 'America/Los_Angeles (UTC-07:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: 'System Administrator managing FSOS enterprise platform roles, security rules, and user access.'
  },
  {
    id: 'usr-105',
    employeeId: 'EMP-EO-8005',
    fullName: 'Hiroshi Tanaka',
    email: 'h.tanaka@eotechnics.com',
    phone: '+81 3 5555 0143',
    company: 'EO Technics Japan',
    department: 'Global Service Operations',
    role: 'Manager',
    status: 'Offline',
    lastLogin: 'Yesterday 18:30',
    timezone: 'Asia/Tokyo (UTC+09:00)',
    language: 'Japanese / English',
    accountStatus: 'Active',
    bio: 'Global Field Service Director managing enterprise contract renewals and SLA targets.'
  },
  {
    id: 'usr-106',
    employeeId: 'EMP-EO-8806',
    fullName: 'Sophia Chen',
    email: 's.chen@eotechnics.com',
    phone: '+886 928 112 233',
    company: 'EO Technics Taiwan',
    department: 'Precision Maintenance',
    role: 'Field Service Engineer',
    status: 'On Leave',
    lastLogin: '3 days ago',
    timezone: 'Asia/Taipei (UTC+08:00)',
    language: 'English / Mandarin',
    accountStatus: 'Active',
    bio: 'Precision Field Service Specialist focused on TSMC and ASE Group cleanroom maintenance.'
  },
  {
    id: 'usr-107',
    employeeId: 'EMP-STM-9901',
    fullName: 'Liam O\'Connor',
    email: 'l.oconnor@st.com',
    phone: '+33 4 76 92 50 00',
    company: 'STMicroelectronics',
    department: 'Quality & Audit Compliance',
    role: 'Viewer',
    status: 'Inactive',
    lastLogin: '2 weeks ago',
    timezone: 'Europe/Paris (UTC+02:00)',
    language: 'English (UK)',
    accountStatus: 'Suspended',
    bio: 'Customer Quality Auditor with read-only access to Machine Health Check reports and SLAs.'
  }
];

export const INITIAL_MHC_SESSIONS: MHCSession[] = [
  {
    id: 'MHC-2026-TSMC-001',
    machineId: 'mch-101',
    machineModel: 'TRUMPF TruMicro 7000 Series',
    machineSerialNumber: 'SN-TRU-8849201-A',
    machineName: 'TRUMPF TruMicro 7000 (MCH-TSMC-01)',
    customerId: 'cust-1',
    customerName: 'TSMC Microelectronics Fab 18',
    plantName: 'Tainan Cleanroom Fab 18A',
    engineerName: 'Sahafiz',
    startDate: '2026-08-01',
    startTime: '08:30',
    lastUpdated: '2026-08-01 10:42 AM',
    completionStatus: 'IN_PROGRESS',
    currentSection: 3,
    sectionStatuses: {
      sec_01: 'COMPLETED',
      sec_02: 'COMPLETED',
      sec_03: 'IN_PROGRESS',
      sec_04: 'NOT_STARTED',
      sec_05: 'NOT_STARTED',
      sec_06: 'NOT_STARTED',
      sec_07: 'NOT_STARTED',
      sec_08: 'NOT_STARTED'
    },
    stage01_laserHours: [
      {
        laserId: 'lh-101-1',
        laserIdentifier: 'Laser Head #1 (Main Oscillator)',
        recordedLaserHour: 10250,
        readingDate: '2026-07-01',
        readingTime: '08:30',
        calculatedCurrentHour: 11480,
        warningThreshold: 15000,
        criticalThreshold: 18000,
        runtimeStatus: 'NORMAL'
      },
      {
        laserId: 'lh-101-2',
        laserIdentifier: 'Laser Head #2 (Auxiliary Amplifier)',
        recordedLaserHour: 14800,
        readingDate: '2026-07-01',
        readingTime: '08:30',
        calculatedCurrentHour: 15620,
        warningThreshold: 15000,
        criticalThreshold: 18000,
        runtimeStatus: 'WARNING'
      }
    ],
    stage02_laserProfile: {
      laserId: 'lh-101-1',
      productName: '3nm Silicon Annealing Process Wafer V2',
      recipeProgram: 'RECIPE_3NM_ANNEAL_SUB01',
      profileInfo: 'TEM00 Gaussian Profile - Single Mode 1030nm',
      measurementInfo: 'Spot Size: 42.5 µm, Rayleigh Length: 2.1 mm',
      supportingEvidence: 'Beam shape ellipticity < 1.05. Energy density verified within ±0.8%.',
      images: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
      ]
    },
    stage03_laserPower: [
      {
        laserId: 'lh-101-1',
        laserIdentifier: 'Laser Head #1 (Main Oscillator)',
        ratedPowerWatts: 250,
        referenceValueWatts: 250,
        beforeValueWatts: 246.5,
        afterValueWatts: 249.2,
        stabilityPercent: 99.6,
        result: 'PASS',
        notes: 'Optics cleaned; power output recovered to 249.2W at 100% duty cycle.',
        evidenceImages: []
      },
      {
        laserId: 'lh-101-2',
        laserIdentifier: 'Laser Head #2 (Auxiliary Amplifier)',
        ratedPowerWatts: 250,
        referenceValueWatts: 250,
        beforeValueWatts: 238.0,
        afterValueWatts: 241.5,
        stabilityPercent: 96.6,
        result: 'WARNING',
        notes: 'Minor power degradation observed; realignment scheduled for Q4 PM.',
        evidenceImages: []
      }
    ],
    stage04_opticsBeam: {
      cleanlinessScore: 96,
      beamWaistMm: 1.08,
      focusOffsetMm: 0.02,
      symmetryRatio: 0.98,
      m2Value: 1.12,
      beforeCondition: 'Slight dust deposition on outer protective window.',
      afterCondition: 'Wiped with pure isopropyl & optical lint-free swab. Transmittance restored.',
      inspectionResult: 'PASS',
      images: [
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      ],
      notes: 'Protective window replacement not required this cycle.'
    },
    stage05_cooling: {
      chillerTempCelsius: 20.2,
      chillerFlowLpm: 18.5,
      diConductivityUs: 0.35,
      coolingCondition: 'DI water loop optimal, zero micro-leakage.',
      thermalCondition: 'Thermal gradient across laser housing < 0.4°C.',
      beforeCondition: 'Conductivity 0.48 µS/cm prior to DI resin filter change.',
      afterCondition: 'Conductivity reduced to 0.35 µS/cm following resin cartridge refresh.',
      result: 'PASS',
      notes: 'DI Water Cooling Filter replaced successfully as scheduled.'
    },
    stage06_productQuality: {
      sampleId: 'SAMPLE-TSMC-3NM-8812',
      viaDiameterUm: 42.4,
      viaShape: 'Circular (Roundness 0.99)',
      viaOffsetUm: 0.3,
      padQuality: 'Zero recast layer, zero thermal heat affect zone oxidation.',
      visualVerification: 'High-magnification SEM inspection confirms uniform ablation depth.',
      beforeInspectionNotes: 'Sample cut prior to power realignment exhibited minor edge micro-burrs.',
      afterInspectionNotes: 'Post-calibration sample demonstrates clean cut edges matching litho target.',
      beforeImages: [],
      afterImages: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
      ],
      result: 'PASS',
      notes: 'Wafer yield test passed cleanroom quality assurance standard.'
    },
    stage07_spareParts: [
      {
        id: 'sp-801',
        partName: 'DI Water Resin Filter Cartridge 10"',
        partNumber: 'EO-FLT-9921',
        category: 'Cooling Consumable',
        quantity: 1,
        reason: 'Scheduled quarterly preventive replacement',
        action: 'REPLACED',
        costIndicator: 'EO_SUPPORT',
        notes: 'Cartridge replaced under active Service Contract SC-TSMC-2026-A.'
      },
      {
        id: 'sp-802',
        partName: 'Laser Window Fused Silica 50mm',
        partNumber: 'EO-OPT-1044',
        category: 'Optics Consumable',
        quantity: 1,
        reason: 'Recommended spare stock for cleanroom drawer',
        action: 'RECOMMENDED',
        costIndicator: 'CUSTOMER_COST',
        notes: 'Recommended ordering 1 unit backup for Q4 operations.'
      }
    ],
    stage08_engineerRemarks: {
      generalFindings: 'TRUMPF TruMicro 7000 system overall condition is stable. Laser Head #1 operating within 99.6% stability.',
      observedIssues: 'Laser Head #2 exhibits minor output power drop (241.5W vs 250W rated).',
      correctiveActions: 'Cleaned protective optics window, replaced DI water resin filter, aligned oscillator beam waist.',
      recommendations: 'Monitor Laser Head #2 power weekly. Plan diode array inspection during Q4 maintenance cycle.',
      followUpRequired: true,
      productionReleaseVerdict: 'APPROVED'
    }
  }
];

export const INITIAL_MHC_REPORT_DRAFTS: MHCReportDraftConfig[] = [
  {
    id: 'DRAFT-MHC-2026-001',
    mhcSessionId: 'MHC-2026-TSMC-001',
    reportTitle: 'OFFICIAL MACHINE HEALTH CHECK CERTIFICATE & FIELD INSPECTION REPORT',
    reportNumber: 'EO-MHC-REP-2026-0881',
    date: '2026-08-01',
    customerName: 'TSMC Microelectronics Fab 18',
    plantName: 'Tainan Cleanroom Fab 18A',
    machineModel: 'TRUMPF TruMicro 7000 Series',
    machineSerialNumber: 'SN-TRU-8849201-A',
    machineName: 'TRUMPF TruMicro 7000 (MCH-TSMC-01)',
    engineerName: 'Sahafiz',
    engineerTitle: 'Senior Field Service Engineer (EO Technics)',
    sectionsVisibility: {
      cover: true,
      passport: true,
      summary: true,
      sec_01: true,
      sec_02: true,
      sec_03: true,
      sec_04: true,
      sec_05: true,
      sec_06: true,
      sec_07: true,
      sec_08: true,
      evidence: true,
      signoff: true
    },
    sectionsOrder: [
      'cover',
      'passport',
      'summary',
      'sec_01',
      'sec_02',
      'sec_03',
      'sec_04',
      'sec_05',
      'sec_06',
      'sec_07',
      'sec_08',
      'evidence',
      'signoff'
    ],
    customComments: 'Comprehensive Machine Health Check executed in accordance with TSMC Fab 18 Cleanroom SOP and EO Technics Technical Standard. All key optical and thermal subsystems verified.',
    selectedImages: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        caption: 'Beam Profile Analysis - TEM00 Single Mode Spot Output',
        sectionKey: 'sec_04'
      }
    ],
    engineerConclusion: 'The machine is approved for continuous 24/7 semiconductor wafer annealing production under conditional monitoring for Laser Head #2.',
    engineerSignatureName: 'Sahafiz',
    engineerSignatureDate: '2026-08-01',
    customerSignatureName: 'Dr. Marcus Vance',
    customerSignatureDate: '2026-08-01',
    lastSaved: '2026-08-01 10:45 AM'
  }
];


