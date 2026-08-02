export default function Header() {
  return (
    <header className="text-center mb-6 animate-slide-up">
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="text-4xl">🎨</span>
        <h1 className="text-4xl sm:text-5xl font-black gradient-text tracking-tight">
          Sticker Maker
        </h1>
      </div>
      <p className="text-base sm:text-lg text-[--color-text-secondary] max-w-[500px] mx-auto">
        Create custom <strong className="text-[--color-accent-cyan]">Telegram sticker packs</strong> from your images.
        Upload, style, and publish — all for free.
      </p>
    </header>
  )
}
