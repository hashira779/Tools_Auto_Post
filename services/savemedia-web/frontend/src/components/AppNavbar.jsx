export default function AppNavbar({
  onToggleSidebar,
  activeTool,
  onSelectTool,
}) {
  return (
    <header className="w-full max-w-[1080px] h-16 flex items-center justify-between px-4 sm:px-6 mb-4">
      {/* Left: Sidebar Toggle + Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 shadow-sm"
          title="Toggle Navigation Menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
            CamTech <span className="text-indigo-400 font-medium text-xs sm:text-sm">Studio</span>
          </span>
        </div>
      </div>

      {/* Right: Quick Pill Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-white/10 rounded-xl">
        <button
          onClick={() => onSelectTool('downloader')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTool === 'downloader' || activeTool === 'audio'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎬 Video DL
        </button>
        <button
          onClick={() => onSelectTool('sticker')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTool === 'sticker' || activeTool === 'meme'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎨 Stickers &amp; Memes
        </button>
      </div>
    </header>
  )
}
