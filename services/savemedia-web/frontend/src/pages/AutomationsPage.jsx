import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import VerificationOverlay from '../components/VerificationOverlay'

export default function AutomationsPage() {
  const { dbUser, session, loading: authLoading, loginWithGoogle } = useAuth()
  const [activeTab, setActiveTab] = useState('all')

  // Interactive Live Pipeline Simulator State
  const [isRunningSim, setIsRunningSim] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [selectedNode, setSelectedNode] = useState('trigger')
  const [logs, setLogs] = useState([
    { time: '10:42:01', tag: 'SYSTEM', text: 'n8n background daemon running in standalone Docker engine' },
    { time: '10:42:02', tag: 'INFO', text: 'Redis Celery queue ready: 4 worker threads active' }
  ])

  // Apple-Style Real Scroll Track State
  const [storyStage, setStoryStage] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollyContainerRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollyContainerRef.current) return
      const rect = scrollyContainerRef.current.getBoundingClientRect()
      const totalScrollable = scrollyContainerRef.current.offsetHeight - window.innerHeight
      if (totalScrollable <= 0) return

      const progress = Math.min(Math.max(-rect.top / totalScrollable, 0), 1)
      setScrollProgress(progress)

      const stageIndex = Math.min(Math.floor(progress * 4), 3)
      setStoryStage(stageIndex)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const runTestPipeline = () => {
    setIsRunningSim(true)
    setActiveStep(1)
    setLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), tag: 'START', text: 'Triggering simulated workflow execution…' }
    ])

    setTimeout(() => {
      setActiveStep(2)
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), tag: 'AI_LLM', text: '🧠 Ollama 3B model extracted summary & translation tags (0.28s)' }
      ])
    }, 900)

    setTimeout(() => {
      setActiveStep(3)
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), tag: 'TTS_VOICE', text: '🎙️ Kokoro-82M synthesized 48kHz Khmer voiceover MP3 (0.34s)' }
      ])
    }, 1800)

    setTimeout(() => {
      setActiveStep(4)
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), tag: 'STORAGE', text: '🗄️ PostgreSQL database updated record ID #84920' }
      ])
    }, 2700)

    setTimeout(() => {
      setActiveStep(5)
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), tag: 'SUCCESS', text: '🚀 Published broadcast message with audio to Telegram Channel ✅' }
      ])
      setIsRunningSim(false)
    }, 3600)
  }

  const storyStages = [
    {
      id: 0,
      title: 'Instantaneous Webhook Ingestion',
      badge: '< 50ms Latency',
      desc: 'High-throughput event gateways capture webhooks from Telegram, Discord, GitHub, and custom APIs without dropping packets.',
      stats: '50,000 req/sec',
      image: null
    },
    {
      id: 1,
      title: 'Local Neural LLM & Voiceover',
      badge: 'Zero API Fees',
      desc: 'Executes Ollama 3B/8B and Kokoro-82M TTS directly on local GPU/CPU hardware. Instant Khmer translation & studio-quality speech.',
      stats: '0.34s Speech Synthesis',
      image: null
    },
    {
      id: 2,
      title: 'PostgreSQL Vector Search Sync',
      badge: 'pgvector Database',
      desc: 'Automatically vectorizes unstructured content and builds high-speed cosine similarity indexes for instant semantic retrieval.',
      stats: '1,536-dim Vector Embeddings',
      image: null
    },
    {
      id: 3,
      title: 'Autonomous Multi-Channel Publisher',
      badge: '24/7 Background Robot',
      desc: 'Dispatches scheduled broadcasts, Telegram posts, Discord embeds, and Google Drive backups with automated retry logic.',
      stats: '100% Reliable Delivery',
      image: '/images/automation-bot-card.jpg'
    }
  ]

  const templates = [
    {
      category: 'social',
      title: 'Auto-Post Bot Pipeline',
      badge: 'Popular',
      desc: 'Monitors YouTube, TikTok, or RSS feeds, downloads high-res media with yt-dlp, and auto-posts to Telegram channels with captions.',
      image: '/images/automation-bot-card.jpg',
      nodes: ['Webhook', 'yt-dlp Engine', 'Telegram Bot', 'Redis Queue'],
      color: 'border-orange-300 text-orange-600'
    },
    {
      category: 'ai',
      title: 'AI Khmer Voiceover Studio',
      badge: 'AI Powered',
      desc: 'Takes any text or article, translates it, generates ultra-natural Khmer audio with MMS-TTS / Kokoro, and attaches it as a podcast MP3.',
      nodes: ['Text Input', 'Ollama 3B LLM', 'Kokoro-82M TTS', 'Audio Export'],
      color: 'border-cyan-500/40 text-cyan-400'
    },
    {
      category: 'data',
      title: 'PostgreSQL Vector Search Sync',
      badge: 'Database',
      desc: 'Ingests new documents, generates vector embeddings with pgvector, and enables semantic search across all your uploaded files.',
      nodes: ['File Upload', 'Embedding Model', 'PostgreSQL DB', 'API Response'],
      color: 'border-emerald-500/40 text-emerald-400'
    },
    {
      category: 'notify',
      title: '24/7 Server Health & Alerting',
      badge: 'Infrastructure',
      desc: 'Pings Docker containers, monitors server RAM/Disk usage, and sends instant emergency alert cards to Telegram & Discord.',
      nodes: ['Cron Schedule', 'HTTP Healthcheck', 'Disk Inspector', 'Telegram Alert'],
      color: 'border-purple-500/40 text-purple-400'
    }
  ]

  const filteredTemplates = activeTab === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeTab)

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center pb-24 text-slate-900 overflow-x-hidden relative z-10">
      
      {/* ── 1. HERO BANNER SECTION (CLEAN PROFESSIONAL SAAS) ─────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          Enterprise n8n Automations
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
          Automate Any Task.
          <br className="hidden sm:inline" />
          <span className="text-slate-600"> Connect 400+ Apps.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-12">
          Visual drag-and-drop workflow builder natively connected to local AI models. Build self-running bots and pipelines with zero coding required.
        </p>

        {/* ── 2. REAL INTERACTIVE CODE-DRIVEN WORKFLOW SIMULATOR ──────── */}
        <div className="w-full relative mx-auto mb-16 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl text-left p-6 sm:p-8">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600">
                n8n Live Workflow Visualizer
              </span>
            </div>

            <button
              onClick={runTestPipeline}
              disabled={isRunningSim}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-900 font-bold text-xs shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all cursor-pointer hover:scale-105 active:scale-100 disabled:opacity-60"
            >
              <span>{isRunningSim ? '⚡ Pipeline Running…' : '▶ Simulate Live Test Run'}</span>
            </button>
          </div>

          {/* Fully Responsive Node Diagram */}
          <div className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
              
              {/* Node 1: Trigger */}
              <div 
                onClick={() => setSelectedNode('trigger')}
                className={`bg-white shadow-md rounded-2xl p-4 transition-all duration-300 cursor-pointer border ${
                  activeStep === 1 || selectedNode === 'trigger' 
                    ? 'border-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.3)] scale-[1.02]' 
                    : 'border-orange-500/30 hover:border-orange-400/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 bg-orange-500/20 text-orange-600 rounded-lg text-lg">⚡</span>
                  <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">01</span>
                </div>
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">Trigger</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">Webhook / Cron</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Telegram Post Received</div>
              </div>

              {/* Node 2: AI Processor */}
              <div 
                onClick={() => setSelectedNode('ai')}
                className={`bg-white shadow-md rounded-2xl p-4 transition-all duration-300 cursor-pointer border ${
                  activeStep === 2 || selectedNode === 'ai' 
                    ? 'border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] scale-[1.02]' 
                    : 'border-cyan-500/30 hover:border-cyan-400/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-lg">🧠</span>
                  <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded">02</span>
                </div>
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">AI Processor</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">Ollama & Kokoro</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Translate & Voiceover</div>
              </div>

              {/* Node 3: Storage */}
              <div 
                onClick={() => setSelectedNode('db')}
                className={`bg-white shadow-md rounded-2xl p-4 transition-all duration-300 cursor-pointer border ${
                  activeStep === 4 || selectedNode === 'db' 
                    ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-[1.02]' 
                    : 'border-emerald-500/30 hover:border-emerald-400/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-lg">🗄️</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded">03</span>
                </div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Database</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">PostgreSQL Sync</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Vector Search Archive</div>
              </div>

              {/* Node 4: Action */}
              <div 
                onClick={() => setSelectedNode('action')}
                className={`bg-white shadow-md rounded-2xl p-4 transition-all duration-300 cursor-pointer border ${
                  activeStep === 5 || selectedNode === 'action' 
                    ? 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.3)] scale-[1.02]' 
                    : 'border-purple-500/30 hover:border-purple-400/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 bg-purple-500/20 text-purple-400 rounded-lg text-lg">🚀</span>
                  <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded">04</span>
                </div>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Publisher</span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">Telegram Broadcast</div>
                <div className="text-[11px] text-slate-600 mt-0.5">Send Audio & Summary</div>
              </div>

            </div>
          </div>

          {/* Real-time Terminal Execution Log */}
          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs space-y-1.5 shadow-inner overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-slate-600 pb-2 border-b border-slate-200">
              <span className="truncate">LIVE_EXECUTION_STREAM: /api/v1/workflows/run</span>
              <span className="text-emerald-400 whitespace-nowrap ml-2">● ONLINE</span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1.5">
              {logs.map((l, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-700 text-[11px] sm:text-xs">
                  <span className="text-slate-500 select-none shrink-0">[{l.time}]</span>
                  <span className="text-orange-600 font-bold shrink-0">[{l.tag}]</span>
                  <span className="text-slate-700 break-words">{l.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── AUTH / ACCESS STATUS CARD ────────────────────────────── */}
        <div className="w-full max-w-xl mx-auto my-8">
          {authLoading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-xs uppercase tracking-widest text-slate-600 font-bold">Checking Automation Authorization…</p>
            </div>
          ) : !session ? (
            /* STEP 1: Not signed in */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(249,115,22,0.15)] backdrop-blur-xl animate-fade-in">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 text-orange-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Sign In to Launch Workspace</h3>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mb-6">
                Sign in with your Google account to access your personal n8n automation workspace and execute background workflows.
              </p>
              <button
                onClick={loginWithGoogle}
                className="w-full bg-white/10 hover:bg-white/15 text-slate-900 font-bold py-3.5 sm:py-4 px-6 rounded-2xl border border-white/15 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:border-orange-300 cursor-pointer text-sm sm:text-base hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .5 4.1 1.5l3.1-3.1C17.3 1.6 14.8.7 12 .7 7.5.7 3.7 3.3 1.9 7.1l3.7 2.8C6.5 6.9 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.6 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L1.9 7.1C.7 9.5 0 10.7 0 12s.7 2.5 1.9 4.9l3.7-2.8z"/>
                  <path fill="#34A853" d="M12 23.3c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-1.9-6.4-4.9L1.9 16.5C3.7 20.3 7.5 23.3 12 23.3z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          ) : !dbUser?.is_verified ? (
            /* STEP 2: Signed in, needs Token Activation */
            <VerificationOverlay 
              title="Automation Studio Activation"
              subtitle="Enter your active CAM-XXXX-XXXX key to initialize your n8n workflow workspace."
            />
          ) : (
            /* STEP 3: Verified & Ready to Launch */
            <div className="bg-white border border-orange-300 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(249,115,22,0.25)] backdrop-blur-xl animate-fade-in text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-700 border border-orange-500/30 text-xs font-bold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                Automation Engine Ready
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">n8n Automation Studio is Active</h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 max-w-md mx-auto">
                Launch the complete visual editor to configure triggers, drag AI nodes, and connect external services.
              </p>
              <a
                href="/n8n/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-900 font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl transition-all duration-300 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] cursor-pointer text-sm sm:text-base hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Launch Standalone Workspace</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. APPLE-STYLE SCROLL-PINNED STORYTELLING SECTION ───────── */}
      <section ref={scrollyContainerRef} className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative h-[250vh] sm:h-[300vh]">
        {/* Sticky Pinned Container */}
        <div className="sticky top-20 sm:top-24 w-full bg-white/95 border border-slate-200 rounded-3xl p-5 sm:p-10 shadow-2xl backdrop-blur-2xl text-left overflow-hidden">
          
          {/* Section Header & Apple Scroll Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-6 border-b border-slate-200 mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-orange-600 font-bold">Autonomous Engine</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">Autonomous Intelligence in Motion</h2>
            </div>
            {/* Real Scroll Progress Tracker */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-600">Scroll Story</span>
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-150"
                  style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono font-bold text-orange-600">0{storyStage + 1}/04</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Stage Selector List */}
            <div className="lg:col-span-5 space-y-3">
              {storyStages.map((st) => (
                <div
                  key={st.id}
                  onClick={() => setStoryStage(st.id)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-500 cursor-pointer ${
                    storyStage === st.id
                      ? 'bg-white shadow-md border-orange-500/60 shadow-[0_0_30px_rgba(249,115,22,0.25)] scale-[1.02]'
                      : 'bg-slate-50 border-slate-200 opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-orange-600 uppercase tracking-widest">
                      Stage 0{st.id + 1}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-white shadow-sm px-2 py-0.5 rounded border border-slate-200">
                      {st.badge}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">{st.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>

            {/* Right Dynamic Morphing Display */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-8 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[360px] text-center relative overflow-hidden shadow-inner">
              
              {storyStage === 0 && (
                <div className="space-y-4 animate-fade-in w-full max-w-sm">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto bg-gradient-to-b from-orange-950/60 to-slate-900 border border-orange-300 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                    <span className="text-3xl sm:text-4xl animate-bounce">⚡</span>
                    <span className="text-xs font-mono font-bold text-orange-700 mt-2">&lt; 50ms TRIGGER</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">Instantaneous Event Ingestion</h4>
                  <p className="text-xs text-slate-600">Non-blocking async webhooks queued into Redis brokers.</p>
                </div>
              )}

              {storyStage === 1 && (
                <div className="space-y-4 animate-fade-in w-full max-w-sm">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto bg-gradient-to-b from-cyan-950/60 to-slate-900 border border-cyan-500/40 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <span className="text-3xl sm:text-4xl animate-pulse">🧠</span>
                    <span className="text-xs font-mono font-bold text-cyan-300 mt-2">Ollama + Kokoro TTS</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">Local Neural Processing</h4>
                  <p className="text-xs text-slate-600">0.34s natural voice synthesis & automated summarization.</p>
                </div>
              )}

              {storyStage === 2 && (
                <div className="space-y-4 animate-fade-in w-full max-w-sm">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <span className="text-3xl sm:text-4xl">🗄️</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 mt-2">pgvector Embeddings</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">Vector Storage & Search</h4>
                  <p className="text-xs text-slate-600">1,536-dimensional similarity vectors for semantic lookups.</p>
                </div>
              )}

              {storyStage === 3 && (
                <div className="space-y-4 animate-fade-in w-full max-w-md">
                  <div className="relative rounded-2xl overflow-hidden border border-orange-300 shadow-[0_0_30px_rgba(249,115,22,0.25)]">
                    <img src="/images/automation-bot-card.jpg" alt="Automated Telegram Bot" className="w-full h-44 object-cover" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">Multi-Channel Broadcasting Bot</h4>
                  <p className="text-xs text-slate-600">Automated media distribution with zero manual intervention.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ── 4. FEATURED AUTOMATION TEMPLATES (WITH EMBEDDED IMAGES) ─── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Ready-to-Use Workflows</h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">Deploy battle-tested automation templates with a single click.</p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-[#0B1221] p-1 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'All Templates' },
              { id: 'social', label: 'Social & Media' },
              { id: 'ai', label: 'AI Voice & LLM' },
              { id: 'data', label: 'Data & DB' },
              { id: 'notify', label: 'Alerts & Ops' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === c.id
                    ? 'bg-orange-500/20 text-orange-700 border border-orange-300 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/5 border border-transparent'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map((t, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 hover:border-slate-600 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="flex flex-col h-full justify-between">
                {t.image && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                    <img src={t.image} alt={t.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-white shadow-sm ${t.color}`}>
                    {t.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Template #{idx + 1}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  {t.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                  {t.desc}
                </p>

                {/* Node Sequence Badges */}
                <div className="mb-6">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pipeline Nodes:</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {t.nodes.map((n, i) => (
                      <span key={i} className="text-xs bg-white shadow-md border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

                <div className="pt-6 mt-auto">
                  <a
                    href="/n8n/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-4 py-2.5 rounded-lg text-sm transition-colors border border-slate-300"
                  >
                    <span>Open Template</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </a>
                </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. ENTERPRISE CAPABILITIES ─────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Built for Speed, Reliability & Scale</h3>
          <p className="text-xs sm:text-sm text-slate-600">Enterprise background workers ensure your automations never drop a single task.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:border-orange-500/30 transition-all">
            <div className="text-3xl mb-4">⚡</div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">&lt; 50ms Webhook Trigger</h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Instantaneous event ingestion through dedicated Redis message brokers and high-performance FastAPI gateways.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:border-orange-500/30 transition-all">
            <div className="text-3xl mb-4">🔄</div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">24/7 Persistent Workers</h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Runs in isolated Docker microservices with auto-restart policies and automated database transaction backups.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:border-orange-500/30 transition-all">
            <div className="text-3xl mb-4">🤖</div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Private AI Model Hooks</h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Plug directly into your local Ollama LLMs and Kokoro TTS models without paying external API per-token fees.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
