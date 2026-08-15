/**
 * Resize screenshots for App Store Connect
 * Run: node scripts/resize-screenshots.js
 * 
 * Put your screenshots in the screenshots-input folder, then run this script.
 * Resized images will be in screenshots-output folder.
 */

const fs = require('fs');
const path = require('path');

// App Store required dimensions (portrait)
const WIDTH = 1242;
const HEIGHT = 2688;

const inputDir = path.join(__dirname, '..', 'screenshots-input');
const outputDir = path.join(__dirname, '..', 'screenshots-output');

if (!fs.existsSync(inputDir)) {
  fs.mkdirSync(inputDir, { recursive: true });
  console.log('Created screenshots-input folder. Put your screenshots there and run again.');
  process.exit(0);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Try to use sharp if available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Installing sharp... Run: npm install sharp --save-dev');
  console.log('Then run this script again.');
  process.exit(1);
}

const files = fs.readdirSync(inputDir).filter(f => 
  /\.(png|jpg|jpeg)$/i.test(f)
);

if (files.length === 0) {
  console.log('No PNG/JPG files found in screenshots-input folder.');
  console.log('Put your screenshots there and run again.');
  process.exit(1);
}

async function resize() {
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, `appstore-${file}`);
    await sharp(inputPath)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
      .toFile(outputPath);
    console.log(`Resized: ${file} -> appstore-${file}`);
  }
  console.log(`\nDone! Resized images are in screenshots-output folder.`);
  console.log(`Upload these to App Store Connect.`);
}

resize().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
