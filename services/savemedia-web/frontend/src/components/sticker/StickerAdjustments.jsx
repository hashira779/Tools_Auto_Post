export default function StickerAdjustments({ adjustments, setAdjustments }) {
  const { brightness, contrast, saturation } = adjustments

  const handleChange = (key, value) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setAdjustments({ brightness: 100, contrast: 100, saturation: 100 })
  }

  return (
    <div className="card p-5 mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--color-border)]">
        <h3 className="text-[15px] font-semibold text-[var(--color-text)]">
          Adjustments
        </h3>
        <button
          onClick={handleReset}
          className="text-[11px] text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)] font-medium px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-primary-500)]/10 transition-colors cursor-pointer"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-5">
        {/* Brightness */}
        <div>
          <div className="flex justify-between text-[11px] font-medium mb-2">
            <span className="text-[var(--color-text-3)]">Brightness</span>
            <span className="text-[var(--color-text)]">{brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={brightness}
            onChange={(e) => handleChange('brightness', parseInt(e.target.value))}
            className="w-full accent-[var(--color-primary-500)] h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between text-[11px] font-medium mb-2">
            <span className="text-[var(--color-text-3)]">Contrast</span>
            <span className="text-[var(--color-text)]">{contrast}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={contrast}
            onChange={(e) => handleChange('contrast', parseInt(e.target.value))}
            className="w-full accent-[var(--color-primary-500)] h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between text-[11px] font-medium mb-2">
            <span className="text-[var(--color-text-3)]">Saturation</span>
            <span className="text-[var(--color-text)]">{saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={saturation}
            onChange={(e) => handleChange('saturation', parseInt(e.target.value))}
            className="w-full accent-[var(--color-primary-500)] h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
