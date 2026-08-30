const EMOJI_CATEGORIES = [
  {
    name: 'Reactions',
    emojis: ['😀', '😂', '😍', '🥰', '😎', '🤩', '😇', '🥺', '😜', '🥳', '🤔', '😴'],
  },
  {
    name: 'Vibes',
    emojis: ['❤️', '🔥', '⭐', '✨', '🎉', '👍', '💪', '🙌', '💯', '💥', '🚀', '🌈'],
  },
  {
    name: 'Characters',
    emojis: ['🐱', '🐶', '🦊', '🐼', '🦁', '🦄', '🐸', '🌸', '👑', '🏆', '🎯', '🎵'],
  },
]

export default function StickerEmojiPicker({ selected, onSelect }) {
  return (
    <div className="card p-5 sm:p-6 animate-fade-in">
      <div className="mb-5 flex flex-col items-center text-center">
        <h3 className="text-[15px] font-semibold text-[var(--color-text)]">
          Pick Emoji
        </h3>
        <p className="text-[12px] text-[var(--color-text-3)] mt-1 max-w-xs">
          Telegram uses this emoji when suggesting stickers in chat
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name} className="card-elevated p-3 rounded-xl border border-[var(--color-border)]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-4)] mb-2.5 px-1">
              {cat.name}
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {cat.emojis.map((emoji) => {
                const isSelected = selected === emoji
                return (
                  <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className={`aspect-square rounded-lg text-lg sm:text-xl flex items-center justify-center transition-all duration-150 cursor-pointer select-none focus-ring ${
                      isSelected
                        ? 'bg-[var(--color-primary-500)] scale-110 shadow-md ring-2 ring-[var(--color-surface)] z-10'
                        : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-2)]'
                    }`}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected & Continue */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-4)]">Selected</span>
          <div className="w-10 h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-2)] rounded-xl flex items-center justify-center text-2xl shadow-inner">
            {selected}
          </div>
      </div>
    </div>
  )
}
