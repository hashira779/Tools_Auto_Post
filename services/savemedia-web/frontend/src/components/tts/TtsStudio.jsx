import { useState, useEffect, useRef } from 'react';
import TtsHero from './TtsHero';
import { ttsManager } from '../../services/tts/TTSManager';

function WaveformVisualizer({ isPlaying }) {
  const bars = 40;
  return (
    <div className="flex items-end justify-center gap-[2px] h-8 px-2">
      {Array.from({ length: bars }).map((_, i) => {
        const baseH = Math.sin(i * 0.3) * 12 + 14;
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
        );
      })}
    </div>
  );
}

export default function TtsStudio() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Local Engine State
  const [engineStatus, setEngineStatus] = useState('checking'); // 'checking', 'ready', 'offline'

  const audioRef = useRef(null);
  const textareaRef = useRef(null);

  // Check local engine status periodically and on mount
  useEffect(() => {
    const checkEngine = async () => {
      const isAvailable = await ttsManager.checkLocalEngine();
      setEngineStatus(isAvailable ? 'ready' : 'offline');
    };
    
    checkEngine();
    const interval = setInterval(checkEngine, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);

    try {
      const blob = await ttsManager.generateSpeech(text.trim());
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError("Voice generation is temporarily unavailable. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!audioBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(audioBlob);
    a.download = `KhmerVoice_${Date.now()}.wav`;
    a.click();
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Track audio play state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      <TtsHero />

      <div className="w-full max-w-[760px] space-y-5 mb-12">
        
        {/* ── Status Banner ──────────────────────── */}
        <div className="flex items-center justify-between rounded-2xl bg-[#0e1117] border border-white/[0.06] p-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Khmer AI Voice 
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-md">VoxCPM2-Khmer</span>
            </h2>
            
            <div className="flex items-center gap-2 mt-2">
              {engineStatus === 'checking' && (
                <span className="flex items-center gap-2 text-sm text-yellow-500">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  Checking Local Engine...
                </span>
              )}
              {engineStatus === 'ready' && (
                <span className="flex items-center gap-2 text-sm text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  Local GPU Ready
                </span>
              )}
              {engineStatus === 'offline' && (
                <span className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  Offline Engine Not Installed
                </span>
              )}
            </div>
            
            {engineStatus === 'ready' && (
              <p className="text-xs text-emerald-500/70 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Local processing. Your text is processed securely on your computer.
              </p>
            )}
          </div>
          
          {engineStatus === 'offline' && (
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-600">
              Install Offline Engine
            </button>
          )}
        </div>

        {/* ── Text Editor ────────────────────────── */}
        <div className="rounded-2xl bg-[#0e1117] border border-white/[0.06] overflow-hidden shadow-xl">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="សួស្តី សូមស្វាគមន៍មកកាន់ប្រព័ន្ធរបស់យើង..."
            maxLength={5000}
            rows={7}
            className="w-full bg-transparent px-5 py-6 text-[16px] leading-relaxed text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-[system-ui,-apple-system,sans-serif]"
            style={{ minHeight: '200px' }}
          />

          {/* Bottom Controls */}
          <div className="px-5 py-4 border-t border-white/[0.04] bg-slate-900/30 flex items-center justify-between">
            <div className="flex flex-col">
               {error && (
                <span className="text-[12px] text-red-400 mb-1">{error}</span>
               )}
               <span className="text-[11px] text-slate-500">
                 Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono mx-1">Ctrl+Enter</kbd> to generate
               </span>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 cursor-pointer ${
                loading
                  ? 'bg-emerald-900/40 text-emerald-600 cursor-wait'
                  : text.trim()
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 active:scale-[0.97]'
                    : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Generate Voice
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Audio Result ────────────────────────── */}
        {audioUrl && (
          <div className="rounded-2xl bg-[#0e1117] border border-emerald-500/15 overflow-hidden animate-fade-in shadow-xl shadow-emerald-900/5">
            {/* Waveform */}
            <div className="px-5 pt-6 pb-4 bg-gradient-to-b from-emerald-900/10 to-transparent">
              <WaveformVisualizer isPlaying={isPlaying} />
            </div>

            {/* Player */}
            <div className="px-5 pb-5">
              <audio
                ref={audioRef}
                src={audioUrl}
                autoPlay
                controls
                className="w-full h-10 rounded-lg"
              />
            </div>

            {/* Download bar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.04] bg-emerald-500/[0.02]">
              <span className="text-xs font-medium text-emerald-500/70">Audio Ready</span>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-all cursor-pointer border border-emerald-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download WAV
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
