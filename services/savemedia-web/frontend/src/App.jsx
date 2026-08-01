import { useDownloader } from './hooks/useDownloader'
import { FORMAT_VIDEO } from './constants/platforms'

import BackgroundOrbs from './components/BackgroundOrbs'
import Hero from './components/Hero'
import SearchCard from './components/SearchCard'
import VideoPreview from './components/VideoPreview'
import FormatTabs from './components/FormatTabs'
import QualityGrid from './components/QualityGrid'
import DownloadButton from './components/DownloadButton'
import Footer from './components/Footer'

function App() {
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

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
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
            className="w-full max-w-[700px] glass rounded-2xl p-6 sm:p-7 shadow-xl animate-slide-up mb-6"
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

        <Footer />
      </div>
    </>
  )
}

export default App
