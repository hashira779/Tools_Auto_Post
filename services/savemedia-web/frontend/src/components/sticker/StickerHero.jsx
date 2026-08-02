export default function StickerHero() {
  return (
    <header className="text-center mb-10 max-w-[720px] animate-pop-in">
      {/* Logo Icon */}
      <div className="inline-flex items-center gap-3 mb-5">
        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-3xl shadow-[0_10px_20px_rgba(0,0,0,0.05)] border-2 border-purple-100">
          🎨
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-6xl font-black text-[#1e293b] tracking-tight leading-tight mb-3">
        Telegram <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">Sticker Maker</span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-[var(--color-text-secondary)] font-medium leading-relaxed max-w-[540px] mx-auto">
        Turn any photo into Telegram stickers in seconds!
        <br className="hidden sm:block" />
        Choose a style, pick an emoji, and publish directly to your Telegram sticker pack.
      </p>

      {/* Badges */}
      <div className="flex justify-center gap-2.5 mt-6 flex-wrap">
        {[
          { text: '100% Free', icon: '✨', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { text: 'Auto 512×512 WebP', icon: '📐', bg: 'bg-blue-50 text-blue-700 border-blue-100' },
          { text: '5 Creative Styles', icon: '🎭', bg: 'bg-purple-50 text-purple-700 border-purple-100' },
          { text: 'Instant Telegram Publish', icon: '🚀', bg: 'bg-pink-50 text-pink-700 border-pink-100' },
        ].map((b) => (
          <span
            key={b.text}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border shadow-xs select-none ${b.bg}`}
          >
            <span>{b.icon}</span>
            <span>{b.text}</span>
          </span>
        ))}
      </div>
    </header>
  )
}
