import { useState } from 'react'
import { useDownloader } from './hooks/useDownloader'
import { FORMAT_VIDEO } from './constants/platforms'

import BackgroundOrbs from './components/BackgroundOrbs'
import ToolSwitcher, { TOOL_DOWNLOADER, TOOL_STICKER } from './components/ToolSwitcher'
import Hero from './components/Hero'
import SearchCard from './components/SearchCard'
import VideoPreview from './components/VideoPreview'
import FormatTabs from './components/FormatTabs'
import QualityGrid from './components/QualityGrid'
import DownloadButton from './components/DownloadButton'
import StickerHero from './components/sticker/StickerHero'
import StickerStudio from './components/sticker/StickerStudio'
import Footer from './components/Footer'

function App() {
  const [activeTool, setActiveTool] = useState(TOOL_DOWNLOADER)

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

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
        {/* Tool Switcher Navigation */}
        <ToolSwitcher
          activeTool={activeTool}
          onSelectTool={setActiveTool}
        />

        {/* 🎬 Tool 1: Video & Audio Downloader */}
        {activeTool === TOOL_DOWNLOADER && (
          <div className="w-full flex flex-col items-center animate-fade-in">
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
                className="w-full max-w-[700px] card-playful p-6 sm:p-7 shadow-xl animate-pop-in mb-8"
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
          </div>
        )}

        {/* 🎨 Tool 2: Telegram Sticker Maker */}
        {activeTool === TOOL_STICKER && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <StickerHero />
            <StickerStudio />
          </div>
        )}

        <Footer />
      </div>
    </>
  )
}

export default App

