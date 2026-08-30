const KHMER_MEME_PRESETS = [
  { text: 'សើចឡើងរឹងថ្គាម 😂', label: 'សើចឡើងរឹងថ្គាម' },
  { text: 'អត់យល់ទេ 🙄', label: 'អត់យល់ទេ' },
  { text: 'កុំមកចេះ 🤫', label: 'កុំមកចេះ' },
  { text: 'ឡូយមែនទែន 🔥', label: 'ឡូយមែនទែន' },
  { text: 'សុំទោសផង 🙏', label: 'សុំទោស' },
  { text: 'ហាសហា 🤣', label: 'ហាសហា' },
  { text: 'ទៅណាទៅ 🏃', label: 'ទៅណាទៅ' },
  { text: 'អរគុណច្រើន ❤️', label: 'អរគុណ' },
]

const ENGLISH_MEME_PRESETS = [
  { text: 'OMG! 😱', label: 'OMG!' },
  { text: 'WHAT?! 🤯', label: 'WHAT?!' },
  { text: 'LOL 😂', label: 'LOL' },
  { text: 'NOPE 🙅‍♂️', label: 'NOPE' },
  { text: 'DEAL WITH IT 😎', label: 'DEAL WITH IT' },
  { text: 'MISSION PASSED 🌟', label: 'MISSION PASSED' },
]

export const FONTS = [
  { id: 'Koulen', name: 'Koulen (Khmer Meme)', family: '"Koulen", cursive, sans-serif' },
  { id: 'Kantumruy Pro', name: 'Kantumruy Pro', family: '"Kantumruy Pro", sans-serif' },
  { id: 'Battambang', name: 'Battambang Bold', family: '"Battambang", sans-serif' },
  { id: 'Impact', name: 'Impact / Meme', family: 'Impact, "Inter", sans-serif' },
]

export const TEXT_STYLES = [
  { id: 'meme', name: 'Meme Stroke', desc: 'White with bold black outline' },
  { id: 'gold', name: 'Gold Glow', desc: 'Bright gold with dark outline' },
  { id: 'bubble', name: 'Comic Bubble', desc: 'White badge background' },
  { id: 'stamp', name: 'Red Stamp', desc: 'Vibrant red alert box' },
  { id: 'neon', name: 'Neon Cyan', desc: 'Glowing cyber text' },
]

const POSITIONS = [
  { id: 'bottom', name: 'Bottom' },
  { id: 'top', name: 'Top' },
  { id: 'center', name: 'Center' },
]

export default function StickerTextEditor({ textConfig, onTextConfigChange }) {
  const { text, font, style, position, fontSize } = textConfig

  const handleChange = (key, value) => {
    onTextConfigChange((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="card p-5 mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--color-border)]">
        <h3 className="text-[15px] font-semibold text-[var(--color-text)]">
          Add Text & Memes
        </h3>
        {text && (
          <button
            onClick={() => handleChange('text', '')}
            className="text-[11px] text-[var(--color-error)] hover:text-red-400 font-medium px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-error-dim)] transition-colors cursor-pointer"
          >
            Clear Text
          </button>
        )}
      </div>

      {/* Khmer Presets */}
      <div className="mb-5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-4)] mb-2 px-1">
          Khmer Memes
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KHMER_MEME_PRESETS.map((p) => (
            <button
              key={p.text}
              onClick={() => handleChange('text', p.text)}
              className={`text-[12px] px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border focus-ring ${
                text === p.text
                  ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-2)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* English Presets */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-4)] mb-2 px-1">
          English Memes
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ENGLISH_MEME_PRESETS.map((p) => (
            <button
              key={p.text}
              onClick={() => handleChange('text', p.text)}
              className={`text-[12px] px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border focus-ring ${
                text === p.text
                  ? 'bg-[var(--color-primary-500)] text-white border-[var(--color-primary-500)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-2)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] border-[var(--color-border)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Text */}
      <div className="mb-6">
        <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-2 px-1">
          Custom Text (Khmer, English, Emojis)
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="e.g. សើចឡើងរឹងថ្គាម, LOL, OMG..."
          className="input-field w-full px-4 py-3 text-[14px]"
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[var(--color-border)]">
        {/* Style */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-1.5 px-1">Style</label>
          <select
            value={style}
            onChange={(e) => handleChange('style', e.target.value)}
            className="input-field w-full px-3 py-2 text-[12px] cursor-pointer"
          >
            {TEXT_STYLES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Font */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-1.5 px-1">Font</label>
          <select
            value={font}
            onChange={(e) => handleChange('font', e.target.value)}
            className="input-field w-full px-3 py-2 text-[12px] cursor-pointer"
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--color-text-4)] uppercase tracking-wider mb-1.5 px-1">Position</label>
          <div className="flex gap-1 h-[34px]">
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleChange('position', p.id)}
                className={`flex-1 rounded-lg text-[11px] font-medium transition-colors border cursor-pointer focus-ring ${
                  position === p.id
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-text)] border-[var(--color-border-2)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-3)] hover:text-[var(--color-text)] border-[var(--color-border)]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Font Size */}
      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
         <div className="flex justify-between text-[11px] font-medium mb-2 px-1">
            <span className="text-[var(--color-text-4)] uppercase tracking-wider">Font Size</span>
            <span className="text-[var(--color-text)]">{fontSize}px</span>
          </div>
          <input
            type="range"
            min="20"
            max="120"
            value={fontSize}
            onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
            className="w-full accent-[var(--color-primary-500)] h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
          />
      </div>
    </div>
  )
}
