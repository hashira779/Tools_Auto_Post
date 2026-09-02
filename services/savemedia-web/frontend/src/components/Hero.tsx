import { PLATFORMS } from '../constants/platforms'

export default function Hero() {
  return (
    <header className="text-center mb-10 w-full animate-fade-in flex flex-col items-center pt-2">
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-1)] border border-[var(--color-border)] mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-500)]"></span>
        <span className="text-[12px] font-medium text-[var(--color-text-2)] tracking-normal">
          Media Downloader Studio
        </span>
      </div>

      {/* Headline — one weight, one colour, hierarchy carried by size */}
      <h1 className="text-[2.15rem] sm:text-5xl lg:text-[3.5rem] font-semibold tracking-[-0.03em] leading-[1.08] mb-5 text-[var(--color-text)] max-w-[19ch] mx-auto">
        Download any video in ultra HD quality
      </h1>

      {/* Subtitle */}
      <p className="text-[15px] sm:text-[17px] text-[var(--color-text-3)] leading-relaxed max-w-[52ch] mx-auto">
        Save MP4 video, 4K clips, and 320kbps MP3 audio from YouTube, TikTok,
        Instagram, and Facebook. Free, with no ads.
      </p>

      {/* Supported platforms */}
      <div className="relative w-full max-w-xl mx-auto mt-9 overflow-hidden mask-edges pb-2">
        <div className="flex w-max animate-marquee">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-2.5 px-1.5 shrink-0">
              {PLATFORMS.map((p) => (
                <span
                  key={p.key}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[var(--color-text-2)] bg-[var(--color-surface-1)] border border-[var(--color-border)] select-none"
                >
                  <span style={{ color: p.color }}>{p.icon}</span>
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
