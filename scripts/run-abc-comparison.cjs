const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function main() {
  console.log('====================================================');
  console.log('RUNNING FULL A/B/C COMPARISON SUITE (10-PAGE A4 REPORT)');
  console.log('====================================================');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 }
  });

  await page.goto('http://localhost:3000');

  // 1. Inject Authentication & Full Session Data
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
        },
        {
          laserId: 'lh2',
          laserIdentifier: 'Laser Head 2',
          recordedLaserHour: 11200,
          readingDate: '2026-09-02',
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

  // Click continue button to open 10-page report view
  const continueBtn = await page.$('#mhc-autopilot-continue-last-btn');
  if (continueBtn) {
    await continueBtn.click();
    await page.waitForTimeout(2500);
  }

  const pageCount = await page.evaluate(() => document.querySelectorAll('.mhc-a4-page').length);
  console.log(`[DOM Status] Confirmed ${pageCount} A4 report pages present in DOM.`);
  if (pageCount !== 10) {
    throw new Error(`Expected 10 A4 pages, found ${pageCount}`);
  }

  // Ensure test_artifacts directory exists
  const artDir = path.join(process.cwd(), 'test_artifacts');
  if (!fs.existsSync(artDir)) {
    fs.mkdirSync(artDir, { recursive: true });
  }

  // -------------------------------------------------------------------------
  // GENERATE B: Improved Raster (Scale 2.0, JPEG 0.95)
  // -------------------------------------------------------------------------
  console.log('\n--> Triggering Option B (Improved Raster: scale 2.0, JPEG 0.95)...');
  const bDownloadPromise = page.waitForEvent('download', { timeout: 90000 });
  await page.click('#btn-test-pdf-option-b');
  const bDownload = await bDownloadPromise;
  const bPath = path.join(artDir, 'B_improved_raster_200dpi.pdf');
  await bDownload.saveAs(bPath);
  console.log(`✓ Option B PDF Saved: ${bPath} (${(fs.statSync(bPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // -------------------------------------------------------------------------
  // GENERATE C: Native Browser Print (Clean Print CSS / Paged Media)
  // -------------------------------------------------------------------------
  console.log('\n--> Triggering Option C (Native Browser Print with Paged Media CSS)...');
  // Inject isolated print styles for Option C evaluation
  await page.evaluate(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'print-paged-media-rules';
    styleEl.textContent = `
      @media print {
        @page {
          size: 210mm 297mm;
          margin: 0 !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* Hide UI chrome */
        aside, nav, header, [role="navigation"], .no-print {
          display: none !important;
        }
        /* Strip margins from report wrapper */
        .min-h-screen {
          padding: 0 !important;
          margin: 0 !important;
        }
        div[class*="space-y-8"] {
          margin: 0 !important;
          padding: 0 !important;
        }
        div[class*="space-y-8"] > * + * {
          margin-top: 0 !important;
        }
        /* Ensure each A4 page is exact */
        .mhc-a4-page {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          page-break-after: always !important;
          break-after: page !important;
          margin: 0 !important;
          box-shadow: none !important;
          border: none !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  });

  const cPath = path.join(artDir, 'C_native_print_isolated.pdf');
  await page.pdf({
    path: cPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log(`✓ Option C PDF Saved: ${cPath} (${(fs.statSync(cPath).size / 1024 / 1024).toFixed(2)} MB)`);

  await browser.close();
  console.log('\nAll generation completed. Starting detailed comparative analysis...');
}

main().catch(err => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
