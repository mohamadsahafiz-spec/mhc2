const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });
  
  await page.goto('http://localhost:3000');
  
  await page.evaluate(() => {
    const auth = {
      isAuthenticated: true,
      userId: 'usr-101',
      engineerName: 'Sahafiz',
      role: 'Field Service Engineer',
      company: 'EO Technics',
      department: 'Service Operations',
      operationalStatus: 'Active',
      lastLogin: new Date().toISOString(),
      workspaceMode: 'MHC_MODE'
    };
    localStorage.setItem('fso_v080_authenticated', JSON.stringify(auth));
    
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
  
  // Click on the MHC Autopilot sidebar button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.innerText();
    if (text.includes('MHC Autopilot')) {
      await btn.click();
      break;
    }
  }
  
  await page.waitForTimeout(2000);
  
  const pageCount = await page.evaluate(() => {
    return document.querySelectorAll('.mhc-a4-page').length;
  });
  console.log('MHC A4 Pages found in DOM:', pageCount);
  
  const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('View text:', text.replace(/\n+/g, ' '));
  
  await browser.close();
}

run().catch(console.error);
