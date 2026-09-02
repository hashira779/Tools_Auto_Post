import { useState, useEffect, useRef, useCallback } from 'react'
import TtsHero from './TtsHero'
import { ttsManager } from '../../services/tts/TTSManager'

const API_BASE = '/api/tts'

// Voice avatar colors — consistent per voice
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
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
      className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors duration-200 cursor-pointer min-w-[64px] focus-ring border ${
        isSelected
          ? 'bg-[rgba(134,59,255,0.06)] border-[var(--color-primary-500)]'
          : 'bg-transparent hover:bg-[var(--color-surface-2)] border-transparent hover:border-[var(--color-border)]'
      }`}
    >
      <div className={`relative w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-xs transition-transform duration-150 ${
        isSelected ? 'scale-105' : 'group-'
      }`}>
        {initials}
        {isSelected && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[var(--color-primary-500)] rounded-full border border-[var(--color-surface-1)] flex items-center justify-center">
            <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="currentColor">
              <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className={`text-[10px] font-semibold leading-tight transition-colors ${
          isSelected ? 'text-[var(--color-text)]' : 'text-[var(--color-text-3)] group-hover:text-[var(--color-text-2)]'
        }`}>
          {name.split(' ')[0]}
        </p>
        <p className="text-[9px] text-[var(--color-text-4)] mt-0.5">{gender}</p>
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
            className={`w-[2px] rounded-full transition-colors duration-200 ${
              isPlaying ? 'bg-[var(--color-primary-400)]/80' : 'bg-[var(--color-border-3)]'
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
  const [pitch, setPitch] = useState('+0Hz')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [engineStatus, setEngineStatus] = useState('checking')
  const [showInstallModal, setShowInstallModal] = useState(false)
  const audioRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const checkEngine = async () => {
      const status = await ttsManager.checkLocalEngine();
      setEngineStatus(status);
    };
    checkEngine();
    const interval = setInterval(checkEngine, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/voices`)
      .then(r => r.json())
      .then(data => {
        const v = data.voices || [];
        const l = data.languages || {};
        
        // Inject VoxCPM2 Local Voice
        const voxVoice = { id: 'voxcpm2-khm', name: 'VoxCPM2 Local GPU', lang: 'ខ្មែរ', gender: 'Neutral' };
        v.unshift(voxVoice);
        if (!l['ខ្មែរ']) l['ខ្មែរ'] = [];
        l['ខ្មែរ'].unshift(voxVoice);

        setVoices(v)
        setLanguages(l)
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
      if (selectedVoice === 'voxcpm2-khm') {
        const status = await ttsManager.checkLocalEngine();
        if (status === 'offline') {
          throw new Error("Local Offline Engine is not installed or not running. Please start the background service.");
        } else if (status === 'starting') {
          throw new Error("Engine is still loading the model. Please wait a moment.");
        }
        const blob = await ttsManager.generateSpeech(text.trim());
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      } else {
        const fd = new FormData()
        fd.append('text', text.trim())
        fd.append('voice_id', selectedVoice)
        fd.append('rate', rate)
        fd.append('pitch', pitch)

        const resp = await fetch(`${API_BASE}/generate`, { method: 'POST', body: fd })
        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}))
          throw new Error(e.detail || `Error ${resp.status}`)
        }

        const blob = await resp.blob()
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
      }
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

      <div className="w-full max-w-3xl space-y-4 mb-10">

        {/* ── Local Engine Status ────────────────────────── */}
        <div className="card flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
             <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${engineStatus === 'ready' ? 'bg-[var(--color-success)]' : (engineStatus === 'checking' || engineStatus === 'starting') ? 'bg-[var(--color-warning)] animate-pulse' : 'bg-[var(--color-text-4)]'}`}></div>
             <div>
               <h3 className="text-[13px] font-semibold text-[var(--color-text)]">Local GPU Engine</h3>
               <p className="text-[11px] text-[var(--color-text-4)] mt-0.5">{engineStatus === 'ready' ? 'VoxCPM2-Khmer connected and ready.' : engineStatus === 'starting' ? 'Connected. Loading model...' : 'Offline engine not running.'}</p>
             </div>
          </div>
          {engineStatus === 'offline' && (
             <button
               onClick={() => setShowInstallModal(true)}
               className="btn-secondary px-3 py-1.5 text-[11px] flex items-center gap-1.5"
             >
               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               Install
             </button>
          )}
        </div>

        {/* ── Text Editor ────────────────────────── */}
        <div className="card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
            <span className="text-[10px] font-semibold text-[var(--color-text-4)] ">Script</span>
            <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-4)]">
              <span>{wordCount} words</span>
              <span className="w-px h-3 bg-[var(--color-border-2)]" />
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
            rows={6}
            className="w-full bg-transparent px-5 py-4 text-[14px] leading-relaxed text-[var(--color-text)] placeholder-[var(--color-text-4)] focus:outline-none resize-none"
            style={{ minHeight: '140px' }}
          />

          {/* Bottom hint */}
          <div className="px-4 py-2 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-2)]/30">
            <span className="text-[10px] text-[var(--color-text-4)]">
              Use commas or periods for natural pauses
            </span>
            <span className="text-[10px] text-[var(--color-text-4)] hidden sm:block">
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-1)] mr-1">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-1)]">Enter</kbd> to generate
            </span>
            {error && (
              <span className="text-[11px] text-[var(--color-error)]">{error}</span>
            )}
          </div>
        </div>

        {/* ── Language Tabs ───────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
            <span className="text-[10px] font-semibold text-[var(--color-text-4)] ">Language</span>
          </div>
          <div className="flex flex-wrap gap-1 px-3 py-2.5">
            {Object.keys(languages).map(lang => (
              <button
                key={lang}
                onClick={() => {
                  setSelectedLang(lang)
                  const lv = languages[lang]
                  if (lv?.length) setSelectedVoice(lv[0].id)
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer focus-ring border ${
                  selectedLang === lang
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-text)] border-[var(--color-border-2)]'
                    : 'bg-transparent text-[var(--color-text-3)] border-transparent hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* ── Voice Selector ─────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/30 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--color-text-4)] ">Voice</span>
            <span className="text-[10px] text-[var(--color-text-4)]">{filteredVoices.length} available</span>
          </div>
          <div className="flex gap-1 px-3 py-2.5 overflow-x-auto">
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
              <p className="text-xs text-[var(--color-text-4)] px-2 py-4">Select a language above</p>
            )}
          </div>
        </div>

        {/* ── Controls Row ────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {/* Speed */}
          <div className="flex-1 card px-3 py-2.5 flex flex-col">
            <label className="text-[10px] text-[var(--color-text-4)] font-semibold block mb-2 px-1">Speed</label>
            <div className="flex gap-1 flex-1">
              {[
                { label: '0.75×', value: '-25%' },
                { label: '1×', value: '+0%' },
                { label: '1.25×', value: '+25%' },
                { label: '1.5×', value: '+50%' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRate(opt.value)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border focus-ring ${
                    rate === opt.value
                      ? 'bg-[var(--color-surface-3)] text-[var(--color-text)] border-[var(--color-border-2)]'
                      : 'bg-transparent text-[var(--color-text-3)] border-transparent hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pitch */}
          <div className="flex-1 card px-3 py-2.5 flex flex-col">
            <label className="text-[10px] text-[var(--color-text-4)] font-semibold block mb-2 px-1">Pitch</label>
            <div className="flex gap-1 flex-1">
              {[
                { label: 'Deep', value: '-15Hz' },
                { label: 'Normal', value: '+0Hz' },
                { label: 'High', value: '+15Hz' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPitch(opt.value)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border focus-ring ${
                    pitch === opt.value
                      ? 'bg-[var(--color-surface-3)] text-[var(--color-text)] border-[var(--color-border-2)]'
                      : 'bg-transparent text-[var(--color-text-3)] border-transparent hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
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
            className={`h-[72px] sm:h-auto sm:w-36 rounded-xl font-semibold text-[13px] transition-colors flex items-center justify-center gap-2 cursor-pointer focus-ring ${
              loading
                ? 'bg-[var(--color-surface-3)] text-[var(--color-text-3)] cursor-wait border border-[var(--color-border)]'
                : text.trim()
                  ? 'btn-primary'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-4)] cursor-not-allowed border border-[var(--color-border)]'
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
            <span>{loading ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>

        {/* ── Audio Result ────────────────────────── */}
        {audioUrl && (
          <div className="card overflow-hidden animate-slide-up border-[var(--color-border-2)]">
            {/* Waveform */}
            <div className="px-5 pt-4 pb-2 bg-[var(--color-surface-1)]">
              <WaveformVisualizer isPlaying={isPlaying} />
            </div>

            {/* Player */}
            <div className="px-4 pb-3 pt-1 bg-[var(--color-surface-1)]">
              <audio
                ref={audioRef}
                src={audioUrl}
                autoPlay
                controls
                className="w-full h-9 rounded-lg opacity-90"
              />
            </div>

            {/* Download bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <span className="text-[11px] font-medium text-[var(--color-text-3)]">
                {audioBlob ? `${(audioBlob.size / 1024).toFixed(0)} KB` : ''} · MP3
              </span>
              <button
                onClick={handleDownload}
                className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-[11px]"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download MP3
              </button>
            </div>
          </div>
        )}

        {/* ── Install Engine Modal ────────────────── */}
        {showInstallModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="card p-5 max-w-sm w-full space-y-4 relative bg-[var(--color-surface)] border-[var(--color-border-3)] shadow-2xl">
              <button
                onClick={() => setShowInstallModal(false)}
                className="absolute top-3.5 right-3.5 text-[var(--color-text-4)] hover:text-[var(--color-text-2)] transition-colors cursor-pointer focus-ring rounded-lg p-1"
                aria-label="Close dialog"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div>
                <h3 className="text-[15px] font-semibold text-[var(--color-text)]">Install GPU Engine</h3>
                <p className="text-[12px] text-[var(--color-text-3)] mt-0.5">Run VoxCPM2-Khmer offline natively.</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-[rgba(34,197,94,0.15)] bg-[rgba(34,197,94,0.05)]">
                  <p className="text-[11px] font-semibold text-[var(--color-success)] mb-1">Safe & Secure</p>
                  <p className="text-[11px] text-[var(--color-text-3)] leading-relaxed">
                    No installation required. Extract ZIP and run. 100% local — no data leaves your PC.
                  </p>
                </div>

                <a
                  href="https://camtech.cam/VoxCPM2-Khmer-Engine.zip"
                  download="VoxCPM2-Khmer-Engine.zip"
                  className="w-full py-2.5 btn-primary rounded-xl text-[13px] font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Engine (ZIP)
                </a>
              </div>

              <div className="border-t border-[var(--color-border)] pt-3 text-[10px] text-[var(--color-text-4)] space-y-1.5">
                <p>• Extract ZIP → run VoxCPM2-Khmer-Engine.exe</p>
                <p>• Requires NVIDIA GPU with CUDA support</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
