export const TOOL_DOWNLOADER = 'downloader'
export const TOOL_STICKER = 'sticker'

export default function ToolSwitcher({ activeTool, onSelectTool }) {
  return (
    <div className="flex items-center justify-center mb-8 sm:mb-12 animate-fade-in">
      <nav aria-label="Tool Switcher" className="inline-flex p-1.5 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/40 gap-1.5">
        {/* Media Downloader Tab */}
        <button
          onClick={() => onSelectTool(TOOL_DOWNLOADER)}
          className={`flex items-center gap-2.5 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none ${
            activeTool === TOOL_DOWNLOADER
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-white/10 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Video Downloader</span>
        </button>

        {/* Sticker Maker Tab */}
        <button
          onClick={() => onSelectTool(TOOL_STICKER)}
          className={`flex items-center gap-2.5 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none relative ${
            activeTool === TOOL_STICKER
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 border border-white/10 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <span>Sticker Maker</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
            NEW
          </span>
        </button>
      </nav>
    </div>
  )
}
