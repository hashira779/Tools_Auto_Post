export const TOOL_DOWNLOADER = 'downloader'
export const TOOL_STICKER = 'sticker'

export default function ToolSwitcher({ activeTool, onSelectTool }) {
  return (
    <div className="flex items-center justify-center mb-8 animate-pop-in">
      <div className="inline-flex p-1.5 bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 gap-2">
        {/* Media Downloader Tab */}
        <button
          onClick={() => onSelectTool(TOOL_DOWNLOADER)}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm sm:text-base font-extrabold transition-all duration-300 cursor-pointer select-none ${
            activeTool === TOOL_DOWNLOADER
              ? 'bg-[var(--color-accent-blue)] text-white shadow-md shadow-blue-500/25 scale-[1.02]'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">🎬</span>
          <span>Video Downloader</span>
        </button>

        {/* Sticker Maker Tab */}
        <button
          onClick={() => onSelectTool(TOOL_STICKER)}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm sm:text-base font-extrabold transition-all duration-300 cursor-pointer select-none relative ${
            activeTool === TOOL_STICKER
              ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white shadow-md shadow-purple-500/25 scale-[1.02]'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl">🎨</span>
          <span>Sticker Maker</span>
          <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm animate-pulse">
            NEW
          </span>
        </button>
      </div>
    </div>
  )
}
