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
      className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 cursor-pointer min-w-[72px] focus-ring shadow-sm ${
        isSelected
          ? 'bg-[var(--color-surface-2)] ring-1 ring-[var(--color-primary-500)]/50 shadow-md transform scale-[1.02]'
          : 'hover:bg-[var(--color-surface-2)] border border-transparent hover:border-[var(--color-border)]'
      }`}
    >
      <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-sm transition-transform duration-150 ${
        isSelected ? 'scale-105' : 'group-hover:scale-105'
      }`}>
        {initials}
        {isSelected && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--color-primary-500)] rounded-full border-2 border-[var(--color-surface-1)] flex items-center justify-center">
            <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="currentColor">
              <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className={`text-[11px] font-medium leading-tight transition-colors ${
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
            className={`w-[3px] rounded-full transition-all duration-200 ${
              isPlaying ? 'bg-[var(--color-primary-400)]/70' : 'bg-[var(--color-surface-3)]'
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

      <div className="w-full max-w-[760px] space-y-4 mb-12">

        {/* ── Local Engine Status ────────────────────────── */}
        <div className="card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full shrink-0 ${engineStatus === 'ready' ? 'bg-[var(--color-success)]' : (engineStatus === 'checking' || engineStatus === 'starting') ? 'bg-[var(--color-warning)] animate-pulse' : 'bg-[var(--color-text-4)]'}`}></div>
             <div>
               <h3 className="text-sm font-medium text-[var(--color-text)]">Local GPU Engine</h3>
               <p className="text-xs text-[var(--color-text-3)]">{engineStatus === 'ready' ? 'VoxCPM2-Khmer connected and ready.' : engineStatus === 'starting' ? 'Connected. Loading model...' : 'Offline engine not running.'}</p>
             </div>
          </div>
          {engineStatus === 'offline' && (
             <button
               onClick={() => setShowInstallModal(true)}
               className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
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
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
            <span className="text-[11px] font-medium text-[var(--color-text-4)] uppercase tracking-wider">Script</span>
            <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-4)]">
              <span>{wordCount} words</span>
              <span className="w-px h-3 bg-[var(--color-border)]" />
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
            className="w-full bg-transparent px-5 py-4 text-[15px] leading-relaxed text-[var(--color-text)] placeholder-[var(--color-text-4)] focus:outline-none resize-none"
            style={{ minHeight: '180px' }}
          />

          {/* Bottom hint */}
          <div className="px-4 py-2.5 border-t border-[var(--color-border)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--color-text-4)]">
              Tip: Use commas or periods for natural pauses
            </span>
            <span className="text-[11px] text-[var(--color-text-4)] hidden sm:block">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-3)] text-[10px] font-mono border border-[var(--color-border)]">Ctrl+Enter</kbd> to generate
            </span>
            {error && (
              <span className="text-[11px] text-[var(--color-error)]">{error}</span>
            )}
          </div>
        </div>

        {/* ── Language Tabs ───────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--color-border)]">
            <span className="text-[11px] font-medium text-[var(--color-text-4)] uppercase tracking-wider">Language</span>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer focus-ring ${
                  selectedLang === lang
                    ? 'bg-[rgba(134,59,255,0.1)] text-[var(--color-primary-300)] ring-1 ring-[var(--color-primary-500)]/30'
                    : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* ── Voice Selector ─────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between">
            <span className="text-[11px] font-medium text-[var(--color-text-4)] uppercase tracking-wider">Voice</span>
            <span className="text-[11px] text-[var(--color-text-4)]">{filteredVoices.length} available</span>
          </div>
          <div className="flex gap-1 px-3 py-3 overflow-x-auto">
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
          <div className="flex-1 card px-4 py-3">
            <label className="text-[11px] text-[var(--color-text-4)] uppercase tracking-wider font-medium block mb-2">Speed</label>
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
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer focus-ring ${
                    rate === opt.value
                      ? 'bg-[rgba(134,59,255,0.1)] text-[var(--color-primary-300)] ring-1 ring-[var(--color-primary-500)]/30'
                      : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pitch */}
          <div className="flex-1 card px-4 py-3">
            <label className="text-[11px] text-[var(--color-text-4)] uppercase tracking-wider font-medium block mb-2">Pitch</label>
            <div className="flex gap-1.5">
              {[
                { label: 'Deep', value: '-15Hz' },
                { label: 'Normal', value: '+0Hz' },
                { label: 'High', value: '+15Hz' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPitch(opt.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer focus-ring ${
                    pitch === opt.value
                      ? 'bg-[rgba(134,59,255,0.1)] text-[var(--color-primary-300)] ring-1 ring-[var(--color-primary-500)]/30'
                      : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]'
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
            className={`h-auto sm:h-[unset] px-8 py-3 sm:py-0 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer focus-ring ${
              loading
                ? 'bg-[var(--color-surface-3)] text-[var(--color-text-3)] cursor-wait'
                : text.trim()
                  ? 'btn-primary'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-4)] cursor-not-allowed'
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
          <div className="card overflow-hidden border-[var(--color-primary-500)]/20 animate-fade-in">
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
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="text-[11px] text-[var(--color-text-3)]">
                {audioBlob ? `${(audioBlob.size / 1024).toFixed(0)} KB` : ''} · MP3
              </span>
              <button
                onClick={handleDownload}
                className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
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
            <div className="card p-6 max-w-md w-full space-y-5 relative border-[var(--color-border-2)]">
              <button
                onClick={() => setShowInstallModal(false)}
                className="absolute top-4 right-4 text-[var(--color-text-3)] hover:text-[var(--color-text)] transition-colors cursor-pointer focus-ring rounded-lg p-1"
                aria-label="Close dialog"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div>
                <h3 className="text-base font-semibold text-[var(--color-text)]">Install Local GPU Engine</h3>
                <p className="text-xs text-[var(--color-text-3)] mt-1">Run VoxCPM2-Khmer offline on your PC GPU</p>
              </div>

              <div className="space-y-3">
                <div className="badge-success p-3 rounded-xl" style={{ background: 'var(--color-success-dim)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                  <p className="text-xs text-[var(--color-success)] font-medium">Safe & Secure</p>
                  <p className="text-[11px] text-[var(--color-text-3)] mt-1">
                    No installation required. Extract the ZIP and run. 100% local — no data leaves your computer. CORS-secured to camtech.cam.
                  </p>
                </div>

                <a
                  href="https://camtech.cam/VoxCPM2-Khmer-Engine.zip"
                  download="VoxCPM2-Khmer-Engine.zip"
                  className="w-full py-3 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Engine (ZIP)
                </a>
              </div>

              <div className="border-t border-[var(--color-border)] pt-3 text-[11px] text-[var(--color-text-4)] space-y-1">
                <p>• Extract ZIP → double-click VoxCPM2-Khmer-Engine.exe</p>
                <p>• Connects securely via CORS to camtech.cam</p>
                <p>• Requires NVIDIA GPU with CUDA support</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
