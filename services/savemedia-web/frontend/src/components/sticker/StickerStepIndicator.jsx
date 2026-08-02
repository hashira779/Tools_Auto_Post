export default function StickerStepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between w-full max-w-[560px] mx-auto mb-6 px-4">
      {steps.map((s, i) => {
        const isCompleted = s.id < currentStep
        const isActive = s.id === currentStep

        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                    : isActive
                    ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-purple-500/30 scale-110 ring-4 ring-purple-100'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                {isCompleted ? '✓' : s.id}
              </div>
              <span
                className={`text-xs font-bold transition-colors duration-200 ${
                  isActive
                    ? 'text-purple-700 font-extrabold'
                    : isCompleted
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 mb-5 rounded-full transition-all duration-500 ${
                  s.id < currentStep
                    ? 'bg-gradient-to-r from-emerald-500 to-purple-600'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
