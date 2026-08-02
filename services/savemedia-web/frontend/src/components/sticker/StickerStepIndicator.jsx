export default function StickerStepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between w-full max-w-[540px] mx-auto mb-8 px-4">
      {steps.map((s, i) => {
        const isCompleted = s.id < currentStep
        const isActive = s.id === currentStep

        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 border border-white/20 scale-105'
                    : 'bg-slate-900 text-slate-500 border border-white/5'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s.id
                )}
              </div>
              <span
                className={`text-[11px] font-semibold transition-colors duration-200 ${
                  isActive
                    ? 'text-white'
                    : isCompleted
                    ? 'text-slate-300'
                    : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-3 mb-4 rounded-full transition-all duration-300 ${
                  s.id < currentStep
                    ? 'bg-gradient-to-r from-emerald-500/60 to-violet-500/60'
                    : 'bg-white/5'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
