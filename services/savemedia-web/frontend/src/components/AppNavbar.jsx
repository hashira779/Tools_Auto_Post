import { useState, useEffect, useRef } from 'react'
import CamtechLogo from './CamtechLogo'
export const TOOL_DOWNLOADER = 'downloader'
export const TOOL_TTS = 'tts'
export const TOOL_STICKER = 'sticker'

const BOTS = [
  {
    name: 'Lyrics / Subtitle Bot',
    desc: 'Auto video subtitles',
    url: 'https://t.me/CamTechLyricBot',
    label: 'Free',
  },
  {
    name: 'Facebook Auto-Post',
    desc: 'Automated social posting',
    url: 'https://t.me/CamTechAutoPostBot',
    label: 'Auto',
  },
]

const NAV_TOOLS = [
  { id: TOOL_DOWNLOADER, label: 'Downloader', mobileLabel: 'Download' },
  { id: TOOL_TTS, label: 'Text to Voice', mobileLabel: 'Voice' },
  { id: TOOL_STICKER, label: 'Stickers', mobileLabel: 'Stickers' },
]

export default function AppNavbar({ activeTool, onSelectTool, onOpenMobileMenu }) {
  const [botsMenuOpen, setBotsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef(null)

  // Track scroll for navbar border
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!botsMenuOpen) return
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setBotsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [botsMenuOpen])

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
          </nav>

          {/* ── Right: Bots + Mobile Menu ─────────────── */}
          <div className="flex items-center gap-1.5">

            {/* Bots Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setBotsMenuOpen((p) => !p)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer focus-ring ${
                  botsMenuOpen
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                <span className="hidden sm:inline">Bots</span>
                <svg className={`w-3 h-3 transition-transform duration-150 ${botsMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Panel */}
              {botsMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 dropdown-panel p-1.5 z-50 animate-slide-in-down">
                  <div className="px-2.5 py-2">
                    <span className="text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider">
                      Telegram Bots
                    </span>
                  </div>

                  {BOTS.map((bot) => (
                    <a
                      key={bot.name}
                      href={bot.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setBotsMenuOpen(false)}
                      className="flex items-center justify-between px-2.5 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--color-surface-3)] group"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[var(--color-text)] truncate">{bot.name}</div>
                        <div className="text-[11px] text-[var(--color-text-4)]">{bot.desc}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="badge text-[10px] py-0.5 px-1.5">{bot.label}</span>
                        <svg className="w-3 h-3 text-[var(--color-text-4)] group-hover:text-[var(--color-text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  ))}

                  <div className="mt-1 pt-1.5 border-t border-[var(--color-border)] px-2.5 pb-1">
                    <p className="text-[10px] text-[var(--color-text-4)]">
                      Open in Telegram to get started
                    </p>
                  </div>
                </div>
              )}
            </div>

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
