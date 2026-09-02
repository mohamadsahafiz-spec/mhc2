const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

  // Load the extracted page 1 JPEGs
  const files = [
    { label: 'A_Baseline_1.20_q0.80', file: 'page1_A_120.jpg' },
    { label: 'C1_Scale_1.50_q0.85', file: 'page1_C1_150.jpg' },
    { label: 'C2_Scale_1.60_q0.90', file: 'page1_C2_160.jpg' },
    { label: 'C3_Scale_1.75_q0.92', file: 'page1_C3_175.jpg' },
    { label: 'C4_Scale_2.00_q0.90', file: 'page1_C4_200_q90.jpg' },
    { label: 'B_Reference_2.00_q0.95', file: 'page1_B_200_q95.jpg' }
  ];

  // We will build an HTML comparison canvas that loads each image and zooms into 3 regions:
  // Region 1: Header / Document Title ("MACHINE HEALTH CHECK REPORT" + EO TECHNICS)
  // Region 2: Metadata Grid ("REPORT NUMBER", "MACHINE SERIAL NUMBER", "CUSTOMER")
  // Region 3: Machine Status Badge & Fine 8pt Text
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: monospace; background: #1e1e1e; color: #fff; padding: 20px; }
        .row { display: flex; gap: 15px; margin-bottom: 25px; }
        .card { background: #2d2d2d; padding: 10px; border-radius: 6px; border: 1px solid #444; }
        .card h4 { margin: 0 0 8px 0; font-size: 13px; color: #38bdf8; }
        canvas { border: 1px solid #666; background: #fff; image-rendering: pixelated; }
      </style>
    </head>
    <body>
      <h2>Visual Crop Comparison (300% Zoom)</h2>
      <div id="container"></div>
      <script>
        const files = ${JSON.stringify(files)};
        const regions = [
          { name: 'Region 1: Title & EO Logo (Top Header)', relX: 0.05, relY: 0.03, relW: 0.45, relH: 0.07 },
          { name: 'Region 2: Metadata Table & 8pt Labels', relX: 0.05, relY: 0.12, relW: 0.45, relH: 0.08 },
          { name: 'Region 3: Status Badge & Sub-labels', relX: 0.55, relY: 0.12, relW: 0.40, relH: 0.08 }
        ];

        async function init() {
          const container = document.getElementById('container');
          for (const region of regions) {
            const h3 = document.createElement('h3');
            h3.textContent = region.name;
            container.appendChild(h3);

            const row = document.createElement('div');
            row.className = 'row';

            for (const item of files) {
              const card = document.createElement('div');
              card.className = 'card';
              card.innerHTML = '<h4>' + item.label + '</h4>';

              const canvas = document.createElement('canvas');
              canvas.width = 320;
              canvas.height = 160;
              card.appendChild(canvas);
              row.appendChild(card);

              const img = new Image();
              img.src = item.file;
              await new Promise(res => { img.onload = res; });

              const ctx = canvas.getContext('2d');
              const sx = Math.floor(img.naturalWidth * region.relX);
              const sy = Math.floor(img.naturalHeight * region.relY);
              const sw = Math.floor(img.naturalWidth * region.relW);
              const sh = Math.floor(img.naturalHeight * region.relH);

              ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            }
            container.appendChild(row);
          }
          window.__cropsReady = true;
        }
        init();
      </script>
    </body>
    </html>
  `;

  fs.writeFileSync('test_artifacts/crop_comparison.html', htmlContent);

  await page.goto('file://' + path.resolve('test_artifacts/crop_comparison.html'));
  await page.waitForFunction(() => window.__cropsReady === true, { timeout: 15000 });

  await page.screenshot({
    path: 'test_artifacts/visual_crops_comparison.png',
    fullPage: true
  });
  console.log('Saved visual crops comparison screenshot: test_artifacts/visual_crops_comparison.png');

  await browser.close();
}

main().catch(console.error);
