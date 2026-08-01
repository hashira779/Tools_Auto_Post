// ── API Layer ───────────────────────────────────────────────────
const API_BASE = '/api'

export async function fetchVideoInfo(url) {
  const res = await fetch(`${API_BASE}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch video info')
  }
  return data
}

/**
 * Trigger download task, poll until SUCCESS, then download the file.
 */
export async function downloadMedia(url, formatType, quality, onProgress) {
  // 1. Start task
  const startRes = await fetch(`${API_BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, format_type: formatType, quality }),
  })

  const startData = await startRes.json()
  if (!startRes.ok) {
    throw new Error(startData.detail || 'Download failed to start')
  }

  const taskId = startData.task_id

  // 2. Poll status
  while (true) {
    await new Promise(r => setTimeout(r, 2000)) // Wait 2s between polls
    
    const statusRes = await fetch(`${API_BASE}/download/status/${taskId}`)
    const statusData = await statusRes.json()

    if (!statusRes.ok) {
      throw new Error('Failed to check download status')
    }

    if (onProgress) {
      onProgress(statusData.status)
    }

    if (statusData.status === 'SUCCESS') {
      break
    } else if (statusData.status === 'FAILURE') {
      throw new Error(statusData.error || 'Download failed during processing')
    }
    // else keep polling for PENDING or PROGRESS
  }

  // 3. Trigger native browser download
  return { downloadUrl: `${API_BASE}/download/file/${taskId}` }
}
