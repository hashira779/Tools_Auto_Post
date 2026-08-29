import { useState, useEffect, useRef } from 'react'
import { useDownloader } from './hooks/useDownloader'
import { useAuth } from './hooks/useAuth'
import { FORMAT_VIDEO } from './constants/platforms'

import { lazy, Suspense } from 'react'
import AppNavbar, { TOOL_DOWNLOADER, TOOL_TTS, TOOL_STICKER, TOOL_ADMIN, TOOL_PDF, TOOL_SCREEN_SHARE } from './components/AppNavbar'
import AppSidebar from './components/AppSidebar'
import Hero from './components/Hero'
import SearchCard from './components/SearchCard'
import VideoPreview from './components/VideoPreview'
import FormatTabs from './components/FormatTabs'
import QualityGrid from './components/QualityGrid'
import DownloadButton from './components/DownloadButton'
import Footer from './components/Footer'
import VerificationOverlay from './components/VerificationOverlay'

// Lazy load heavy tool chunks so the main downloader loads instantly
const TtsStudio = lazy(() => import('./components/tts/TtsStudio'))
const StickerHero = lazy(() => import('./components/sticker/StickerHero'))
const StickerStudio = lazy(() => import('./components/sticker/StickerStudio'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))
const ScreenShareContainer = lazy(() => import('./components/screenshare/ScreenShareContainer'))

function App() {
  const [activeTool, setActiveTool] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/share')) {
      return TOOL_SCREEN_SHARE;
    }
    return TOOL_DOWNLOADER;
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const pdfWrapperRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initialize Auth at the root so OAuth redirects are caught regardless of active tab
  const { session } = useAuth()

  // Automatically switch to Chat AI if returning from Google Login (URL contains access_token)
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes('access_token=')) {
      // Supabase will automatically parse the hash and clear it.
    }
  }, [])

  // Listen for native fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      pdfWrapperRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const {
    url, loading, error, videoInfo,
    formatTab, selectedQuality,
    downloading, downloadStatus, downloadSuccess,
    setUrl, handleFetch, handleDownload,
    switchFormatTab, setSelectedQuality,
  } = useDownloader()

  // Get formats for the active tab
  const currentFormats = videoInfo
    ? formatTab === FORMAT_VIDEO ? videoInfo.video_formats : videoInfo.audio_formats
    : []

  return (
    <>
      {/* Mobile Menu Drawer */}
      <AppSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
      />

      <VerificationOverlay />

      {/* Main Layout */}
      <div className="relative min-h-screen flex flex-col">
        {/* Top Navbar */}
        <AppNavbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Content (For normal tools) */}
        {(activeTool !== TOOL_PDF) ? (
          <div className="flex-1 w-full max-w-[1024px] mx-auto px-5 sm:px-6 lg:px-8 pt-12 pb-20">
            {/* Media Downloader */}
            {activeTool === TOOL_DOWNLOADER && (
              <main className="flex flex-col items-center animate-fade-in">
                <Hero />
                <SearchCard
                  url={url}
                  onUrlChange={setUrl}
                  onFetch={handleFetch}
                  loading={loading}
                  error={error}
                />
                {loading && !videoInfo && (
                  <div className="w-full card p-5 sm:p-6 mb-8 animate-pulse flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg bg-[var(--color-surface-3)]"></div>
                      <div className="flex-1 flex flex-col justify-center gap-2.5">
                        <div className="h-4 w-3/4 bg-[var(--color-surface-3)] rounded"></div>
                        <div className="h-3 w-1/2 bg-[var(--color-surface-3)] rounded"></div>
                        <div className="h-3 w-1/3 bg-[var(--color-surface-3)] rounded"></div>
                      </div>
                    </div>
                    <div className="flex gap-2 border-b border-[var(--color-border)] pb-3">
                      <div className="h-8 w-24 bg-[var(--color-surface-3)] rounded-lg"></div>
                      <div className="h-8 w-24 bg-[var(--color-surface-3)] rounded-lg"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="h-12 bg-[var(--color-surface-3)] rounded-xl"></div>
                      <div className="h-12 bg-[var(--color-surface-3)] rounded-xl"></div>
                      <div className="h-12 bg-[var(--color-surface-3)] rounded-xl"></div>
                    </div>
                    <div className="h-12 w-full bg-[var(--color-surface-3)] rounded-xl"></div>
                  </div>
                )}
                {videoInfo && !loading && (
                  <div
                    id="results-card"
                    className="w-full card p-5 sm:p-6 animate-fade-in mb-8"
                  >
                    <VideoPreview videoInfo={videoInfo} />
                    <FormatTabs activeTab={formatTab} onSwitch={switchFormatTab} />
                    <QualityGrid
                      formats={currentFormats}
                      selectedQuality={selectedQuality}
                      onSelect={setSelectedQuality}
                    />
                    <DownloadButton
                      formatTab={formatTab}
                      selectedQuality={selectedQuality}
                      downloading={downloading}
                      downloadStatus={downloadStatus}
                      downloadSuccess={downloadSuccess}
                      onDownload={handleDownload}
                    />
                  </div>
                )}
              </main>
            )}

            {/* Text-to-Voice Studio */}
            {activeTool === TOOL_TTS && (
              <main className="flex flex-col items-center animate-fade-in">
                <Suspense fallback={<div className="w-full h-64 animate-pulse bg-[var(--color-surface-2)] rounded-xl mt-8"></div>}>
                  <TtsStudio />
                </Suspense>
              </main>
            )}

            {/* Telegram Sticker Studio */}
            {activeTool === TOOL_STICKER && (
              <main className="flex flex-col items-center animate-fade-in">
                <Suspense fallback={<div className="w-full h-64 animate-pulse bg-[var(--color-surface-2)] rounded-xl mt-8"></div>}>
                  <StickerHero />
                  <StickerStudio />
                </Suspense>
              </main>
            )}

            {/* Admin Dashboard */}
            {activeTool === TOOL_ADMIN && (
              <main className="flex flex-col items-center animate-fade-in w-full">
                <Suspense fallback={<div className="w-full h-64 animate-pulse bg-[var(--color-surface-2)] rounded-xl mt-8"></div>}>
                  <AdminDashboard />
                </Suspense>
              </main>
            )}

            {/* Screen Share */}
            {activeTool === TOOL_SCREEN_SHARE && (
              <main className="flex flex-col items-center animate-fade-in w-full">
                <Suspense fallback={<div className="w-full h-64 animate-pulse bg-[var(--color-surface-2)] rounded-xl mt-8"></div>}>
                  <ScreenShareContainer />
                </Suspense>
              </main>
            )}
          </div>
        ) : (
          /* Full Width/Height Layout for LLM & PDF */
          <div ref={pdfWrapperRef} className="flex-1 w-full animate-fade-in flex flex-col relative group bg-[var(--color-background)]">
            {activeTool === TOOL_PDF && (
              <>
                <iframe
                  src="/pdf/"
                  title="CamTech PDF Tools"
                  className="w-full h-full flex-1 border-0"
                  style={{ minHeight: isFullscreen ? '100vh' : 'calc(100vh - 64px)' }}
                  allow="clipboard-write; clipboard-read"
                />
                
                {/* Floating Fullscreen Toggle Button */}
                <button
                  onClick={toggleFullscreen}
                  className="absolute bottom-6 right-8 p-3 rounded-full bg-[var(--color-primary)] text-white shadow-lg opacity-50 hover:opacity-100 transition-opacity z-50 flex items-center justify-center group-hover:opacity-100"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {activeTool !== TOOL_PDF && <Footer />}
      </div>
    </>
  )
}

export default App
