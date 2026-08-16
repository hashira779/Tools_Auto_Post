import { useState, useEffect } from 'react'
import { useDownloader } from './hooks/useDownloader'
import { useAuth } from './hooks/useAuth'
import { FORMAT_VIDEO } from './constants/platforms'

import AppNavbar, { TOOL_DOWNLOADER, TOOL_TTS, TOOL_STICKER, TOOL_LLM } from './components/AppNavbar'
import AppSidebar from './components/AppSidebar'
import Hero from './components/Hero'
import SearchCard from './components/SearchCard'
import VideoPreview from './components/VideoPreview'
import FormatTabs from './components/FormatTabs'
import QualityGrid from './components/QualityGrid'
import DownloadButton from './components/DownloadButton'
import TtsStudio from './components/tts/TtsStudio'
import StickerHero from './components/sticker/StickerHero'
import StickerStudio from './components/sticker/StickerStudio'
import AIChatStudio from './components/chat/AIChatStudio'
import Footer from './components/Footer'

function App() {
  const [activeTool, setActiveTool] = useState(TOOL_DOWNLOADER)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Initialize Auth at the root so OAuth redirects are caught regardless of active tab
  const { session } = useAuth()

  // Automatically switch to Chat AI if returning from Google Login (URL contains access_token)
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes('access_token=')) {
      setActiveTool(TOOL_LLM)
      // Supabase will automatically parse the hash and clear it, so we just switch the tab.
    }
  }, [])

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

      {/* Main Layout */}
      <div className="relative min-h-screen flex flex-col">
        {/* Top Navbar */}
        <AppNavbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Content (For normal tools) */}
        {activeTool !== TOOL_LLM ? (
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
                    {/* Skeleton... omitted for brevity but intact in real code */}
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
                <TtsStudio />
              </main>
            )}

            {/* Telegram Sticker Studio */}
            {activeTool === TOOL_STICKER && (
              <main className="flex flex-col items-center animate-fade-in">
                <StickerHero />
                <StickerStudio />
              </main>
            )}
          </div>
        ) : (
          /* AI Chat Studio (Full Width/Height Layout) */
          <div className="flex-1 w-full animate-fade-in">
            <AIChatStudio />
          </div>
        )}

        {activeTool !== TOOL_LLM && <Footer />}
      </div>
    </>
  )
}

export default App
