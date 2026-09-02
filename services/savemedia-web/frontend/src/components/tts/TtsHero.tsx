export default function TtsHero() {
  return (
    <header className="text-center mb-8 w-full animate-fade-in flex flex-col items-center select-none">
      <div className="badge badge-primary mb-4 flex items-center gap-1.5 px-2.5 py-1">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        <span className="font-medium text-[11px]">Text to Speech</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-[var(--color-text)]">
        Generate <span className="text-[var(--color-primary-600)]">AI Voiceovers</span>
      </h1>
      <p className="text-[14px] text-[var(--color-text-3)] max-w-sm mx-auto">
        Convert text to natural-sounding speech across 30+ languages.
      </p>
    </header>
  )
}
