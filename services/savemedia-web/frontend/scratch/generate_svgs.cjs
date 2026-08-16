const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '../../../../public') // From scratch back to frontend

const SYMBOL_PATHS = `
  <defs>
    <linearGradient id="camtech-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="camtech-pixel-grad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
  </defs>
  <!-- Main C Shape (Right Side) -->
  <path d="M 280 80 A 176 176 0 0 1 280 432 L 190 432 A 266 266 0 0 0 456 256 A 266 266 0 0 0 190 80 Z" fill="url(#camtech-blue-grad)" />
  <!-- Top Diagonal Cut -->
  <polygon points="190,80 280,80 230,170 140,170" fill="url(#camtech-pixel-grad)" />
  <!-- Bottom Diagonal Cut -->
  <polygon points="190,432 280,432 230,342 140,342" fill="#1e40af" />
  <!-- Digital Pixels (Left Side) -->
  <rect x="60" y="160" width="40" height="40" fill="#0ea5e9" />
  <rect x="110" y="210" width="40" height="40" fill="#38bdf8" />
  <rect x="60" y="260" width="40" height="40" fill="#2563eb" />
  <rect x="110" y="310" width="40" height="40" fill="#1d4ed8" />
  <rect x="160" y="260" width="40" height="40" fill="#1e40af" />
  <!-- Smaller pixels -->
  <rect x="110" y="140" width="20" height="20" fill="#0ea5e9" />
  <rect x="80" y="220" width="20" height="20" fill="#bae6fd" />
  <rect x="170" y="210" width="20" height="20" fill="#2563eb" />
  <rect x="80" y="320" width="20" height="20" fill="#1e3a8a" />
  <rect x="160" y="350" width="20" height="20" fill="#1e40af" />
`

const getMonoSymbolPaths = (color) => `
  <!-- Main C Shape (Right Side) -->
  <path d="M 280 80 A 176 176 0 0 1 280 432 L 190 432 A 266 266 0 0 0 456 256 A 266 266 0 0 0 190 80 Z" fill="${color}" />
  <!-- Top Diagonal Cut -->
  <polygon points="190,80 280,80 230,170 140,170" fill="${color}" />
  <!-- Bottom Diagonal Cut -->
  <polygon points="190,432 280,432 230,342 140,342" fill="${color}" />
  <!-- Digital Pixels (Left Side) -->
  <rect x="60" y="160" width="40" height="40" fill="${color}" />
  <rect x="110" y="210" width="40" height="40" fill="${color}" />
  <rect x="60" y="260" width="40" height="40" fill="${color}" />
  <rect x="110" y="310" width="40" height="40" fill="${color}" />
  <rect x="160" y="260" width="40" height="40" fill="${color}" />
  <!-- Smaller pixels -->
  <rect x="110" y="140" width="20" height="20" fill="${color}" />
  <rect x="80" y="220" width="20" height="20" fill="${color}" />
  <rect x="170" y="210" width="20" height="20" fill="${color}" />
  <rect x="80" y="320" width="20" height="20" fill="${color}" />
  <rect x="160" y="350" width="20" height="20" fill="${color}" />
`

const WORDMARK_PATHS = (color) => `
  <g fill="${color}" transform="translate(45, 450)">
    <!-- C -->
    <path d="M 720 150 A 105 105 0 0 0 615 255 A 105 105 0 0 0 720 360 L 720 315 A 60 60 0 0 1 660 255 A 60 60 0 0 1 720 195 Z" />
    <!-- A -->
    <path d="M 870 150 L 780 360 L 830 360 L 850 310 L 890 310 L 910 360 L 960 360 Z M 870 200 L 880 270 L 860 270 Z" fill-rule="evenodd" />
    <!-- M -->
    <polygon points="980,360 980,150 1025,150 1060,260 1095,150 1140,150 1140,360 1095,360 1095,240 1060,330 1025,240 1025,360" />
    <!-- T -->
    <polygon points="1170,150 1310,150 1310,195 1262.5,195 1262.5,360 1217.5,360 1217.5,195 1170,195" />
    <!-- E -->
    <polygon points="1340,150 1460,150 1460,195 1385,195 1385,232 1445,232 1445,277 1385,277 1385,315 1460,315 1460,360 1340,360" />
    <!-- C -->
    <path d="M 1605 150 A 105 105 0 0 0 1500 255 A 105 105 0 0 0 1605 360 L 1605 315 A 60 60 0 0 1 1545 255 A 60 60 0 0 1 1605 195 Z" />
    <!-- H -->
    <polygon points="1640,150 1685,150 1685,232 1765,232 1765,150 1810,150 1810,360 1765,360 1765,277 1685,277 1685,360 1640,360" />
  </g>
`

const HEADER = (viewBox, title, desc) => `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${title.replace(/ /g, '')}Title">
  <title id="${title.replace(/ /g, '')}Title">${title}</title>
  <desc>${desc}</desc>
`

// Resolve absolute path properly so we don't mess up
const outDir = 'd:\\Project\\CamTech\\services\\savemedia-web\\frontend\\public';

// 1. Icon (camtech-icon.svg)
fs.writeFileSync(
  path.join(outDir, 'camtech-icon.svg'),
  HEADER('0 0 512 512', 'CAMTECH Icon', 'CAMTECH technology logo symbol') + SYMBOL_PATHS + '\n</svg>'
)

// 2. Full Color Logo (camtech-logo.svg)
fs.writeFileSync(
  path.join(outDir, 'camtech-logo.svg'),
  HEADER('0 0 1900 512', 'CAMTECH', 'CAMTECH technology and education logo') + SYMBOL_PATHS + WORDMARK_PATHS('#0f172a') + '\n</svg>'
)

// 3. Dark Version (designed for light backgrounds -> meaning deep navy)
fs.writeFileSync(
  path.join(outDir, 'camtech-logo-dark.svg'),
  HEADER('0 0 1900 512', 'CAMTECH Dark', 'CAMTECH dark monochrome logo') + getMonoSymbolPaths('#0f172a') + WORDMARK_PATHS('#0f172a') + '\n</svg>'
)

// 4. White Version (designed for dark backgrounds -> meaning pure white)
fs.writeFileSync(
  path.join(outDir, 'camtech-logo-white.svg'),
  HEADER('0 0 1900 512', 'CAMTECH White', 'CAMTECH white monochrome logo') + getMonoSymbolPaths('#ffffff') + WORDMARK_PATHS('#ffffff') + '\n</svg>'
)

console.log('SVG files generated successfully!')
