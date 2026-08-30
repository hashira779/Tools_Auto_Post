// ─────────────────────────────────────────────────────────────
// Central route map: every tool has a real, shareable URL.
// NOTE: /pdf/ is reverse-proxied by Nginx to Stirling-PDF, so the
// SPA route for the PDF tool wrapper lives at /pdf-tools instead.
// ─────────────────────────────────────────────────────────────

export const TOOL_DOWNLOADER = 'downloader'
export const TOOL_TTS = 'tts'
export const TOOL_STICKER = 'sticker'
export const TOOL_ADMIN = 'admin'
export const TOOL_PDF = 'pdf'
export const TOOL_SCREEN_SHARE = 'screen-share'

export const TOOL_PATHS = {
  [TOOL_DOWNLOADER]: '/',
  [TOOL_TTS]: '/tts',
  [TOOL_STICKER]: '/sticker',
  [TOOL_PDF]: '/pdf-tools',
  [TOOL_SCREEN_SHARE]: '/live',
  [TOOL_ADMIN]: '/admin',
}

/** Resolve the active tool id from a pathname. */
export function toolFromPath(pathname) {
  if (pathname.startsWith('/share/')) return TOOL_SCREEN_SHARE
  if (pathname.startsWith('/live')) return TOOL_SCREEN_SHARE
  if (pathname.startsWith('/tts')) return TOOL_TTS
  if (pathname.startsWith('/sticker')) return TOOL_STICKER
  if (pathname.startsWith('/pdf-tools')) return TOOL_PDF
  if (pathname.startsWith('/admin')) return TOOL_ADMIN
  return TOOL_DOWNLOADER
}
