/**
 * Capture App Store screenshots using Puppeteer
 * Run: npx puppeteer scripts/capture-screenshots.js
 *
 * Prerequisites: npm install puppeteer --save-dev
 *
 * The app must be running (npm run dev) or use BASE_URL for production.
 * For authenticated screens (feed, entry, profile), sign in first in a browser,
 * then copy your session cookie - or run this and manually capture those after.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots-input');

// iPhone 15 Pro Max viewport (App Store will resize)
const WIDTH = 430;
const HEIGHT = 932;

const SCREENS = [
  { name: '01-landing', path: '/' },
  { name: '02-signin', path: '/auth/signin' },
  { name: '03-signup', path: '/auth/signup' },
  { name: '04-feed', path: '/feed' },
  { name: '05-new-entry', path: '/entries/new' },
  { name: '06-profile', path: '/profile' },
  { name: '07-memories', path: '/memories' },
  { name: '08-leaderboard', path: '/leaderboard' },
];

async function main() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.log('Run first: npm install puppeteer --save-dev');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Capturing screenshots from ${BASE_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  );

  for (const { name, path: route } of SCREENS) {
    const url = `${BASE_URL}${route}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise((r) => setTimeout(r, 500));
      const filepath = path.join(OUTPUT_DIR, `${name}.png`);
      await page.screenshot({ path: filepath, type: 'png' });
      console.log(`  ✓ ${name}.png`);
    } catch (err) {
      console.log(`  ✗ ${name}.png - ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone! Run: node scripts/resize-screenshots.js');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
