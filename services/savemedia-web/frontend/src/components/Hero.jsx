import { PLATFORMS } from '../constants/platforms'

export default function Hero() {
  return (
    <header className="text-center mb-10 max-w-[760px] animate-fade-in">
      {/* Brand Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-white/10 shadow-lg mb-6 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-semibold text-slate-300 tracking-wide">
          Universal Social Media Downloader
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-4 text-white">
        Download Any Video in <span className="gradient-text-accent">High Quality</span>
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-[540px] mx-auto">
        Save MP4 videos and MP3 audio instantly from YouTube, TikTok, Instagram, and more with zero limits.
      </p>

      {/* Platform Badges */}
      <div className="flex justify-center gap-2 mt-7 flex-wrap">
        {PLATFORMS.map((p) => (
          <span
            key={p.key}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl
                       text-xs font-semibold tracking-wide bg-slate-900/60 backdrop-blur-md
                       text-slate-300 border border-white/5
                       hover:border-indigo-500/40 hover:text-white hover:bg-slate-800/60
                       transition-all duration-200 cursor-default select-none shadow-sm"
          >
            <span className={`w-2 h-2 rounded-full ${p.dotClass} opacity-80 group-hover:opacity-100 transition-opacity`} />
            {p.name}
          </span>
        ))}
      </div>
    </header>
  )
}
