import { PLATFORMS } from '../constants/platforms'

export default function Hero() {
  return (
    <header className="text-center mb-10 w-full animate-fade-in flex flex-col items-center">
      {/* Eyebrow */}
      <div className="badge badge-primary mb-6 flex items-center gap-2 px-3 py-1.5 shadow-sm border border-white/5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary-400)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary-500)]"></span>
        </span>
        <span className="font-semibold tracking-wide">Universal Media Downloader</span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-[var(--color-text)] max-w-2xl mx-auto drop-shadow-sm">
        Download any video in{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-400)] to-[var(--color-primary-600)]">
          high quality.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-[var(--color-text-3)] leading-relaxed max-w-xl mx-auto font-medium">
        Save MP4 videos and MP3 audio from YouTube, TikTok, Instagram, and more — instantly and free.
      </p>

      {/* Platform pills */}
      <div className="flex justify-center gap-3 mt-8 flex-wrap">
        {PLATFORMS.map((p) => (
          <span
            key={p.key}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium text-[var(--color-text-2)] bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm select-none transition-transform hover:scale-105"
          >
            <span style={{ color: p.color }} className="opacity-90">
              {p.icon}
            </span>
            {p.name}
          </span>
        ))}
      </div>
    </header>
  )
}
