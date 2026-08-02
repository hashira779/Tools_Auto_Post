const EMOJI_CATEGORIES = [
  {
    name: 'Faces & Reactions',
    emojis: ['😀', '😂', '😍', '🥰', '😎', '🤩', '😇', '🥺', '😜', '🥳', '🤔', '😴'],
  },
  {
    name: 'Vibes & Gestures',
    emojis: ['❤️', '🔥', '⭐', '✨', '🎉', '👍', '💪', '🙌', '💯', '💥', '🚀', '🌈'],
  },
  {
    name: 'Animals & Fun',
    emojis: ['🐱', '🐶', '🦊', '🐼', '🦁', '🦄', '🐸', '🌸', '👑', '🏆', '🎯', '🎵'],
  },
]

export default function StickerEmojiPicker({ selected, onSelect, onContinue }) {
  return (
    <div className="card-playful p-6 sm:p-8 mt-6 transition-all duration-300">
      <div className="text-center mb-6">
        <h3 className="text-xl font-black text-gray-800 flex items-center justify-center gap-2">
          <span>😀</span> Pick an Associated Emoji
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
          Telegram uses this emoji when suggesting your sticker in chats
        </p>
      </div>

      <div className="space-y-4">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name} className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2 px-1">
              {cat.name}
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
              {cat.emojis.map((emoji) => {
                const isSelected = selected === emoji

                return (
                  <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className={`h-11 sm:h-12 rounded-xl text-2xl flex items-center justify-center transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-115 ring-2 ring-purple-300'
                        : 'bg-white hover:bg-purple-50 hover:scale-110 border border-gray-100'
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500">Selected Emoji:</span>
          <div className="w-12 h-12 bg-purple-50 border-2 border-purple-200 rounded-2xl flex items-center justify-center text-3xl shadow-xs">
            {selected}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
        >
          <span>🚀</span> Publish to Telegram →
        </button>
      </div>
    </div>
  )
}
