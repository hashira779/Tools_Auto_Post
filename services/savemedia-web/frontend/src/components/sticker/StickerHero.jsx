export default function StickerHero() {
  return (
    <header className="text-center mb-10 w-full animate-fade-in flex flex-col items-center">
      {/* Eyebrow */}
      <div className="badge badge-primary mb-6 flex items-center gap-2 px-3 py-1.5 shadow-sm border border-white/5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary-400)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary-500)]"></span>
        </span>
        <span className="font-semibold tracking-wide">Telegram Sticker Studio</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-[var(--color-text)] max-w-2xl mx-auto drop-shadow-sm">
        Create Telegram stickers{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-400)] to-[var(--color-primary-600)]">
          in seconds.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-[var(--color-text-3)] leading-relaxed max-w-xl mx-auto font-medium">
        Transform photos into high-quality WebP stickers, add distinct styles, and export directly to Telegram.
      </p>

      {/* Feature pills */}
      <div className="flex justify-center gap-3 mt-8 flex-wrap">
        {[
          '100% Free',
          'Auto 512×512',
          '5 Styles',
          'Telegram Export',
        ].map((text) => (
          <span
            key={text}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-bold tracking-wide text-[var(--color-text-2)] bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm uppercase select-none transition-transform hover:scale-105"
          >
            {text}
          </span>
        ))}
      </div>
    </header>
  )
}
