export default function TtsHero() {
  return (
    <header className="w-full max-w-[800px] mb-10 sm:mb-14 animate-fade-in select-none">
      {/* Minimal top line */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">
            Text to Speech
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            30+ languages • Neural voices • Free
          </p>
        </div>
      </div>
    </header>
  )
}
