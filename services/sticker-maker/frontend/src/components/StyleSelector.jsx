const STYLES = [
  { id: 'original', name: 'Original', icon: '📷', desc: 'Keep original, resize to 512×512' },
  { id: 'outline', name: 'White Outline', icon: '✏️', desc: 'Add a white border outline' },
  { id: 'circle', name: 'Circle Crop', icon: '⭕', desc: 'Circular crop with white border' },
  { id: 'rounded', name: 'Rounded', icon: '🔲', desc: 'Smooth rounded corners' },
  { id: 'cartoon', name: 'Cartoon', icon: '🎨', desc: 'Posterize with bold edges' },
]

export default function StyleSelector({ imagePreview, selectedStyle, onSelectStyle, processing, error, onBack }) {
  return (
    <div className="glass rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            🎭 Choose a Style
          </h2>
          <p className="text-sm text-[--color-text-secondary]">
            Select how your sticker should look
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-[--color-accent-purple] hover:text-[--color-accent-pink] transition-colors"
        >
          ← Change Image
        </button>
      </div>

      {/* Image Preview */}
      <div className="flex justify-center mb-6">
        <div className="w-32 h-32 rounded-xl overflow-hidden border border-[--color-border]">
          <img
            src={imagePreview}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelectStyle(style.id)}
            disabled={processing}
            className={`style-card rounded-xl p-4 text-left ${
              selectedStyle === style.id ? 'active' : ''
            }`}
          >
            <div className="text-2xl mb-2">{style.icon}</div>
            <div className="font-semibold text-sm">{style.name}</div>
            <div className="text-xs text-[--color-text-muted] mt-1">{style.desc}</div>
          </button>
        ))}
      </div>

      {/* Processing State */}
      {processing && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="spinner" />
          <span className="text-[--color-text-secondary]">Processing your sticker...</span>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ❌ {error}
        </div>
      )}
    </div>
  )
}
