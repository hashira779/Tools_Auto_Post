import { useState } from 'react'
import { useDownloader } from './hooks/useDownloader'
import { FORMAT_VIDEO } from './constants/platforms'

import BackgroundOrbs from './components/BackgroundOrbs'
import AppNavbar, { TOOL_DOWNLOADER, TOOL_CV, TOOL_STICKER } from './components/AppNavbar'
import AppSidebar from './components/AppSidebar'
import Hero from './components/Hero'
import SearchCard from './components/SearchCard'
import VideoPreview from './components/VideoPreview'
import FormatTabs from './components/FormatTabs'
import QualityGrid from './components/QualityGrid'
import DownloadButton from './components/DownloadButton'
import CvStudio from './components/cv/CvStudio'
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
      <BackgroundOrbs />

      {/* Slide-out Mobile Menu Drawer */}
      <AppSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
      />

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-4 sm:px-6">
        {/* Top Navbar */}
        <AppNavbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* 🎬 Tool 1: Video & Audio Downloader */}
        {activeTool === TOOL_DOWNLOADER && (
          <main className="w-full flex flex-col items-center animate-fade-in">
            <Hero />

            <SearchCard
              url={url}
              onUrlChange={setUrl}
              onFetch={handleFetch}
              loading={loading}
              error={error}
            />

            {videoInfo && (
              <div
                id="results-card"
                className="w-full max-w-[760px] glass-card p-6 sm:p-8 animate-fade-in mb-8"
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

        {/* 📷 Tool 2: AI Professional CV 4x6 & ID Photo Studio */}
        {activeTool === TOOL_CV && (
          <main className="w-full flex flex-col items-center animate-fade-in">
            <CvStudio />
          </main>
        )}

        {/* 🎨 Tool 3: Telegram Sticker & Khmer Meme Studio */}
        {activeTool === TOOL_STICKER && (
          <main className="w-full flex flex-col items-center animate-fade-in">
            <StickerHero />
            <StickerStudio />
          </main>
        )}

        <Footer />
      </div>
    </>
  )
}

export default App
