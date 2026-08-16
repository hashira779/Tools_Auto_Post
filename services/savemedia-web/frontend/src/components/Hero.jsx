import { PLATFORMS } from '../constants/platforms'

export default function Hero() {
  return (
    <header className="text-center mb-8 w-full animate-fade-in">
      {/* Eyebrow */}
      <div className="badge badge-primary mb-5 mx-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-400)]" />
        <span>Universal Media Downloader</span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] mb-4 text-[var(--color-text)]">
        Download any video in{' '}
        <span className="text-[var(--color-primary-400)]">high quality</span>
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-[var(--color-text-2)] leading-relaxed max-w-[480px] mx-auto">
        Save MP4 videos and MP3 audio from YouTube, TikTok, Instagram, and more — instantly and free.
      </p>

      {/* Platform pills */}
      <div className="flex justify-center gap-2 mt-6 flex-wrap">
        {PLATFORMS.map((p) => (
          <span
            key={p.key}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--color-text-3)] bg-[var(--color-surface-1)] border border-[var(--color-border)] select-none"
          >
            <span style={{ color: p.color }} className="opacity-70">
              {p.icon}
            </span>
            {p.name}
          </span>
        ))}
      </div>
    </header>
  )
}
