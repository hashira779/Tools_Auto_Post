const EMOJI_ROWS = [
  ['😀', '😂', '😍', '🥰', '😎', '🤩', '😇', '🥺'],
  ['❤️', '🔥', '⭐', '✨', '🎉', '👍', '💪', '🙌'],
  ['🎨', '🎭', '🎪', '🌈', '🦄', '🐱', '🐶', '🌸'],
  ['💎', '👑', '🏆', '🎯', '🚀', '💫', '🌟', '🎵'],
]

export default function EmojiPicker({ selected, onSelect }) {
  return (
    <div className="glass rounded-2xl p-6 sm:p-8">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        😀 Pick an Emoji
      </h2>
      <p className="text-sm text-[--color-text-secondary] mb-5">
        Choose an emoji that represents your sticker
      </p>

      <div className="space-y-2">
        {EMOJI_ROWS.map((row, i) => (
          <div key={i} className="flex items-center justify-center gap-2">
            {row.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelect(emoji)}
                className={`emoji-btn ${selected === emoji ? 'active' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-[--color-text-muted]">
        Selected: <span className="text-2xl ml-1">{selected}</span>
      </div>
    </div>
  )
}
