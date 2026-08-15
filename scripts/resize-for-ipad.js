/**
 * Resize screenshots for 13-inch iPad (App Store requirement)
 * Run: node scripts/resize-for-ipad.js
 *
 * iPad 13" portrait: 2048 x 2732 pixels
 * Output: screenshots-output/ipad-13inch.png and screenshots-output/ipad-*.png
 */

const fs = require('fs');
const path = require('path');

const WIDTH = 2048;
const HEIGHT = 2732;

const inputDir = path.join(__dirname, '..', 'screenshots-input');
const outputDir = path.join(__dirname, '..', 'screenshots-output');

if (!fs.existsSync(inputDir)) {
  fs.mkdirSync(inputDir, { recursive: true });
  console.log('Created screenshots-input. Add app screenshots and run again.');
  process.exit(0);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir)
  .filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
  .sort();

if (files.length === 0) {
  console.log('No images in screenshots-input. Add screenshots and run again.');
  process.exit(1);
}

const sharp = require('sharp');

const appInUseKeywords = [
  'feed',
  'profile',
  'memories',
  'entry',
  'entries',
  'new',
  'create',
  'journal',
  'friends',
];

const landingKeywords = [
  'landing',
  'login',
  'signin',
  'sign-in',
  'signup',
  'sign-up',
  'auth',
];

function scoreScreenshot(file) {
  const name = file.toLowerCase();
  const appScore = appInUseKeywords.some((keyword) => name.includes(keyword)) ? 10 : 0;
  const landingPenalty = landingKeywords.some((keyword) => name.includes(keyword)) ? -10 : 0;
  return appScore + landingPenalty;
}

function selectBestIpadScreenshot(files) {
  return [...files].sort((a, b) => {
    const scoreDiff = scoreScreenshot(b) - scoreScreenshot(a);
    return scoreDiff || a.localeCompare(b);
  })[0];
}

async function resize() {
  const selectedFile = selectBestIpadScreenshot(files);
  await sharp(path.join(inputDir, selectedFile))
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
    .toFile(path.join(outputDir, 'ipad-13inch.png'));
  console.log(`Selected ${selectedFile} → ipad-13inch.png`);

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const base = file.replace(/\.[^.]+$/, '');
    const outputPath = path.join(outputDir, `ipad-${base}.png`);
    await sharp(inputPath)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toFile(outputPath);
    console.log(`  ${file} → ipad-${base}.png`);
  }
  console.log(`\nDone! ${files.length} iPad images (2048×2732) in screenshots-output/`);
  console.log('Upload to App Store Connect → 13-inch iPad display.');
}

resize().catch((err) => {
  console.error(err);
  process.exit(1);
});
