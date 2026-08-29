const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Checking if sharp is installed...");
try {
  require.resolve('sharp');
} catch (e) {
  console.log("Installing sharp...");
  execSync('npm install sharp --no-save', { stdio: 'inherit' });
}

const sharp = require('sharp');

const publicDir = path.join(__dirname, '../public');
const inputFile = path.join(publicDir, 'camtech-logo.svg');
const outputFile = path.join(publicDir, 'camtech-logo.png');

console.log(`Converting ${inputFile} to PNG...`);

sharp(inputFile)
  .png()
  .toFile(outputFile)
  .then(info => {
    console.log("Conversion successful!");
    console.log(`Saved as ${outputFile}`);
    console.log("Info:", info);
  })
  .catch(err => {
    console.error("Error converting SVG to PNG:", err);
  });
