import { useDownloader } from '../hooks/useDownloader'
import { FORMAT_VIDEO } from '../constants/platforms'

import Hero from '../components/Hero'
import SearchCard from '../components/SearchCard'
import VideoPreview from '../components/VideoPreview'
import FormatTabs from '../components/FormatTabs'
import QualityGrid from '../components/QualityGrid'
import DownloadButton from '../components/DownloadButton'

function ResultsSkeleton() {
  return (
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
  )
}

export default function DownloaderPage() {
  const {
    url, loading, error, videoInfo,
    formatTab, selectedQuality,
    downloading, downloadStatus, downloadSuccess,
    setUrl, handleFetch, handleDownload,
    switchFormatTab, setSelectedQuality,
  } = useDownloader()

  const currentFormats = videoInfo
    ? formatTab === FORMAT_VIDEO ? videoInfo.video_formats : videoInfo.audio_formats
    : []

  return (
    <main className="flex flex-col items-center animate-fade-in">
      <Hero />
      <SearchCard
        url={url}
        onUrlChange={setUrl}
        onFetch={handleFetch}
        loading={loading}
        error={error}
      />
      {loading && !videoInfo && <ResultsSkeleton />}
      {videoInfo && !loading && (
        <div id="results-card" className="w-full card p-5 sm:p-6 animate-fade-in mb-8">
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
  )
}
