import { useState, useEffect, useRef, useCallback } from 'react'
import TtsHero from './TtsHero'

const API_BASE = '/api/tts'

// Voice avatar colors — consistent per voice
const AVATAR_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
]

function VoiceAvatar({ name, gender, isSelected, onClick, colorIdx }) {
  const initials = name.charAt(0).toUpperCase()
  const gradient = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 cursor-pointer min-w-[80px] ${
        isSelected
          ? 'bg-white/[0.06] ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/5'
          : 'hover:bg-white/[0.03]'
      }`}
    >
      <div className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform duration-200 ${
        isSelected ? 'scale-110' : 'group-hover:scale-105'
      }`}>
        {initials}
        {isSelected && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="currentColor">
              <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className={`text-[11px] font-medium leading-tight transition-colors ${
          isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
        }`}>
          {name.split(' ')[0]}
        </p>
        <p className="text-[9px] text-slate-600 mt-0.5">{gender}</p>
      </div>
    </button>
  )
}

function WaveformVisualizer({ isPlaying }) {
  const bars = 40
  return (
    <div className="flex items-end justify-center gap-[2px] h-8 px-2">
      {Array.from({ length: bars }).map((_, i) => {
        const baseH = Math.sin(i * 0.3) * 12 + 14
        return (
          <div
            key={i}
            className={`w-[3px] rounded-full transition-all duration-200 ${
              isPlaying ? 'bg-emerald-400/80' : 'bg-slate-700'
            }`}
            style={{
              height: `${isPlaying ? baseH + Math.random() * 8 : 4}px`,
              transition: isPlaying ? 'height 0.15s ease' : 'height 0.5s ease',
            }}
          />
        )
      })}
    </div>
  )
}

export default function TtsStudio() {
  const [text, setText] = useState('')
  const [voices, setVoices] = useState([])
  const [languages, setLanguages] = useState({})
  const [selectedVoice, setSelectedVoice] = useState('km-KH-PisethNeural')
  const [selectedLang, setSelectedLang] = useState('ខ្មែរ')
  const [rate, setRate] = useState('+0%')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    fetch(`${API_BASE}/voices`)
      .then(r => r.json())
      .then(data => {
        setVoices(data.voices || [])
        setLanguages(data.languages || {})
      })
      .catch(() => {})
  }, [])

  const filteredVoices = languages[selectedLang] || []

  const handleGenerate = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setAudioUrl(null)
    setAudioBlob(null)

    try {
      const fd = new FormData()
      fd.append('text', text.trim())
      fd.append('voice_id', selectedVoice)
      fd.append('rate', rate)

      const resp = await fetch(`${API_BASE}/generate`, { method: 'POST', body: fd })
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}))
        throw new Error(e.detail || `Error ${resp.status}`)
      }

      const blob = await resp.blob()
      setAudioBlob(blob)
      setAudioUrl(URL.createObjectURL(blob))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!audioBlob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(audioBlob)
    a.download = `voiceover_${selectedVoice}.mp3`
    a.click()
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleGenerate()
    }
  }

  // Track audio play state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [audioUrl])

  const charCount = text.length
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      <TtsHero />

      <div className="w-full max-w-[760px] space-y-5 mb-12">

        {/* ── Text Editor ────────────────────────── */}
        <div className="rounded-2xl bg-[#0e1117] border border-white/[0.06] overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Script</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span>{wordCount} words</span>
              <span className="w-px h-3 bg-slate-800" />
              <span>{charCount} / 5,000</span>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing or paste your script here..."
            maxLength={5000}
            rows={7}
            className="w-full bg-transparent px-5 py-4 text-[15px] leading-relaxed text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-[system-ui,-apple-system,sans-serif]"
            style={{ minHeight: '180px' }}
          />

          {/* Bottom hint */}
          <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[10px] text-slate-600">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 text-[9px] font-mono">Ctrl+Enter</kbd> to generate
            </span>
            {error && (
              <span className="text-[11px] text-red-400">{error}</span>
            )}
          </div>
        </div>

        {/* ── Language Tabs ───────────────────────── */}
        <div className="rounded-2xl bg-[#0e1117] border border-white/[0.06] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.04]">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Language</span>
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 py-3">
            {Object.keys(languages).map(lang => (
              <button
                key={lang}
                onClick={() => {
                  setSelectedLang(lang)
                  const lv = languages[lang]
                  if (lv?.length) setSelectedVoice(lv[0].id)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedLang === lang
                    ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* ── Voice Selector ─────────────────────── */}
        <div className="rounded-2xl bg-[#0e1117] border border-white/[0.06] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Voice</span>
            <span className="text-[10px] text-slate-600">{filteredVoices.length} available</span>
          </div>
          <div className="flex gap-1 px-3 py-3 overflow-x-auto scrollbar-hide">
            {filteredVoices.map((v, i) => (
              <VoiceAvatar
                key={v.id}
                name={v.name}
                gender={v.gender}
                isSelected={selectedVoice === v.id}
                onClick={() => setSelectedVoice(v.id)}
                colorIdx={i}
              />
            ))}
            {filteredVoices.length === 0 && (
              <p className="text-xs text-slate-600 px-2 py-4">Select a language above</p>
            )}
          </div>
        </div>

        {/* ── Controls Row ────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Speed */}
          <div className="flex-1 rounded-2xl bg-[#0e1117] border border-white/[0.06] px-4 py-3">
            <label className="text-[10px] text-slate-600 uppercase tracking-wider font-medium block mb-1.5">Speed</label>
            <div className="flex gap-1.5">
              {[
                { label: '0.75×', value: '-25%' },
                { label: '1×', value: '+0%' },
                { label: '1.25×', value: '+25%' },
                { label: '1.5×', value: '+50%' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRate(opt.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    rate === opt.value
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className={`h-[72px] px-8 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 cursor-pointer ${
              loading
                ? 'bg-emerald-900/40 text-emerald-600 cursor-wait'
                : text.trim()
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 active:scale-[0.97]'
                  : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            <span className="hidden sm:inline">{loading ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>

        {/* ── Audio Result ────────────────────────── */}
        {audioUrl && (
          <div className="rounded-2xl bg-[#0e1117] border border-emerald-500/15 overflow-hidden animate-fade-in">
            {/* Waveform */}
            <div className="px-5 pt-5 pb-3">
              <WaveformVisualizer isPlaying={isPlaying} />
            </div>

            {/* Player */}
            <div className="px-5 pb-4">
              <audio
                ref={audioRef}
                src={audioUrl}
                autoPlay
                controls
                className="w-full h-10 rounded-lg"
              />
            </div>

            {/* Download bar */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-emerald-500/[0.03]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-400">
                  {audioBlob ? `${(audioBlob.size / 1024).toFixed(0)} KB` : ''} • MP3
                </span>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-all cursor-pointer border border-emerald-500/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download MP3
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
