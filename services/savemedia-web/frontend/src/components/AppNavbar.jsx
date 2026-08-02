import { useState } from 'react'

export const TOOL_DOWNLOADER = 'downloader'
export const TOOL_CV = 'cv'
export const TOOL_STICKER = 'sticker'

export default function AppNavbar({
  activeTool,
  onSelectTool,
  onOpenMobileMenu,
}) {
  const [botsMenuOpen, setBotsMenuOpen] = useState(false)

  return (
    <header className="w-full max-w-[960px] sticky top-3 z-30 mb-8 sm:mb-12">
      <div className="w-full h-14 sm:h-16 px-3 sm:px-5 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <div
          onClick={() => onSelectTool(TOOL_DOWNLOADER)}
          className="flex items-center gap-2.5 sm:gap-3 select-none cursor-pointer group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-sm group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
              CamTech
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              Pro Studio
            </span>
          </div>
        </div>

        {/* Center: Sleek Segmented Switcher (Desktop) */}
        <div className="hidden md:flex items-center p-1 bg-slate-950/60 border border-white/10 rounded-xl gap-1">
          {/* 1. Downloader */}
          <button
            onClick={() => onSelectTool(TOOL_DOWNLOADER)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTool === TOOL_DOWNLOADER
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Media Downloader</span>
          </button>

          {/* 2. AI CV 4x6 Studio */}
          <button
            onClick={() => onSelectTool(TOOL_CV)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer relative ${
              activeTool === TOOL_CV
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>AI CV 4×6 Photo</span>
            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              NEW
            </span>
          </button>

          {/* 3. Telegram Stickers & Memes */}
          <button
            onClick={() => onSelectTool(TOOL_STICKER)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer relative ${
              activeTool === TOOL_STICKER
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Stickers</span>
            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              HOT
            </span>
          </button>
        </div>

        {/* Right: Automation Bots Dropdown & Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Bots Dropdown */}
          <div className="relative">
            <button
              onClick={() => setBotsMenuOpen((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
            >
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Bots</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {botsMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setBotsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 p-2 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 animate-fade-in space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Telegram Automation
                  </div>
                  <a
                    href="https://t.me/CamTechAutoPostBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setBotsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                      🎤
                    </span>
                    <div className="flex-1 text-left">
                      <div>Lyrics /srt Bot</div>
                      <div className="text-[10px] text-slate-400 font-normal">Auto video subtitles</div>
                    </div>
                  </a>
                  <a
                    href="https://t.me/CamTechAutoPostBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setBotsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      📢
                    </span>
                    <div className="flex-1 text-left">
                      <div>Facebook Auto-Post</div>
                      <div className="text-[10px] text-slate-400 font-normal">Automated social posting</div>
                    </div>
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            title="Open Menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Switcher */}
      <div className="grid grid-cols-3 md:hidden gap-1 p-1 mt-3 bg-slate-900/90 border border-white/10 rounded-xl max-w-sm mx-auto shadow-lg">
        <button
          onClick={() => onSelectTool(TOOL_DOWNLOADER)}
          className={`flex items-center justify-center py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTool === TOOL_DOWNLOADER
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Downloader</span>
        </button>
        <button
          onClick={() => onSelectTool(TOOL_CV)}
          className={`flex items-center justify-center py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTool === TOOL_CV
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>CV 4×6</span>
        </button>
        <button
          onClick={() => onSelectTool(TOOL_STICKER)}
          className={`flex items-center justify-center py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTool === TOOL_STICKER
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Stickers</span>
        </button>
      </div>
    </header>
  )
}
