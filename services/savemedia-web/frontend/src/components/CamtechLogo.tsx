import React from 'react'

export default function CamtechLogo({
  variant = 'full', // 'full' | 'icon' | 'stacked'
  theme = 'color', // 'color' | 'dark' | 'white' | 'mono'
  width,
  className = '',
}) {
  const isColor = theme === 'color'

  let fillDark, fillBlue, fillCyan, gradTop, gradBottom

  switch (theme) {
    case 'dark':
      // For light backgrounds (deep navy color)
      fillDark = '#0B1220'
      fillBlue = '#0B1220'
      fillCyan = '#0B1220'
      gradTop = '#0B1220'
      gradBottom = '#0B1220'
      break
    case 'white':
      // For dark backgrounds (pure white color)
      fillDark = '#FFFFFF'
      fillBlue = '#FFFFFF'
      fillCyan = '#FFFFFF'
      gradTop = '#FFFFFF'
      gradBottom = '#FFFFFF'
      break
    case 'mono':
      // Pure black or inherits via CSS
      fillDark = 'currentColor'
      fillBlue = 'currentColor'
      fillCyan = 'currentColor'
      gradTop = 'currentColor'
      gradBottom = 'currentColor'
      break
    case 'color':
    default:
      // Brand colors based exactly on the logo: dark parts use dynamic text color (navy in light, white in dark)
      fillDark = 'var(--color-text, currentColor)'
      fillBlue = '#1473E6'
      fillCyan = '#19B5FE'
      gradTop = 'url(#camtech-top-grad)'
      gradBottom = 'url(#camtech-bottom-grad)'
      break
  }

  const defs = isColor && (
    <defs>
      <linearGradient id="camtech-top-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1473E6" />
        <stop offset="100%" stopColor="#19B5FE" />
      </linearGradient>
      <linearGradient id="camtech-bottom-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#19B5FE" />
        <stop offset="100%" stopColor="#0B1220" />
      </linearGradient>
    </defs>
  )

  const SymbolContent = () => (
    <>
      {/* Back Curve */}
      <path d="M 230 110 A 146 146 0 0 1 376 256 A 146 146 0 0 1 230 402 L 200 402 A 176 176 0 0 0 416 256 A 176 176 0 0 0 200 110 Z" fill={fillDark} />

      {/* Top front ribbon */}
      <path d="M 150 110 L 230 110 A 146 146 0 0 1 346 190 L 260 190 A 70 70 0 0 0 230 170 L 150 170 Z" fill={gradTop} />
      <polygon points="346,190 290,260 204,260 260,190" fill={fillCyan} />

      {/* Bottom front ribbon */}
      <path d="M 150 402 L 230 402 A 146 146 0 0 0 346 322 L 260 322 A 70 70 0 0 1 230 342 L 150 342 Z" fill={gradBottom} />
      <polygon points="346,322 290,252 204,252 260,322" fill={fillBlue} />

      {/* Digital Pixels (Left Edge) */}
      <rect x="130" y="220" width="36" height="36" fill={fillBlue} />
      <rect x="80" y="270" width="36" height="36" fill={fillCyan} />
      <rect x="140" y="310" width="30" height="30" fill={fillBlue} />
      
      <rect x="90" y="180" width="22" height="22" fill={fillCyan} />
      <rect x="110" y="240" width="16" height="16" fill={fillDark} />
      
      <rect x="40" y="240" width="28" height="28" fill={fillDark} />
      <rect x="110" y="320" width="16" height="16" fill={fillCyan} />
      <rect x="50" y="300" width="22" height="22" fill={fillDark} />
    </>
  )

  const drawWordmark = () => {
    const wordDark = fillDark
    const wordBlue = isColor ? '#1473E6' : fillDark

    return (
      <g>
        <g transform="translate(480, 70)">
          {/* C */}
          <path d="M 120 40 A 110 110 0 0 0 20 150 A 110 110 0 0 0 120 260 L 120 215 A 65 65 0 0 1 65 150 A 65 65 0 0 1 120 85 Z" fill={wordDark} />
          {/* A */}
          <path d="M 160 260 L 230 40 L 300 260 L 255 260 L 230 180 L 205 260 Z" fill={wordDark} />
          <polygon points="230,195 205,260 255,260" fill={wordBlue} />
          {/* M */}
          <polygon points="340,260 340,40 390,40 435,150 480,40 530,40 530,260 485,260 485,130 435,220 385,130 385,260" fill={wordDark} />
          {/* T */}
          <polygon points="560,40 700,40 700,85 652.5,85 652.5,260 607.5,260 607.5,85 560,85" fill={wordBlue} />
          {/* E */}
          <polygon points="730,40 850,40 850,85 775,85 775,127 835,127 835,172 775,172 775,215 850,215 850,260 730,260" fill={wordBlue} />
          {/* C */}
          <path d="M 980 40 A 110 110 0 0 0 880 150 A 110 110 0 0 0 980 260 L 980 215 A 65 65 0 0 1 925 150 A 65 65 0 0 1 980 85 Z" fill={wordBlue} />
          {/* H */}
          <polygon points="1010,40 1055,40 1055,127 1135,127 1135,40 1180,40 1180,260 1135,260 1135,172 1055,172 1055,260 1010,260" fill={wordBlue} />
        </g>
        <g transform="translate(480, 370)">
          <rect x="0" y="10" width="160" height="2" fill={wordDark} opacity="0.5" />
          <text x="590" y="18" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="500" letterSpacing="8" fill={wordDark} textAnchor="middle">
            INNOVATION <tspan fill={wordBlue}>•</tspan> TECHNOLOGY <tspan fill={wordBlue}>•</tspan> EDUCATION
          </text>
          <rect x="1015" y="10" width="165" height="2" fill={wordDark} opacity="0.5" />
        </g>
      </g>
    )
  }

  const baseClasses = `camtech-logo transition-[transform,opacity] duration-200 ease-out hover: inline-block select-none ${className}`

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 512 512"
        width={width || 32}
        height={width || 32}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="camtechIconTitle"
        className={baseClasses}
        aria-hidden={!width}
      >
        <title id="camtechIconTitle">CAMTECH Icon</title>
        {defs}
        <SymbolContent />
      </svg>
    )
  }

  if (variant === 'stacked') {
    return (
      <svg
        viewBox="0 0 1800 1000"
        width={width || 120}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="camtechStackedTitle"
        className={baseClasses}
        aria-hidden={!width}
      >
        <title id="camtechStackedTitle">CAMTECH Logo</title>
        {defs}
        <g transform="translate(644, 0)">
          <SymbolContent />
        </g>
        <g transform="translate(55, 450)">
          {drawWordmark()}
        </g>
      </svg>
    )
  }

  // full
  return (
    <svg
      viewBox="0 0 1700 512"
      width={width || 180}
      height={width ? width * (512 / 1700) : undefined}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="camtechFullTitle"
      className={baseClasses}
      aria-hidden={!width}
    >
      <title id="camtechFullTitle">CAMTECH</title>
      <desc>CAMTECH technology, innovation and education logo</desc>
      {defs}
      <SymbolContent />
      {drawWordmark()}
    </svg>
  )
}
