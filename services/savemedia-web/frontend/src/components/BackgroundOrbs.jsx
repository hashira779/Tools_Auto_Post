export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className="blob w-[700px] h-[700px] bg-blue-100 -top-[200px] -left-[100px]"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="blob w-[600px] h-[600px] bg-orange-100 -bottom-[150px] -right-[150px]"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="blob w-[500px] h-[500px] bg-green-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50"
        style={{ animationDelay: '-12s' }}
      />
    </div>
  )
}
