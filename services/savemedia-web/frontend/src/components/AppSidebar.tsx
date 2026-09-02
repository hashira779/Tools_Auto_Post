import {
  TOOL_DOWNLOADER, TOOL_TTS, TOOL_STICKER, TOOL_PDF, TOOL_SCREEN_SHARE, TOOL_AUTOMATION
} from '../routes'

const SIDEBAR_TOOLS = [
  { id: TOOL_DOWNLOADER, label: 'Media Downloader' },
  { id: TOOL_TTS, label: 'Text to Voice' },
  { id: TOOL_STICKER, label: 'Telegram Stickers' },
  { id: TOOL_PDF, label: 'PDF Tools' },
  { id: TOOL_SCREEN_SHARE, label: 'Live Camera / Screen Share' },
  { id: TOOL_AUTOMATION, label: 'Workflow Automations' },
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
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed top-4 bottom-4 right-4 w-72 max-w-[80vw] bg-[var(--navbar-bg)] backdrop-blur-[40px] border border-[var(--color-glass-border)] rounded-2xl shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden"
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-glass-border)]">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="w-6 h-6" width="24" height="24" />
            <span className="font-bold text-[var(--color-text)] text-sm">CamTech</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-3)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer focus-ring"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {/* Tools */}
          <div>
            <div className="text-[10px] font-bold text-[var(--color-text-4)] mb-2 px-2">
              Tools
            </div>
            <div className="space-y-1">
              {SIDEBAR_TOOLS.map((tool) => {
                const isActive = activeTool === tool.id
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleSelect(tool.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-200 cursor-pointer focus-ring ${
                      isActive
                        ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-glass-border)] shadow-sm'
                        : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-1)] border border-transparent'
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
            <div className="text-[10px] font-bold text-[var(--color-text-4)] mb-2 px-2">
              Telegram Bots
            </div>
            <div className="space-y-1">
              {BOTS.map((bot) => (
                <a
                  key={bot.name}
                  href={bot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--color-text-3)] hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-1)] transition-colors border border-transparent"
                >
                  <span>{bot.name}</span>
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--color-glass-border)] bg-[var(--color-surface-1)]/50">
          <p className="text-[11px] font-semibold text-[var(--color-text-4)] text-center">
            CamTech &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  )
}
