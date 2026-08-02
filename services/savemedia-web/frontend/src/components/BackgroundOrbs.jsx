export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#090D16]">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />

      {/* Atmospheric Ambient Glows */}
      <div className="bg-glow-indigo w-[650px] h-[650px] -top-[150px] -left-[100px]" />
      <div className="bg-glow-cyan w-[550px] h-[550px] -bottom-[100px] -right-[80px]" />
      <div className="bg-glow-violet w-[500px] h-[500px] top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
    </div>
  )
}
