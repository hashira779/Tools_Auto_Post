const EMOJI_CATEGORIES = [
  {
    name: 'Reactions & Faces',
    emojis: ['😀', '😂', '😍', '🥰', '😎', '🤩', '😇', '🥺', '😜', '🥳', '🤔', '😴'],
  },
  {
    name: 'Vibes & Gestures',
    emojis: ['❤️', '🔥', '⭐', '✨', '🎉', '👍', '💪', '🙌', '💯', '💥', '🚀', '🌈'],
  },
  {
    name: 'Icons & Elements',
    emojis: ['🐱', '🐶', '🦊', '🐼', '🦁', '🦄', '🐸', '🌸', '👑', '🏆', '🎯', '🎵'],
  },
]

export default function StickerEmojiPicker({ selected, onSelect, onContinue }) {
  return (
    <div className="glass-card p-6 sm:p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center gap-2">
          <span>😀</span> Pick Associated Emoji
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
          Telegram uses this emoji when suggesting stickers in chat
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name} className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              {cat.name}
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {cat.emojis.map((emoji) => {
                const isSelected = selected === emoji

                return (
                  <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className={`h-10 sm:h-11 rounded-lg text-xl flex items-center justify-center transition-all duration-150 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-110 border border-white/30'
                        : 'bg-slate-900 hover:bg-slate-800 border border-white/5'
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

      {/* Selected Preview & Continue */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Selected Emoji:</span>
          <div className="w-10 h-10 bg-slate-900 border border-white/15 rounded-xl flex items-center justify-center text-2xl shadow-inner">
            {selected}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full sm:w-auto px-7 py-3.5 btn-pro rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>🚀</span> Export to Telegram →
        </button>
      </div>
    </div>
  )
}
