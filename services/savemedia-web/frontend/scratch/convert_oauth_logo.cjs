const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '../public');
const inputFile = path.join(publicDir, 'camtech-icon.svg');
const outputFile = path.join(publicDir, 'camtech-oauth-logo.png');

console.log(`Converting ${inputFile} to a square Google OAuth PNG...`);

// Google prefers a square logo (120x120 min, but 512x512 is great)
sharp(inputFile)
  .resize(512, 512)
  .png()
  .toFile(outputFile)
  .then(info => {
    console.log("Conversion successful!");
    console.log(`Saved as ${outputFile}`);
  })
  .catch(err => {
    console.error("Error converting SVG to PNG:", err);
  });
