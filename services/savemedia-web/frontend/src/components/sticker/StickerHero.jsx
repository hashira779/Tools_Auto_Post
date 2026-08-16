export default function StickerHero() {
  return (
    <header className="text-center mb-8 w-full animate-fade-in">
      {/* Eyebrow */}
      <div className="badge badge-primary mb-5 mx-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-400)]" />
        <span>Telegram Sticker Studio</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] mb-4 text-[var(--color-text)]">
        Create Telegram stickers{' '}
        <span className="text-[var(--color-primary-400)]">in seconds</span>
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-[var(--color-text-2)] leading-relaxed max-w-[480px] mx-auto">
        Transform photos into 512×512 WebP stickers, add styles, and export directly to Telegram.
      </p>

      {/* Feature pills */}
      <div className="flex justify-center gap-2 mt-6 flex-wrap">
        {[
          '100% Free',
          'Auto 512×512',
          '5 Styles',
          'Telegram Export',
        ].map((text) => (
          <span
            key={text}
            className="badge text-[11px]"
          >
            {text}
          </span>
        ))}
      </div>
    </header>
  )
}
