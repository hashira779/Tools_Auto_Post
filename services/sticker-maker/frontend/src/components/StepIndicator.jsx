export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-[500px] mx-auto mb-2 animate-fade-in">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`step-dot ${
                s.id < currentStep ? 'completed' :
                s.id === currentStep ? 'active' : 'pending'
              }`}
            >
              {s.id < currentStep ? '✓' : s.id}
            </div>
            <span className={`text-xs font-semibold ${
              s.id <= currentStep ? 'text-[--color-text-primary]' : 'text-[--color-text-muted]'
            }`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-line mx-2 mb-5 ${s.id < currentStep ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
