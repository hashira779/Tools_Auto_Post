import { PLATFORMS } from '../constants/platforms'

export default function Hero() {
  return (
    <header className="text-center mb-10 w-full animate-fade-in flex flex-col items-center">
      {/* Eyebrow */}
      <div className="badge badge-primary mb-5 text-[11px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-400)]"></span>
        <span className="font-medium">Media Downloader</span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15] mb-4 text-[var(--color-text)] max-w-lg mx-auto">
        Download any video in{' '}
        <span className="bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-300)] bg-clip-text text-transparent">
          high quality.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-[15px] text-[var(--color-text-3)] leading-relaxed max-w-md mx-auto">
        Save MP4 videos and MP3 audio from YouTube, TikTok, Instagram, and more — free.
      </p>

      {/* Platform pills */}
      <div className="flex justify-center gap-2 mt-7 flex-wrap">
        {PLATFORMS.map((p) => (
          <span
            key={p.key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[var(--color-text-3)] bg-[var(--color-surface-2)] border border-[var(--color-border)] select-none"
          >
            <span style={{ color: p.color }} className="opacity-80">
              {p.icon}
            </span>
            {p.name}
          </span>
        ))}
      </div>
    </header>
  )
}
