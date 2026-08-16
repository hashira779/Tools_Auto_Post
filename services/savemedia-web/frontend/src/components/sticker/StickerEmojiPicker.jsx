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

export default function StickerEmojiPicker({ selected, onSelect, onContinue }) {
  return (
    <div className="card p-5 sm:p-6 animate-fade-in">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-[var(--color-text)]">
          Pick Emoji
        </h3>
        <p className="text-sm text-[var(--color-text-3)] mt-0.5">
          Telegram uses this emoji when suggesting stickers in chat
        </p>
      </div>

      <div className="space-y-3 mb-5">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name} className="card-elevated p-3 rounded-xl">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-4)] mb-2 px-1">
              {cat.name}
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {cat.emojis.map((emoji) => {
                const isSelected = selected === emoji
                return (
                  <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className={`h-10 sm:h-11 rounded-lg text-xl flex items-center justify-center transition-all duration-100 cursor-pointer select-none focus-ring ${
                      isSelected
                        ? 'bg-[var(--color-primary-500)] scale-110 ring-1 ring-white/20'
                        : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)]'
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-3)]">Selected:</span>
          <div className="w-10 h-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg flex items-center justify-center text-2xl">
            {selected}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full sm:w-auto px-6 py-3 btn-primary text-sm font-semibold flex items-center justify-center gap-2"
        >
          Export to Telegram →
        </button>
      </div>
    </div>
  )
}
