import React, { useState, useEffect } from 'react'

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    // Check if already running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true

    if (isStandalone) return

    // Check if user dismissed banner recently
    const dismissedTime = localStorage.getItem('camtech_pwa_dismissed')
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
      return
    }

    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(iosDevice)

    // Android / Chrome / Edge prompt event listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    const handleOpenInstall = () => {
      if (iosDevice || !deferredPrompt || typeof (deferredPrompt as any)?.prompt !== 'function') {
        setShowGuide(true)
      } else {
        handleInstallClick()
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('open-pwa-install', handleOpenInstall)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('open-pwa-install', handleOpenInstall)
    }
  }, [deferredPrompt])

  const handleInstallClick = async () => {
    if (isIos) {
      setShowGuide(true)
      return
    }

    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setShowBanner(false)
          setShowGuide(false)
        }
        setDeferredPrompt(null)
      } catch (err) {
        console.warn('PWA install prompt error:', err)
        setShowGuide(true)
      }
    } else {
      setShowGuide(true)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowGuide(false)
    localStorage.setItem('camtech_pwa_dismissed', Date.now().toString())
  }

  return (
    <>
      {/* ── 1. FLOATING TOAST BANNER (BOTTOM-RIGHT) ────────────────────── */}
      {showBanner && !showGuide && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] z-50 animate-fade-in">
          <div className="bg-[#0B1221]/95 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl text-white flex items-center justify-between gap-3 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-600)] p-2.5 flex items-center justify-center shrink-0 border border-white/20">
                <img src="/camtech-icon.svg" alt="CamTech Icon" className="w-full h-full object-contain filter drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white tracking-tight">CamTech App</h4>
                  <span className="text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded-full">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-4)] leading-tight mt-0.5">
                  {isIos ? 'Add to Home Screen for 1-tap full screen' : 'Install for offline & instant full screen access'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors duration-200 active:scale-95 whitespace-nowrap"
              >
                {isIos ? 'Install' : 'Install'}
              </button>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)]/80 hover:bg-[var(--color-surface-2)] text-[var(--color-text-4)] hover:text-white text-xs font-bold flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. APPLE-GRADE BOTTOM SHEET / MODAL INSTALL GUIDE ─────────── */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[#0B1221] border border-slate-800 rounded-2xl p-6 sm:p-7 max-w-md w-full text-left shadow-[0_25px_70px_rgba(0,0,0,0.8)] text-white relative overflow-hidden space-y-5">
            {/* Top Ambient Light */}
            <div className="absolute top-0 inset-x-0 h-1 bg-[var(--color-primary-600)]"></div>

            {/* Header with App Identity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary-600)] p-2 flex items-center justify-center border border-white/20">
                  <img src="/camtech-icon.svg" alt="CamTech Icon" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>Install CamTech</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-mono">
                      ✓ Ready
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-4)]">Add to Home Screen for fast native experience</p>
                </div>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-full bg-[var(--color-surface-2)]/80 hover:bg-[var(--color-surface-2)] text-[var(--color-text-4)] hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer border border-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Visual Step-by-Step Cards */}
            <div className="space-y-2.5">
              {isIos ? (
                <>
                  {/* iOS Step 1 */}
                  <div className="bg-[var(--color-surface-2)]/90 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3.5 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">1. Tap the Share button</span>
                      <p className="text-[11px] text-[var(--color-text-4)] leading-snug mt-0.5">
                        Tap the <span className="text-blue-300 font-semibold">Share</span> icon in Safari's bottom toolbar.
                      </p>
                    </div>
                  </div>

                  {/* iOS Step 2 */}
                  <div className="bg-[var(--color-surface-2)]/90 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3.5 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">2. Tap "Add to Home Screen"</span>
                      <p className="text-[11px] text-[var(--color-text-4)] leading-snug mt-0.5">
                        Scroll down and select <span className="text-cyan-300 font-semibold">Add to Home Screen</span>.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Desktop PC Step 1 */}
                  <div className="bg-[var(--color-surface-2)]/90 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3.5 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">1. Look for the Install Icon</span>
                      <p className="text-[11px] text-[var(--color-text-4)] leading-snug mt-0.5">
                        Click the <span className="text-blue-300 font-semibold">Install App (⊕)</span> button in your browser's address bar.
                      </p>
                    </div>
                  </div>

                  {/* Desktop PC Step 2 */}
                  <div className="bg-[var(--color-surface-2)]/90 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3.5 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">2. Confirm Desktop Install</span>
                      <p className="text-[11px] text-[var(--color-text-4)] leading-snug mt-0.5">
                        Click <span className="text-cyan-300 font-semibold">Install</span> to pin CamTech to your Taskbar or Desktop.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Action Button */}
            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-3 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Got it, Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
