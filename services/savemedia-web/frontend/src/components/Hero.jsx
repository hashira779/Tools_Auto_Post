import { PLATFORMS } from '../constants/platforms'

export default function Hero() {
  return (
    <header className="text-center mb-14 max-w-[720px] animate-pop-in">
      {/* Logo Icon */}
      <div className="inline-flex items-center gap-3 mb-6">
        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-3xl shadow-[0_10px_20px_rgba(0,0,0,0.05)] border-2 border-[var(--color-bg-primary)]">
          🚀
        </div>
      </div>

      {/* Title */}
      <h1 className="text-5xl sm:text-7xl font-black text-[#1e293b] tracking-tight leading-tight mb-4">
        Cam<span className="text-[var(--color-accent-blue)]">Tech</span>
      </h1>

      {/* Subtitle */}
      <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] font-medium leading-relaxed max-w-[500px] mx-auto">
        Download videos & audio from your favorite apps.
        <br className="hidden sm:block" />
        Just paste a link, pick your format, and go!
      </p>

      {/* Platform Badges */}
      <div className="flex justify-center gap-3 mt-8 flex-wrap">
        {PLATFORMS.map((p) => (
          <span
            key={p.key}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-2xl
                       text-sm font-bold tracking-wide bg-white shadow-sm
                       text-[var(--color-text-secondary)] border border-gray-100
                       hover:-translate-y-1 hover:shadow-md hover:text-[var(--color-text-primary)]
                       transition-all duration-300 cursor-default select-none"
          >
            <span className={`w-3 h-3 rounded-full ${p.dotClass} group-hover:scale-125 transition-transform duration-300`} />
            {p.name}
          </span>
        ))}
      </div>
    </header>
  )
}
