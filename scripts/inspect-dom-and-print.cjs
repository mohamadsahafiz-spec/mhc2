const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto('http://localhost:3000');

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
        activityNotes: {},
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
      ]
    };
    localStorage.setItem('fso_v080_mhc_sessions', JSON.stringify([session]));
  });

  await page.reload();
  await page.waitForTimeout(1500);

  // Click MHC Autopilot
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

  // 1. Inspect DOM hierarchy above .mhc-a4-page
  const hierarchy = await page.evaluate(() => {
    const page1 = document.querySelector('.mhc-a4-page');
    if (!page1) return 'No page found';
    const chain = [];
    let el = page1.parentElement;
    while (el && el !== document.documentElement) {
      const computed = window.getComputedStyle(el);
      chain.push({
        tag: el.tagName,
        id: el.id,
        className: el.className.slice(0, 80),
        overflow: computed.overflow,
        overflowY: computed.overflowY,
        position: computed.position,
        height: computed.height,
        maxHeight: computed.maxHeight,
        display: computed.display
      });
      el = el.parentElement;
    }
    return chain;
  });
  console.log('DOM Parent Hierarchy:\n', JSON.stringify(hierarchy, null, 2));

  // 2. Take screenshots of page 1 and page 2 DOM elements for sharpness/rendering visual baseline
  const page1 = await page.$('.mhc-a4-page:nth-child(1)');
  if (page1) {
    await page1.screenshot({ path: 'test_artifacts/DOM_Page1.png' });
    console.log('Saved test_artifacts/DOM_Page1.png');
  }
  const page2 = await page.$('.mhc-a4-page:nth-child(2)');
  if (page2) {
    await page2.screenshot({ path: 'test_artifacts/DOM_Page2.png' });
    console.log('Saved test_artifacts/DOM_Page2.png');
  }

  // 3. Now let's analyze WHY Candidate C (browser print) only gave 2 pages
  // In Chromium print to PDF: if any ancestor has overflow: hidden, or height: 100vh / min-h-screen with flex,
  // Chromium's print layout engine clips paged media!
  // Let's test what happens when all ancestor overflow constraints are removed in @media print:
  await page.evaluate(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'debug-print-css';
    styleEl.textContent = `
      @media print {
        @page {
          size: 210mm 297mm;
          margin: 0 !important;
        }
        *, *:before, *:after {
          box-sizing: border-box !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          overflow: visible !important;
          height: auto !important;
          min-height: auto !important;
        }
        /* Make every ancestor visible and auto height */
        div, main, section {
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
        }
        /* Hide all non-printable chrome */
        aside, nav, header, [role="navigation"], .no-print {
          display: none !important;
        }
        /* Container styling */
        .min-h-screen {
          min-height: auto !important;
          height: auto !important;
          display: block !important;
        }
        /* Page styling */
        .mhc-a4-page {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          page-break-before: auto !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin: 0 !important;
          padding: 15mm 20mm !important;
          box-shadow: none !important;
          border: none !important;
          position: relative !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  });

  const cFullTestPath = path.join(process.cwd(), 'test_artifacts/C_native_print_fixed_css.pdf');
  await page.pdf({
    path: cFullTestPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log('Saved test_artifacts/C_native_print_fixed_css.pdf:', (fs.statSync(cFullTestPath).size / 1024 / 1024).toFixed(2), 'MB');

  await browser.close();
}

test().catch(console.error);
