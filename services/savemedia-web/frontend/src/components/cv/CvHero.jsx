export default function CvHero() {
  return (
    <header className="text-center mb-8 sm:mb-10 max-w-[800px] animate-fade-in select-none">
      {/* Brand Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-white/10 shadow-lg mb-5 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs font-semibold text-slate-300 tracking-wide">
          AI Professional CV &amp; ID Photo Studio
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
          4×6 cm
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-3 text-white">
        រូបថត <span className="gradient-text-accent">CV 4×6 &amp; Passport</span> កម្រិតអាជីព
      </h1>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed max-w-[580px] mx-auto">
        ប្តូររូបធម្មតាទៅជារូបថតការងារផ្លូវការ ប្តូរផ្ទៃខៀវ/ស ប្តូរឈុតអាវធំ បុរស-នារី គ្រូពេទ្យ គ្រូបង្រៀន និងអាវប៉ាក់ប្រពៃណី ក្នុងរយៈពេលត្រឹមតែប៉ុន្មានវិនាទី។
      </p>
    </header>
  )
}
