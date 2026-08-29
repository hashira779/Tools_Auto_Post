import { useState, useEffect } from 'react'
import CamtechLogo from './CamtechLogo'
import { useAuth } from '../hooks/useAuth'

export const TOOL_DOWNLOADER = 'downloader'
export const TOOL_TTS = 'tts'
export const TOOL_STICKER = 'sticker'
export const TOOL_ADMIN = 'admin'
export const TOOL_PDF = 'pdf'
export const TOOL_SCREEN_SHARE = 'screen-share'

const NAV_TOOLS = [
  { id: TOOL_DOWNLOADER, label: 'Downloader', mobileLabel: 'Download' },
  { id: TOOL_TTS, label: 'Text to Voice', mobileLabel: 'Voice' },
  { id: TOOL_STICKER, label: 'Stickers', mobileLabel: 'Stickers' },
  { id: TOOL_PDF, label: 'PDF Tools', mobileLabel: 'PDF' },
  { id: TOOL_SCREEN_SHARE, label: 'Screen Share', mobileLabel: 'Share' },
]

export default function AppNavbar({ activeTool, onSelectTool, onOpenMobileMenu }) {
  const { dbUser } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      // Default to dark theme if nothing saved
      return savedTheme || 'dark'
    }
    return 'dark'
  })

  // Track scroll for navbar border
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Apply theme to html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full navbar transition-[border-color] duration-200 ${
        scrolled ? 'border-b border-[var(--color-border-2)]' : 'border-b border-transparent'
      }`}
    >
      <div className="max-w-[1024px] mx-auto px-5 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between">

          {/* ── Left: Logo ────────────────────────────── */}
          <button
            onClick={() => onSelectTool(TOOL_DOWNLOADER)}
            className="flex items-center select-none cursor-pointer group focus-ring rounded-lg py-1.5 px-2 -ml-2"
            aria-label="CamTech home"
          >
            <CamtechLogo variant="full" theme="color" width={140} />
          </button>

          {/* ── Center: Nav Tabs (Desktop) ────────────── */}
          <nav className="hidden md:flex items-center gap-0.5" role="tablist" aria-label="Tools">
            {NAV_TOOLS.map((tool) => {
              const isActive = activeTool === tool.id
              return (
                <button
                  key={tool.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectTool(tool.id)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer focus-ring ${
                    isActive
                      ? 'text-[var(--color-text)] bg-[var(--color-surface-3)]'
                      : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {tool.label}
                </button>
              )
            })}
            
            {dbUser?.is_admin && (
              <button
                role="tab"
                aria-selected={activeTool === TOOL_ADMIN}
                onClick={() => onSelectTool(TOOL_ADMIN)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer focus-ring flex items-center gap-1.5 ${
                  activeTool === TOOL_ADMIN
                    ? 'text-red-400 bg-red-400/10'
                    : 'text-red-500/70 hover:text-red-400 hover:bg-red-400/5'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m3.332-8A4.499 4.499 0 1115.67 7H9.33a4.499 4.499 0 112.338 8.057l1.232 3.696a1 1 0 001.914 0l1.232-3.696A4.499 4.499 0 0115.332 7z" />
                </svg>
                Admin
              </button>
            )}
          </nav>

          {/* ── Right: Fullscreen + Theme + Mobile Menu ─────────────── */}
          <div className="flex items-center gap-2">

            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-3)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer focus-ring hidden sm:flex"
              aria-label="Toggle Fullscreen"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-3)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer focus-ring"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {/* Sun Icon */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.485-7.071l-1.414 1.414M6.343 17.657l-1.414 1.414m12.728 0l-1.414-1.414M6.343 6.343L4.929 4.929M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {/* Moon Icon */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-3)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer focus-ring"
              aria-label="Open menu"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Tool Tabs ─────────────────────────── */}
      <div className="md:hidden border-t border-[var(--color-border)]">
        <div className="max-w-[800px] mx-auto px-4">
          <nav className="flex" role="tablist" aria-label="Tools">
            {NAV_TOOLS.map((tool) => {
              const isActive = activeTool === tool.id
              return (
                <button
                  key={tool.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectTool(tool.id)}
                  className={`flex-1 py-2.5 text-center text-xs font-medium transition-colors cursor-pointer relative ${
                    isActive
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-text-4)]'
                  }`}
                >
                  {tool.mobileLabel}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-[var(--color-primary-500)]" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
