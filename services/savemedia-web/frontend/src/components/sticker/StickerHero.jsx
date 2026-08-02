export default function StickerHero() {
  return (
    <header className="text-center mb-10 max-w-[760px] animate-fade-in">
      {/* Brand Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/50 border border-violet-500/20 shadow-lg mb-6 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        <span className="text-xs font-semibold text-violet-200 tracking-wide">
          Telegram Sticker Studio Pro
        </span>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-4 text-white">
        Create Telegram Stickers <span className="gradient-text-accent">in Seconds</span>
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-[540px] mx-auto">
        Transform your photos into 512×512 WebP stickers, add pro styles, and export directly to Telegram with zero friction.
      </p>

      {/* Feature Badges */}
      <div className="flex justify-center gap-2 mt-7 flex-wrap">
        {[
          { text: '100% Free Forever', icon: '⚡' },
          { text: 'Auto 512×512 WebP', icon: '📐' },
          { text: '5 Creative FX Styles', icon: '🎨' },
          { text: '1-Click Telegram Export', icon: '🚀' },
        ].map((b) => (
          <span
            key={b.text}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl
                       text-xs font-semibold tracking-wide bg-slate-900/60 backdrop-blur-md
                       text-slate-300 border border-white/5 shadow-sm"
          >
            <span>{b.icon}</span>
            <span>{b.text}</span>
          </span>
        ))}
      </div>
    </header>
  )
}
