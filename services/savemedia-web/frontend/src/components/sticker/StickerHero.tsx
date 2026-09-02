export default function StickerHero() {
  return (
    <header className="text-center mb-8 w-full animate-fade-in flex flex-col items-center select-none">
      <div className="badge badge-primary mb-4 flex items-center gap-1.5 px-2.5 py-1">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
          <path d="M15 9h.01" />
          <path d="M9 9h.01" />
          <path d="M15 14a3 3 0 0 1-6 0" />
        </svg>
        <span className="font-medium text-[11px]">Telegram Stickers</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-[var(--color-text)]">
        Create <span className="text-[var(--color-primary-600)]">Custom Stickers</span>
      </h1>
      <p className="text-[14px] text-[var(--color-text-3)] max-w-sm mx-auto">
        Convert any image into a Telegram sticker with custom text, memes, and styles.
      </p>
    </header>
  )
}
