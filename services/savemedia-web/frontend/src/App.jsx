import { useState } from 'react'
import { useDownloader } from './hooks/useDownloader'
import { FORMAT_VIDEO } from './constants/platforms'

import AppNavbar, { TOOL_DOWNLOADER, TOOL_TTS, TOOL_STICKER } from './components/AppNavbar'
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
import Footer from './components/Footer'

function App() {
  const [activeTool, setActiveTool] = useState(TOOL_DOWNLOADER)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

        {/* Content */}
        <div className="flex-1 w-full max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
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
                <div className="w-full card p-5 sm:p-6 mb-8 animate-pulse flex flex-col gap-5 border-[var(--color-border-2)]">
                  {/* Skeleton Header */}
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg bg-[var(--color-surface-2)]"></div>
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <div className="h-5 w-3/4 bg-[var(--color-surface-2)] rounded-md"></div>
                      <div className="h-3 w-1/2 bg-[var(--color-surface-2)] rounded-md"></div>
                      <div className="h-3 w-1/3 bg-[var(--color-surface-2)] rounded-md mt-1"></div>
                    </div>
                  </div>
                  {/* Skeleton Tabs */}
                  <div className="flex gap-2 border-b border-[var(--color-border)] pb-3">
                    <div className="h-8 w-24 bg-[var(--color-surface-2)] rounded-md"></div>
                    <div className="h-8 w-24 bg-[var(--color-surface-2)] rounded-md"></div>
                  </div>
                  {/* Skeleton Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="h-12 bg-[var(--color-surface-2)] rounded-xl"></div>
                    <div className="h-12 bg-[var(--color-surface-2)] rounded-xl"></div>
                    <div className="h-12 bg-[var(--color-surface-2)] rounded-xl"></div>
                  </div>
                  {/* Skeleton Button */}
                  <div className="h-12 w-full bg-[var(--color-surface-2)] rounded-xl mt-2"></div>
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

        <Footer />
      </div>
    </>
  )
}

export default App
