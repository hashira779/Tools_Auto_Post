import { useState, useCallback } from 'react'
import { fetchVideoInfo, downloadMedia } from '../api/media'
import { FORMAT_VIDEO } from '../constants/platforms'

/**
 * Custom hook that manages the entire download workflow:
 * URL input → fetch info → select format/quality → download file.
 */
export function useDownloader() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoInfo, setVideoInfo] = useState(null)
  const [formatTab, setFormatTab] = useState(FORMAT_VIDEO)
  const [selectedQuality, setSelectedQuality] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState('')
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // ── Fetch video metadata ────────────────────────────────────
  const handleFetch = useCallback(async (overrideUrl) => {
    const override = typeof overrideUrl === 'string' ? overrideUrl : null
    const trimmedUrl = (override || url).trim()
    if (!trimmedUrl) {
      setError('Please paste a video URL')
      return
    }

    setLoading(true)
    setError('')
    setVideoInfo(null)
    setSelectedQuality(null)
    setDownloadSuccess(false)

    try {
      const data = await fetchVideoInfo(trimmedUrl)
      setVideoInfo(data)

      // Auto-select first available quality
      if (data.video_formats?.length > 0) {
        setSelectedQuality(data.video_formats[0].quality)
        setFormatTab(FORMAT_VIDEO)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [url])

  // ── Download file ───────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!videoInfo || !selectedQuality) return

    setDownloading(true)
    setDownloadStatus('Starting...')
    setError('')

    try {
      const { blob, filename } = await downloadMedia(
        url.trim(), 
        formatTab, 
        selectedQuality,
        (status) => {
          if (status === 'PENDING') setDownloadStatus('In Queue...')
          else if (status === 'PROGRESS') setDownloadStatus('Downloading...')
        }
      )

      // Trigger browser download
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }, [videoInfo, selectedQuality, url, formatTab])

  // ── Switch format tab ───────────────────────────────────────
  const switchFormatTab = useCallback((tab) => {
    setFormatTab(tab)
    const formats = tab === FORMAT_VIDEO ? videoInfo?.video_formats : videoInfo?.audio_formats
    if (formats?.length > 0) {
      setSelectedQuality(formats[0].quality)
    }
  }, [videoInfo])

  return {
    // State
    url, loading, error, videoInfo,
    formatTab, selectedQuality,
    downloading, downloadStatus, downloadSuccess,

    // Actions
    setUrl, setError,
    handleFetch, handleDownload,
    switchFormatTab, setSelectedQuality,
  }
}
