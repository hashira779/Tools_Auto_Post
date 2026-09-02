import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import VerificationOverlay from '../components/VerificationOverlay'
import { Zap, Brain, Database, Send } from 'lucide-react'

const PIPELINE_NODES = [
  { id: 'trigger', step: 1, icon: Zap,      kind: 'Trigger',   title: 'Webhook / Cron',     desc: 'Telegram post received' },
  { id: 'ai',      step: 2, icon: Brain,    kind: 'Processor', title: 'Ollama & Kokoro',    desc: 'Translate and voiceover' },
  { id: 'db',      step: 4, icon: Database, kind: 'Storage',   title: 'PostgreSQL sync',    desc: 'Vector search archive' },
  { id: 'action',  step: 5, icon: Send,     kind: 'Publisher', title: 'Telegram broadcast', desc: 'Send audio and summary' },
]

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
        { time: new Date().toLocaleTimeString(), tag: 'AI_LLM', text: 'Ollama 3B model extracted summary & translation tags (0.28s)' }
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
      color: 'border-[var(--color-border)] text-orange-600'
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
    <main className="w-full flex flex-col items-center animate-fade-in text-[var(--color-text)] relative z-10">
      
      {/* ── 1. HERO BANNER SECTION ───────────────────────────────────── */}
      <section className="w-full pt-4 pb-12 text-center relative">
        <div className="badge badge-primary mb-6 text-xs sm:text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)]"></span>
          Enterprise n8n Automations
        </div>

        <h1 className="text-[2.15rem] sm:text-5xl lg:text-[3.5rem] font-semibold text-[var(--color-text)] tracking-[-0.03em] leading-[1.08] mb-6 max-w-[18ch] mx-auto">
          Automate any task, connect 400+ apps
        </h1>

        <p className="text-base sm:text-lg text-[var(--color-text-3)] max-w-2xl mx-auto leading-relaxed mb-12">
          Visual drag-and-drop workflow builder natively connected to local AI models. Build self-running bots and pipelines with zero coding required.
        </p>

        {/* ── 2. REAL INTERACTIVE CODE-DRIVEN WORKFLOW SIMULATOR ──────── */}
        <div className="w-full relative mx-auto mb-16 rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-1)] shadow-2xl text-left p-6 sm:p-8">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-text-3)]">
                n8n Live Workflow Visualizer
              </span>
            </div>

            <button
              onClick={runTestPipeline}
              disabled={isRunningSim}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <span>{isRunningSim ? 'Running…' : 'Simulate test run'}</span>
            </button>
          </div>

          {/* Fully Responsive Node Diagram */}
          <div className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
              
              {PIPELINE_NODES.map((node, i) => {
                const Icon = node.icon
                const isLive = activeStep === node.step || selectedNode === node.id
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node.id)}
                    className={`rounded-xl border p-4 cursor-pointer bg-[var(--color-surface-1)] transition-[border-color,box-shadow] duration-150 ${
                      isLive
                        ? 'border-[var(--color-primary-500)] shadow-[var(--shadow-md)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-3)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${
                          isLive
                            ? 'bg-[var(--color-primary-600)] text-white'
                            : 'bg-[var(--color-surface-2)] text-[var(--color-text-3)]'
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={2} />
                      </span>
                      <span className="text-[11px] tabular-nums text-[var(--color-text-4)]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-[var(--color-text-4)]">{node.kind}</div>
                    <div className="text-sm font-medium text-[var(--color-text)] mt-0.5">{node.title}</div>
                    <div className="text-[11px] text-[var(--color-text-3)] mt-1 leading-relaxed">{node.desc}</div>
                  </div>
                )
              })}

            </div>
          </div>

          {/* Real-time Terminal Execution Log */}
          <div className="mt-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-4 font-mono text-xs space-y-1.5 shadow-inner overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-3)] pb-2 border-b border-[var(--color-border)]">
              <span className="truncate">LIVE_EXECUTION_STREAM: /api/v1/workflows/run</span>
              <span className="text-emerald-400 whitespace-nowrap ml-2">● ONLINE</span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1.5">
              {logs.map((l, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[var(--color-text-2)] text-[11px] sm:text-xs">
                  <span className="text-[var(--color-text-4)] select-none shrink-0">[{l.time}]</span>
                  <span className="text-amber-500 shrink-0">[{l.tag}]</span>
                  <span className="text-[var(--color-text-2)] break-words">{l.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── AUTH / ACCESS STATUS CARD ────────────────────────────── */}
        <div className="w-full max-w-xl mx-auto my-8">
          {authLoading ? (
            <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-2xl p-8 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--color-primary-500)]/30 border-t-[var(--color-primary-500)] rounded-full animate-spin"></div>
              <p className="text-xs text-[var(--color-text-3)] font-bold">Checking Automation Authorization…</p>
            </div>
          ) : !session ? (
            /* STEP 1: Not signed in */
            <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 backdrop-blur-xl animate-fade-in">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-500)]/12 flex items-center justify-center border border-[var(--color-primary-500)]/30 text-orange-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)]">Sign In to Launch Workspace</h3>
              </div>
              <p className="text-[var(--color-text-3)] text-xs sm:text-sm mb-6">
                Sign in with your Google account to access your personal n8n automation workspace and execute background workflows.
              </p>
              <button
                onClick={loginWithGoogle}
                className="btn-secondary w-full py-3.5 sm:py-4 px-6 text-sm sm:text-base"
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
            <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 backdrop-blur-xl animate-fade-in text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-primary-500)]/12 text-[var(--color-primary-600)] border border-[var(--color-primary-500)]/30 text-xs font-bold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                Automation Engine Ready
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mb-2">n8n Automation Studio is Active</h3>
              <p className="text-[var(--color-text-3)] text-xs sm:text-sm mb-6 max-w-md mx-auto">
                Launch the complete visual editor to configure triggers, drag AI nodes, and connect external services.
              </p>
              <a
                href="/n8n/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] text-[var(--color-text)] font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl transition-colors duration-300 cursor-pointer text-sm sm:text-base"
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
        <div className="sticky top-24 sm:top-28 w-full bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-10 shadow-2xl backdrop-blur-2xl text-left overflow-hidden">
          
          {/* Section Header & Apple Scroll Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-6 border-b border-[var(--color-border)] mb-6">
            <div>
              <span className="text-xs font-medium text-[var(--color-primary-600)]">Autonomous Engine</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mt-0.5">Autonomous Intelligence in Motion</h2>
            </div>
            {/* Real Scroll Progress Tracker */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[var(--color-text-3)]">Scroll Story</span>
              <div className="w-24 h-1.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden border border-[var(--color-border)]">
                <div 
                  className="h-full bg-[var(--color-primary-500)] rounded-full transition-colors duration-150"
                  style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-[var(--color-primary-600)]">0{storyStage + 1}/04</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Stage Selector List */}
            <div className="lg:col-span-5 space-y-3">
              {storyStages.map((st) => (
                <div
                  key={st.id}
                  onClick={() => setStoryStage(st.id)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-colors duration-500 cursor-pointer ${
                    storyStage === st.id
                      ? 'bg-[var(--color-surface-2)] shadow-md border-[var(--color-primary-500)]'
                      : 'bg-[var(--color-surface-1)] border-[var(--color-border)] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--color-primary-600)] ">
                      Stage 0{st.id + 1}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--color-text-3)] bg-[var(--color-surface-3)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                      {st.badge}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-[var(--color-text)] mb-1">{st.title}</h4>
                  <p className="text-xs text-[var(--color-text-3)] leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>

            {/* Right Dynamic Morphing Display */}
            <div className="lg:col-span-7 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-8 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[360px] text-center relative overflow-hidden shadow-inner">
              
              {storyStage === 0 && (
                <div className="space-y-4 animate-fade-in w-full max-w-sm">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl animate-bounce">⚡</span>
                    <span className="text-xs font-medium text-[var(--color-primary-600)] mt-2">&lt; 50ms TRIGGER</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[var(--color-text)]">Instantaneous Event Ingestion</h4>
                  <p className="text-xs text-[var(--color-text-3)]">Non-blocking async webhooks queued into Redis brokers.</p>
                </div>
              )}

              {storyStage === 1 && (
                <div className="space-y-4 animate-fade-in w-full max-w-sm">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] border border-cyan-500/40 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl animate-pulse">🧠</span>
                    <span className="text-xs font-mono font-bold text-cyan-300 mt-2">Ollama + Kokoro TTS</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[var(--color-text)]">Local Neural Processing</h4>
                  <p className="text-xs text-[var(--color-text-3)]">0.34s natural voice synthesis & automated summarization.</p>
                </div>
              )}

              {storyStage === 2 && (
                <div className="space-y-4 animate-fade-in w-full max-w-sm">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] border border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl">🗄️</span>
                    <span className="text-xs font-mono font-bold text-emerald-300 mt-2">pgvector Embeddings</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[var(--color-text)]">Vector Storage & Search</h4>
                  <p className="text-xs text-[var(--color-text-3)]">1,536-dimensional similarity vectors for semantic lookups.</p>
                </div>
              )}

              {storyStage === 3 && (
                <div className="space-y-4 animate-fade-in w-full max-w-md">
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)]">
                    <img src="/images/automation-bot-card.jpg" alt="Automated Telegram Bot" className="w-full h-44 object-cover" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[var(--color-text)]">Multi-Channel Broadcasting Bot</h4>
                  <p className="text-xs text-[var(--color-text-3)]">Automated media distribution with zero manual intervention.</p>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] tracking-tight">Ready-to-Use Workflows</h2>
            <p className="text-[var(--color-text-3)] text-xs sm:text-sm mt-1">Deploy battle-tested automation templates with a single click.</p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-[var(--color-surface-2)] p-1 rounded-2xl border border-[var(--color-border)] overflow-x-auto max-w-full">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === c.id
                    ? 'bg-[var(--color-primary-500)]/12 text-[var(--color-primary-600)] border border-[var(--color-border)] shadow-sm'
                    : 'text-[var(--color-text-3)] hover:text-[var(--color-text)] hover:bg-white/5 border border-transparent'
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
              className="bg-[var(--color-surface-1)] border border-[var(--color-border)] hover:border-slate-600 rounded-2xl p-6 transition-colors duration-200 flex flex-col justify-between group"
            >
              <div className="flex flex-col h-full justify-between">
                {t.image && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-inner">
                    <img src={t.image} alt={t.title} className="w-full h-36 object-cover group- transition-transform duration-500" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold  px-3 py-1 rounded-full border bg-[var(--color-surface-1)] shadow-sm ${t.color}`}>
                    {t.badge}
                  </span>
                  <span className="text-xs text-[var(--color-text-4)] font-mono">Template #{idx + 1}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] mb-2">
                  {t.title}
                </h3>
                <p className="text-[var(--color-text-3)] text-xs sm:text-sm leading-relaxed mb-6">
                  {t.desc}
                </p>

                {/* Node Sequence Badges */}
                <div className="mb-6">
                  <div className="text-[11px] font-bold text-[var(--color-text-4)] mb-2">Pipeline Nodes:</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {t.nodes.map((n, i) => (
                      <span key={i} className="text-xs bg-[var(--color-surface-1)] shadow-md border border-[var(--color-border)] text-[var(--color-text-2)] px-2.5 py-1 rounded-lg">
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
                    className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] font-bold px-4 py-2.5 rounded-lg text-sm transition-colors border border-[var(--color-border-2)]"
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
          <h3 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-2">Built for Speed, Reliability & Scale</h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-3)]">Enterprise background workers ensure your automations never drop a single task.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 hover:border-[var(--color-primary-500)]/30 transition-colors">
            <div className="text-3xl mb-4">⚡</div>
            <h4 className="text-base sm:text-lg font-bold text-[var(--color-text)] mb-2">&lt; 50ms Webhook Trigger</h4>
            <p className="text-[var(--color-text-3)] text-xs sm:text-sm leading-relaxed">
              Instantaneous event ingestion through dedicated Redis message brokers and high-performance FastAPI gateways.
            </p>
          </div>

          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 hover:border-[var(--color-primary-500)]/30 transition-colors">
            <div className="text-3xl mb-4">🔄</div>
            <h4 className="text-base sm:text-lg font-bold text-[var(--color-text)] mb-2">24/7 Persistent Workers</h4>
            <p className="text-[var(--color-text-3)] text-xs sm:text-sm leading-relaxed">
              Runs in isolated Docker microservices with auto-restart policies and automated database transaction backups.
            </p>
          </div>

          <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7 hover:border-[var(--color-primary-500)]/30 transition-colors">
            <div className="text-3xl mb-4">🤖</div>
            <h4 className="text-base sm:text-lg font-bold text-[var(--color-text)] mb-2">Private AI Model Hooks</h4>
            <p className="text-[var(--color-text-3)] text-xs sm:text-sm leading-relaxed">
              Plug directly into your local Ollama LLMs and Kokoro TTS models without paying external API per-token fees.
            </p>
          </div>
        </div>
      </section>

    </main>
  )
}
