export const TOOL_DOWNLOADER = 'downloader'
export const TOOL_AUDIO = 'audio'
export const TOOL_STICKER = 'sticker'
export const TOOL_MEME = 'meme'
export const TOOL_SRT_INFO = 'srt_info'

export default function AppSidebar({
  isOpen,
  onClose,
  activeTool,
  onSelectTool,
}) {
  const handleSelect = (toolId) => {
    onSelectTool(toolId)
    onClose()
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 z-50 flex flex-col justify-between transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${!isOpen ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Top: Brand Header */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25 shrink-0">
                ⚡
              </div>
              {isOpen && (
                <div className="animate-fade-in truncate">
                  <div className="font-extrabold text-white text-base tracking-tight leading-none">
                    CamTech
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                    Multi-Tool Hub
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Section 1: Media Tools */}
            <div>
              {isOpen && (
                <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  📥 Media Download
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => handleSelect(TOOL_DOWNLOADER)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    activeTool === TOOL_DOWNLOADER
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">🎬</span>
                  {isOpen && (
                    <span className="flex-1 text-left flex items-center justify-between">
                      <span>Video Downloader</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">
                        HD/4K
                      </span>
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleSelect(TOOL_DOWNLOADER)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    activeTool === TOOL_AUDIO
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">🎵</span>
                  {isOpen && (
                    <span className="flex-1 text-left flex items-center justify-between">
                      <span>Audio &amp; MP3</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        320k
                      </span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Section 2: Creative Studio */}
            <div>
              {isOpen && (
                <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  🎨 Creative Studio
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => handleSelect(TOOL_STICKER)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    activeTool === TOOL_STICKER
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">✨</span>
                  {isOpen && (
                    <span className="flex-1 text-left flex items-center justify-between">
                      <span>Telegram Stickers</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        HOT
                      </span>
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleSelect(TOOL_STICKER)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer text-slate-300 hover:bg-white/5 hover:text-white`}
                >
                  <span className="text-lg">💬</span>
                  {isOpen && (
                    <span className="flex-1 text-left flex items-center justify-between">
                      <span>Khmer Meme Text</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                        NEW
                      </span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Section 3: Telegram Bots & Automation */}
            <div>
              {isOpen && (
                <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ⚡ Automation Bots
                </div>
              )}
              <div className="space-y-1">
                <a
                  href="https://t.me/CamTechAutoPostBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  <span className="text-lg">🎤</span>
                  {isOpen && (
                    <span className="flex-1 text-left flex items-center justify-between">
                      <span>Lyrics /srt Bot</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        FREE
                      </span>
                    </span>
                  )}
                </a>

                <a
                  href="https://t.me/CamTechAutoPostBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                >
                  <span className="text-lg">📢</span>
                  {isOpen && (
                    <span className="flex-1 text-left flex items-center justify-between">
                      <span>FB Auto-Post</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        AUTO
                      </span>
                    </span>
                  )}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Server Status Indicator */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            {isOpen && (
              <div className="text-[11px] font-medium text-slate-300 truncate">
                All Microservices Live
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
