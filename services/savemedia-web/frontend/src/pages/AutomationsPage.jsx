import React, { useState, useEffect, useRef } from 'react'

export default function AutomationsPage() {
  const wrapperRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div ref={wrapperRef} className="flex-1 w-full animate-fade-in flex flex-col relative group bg-[var(--color-background)]">
      <iframe 
        src="/n8n/" 
        title="CamTech Automations Builder" 
        className="w-full flex-1 border-0 block" 
        style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 80px)' }}
        allow="clipboard-write; clipboard-read"
      />
      
      {/* Floating Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-6 right-8 p-3 rounded-full bg-[var(--color-primary)] text-white shadow-lg opacity-50 hover:opacity-100 transition-opacity z-50 flex items-center justify-center group-hover:opacity-100"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        )}
      </button>
    </div>
  )
}

