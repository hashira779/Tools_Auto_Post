import { PLATFORMS } from '../constants/platforms'

export default function Hero() {
  return (
    <header className="text-center mb-10 w-full animate-fade-in flex flex-col items-center pt-2">
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface-1)] border border-[var(--color-border)] shadow-sm text-xs font-semibold mb-6">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
        <span className="gradient-text font-bold uppercase tracking-wider text-[11px]">Media Downloader Studio 2.0</span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5 text-[var(--color-text)] max-w-2xl mx-auto">
        Download Any Video in{' '}
        <span className="gradient-text">
          Ultra HD Quality.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-[var(--color-text-3)] leading-relaxed max-w-lg mx-auto">
        Save MP4 videos, 4K clips, and 320kbps MP3 audio from YouTube, TikTok, Instagram & Facebook — 100% free with zero ads.
      </p>

      {/* Platform pills (Marquee) */}
      <div className="relative w-full max-w-xl mx-auto mt-8 overflow-hidden mask-edges pb-2">
        <div className="flex w-max animate-marquee">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3 px-1.5 shrink-0">
              {PLATFORMS.map((p) => (
                <span
                  key={p.key}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[var(--color-text-2)] bg-[var(--color-surface-1)] border border-[var(--color-border)] select-none shadow-sm"
                >
                  <span style={{ color: p.color }}>
                    {p.icon}
                  </span>
                  {p.name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
