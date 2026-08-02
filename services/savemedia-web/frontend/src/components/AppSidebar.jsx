export const TOOL_DOWNLOADER = 'downloader'
export const TOOL_CV = 'cv'
export const TOOL_STICKER = 'sticker'

export default function AppSidebar({
  isOpen,
  onClose,
  activeTool,
  onSelectTool,
}) {
  if (!isOpen) return null

  const handleSelect = (toolId) => {
    onSelectTool(toolId)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 transition-opacity animate-fade-in"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-950/98 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col justify-between p-5 shadow-2xl animate-fade-in">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm">
                ⚡
              </div>
              <span className="font-extrabold text-white text-base">CamTech Pro Studio</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Studio Tools
              </div>
              <div className="space-y-1.5">
                {/* 1. Downloader */}
                <button
                  onClick={() => handleSelect(TOOL_DOWNLOADER)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    activeTool === TOOL_DOWNLOADER
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="flex-1 text-left">Media Downloader</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">
                    HD/4K
                  </span>
                </button>

                {/* 2. AI CV 4x6 Studio */}
                <button
                  onClick={() => handleSelect(TOOL_CV)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    activeTool === TOOL_CV
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="flex-1 text-left">AI CV 4×6 Photo Studio</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                    NEW
                  </span>
                </button>

                {/* 3. Telegram Sticker Studio */}
                <button
                  onClick={() => handleSelect(TOOL_STICKER)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    activeTool === TOOL_STICKER
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="flex-1 text-left">Telegram Sticker Studio</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    HOT
                  </span>
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Telegram Bots
              </div>
              <div className="space-y-1.5">
                <a
                  href="https://t.me/CamTechAutoPostBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  <span className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                    🎤
                  </span>
                  <span className="flex-1 text-left">Lyrics /srt Subtitle Bot</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                    FREE
                  </span>
                </a>

                <a
                  href="https://t.me/CamTechAutoPostBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                    📢
                  </span>
                  <span className="flex-1 text-left">Facebook Auto-Post</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    AUTO
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Systems Online</span>
          </div>
          <span>v2.5</span>
        </div>
      </div>
    </>
  )
}
