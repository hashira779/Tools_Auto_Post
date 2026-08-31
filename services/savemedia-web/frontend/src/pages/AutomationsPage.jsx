import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import VerificationOverlay from '../components/VerificationOverlay'

export default function AutomationsPage() {
  const { dbUser, session, loading: authLoading, loginWithGoogle } = useAuth()
  const [activeTab, setActiveTab] = useState('all')

  const templates = [
    {
      category: 'social',
      title: 'Auto-Post Bot Pipeline',
      badge: 'Popular',
      desc: 'Monitors YouTube, TikTok, or RSS feeds, downloads high-res media with yt-dlp, and auto-posts to Telegram channels with captions.',
      nodes: ['Webhook', 'yt-dlp Engine', 'Telegram Bot', 'Redis Queue'],
      color: 'border-orange-500/40 text-orange-400'
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
    <div className="w-full flex flex-col items-center pb-24 text-slate-200">
      
      {/* ── 1. HERO BANNER SECTION ─────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 pt-10 pb-12 text-center relative">
        {/* Glow Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-orange-600/15 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(249,115,22,0.15)] animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
          AI-Powered n8n Workflow Automation · 400+ Connectors
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-amber-300 tracking-tight leading-[1.15] mb-6">
          Automate Any Task. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Connect 400+ Apps With AI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Visual drag-and-drop workflow builder connected natively to CamTech AI models (Ollama, Kokoro-82M, Telegram Bot, Celery). Build self-running bots and pipelines with <span className="text-slate-200 font-semibold">zero coding required</span>.
        </p>

        {/* ── PRODUCT SHOWCASE HERO BANNER IMAGE ───────────────────── */}
        <div className="relative mx-auto mb-12 rounded-3xl overflow-hidden border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.25)] group">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-transparent to-transparent z-10 pointer-events-none"></div>
          <img
            src="/images/automation-hero-banner.jpg"
            alt="CamTech n8n Automation Studio Suite"
            className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-700"
          />
          <div className="absolute bottom-4 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 text-left">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400 bg-black/60 px-3 py-1 rounded-full border border-orange-500/30 backdrop-blur-md">
                n8n Visual Engine
              </span>
              <h4 className="text-lg font-bold text-white mt-1 shadow-sm">Autonomous Node-Based Workflow Pipeline</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium bg-black/50 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
              ⚡ 400+ Pre-Installed Nodes
            </span>
          </div>
        </div>

        {/* ── AUTH / ACCESS STATUS CARD ────────────────────────────── */}
        <div className="max-w-xl mx-auto">
          {authLoading ? (
            <div className="bg-[#0B1221]/90 border border-orange-900/30 rounded-3xl p-8 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Checking Automation Authorization…</p>
            </div>
          ) : !session ? (
            /* STEP 1: Not signed in */
            <div className="bg-gradient-to-b from-[#0B1221]/95 to-[#050B14]/95 border border-orange-900/40 rounded-3xl p-8 shadow-[0_0_40px_rgba(249,115,22,0.15)] backdrop-blur-xl animate-fade-in">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 text-orange-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Sign In to Launch Workspace</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Sign in with your Google account to access your personal n8n automation workspace and execute background workflows.
              </p>
              <button
                onClick={loginWithGoogle}
                className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-4 px-6 rounded-2xl border border-white/15 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:border-orange-500/40 cursor-pointer text-base hover:-translate-y-0.5"
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
            <div className="bg-gradient-to-b from-[#0B1221]/95 to-[#050B14]/95 border border-orange-500/40 rounded-3xl p-8 shadow-[0_0_50px_rgba(249,115,22,0.25)] backdrop-blur-xl animate-fade-in text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                Automation Engine Ready
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">n8n Automation Studio is Active</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                Launch the complete visual editor to configure triggers, drag AI nodes, and connect external services.
              </p>
              <a
                href="/n8n/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] cursor-pointer text-base hover:-translate-y-0.5 active:translate-y-0"
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

      {/* ── 2. VISUAL INTERACTIVE WORKFLOW GRAPH PREVIEW ────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-b from-[#0B1221]/90 via-[#0a0f1c]/90 to-[#050B14]/90 border border-orange-950/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-white mb-2">Visual Automation Architecture</h3>
            <p className="text-sm text-slate-400">See how CamTech AI bridges triggers, neural networks, and instant publishing.</p>
          </div>

          {/* Node Diagram Container */}
          <div className="bg-black/50 border border-white/5 rounded-2xl p-6 relative overflow-x-auto">
            <div className="min-w-[680px] flex items-center justify-between gap-4">
              
              {/* Node 1: Trigger */}
              <div className="flex-1 bg-[#131B2E] border border-orange-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(249,115,22,0.15)] flex flex-col items-center text-center">
                <span className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl mb-2 text-xl">⚡</span>
                <span className="text-xs font-bold text-orange-300 uppercase tracking-wider">Trigger</span>
                <span className="text-sm font-semibold text-white mt-1">Webhook / Schedule</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Telegram msg, Cron, API</span>
              </div>

              {/* Connecting Line 1 */}
              <div className="flex items-center text-orange-500/60 font-mono text-xs">
                <span className="w-6 h-0.5 bg-gradient-to-r from-orange-500 to-cyan-500"></span>
                <span>▶</span>
              </div>

              {/* Node 2: AI Processor */}
              <div className="flex-1 bg-[#131B2E] border border-cyan-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col items-center text-center">
                <span className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl mb-2 text-xl">🧠</span>
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">AI Processor</span>
                <span className="text-sm font-semibold text-white mt-1">Ollama / Kokoro TTS</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Summarize & Voiceover</span>
              </div>

              {/* Connecting Line 2 */}
              <div className="flex items-center text-cyan-500/60 font-mono text-xs">
                <span className="w-6 h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500"></span>
                <span>▶</span>
              </div>

              {/* Node 3: Storage */}
              <div className="flex-1 bg-[#131B2E] border border-emerald-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col items-center text-center">
                <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl mb-2 text-xl">🗄️</span>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Database</span>
                <span className="text-sm font-semibold text-white mt-1">PostgreSQL & Vector</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Logs & History Save</span>
              </div>

              {/* Connecting Line 3 */}
              <div className="flex items-center text-emerald-500/60 font-mono text-xs">
                <span className="w-6 h-0.5 bg-gradient-to-r from-emerald-500 to-purple-500"></span>
                <span>▶</span>
              </div>

              {/* Node 4: Action */}
              <div className="flex-1 bg-[#131B2E] border border-purple-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(168,85,247,0.15)] flex flex-col items-center text-center">
                <span className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl mb-2 text-xl">🚀</span>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Action</span>
                <span className="text-sm font-semibold text-white mt-1">Telegram & Discord</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Post & Notify Users</span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURED AUTOMATION TEMPLATES ────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Ready-to-Use Workflows</h2>
            <p className="text-slate-400 text-sm mt-1">Deploy battle-tested automation templates with a single click.</p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-[#0B1221] p-1 rounded-2xl border border-orange-950 overflow-x-auto max-w-full">
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
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
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
              className="bg-gradient-to-b from-[#0B1221]/80 to-[#050B14]/80 border border-orange-950/60 rounded-3xl p-7 hover:border-orange-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.12)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-black/40 ${t.color}`}>
                    {t.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Template #{idx + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {t.desc}
                </p>

                {/* Node Sequence Badges */}
                <div className="mb-6">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pipeline Nodes:</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {t.nodes.map((n, i) => (
                      <span key={i} className="text-xs bg-[#131B2E] border border-white/10 text-slate-300 px-2.5 py-1 rounded-lg">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <a
                href="/n8n/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-orange-600/20 text-slate-300 hover:text-orange-300 font-bold px-4 py-3 rounded-xl text-xs transition-all duration-300 border border-slate-800 hover:border-orange-500/40 cursor-pointer"
              >
                <span>Open in Workflow Builder</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. ENTERPRISE CAPABILITIES ─────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h3 className="text-2xl font-bold text-white mb-2">Built for Speed, Reliability & Scale</h3>
          <p className="text-sm text-slate-400">Enterprise background workers ensure your automations never drop a single task.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0B1221]/60 border border-white/5 rounded-3xl p-7 hover:border-orange-500/30 transition-all">
            <div className="text-3xl mb-4">⚡</div>
            <h4 className="text-lg font-bold text-white mb-2">&lt; 50ms Webhook Trigger</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Instantaneous event ingestion through dedicated Redis message brokers and high-performance FastAPI gateways.
            </p>
          </div>

          <div className="bg-[#0B1221]/60 border border-white/5 rounded-3xl p-7 hover:border-orange-500/30 transition-all">
            <div className="text-3xl mb-4">🔄</div>
            <h4 className="text-lg font-bold text-white mb-2">24/7 Persistent Workers</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Runs in isolated Docker microservices with auto-restart policies and automated database transaction backups.
            </p>
          </div>

          <div className="bg-[#0B1221]/60 border border-white/5 rounded-3xl p-7 hover:border-orange-500/30 transition-all">
            <div className="text-3xl mb-4">🤖</div>
            <h4 className="text-lg font-bold text-white mb-2">Private AI Model Hooks</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Plug directly into your local Ollama LLMs and Kokoro TTS models without paying external API per-token fees.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
