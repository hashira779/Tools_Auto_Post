import React, { useState, useEffect } from 'react'

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

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

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(iosDevice)

    if (iosDevice) {
      // Show banner after 3 seconds on iOS
      const timer = setTimeout(() => setShowBanner(true), 3000)
      return () => clearTimeout(timer)
    }

    // Android / Chrome / Edge prompt event listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    const handleOpenInstall = () => {
      setShowBanner(true)
      if (iosDevice || !deferredPrompt || typeof (deferredPrompt as any)?.prompt !== 'function') {
        setShowIosGuide(true)
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
      setShowIosGuide(true)
      return
    }

    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setShowBanner(false)
        }
        setDeferredPrompt(null)
      } catch (err) {
        console.warn('PWA install prompt error:', err)
        setShowIosGuide(true)
      }
    } else {
      setShowIosGuide(true)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIosGuide(false)
    localStorage.setItem('camtech_pwa_dismissed', Date.now().toString())
  }

  if (!showBanner) return null

  return (
    <>
      {/* ── Android & General PWA Install Toast Banner ────────────────── */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-bounce-in">
        <div className="bg-slate-900/95 border border-blue-500/40 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-md p-2 border border-white/20">
              <img src="/camtech-icon.svg" alt="CamTech Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Add CamTech to Home Screen</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded font-mono">App</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                {isIos ? 'Install on iOS for 1-tap full screen access' : 'Fast 1-tap installation for iOS & Android'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              {isIos ? 'How to Add' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* ── iOS Step-by-Step Interactive Modal Guide ────────────────── */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-left space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍏</span>
                <h3 className="text-base font-bold text-white">Add CamTech on iOS</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Follow these 2 quick steps in Safari or Chrome to add CamTech to your iPhone / iPad Home Screen:
            </p>

            <div className="space-y-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                <div>
                  <span className="font-bold text-white">Tap the Share button</span>
                  <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                    Tap <span className="px-1.5 py-0.5 bg-slate-700 rounded font-mono text-blue-300">⎋ (Share)</span> icon at the bottom of Safari browser.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                <div>
                  <span className="font-bold text-white">Select "Add to Home Screen"</span>
                  <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                    Scroll down and tap <span className="px-1.5 py-0.5 bg-slate-700 rounded font-mono text-emerald-300">➕ Add to Home Screen</span>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
