export const TOOL_DOWNLOADER = 'downloader'
export const TOOL_TTS = 'tts'
export const TOOL_STICKER = 'sticker'

const SIDEBAR_TOOLS = [
  { id: TOOL_DOWNLOADER, label: 'Media Downloader' },
  { id: TOOL_TTS, label: 'Text to Voice' },
  { id: TOOL_STICKER, label: 'Telegram Stickers' },
]

const BOTS = [
  { name: 'Lyrics / Subtitle Bot', url: 'https://t.me/CamTechLyricBot' },
  { name: 'Facebook Auto-Post', url: 'https://t.me/CamTechAutoPostBot' },
]

export default function AppSidebar({ isOpen, onClose, activeTool, onSelectTool }) {
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[var(--color-surface)] border-l border-[var(--color-border)] z-50 flex flex-col animate-slide-in-right"
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="w-7 h-7" width="28" height="28" />
            <span className="font-bold text-[var(--color-text)] text-sm">CamTech</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-3)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer focus-ring"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Tools */}
          <div>
            <div className="text-[11px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-2 px-2">
              Tools
            </div>
            <div className="space-y-0.5">
              {SIDEBAR_TOOLS.map((tool) => {
                const isActive = activeTool === tool.id
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleSelect(tool.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-ring ${
                      isActive
                        ? 'bg-[var(--color-primary-500)] text-white'
                        : 'text-[var(--color-text-2)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    {tool.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Telegram Bots */}
          <div>
            <div className="text-[11px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-2 px-2">
              Telegram Bots
            </div>
            <div className="space-y-0.5">
              {BOTS.map((bot) => (
                <a
                  key={bot.name}
                  href={bot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-[var(--color-text-2)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <span>{bot.name}</span>
                  <svg className="w-3.5 h-3.5 text-[var(--color-text-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <p className="text-[11px] text-[var(--color-text-4)]">
            CamTech &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  )
}
