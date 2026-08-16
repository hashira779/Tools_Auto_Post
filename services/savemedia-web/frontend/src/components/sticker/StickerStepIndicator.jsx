import { useState } from 'react'

export default function StickerStepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto mb-8 px-4">
      {steps.map((s, i) => {
        const isCompleted = s.id < currentStep
        const isActive = s.id === currentStep

        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[11px] transition-colors duration-200 ${
                  isCompleted
                    ? 'bg-[var(--color-success-dim)] text-[var(--color-success)] border border-[rgba(52,211,153,0.2)]'
                    : isActive
                    ? 'bg-[var(--color-primary-500)] text-white border border-[var(--color-primary-500)]'
                    : 'bg-[var(--color-surface-1)] text-[var(--color-text-4)] border border-[var(--color-border)]'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s.id
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-200 hidden sm:block ${
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
                className={`h-[1px] flex-1 mx-3 sm:-mt-4 transition-colors duration-300 ${
                  s.id < currentStep
                    ? 'bg-[var(--color-primary-500)]/40'
                    : 'bg-[var(--color-border-2)]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
