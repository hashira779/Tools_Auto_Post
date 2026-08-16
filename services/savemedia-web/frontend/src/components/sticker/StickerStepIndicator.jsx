export default function StickerStepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between w-full max-w-[480px] mx-auto mb-8 px-4">
      {steps.map((s, i) => {
        const isCompleted = s.id < currentStep
        const isActive = s.id === currentStep

        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs transition-all duration-200 ${
                  isCompleted
                    ? 'bg-[var(--color-success-dim)] text-[var(--color-success)] border border-[rgba(34,197,94,0.2)]'
                    : isActive
                    ? 'bg-[var(--color-primary-500)] text-white'
                    : 'bg-[var(--color-surface-1)] text-[var(--color-text-4)] border border-[var(--color-border)]'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s.id
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-[var(--color-text)]'
                    : isCompleted
                    ? 'text-[var(--color-text-2)]'
                    : 'text-[var(--color-text-4)]'
                }`}
              >
                {s.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 mx-3 mb-5 transition-all duration-300 ${
                  s.id < currentStep
                    ? 'bg-[var(--color-primary-500)]/30'
                    : 'bg-[var(--color-border)]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
