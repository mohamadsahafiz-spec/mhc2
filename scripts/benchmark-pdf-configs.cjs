const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const CONFIGS = [
  { id: 'A_baseline', name: 'Baseline A (1.20 / 0.80)', scale: 1.20, quality: 0.80 },
  { id: 'C1_scale150_q85', name: 'Config 1 (1.50 / 0.85)', scale: 1.50, quality: 0.85 },
  { id: 'C2_scale160_q90', name: 'Config 2 (1.60 / 0.90)', scale: 1.60, quality: 0.90 },
  { id: 'C3_scale175_q92', name: 'Config 3 (1.75 / 0.92)', scale: 1.75, quality: 0.92 },
  { id: 'C4_scale200_q90', name: 'Config 4 (2.00 / 0.90)', scale: 2.00, quality: 0.90 },
  { id: 'B_reference', name: 'Reference B (2.00 / 0.95)', scale: 2.00, quality: 0.95 }
];

async function main() {
  console.log('================================================================');
  console.log('STARTING TASK #12 PDF QUALITY OPTIMIZATION BENCHMARK SUITE');
  console.log('================================================================');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto('http://localhost:3000');

  // Inject full session and machine data
  await page.evaluate(() => {
    localStorage.setItem('fso_v080_authenticated', JSON.stringify({
      isAuthenticated: true,
      userId: 'usr-101',
      engineerName: 'Sahafiz',
      role: 'Field Service Engineer',
      company: 'EO Technics',
      department: 'Service Operations',
      operationalStatus: 'Active',
      lastLogin: new Date().toISOString(),
      workspaceMode: 'MHC_MODE'
    }));

    const machine = {
      id: 'mac-test-1',
      machineNumber: 'WLVIA#3',
      model: 'ESI 5330 Flex',
      serialNumber: 'SN-98765',
      customer: 'Acme PCB Corp',
      plant: 'Plant 2 - Penang',
      line: 'Line 1',
      status: 'Active',
      laserType: 'UV 355nm',
      opticsType: 'Telecentric Scan Lens'
    };
    localStorage.setItem('fso_v04_machines', JSON.stringify([machine]));

    const session = {
      id: 'mhc-sess-1',
      machineId: 'mac-test-1',
      machineModel: 'ESI 5330 Flex',
      machineSerialNumber: 'SN-98765',
      machineName: 'Flex Drill WLVIA#3',
      customerId: 'CUST-001',
      customerName: 'Acme PCB Corp',
      plantName: 'Plant 2 - Penang',
      engineerName: 'Sahafiz',
      startDate: '2026-09-02',
      startTime: '09:00',
      lastUpdated: new Date().toISOString(),
      completionStatus: 'IN_PROGRESS',
      currentSection: 9,
      sectionStatuses: {},
      autopilotProgress: {
        currentActivityCode: '09_report',
        currentDay: 'DAY 4',
        activityStatuses: {
          '01': 'COMPLETED',
          '02': 'COMPLETED',
          '03': 'COMPLETED',
          '04': 'COMPLETED',
          '05': 'COMPLETED',
          '06': 'COMPLETED',
          '07': 'COMPLETED',
          '08': 'COMPLETED',
          '09': 'IN_PROGRESS'
        },
        activityNotes: {
          '01': 'Laser hours verified via system counter: 14250h.',
          '02': 'Beam profile nominal TopHat pattern verified with Station 1 sensor.',
          '03': 'Laser power Head 1 stable at 15.1W (0.8% variance).',
          '04': 'Cleanliness score 95/100, waist 2.0mm, symmetry 0.98.',
          '05': 'DI water conductivity 0.8 uS/cm, chiller temp 20.1C nominal.',
          '06': 'Via drilling accuracy 0.5um repeatability pass.',
          '07': 'Air Filter Element ESI-FLT-01 replaced (1 ea).',
          '08': 'All 8 inspection readiness criteria satisfied.'
        },
        lastActiveTimestamp: new Date().toISOString()
      },
      stage01_laserHours: [
        {
          laserId: 'lh1',
          laserIdentifier: 'Laser Head 1',
          recordedLaserHour: 14250,
          readingDate: '2026-09-02',
          readingTime: '09:15',
          calculatedCurrentHour: 14250,
          warningThreshold: 18000,
          criticalThreshold: 20000,
          runtimeStatus: 'NORMAL',
          isVerified: true,
          verifiedHour: 14250
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
          date: '2026-09-02',
          overallResult: 'PASS',
          readings: {
            '6A': { checkpointId: '6A', measuredDiameterMm: 3.52, pass: true },
            '7A': { checkpointId: '7A', measuredDiameterMm: 3.48, pass: true }
          }
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
          evidenceImages: []
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
          costIndicator: 'CUSTOMER_COST'
        }
      ]
    };
    localStorage.setItem('fso_v080_mhc_sessions', JSON.stringify([session]));
  });

  await page.reload();
  await page.waitForTimeout(1500);

  // Navigate to MHC Autopilot
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.innerText();
    if (text.includes('MHC Autopilot')) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(1500);

  const continueBtn = await page.$('#mhc-autopilot-continue-last-btn');
  if (continueBtn) {
    await continueBtn.click();
    await page.waitForTimeout(2500);
  }

  // Ensure DOM has 10 pages
  const pageCount = await page.evaluate(() => document.querySelectorAll('.mhc-a4-page').length);
  console.log(`[DOM Check] ${pageCount} A4 pages loaded in DOM.`);
  if (pageCount !== 10) {
    throw new Error(`Expected 10 pages, found ${pageCount}`);
  }

  const artDir = path.join(process.cwd(), 'test_artifacts');
  if (!fs.existsSync(artDir)) fs.mkdirSync(artDir, { recursive: true });

  const results = [];

  for (const cfg of CONFIGS) {
    console.log(`\n---> Running benchmark: ${cfg.name} (Scale: ${cfg.scale}, JPEG: ${cfg.quality})...`);

    // Run benchmark in page context
    const benchResult = await page.evaluate(async ({ scale, quality }) => {
      if (typeof window.__runPdfBenchmark !== 'function') {
        throw new Error('window.__runPdfBenchmark not available');
      }
      return await window.__runPdfBenchmark(scale, quality);
    }, { scale: cfg.scale, quality: cfg.quality });

    const totalSeconds = (benchResult.totalTimeMs / 1000).toFixed(2);
    const sizeBytes = benchResult.sizeBytes;
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
    const avgPageMs = Math.round(benchResult.totalTimeMs / 10);
    const w = benchResult.dimensions[0].width;
    const h = benchResult.dimensions[0].height;
    // DPI: 210mm = 8.2677 inches. DPI = width / 8.2677
    const dpi = Math.round(w / 8.2677);

    // Save PDF
    const outPdfPath = path.join(artDir, `bench_${cfg.id}.pdf`);
    const base64Data = benchResult.pdfBase64.split(',')[1];
    fs.writeFileSync(outPdfPath, Buffer.from(base64Data, 'base64'));

    // Check page count from binary
    const pdfBuf = fs.readFileSync(outPdfPath);
    const pdfStr = pdfBuf.toString('latin1');
    const actualPages = (pdfStr.match(/\/Type\s*\/Page\b/g) || []).length;

    console.log(`     ✓ Time: ${totalSeconds}s (${avgPageMs}ms/page) | Size: ${sizeMB} MB (${sizeBytes} B) | Canvas: ${w}x${h} (~${dpi} DPI) | Pages: ${actualPages}`);

    results.push({
      id: cfg.id,
      name: cfg.name,
      scale: cfg.scale,
      quality: cfg.quality,
      totalSeconds: parseFloat(totalSeconds),
      avgPageMs,
      sizeBytes,
      sizeMB: parseFloat(sizeMB),
      widthPx: w,
      heightPx: h,
      dpi,
      actualPages,
      filePath: outPdfPath
    });

    // Short cool-down between runs
    await page.waitForTimeout(500);
  }

  console.log('\n================================================================');
  console.log('BENCHMARK SUMMARY TABLE:');
  console.log('================================================================');
  console.table(results.map(r => ({
    Configuration: r.name,
    Scale: r.scale,
    JPEG: r.quality,
    DPI: `~${r.dpi}`,
    'Canvas Px': `${r.widthPx}x${r.heightPx}`,
    Pages: r.actualPages,
    'Time (s)': `${r.totalSeconds}s`,
    'Avg/Page': `${r.avgPageMs}ms`,
    'Size (MB)': `${r.sizeMB} MB`
  })));

  // Write results JSON for analysis
  fs.writeFileSync(path.join(artDir, 'benchmark_results.json'), JSON.stringify(results, null, 2));

  await browser.close();
  console.log('\nBenchmark completed successfully. Results saved to test_artifacts/benchmark_results.json.');
}

main().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
