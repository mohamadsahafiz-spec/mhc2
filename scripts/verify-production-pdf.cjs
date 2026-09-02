const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function main() {
  console.log('=== VERIFYING PRODUCTION PDF GENERATION (v1.2.9) ===');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto('http://localhost:3000');

  // Set authenticated session and machine
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
      id: 'mhc-sess-prod',
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

  // Navigate to Autopilot
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

  // Verify DOM pages
  const pageCount = await page.evaluate(() => document.querySelectorAll('.mhc-a4-page').length);
  console.log(`[DOM Check] ${pageCount} A4 pages loaded in DOM.`);
  if (pageCount !== 10) throw new Error(`Expected 10 pages, found ${pageCount}`);

  // Confirm version in DOM toolbar
  const versionBadgeText = await page.evaluate(() => {
    const badge = document.querySelector('.space-y-6 span.font-mono');
    return badge ? badge.textContent : 'Not found';
  });
  console.log(`[UI Version Check] Toolbar badge: ${versionBadgeText}`);

  // Click production download button and intercept download
  console.log('Triggering production "Download Official MHC PDF" button...');
  const t0 = Date.now();

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 45000 }),
    page.click('#btn-download-mhc-pdf')
  ]);

  const durationMs = Date.now() - t0;
  const suggestedFilename = download.suggestedFilename();
  const artDir = path.join(process.cwd(), 'test_artifacts');
  const targetPdfPath = path.join(artDir, 'production_verified_v1.2.9.pdf');

  await download.saveAs(targetPdfPath);
  console.log(`Downloaded: ${suggestedFilename} in ${(durationMs / 1000).toFixed(2)}s`);

  // Inspect generated PDF
  const pdfBuf = fs.readFileSync(targetPdfPath);
  const pdfStr = pdfBuf.toString('latin1');
  const pages = (pdfStr.match(/\/Type\s*\/Page\b/g) || []).length;
  const mediaBoxes = pdfStr.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g);

  console.log('PDF Inspection:');
  console.log(`  File size: ${(pdfBuf.length / 1024 / 1024).toFixed(2)} MB (${pdfBuf.length} bytes)`);
  console.log(`  Total pages: ${pages}`);
  console.log(`  MediaBox: ${mediaBoxes ? mediaBoxes[0] : 'Unknown'}`);

  // Extract first image to verify resolution
  const start = pdfBuf.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]));
  const end = pdfBuf.indexOf(Buffer.from([0xFF, 0xD9]), start);
  const jpegBuf = pdfBuf.slice(start, end + 2);
  fs.writeFileSync(path.join(artDir, 'production_page1_extracted.jpg'), jpegBuf);

  // Read dimensions from SOF0 marker of extracted JPEG
  let imgWidth = 0;
  let imgHeight = 0;
  for (let i = 0; i < jpegBuf.length - 8; i++) {
    if (jpegBuf[i] === 0xFF && (jpegBuf[i+1] === 0xC0 || jpegBuf[i+1] === 0xC2)) {
      imgHeight = (jpegBuf[i+5] << 8) + jpegBuf[i+6];
      imgWidth = (jpegBuf[i+7] << 8) + jpegBuf[i+8];
      break;
    }
  }
  const dpi = Math.round(imgWidth / 8.2677);
  console.log(`  Extracted Page 1 JPEG Canvas: ${imgWidth} × ${imgHeight} px (~${dpi} DPI)`);

  const summary = {
    appVersion: 'v1.2.9',
    durationSeconds: (durationMs / 1000).toFixed(2),
    fileSizeBytes: pdfBuf.length,
    fileSizeMB: (pdfBuf.length / 1024 / 1024).toFixed(2),
    pages,
    mediaBox: mediaBoxes ? mediaBoxes[0] : null,
    canvasDimensions: `${imgWidth}x${imgHeight}`,
    dpi: `~${dpi} DPI`,
    suggestedFilename
  };

  fs.writeFileSync(path.join(artDir, 'production_verification_v1.2.9.json'), JSON.stringify(summary, null, 2));

  await browser.close();
  console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
