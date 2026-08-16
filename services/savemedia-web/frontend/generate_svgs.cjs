const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, 'public')

const SYMBOL_PATHS = (theme) => {
  const isColor = theme === 'color'
  const fillDark = isColor ? '#0B1220' : 'currentColor'
  const fillBlue = isColor ? '#1473E6' : 'currentColor'
  const fillCyan = isColor ? '#19B5FE' : 'currentColor'
  
  const gradTop = isColor ? 'url(#camtech-top-grad)' : 'currentColor'
  const gradBottom = isColor ? 'url(#camtech-bottom-grad)' : 'currentColor'

  return `
    ${isColor ? `
    <defs>
      <linearGradient id="camtech-top-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1473E6" />
        <stop offset="100%" stop-color="#19B5FE" />
      </linearGradient>
      <linearGradient id="camtech-bottom-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#19B5FE" />
        <stop offset="100%" stop-color="#0B1220" />
      </linearGradient>
    </defs>
    ` : ''}
    <!-- Back Curve -->
    <path d="M 230 110 A 146 146 0 0 1 376 256 A 146 146 0 0 1 230 402 L 200 402 A 176 176 0 0 0 416 256 A 176 176 0 0 0 200 110 Z" fill="${fillDark}" />

    <!-- Top front ribbon -->
    <path d="M 150 110 L 230 110 A 146 146 0 0 1 346 190 L 260 190 A 70 70 0 0 0 230 170 L 150 170 Z" fill="${gradTop}" />
    <!-- Top angle cut -->
    <polygon points="346,190 290,260 204,260 260,190" fill="${fillCyan}" />

    <!-- Bottom front ribbon -->
    <path d="M 150 402 L 230 402 A 146 146 0 0 0 346 322 L 260 322 A 70 70 0 0 1 230 342 L 150 342 Z" fill="${gradBottom}" />
    <!-- Bottom angle cut -->
    <polygon points="346,322 290,252 204,252 260,322" fill="${fillBlue}" />

    <!-- Digital Pixels (Left Edge) -->
    <rect x="130" y="220" width="36" height="36" fill="${fillBlue}" />
    <rect x="80" y="270" width="36" height="36" fill="${fillCyan}" />
    <rect x="140" y="310" width="30" height="30" fill="${fillBlue}" />
    
    <rect x="90" y="180" width="22" height="22" fill="${fillCyan}" />
    <rect x="110" y="240" width="16" height="16" fill="${fillDark}" />
    
    <rect x="40" y="240" width="28" height="28" fill="${fillDark}" />
    <rect x="110" y="320" width="16" height="16" fill="${fillCyan}" />
    <rect x="50" y="300" width="22" height="22" fill="${fillDark}" />
  `
}

const WORDMARK_PATHS = (theme) => {
  const isColor = theme === 'color'
  const colorDark = isColor ? '#0B1220' : 'currentColor' // CAM
  const colorBlue = isColor ? '#1473E6' : 'currentColor' // TECH

  return `
  <g transform="translate(480, 70)">
    <!-- C (Navy) -->
    <path d="M 120 40 A 110 110 0 0 0 20 150 A 110 110 0 0 0 120 260 L 120 215 A 65 65 0 0 1 65 150 A 65 65 0 0 1 120 85 Z" fill="${colorDark}" />
    
    <!-- A (Navy Outer, Blue Inner) -->
    <path d="M 160 260 L 230 40 L 300 260 L 255 260 L 230 180 L 205 260 Z" fill="${colorDark}" />
    <polygon points="230,195 205,260 255,260" fill="${colorBlue}" />
    
    <!-- M (Navy) -->
    <polygon points="340,260 340,40 390,40 435,150 480,40 530,40 530,260 485,260 485,130 435,220 385,130 385,260" fill="${colorDark}" />
    
    <!-- T (Blue) -->
    <polygon points="560,40 700,40 700,85 652.5,85 652.5,260 607.5,260 607.5,85 560,85" fill="${colorBlue}" />
    
    <!-- E (Blue) -->
    <polygon points="730,40 850,40 850,85 775,85 775,127 835,127 835,172 775,172 775,215 850,215 850,260 730,260" fill="${colorBlue}" />
    
    <!-- C (Blue) -->
    <path d="M 980 40 A 110 110 0 0 0 880 150 A 110 110 0 0 0 980 260 L 980 215 A 65 65 0 0 1 925 150 A 65 65 0 0 1 980 85 Z" fill="${colorBlue}" />
    
    <!-- H (Blue) -->
    <polygon points="1010,40 1055,40 1055,127 1135,127 1135,40 1180,40 1180,260 1135,260 1135,172 1055,172 1055,260 1010,260" fill="${colorBlue}" />
  </g>
  
  <g transform="translate(480, 370)">
    <rect x="0" y="10" width="160" height="2" fill="${colorDark}" opacity="0.5" />
    <text x="590" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" letter-spacing="8" fill="${colorDark}" text-anchor="middle">INNOVATION <tspan fill="${colorBlue}">•</tspan> TECHNOLOGY <tspan fill="${colorBlue}">•</tspan> EDUCATION</text>
    <rect x="1015" y="10" width="165" height="2" fill="${colorDark}" opacity="0.5" />
  </g>
  `
}

const HEADER = (viewBox, title, desc, monoFill) => `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${title.replace(/ /g, '')}Title"${monoFill ? ` color="${monoFill}"` : ''}>
  <title id="${title.replace(/ /g, '')}Title">${title}</title>
  <desc>${desc}</desc>
`

// 1. Icon (camtech-icon.svg)
fs.writeFileSync(
  path.join(publicDir, 'camtech-icon.svg'),
  HEADER('0 0 512 512', 'CAMTECH Icon', 'CAMTECH technology logo symbol') + SYMBOL_PATHS('color') + '\n</svg>'
)

// 2. Full Color Logo (camtech-logo.svg)
fs.writeFileSync(
  path.join(publicDir, 'camtech-logo.svg'),
  HEADER('0 0 1700 512', 'CAMTECH', 'CAMTECH technology and education logo') + SYMBOL_PATHS('color') + WORDMARK_PATHS('color') + '\n</svg>'
)

// 3. Dark Version (designed for light backgrounds -> deep navy)
fs.writeFileSync(
  path.join(publicDir, 'camtech-logo-dark.svg'),
  HEADER('0 0 1700 512', 'CAMTECH Dark', 'CAMTECH dark logo', '#0B1220') + SYMBOL_PATHS('mono') + WORDMARK_PATHS('mono') + '\n</svg>'
)

// 4. White Version (designed for dark backgrounds -> pure white)
fs.writeFileSync(
  path.join(publicDir, 'camtech-logo-white.svg'),
  HEADER('0 0 1700 512', 'CAMTECH White', 'CAMTECH white logo', '#FFFFFF') + SYMBOL_PATHS('mono') + WORDMARK_PATHS('mono') + '\n</svg>'
)

// 5. Mono Version (pure black)
fs.writeFileSync(
  path.join(publicDir, 'camtech-logo-mono.svg'),
  HEADER('0 0 1700 512', 'CAMTECH Mono', 'CAMTECH pure monochrome logo', '#000000') + SYMBOL_PATHS('mono') + WORDMARK_PATHS('mono') + '\n</svg>'
)

console.log('SVG files generated successfully!')
