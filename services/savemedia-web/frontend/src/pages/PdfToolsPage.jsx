import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import VerificationOverlay from '../components/VerificationOverlay'

export default function PdfToolsPage() {
  const { dbUser, session, loading: authLoading, loginWithGoogle } = useAuth()
  const [activeCategory, setActiveCategory] = useState('all')

  // Interactive Live Simulator State
  const [activeDemo, setActiveDemo] = useState('compress')
  const [isProcessing, setIsProcessing] = useState(false)
  const [demoProgress, setDemoProgress] = useState(100)
  const [rotatedPages, setRotatedPages] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 })

  const runSimulation = () => {
    setIsProcessing(true)
    setDemoProgress(0)
    let p = 0
    const interval = setInterval(() => {
      p += 15
      if (p >= 100) {
        setDemoProgress(100)
        setIsProcessing(false)
        clearInterval(interval)
      } else {
        setDemoProgress(p)
      }
    }, 150)
  }

  const rotatePage = (pageNum) => {
    setRotatedPages(prev => ({
      ...prev,
      [pageNum]: (prev[pageNum] + 90) % 360
    }))
  }

  const categories = [
    { id: 'all', label: 'All 50+ Tools' },
    { id: 'organize', label: 'Organize & Merge' },
    { id: 'convert', label: 'Convert & Export' },
    { id: 'ai', label: 'AI & OCR' },
    { id: 'security', label: 'Security & Privacy' },
    { id: 'optimize', label: 'Compress & Repair' },
  ]

  const toolCards = [
    {
      category: 'organize',
      title: 'Merge PDF Documents',
      badge: 'Popular',
      desc: 'Combine unlimited PDF files into one clean, organized document with custom page sorting.',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      )
    },
    {
      category: 'convert',
      title: 'PDF to Word (DOCX)',
      badge: 'High Precision',
      desc: 'Convert complex PDF layouts, tables, and images into fully editable Microsoft Word documents.',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      category: 'ai',
      title: 'AI OCR & Text Extraction',
      badge: 'AI Powered',
      desc: 'Extract text from scanned documents & photos with high accuracy Khmer and English OCR recognition.',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      category: 'optimize',
      title: 'Extreme PDF Compressor',
      badge: 'Up to 90% Less',
      desc: 'Shrink massive PDF files for email attachment without losing visual crispness or vector text sharpness.',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    },
    {
      category: 'security',
      title: 'Sanitize & Redact Metadata',
      badge: 'Privacy 100%',
      desc: 'Permanently remove hidden author metadata, GPS location tags, and black-out confidential text.',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      category: 'organize',
      title: 'Visual Split & Page Reorder',
      badge: 'Interactive',
      desc: 'Interactive grid interface to drag, reorder, rotate individual pages, extract chapters, or delete pages.',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    }
  ]

  const filteredTools = activeCategory === 'all' 
    ? toolCards 
    : toolCards.filter(t => t.category === activeCategory)

  return (
    <div className="w-full flex flex-col items-center pb-24 text-slate-200">
      
      {/* ── 1. HERO BANNER SECTION ─────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 pt-10 pb-8 text-center relative">
        {/* Glow Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-red-600/15 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
          Enterprise Stirling-PDF Suite · 50+ Tools
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-300 tracking-tight leading-[1.15] mb-6">
          The Complete All-In-One <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">PDF Powerhouse</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          50+ offline-ready tools to edit, convert, merge, compress, OCR scan, sign, and sanitize documents with <span className="text-slate-200 font-semibold">zero file size limits</span> and 100% private on-premises security.
        </p>

        {/* ── 2. REAL INTERACTIVE CODE-DRIVEN SIMULATOR / PLAYGROUND ──── */}
        <div className="relative mx-auto mb-10 rounded-3xl overflow-hidden border border-red-500/30 bg-[#0B1221]/95 shadow-[0_0_50px_rgba(239,68,68,0.2)] backdrop-blur-2xl text-left p-6 sm:p-8">
          
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-red-950/80">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 ml-2">
                Stirling-PDF · Interactive Workspace Studio
              </span>
            </div>

            {/* Interactive Module Selector */}
            <div className="flex items-center gap-1 bg-[#050B14] p-1 rounded-xl border border-red-950">
              {[
                { id: 'compress', label: '🗜️ Compress' },
                { id: 'ocr', label: '🔍 AI OCR' },
                { id: 'reorder', label: '📑 Page Organizer' },
                { id: 'convert', label: '📄 PDF to Word' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setActiveDemo(m.id); runSimulation(); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeDemo === m.id
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Workspace Body */}
          <div className="py-6">
            {activeDemo === 'compress' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center animate-fade-in">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-400 bg-red-950/60 px-3 py-1 rounded-full border border-red-900/40">
                    Smart Vector Compression
                  </span>
                  <h3 className="text-2xl font-bold text-white">
                    Shrink Heavy PDFs up to 90%
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Preserve crystal-clear vector fonts, table formatting, and hi-res image resolutions while purging redundant internal metadata streams.
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Original: 48.2 MB</span>
                      <span className="text-emerald-400 font-bold">Optimized: 4.6 MB (-90.4%)</span>
                    </div>
                    <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        style={{ width: `${demoProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={runSimulation}
                    disabled={isProcessing}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>{isProcessing ? '⚡ Optimizing…' : '🔄 Run Test Compression'}</span>
                  </button>
                </div>

                {/* Animated File Visualizer */}
                <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                  <div className="w-20 h-24 bg-gradient-to-b from-red-950/80 to-slate-900 border border-red-500/40 rounded-xl flex flex-col items-center justify-center p-2 mb-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <span className="text-2xl mb-1">📄</span>
                    <span className="text-[10px] font-mono font-bold text-red-300">ANNUAL.PDF</span>
                  </div>
                  <span className="text-xs font-bold text-white mb-1">Corporate_Annual_Report_2026.pdf</span>
                  <span className="text-[11px] text-emerald-400 font-mono">⚡ 124 Pages Processed in 0.48s</span>
                </div>
              </div>
            )}

            {activeDemo === 'ocr' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center animate-fade-in">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-900/40">
                    Neural Deep OCR (Khmer + English)
                  </span>
                  <h3 className="text-2xl font-bold text-white">
                    Convert Scanned Photos to Selectable Text
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Trained on specialized Khmer language fonts and complex table structures. Turn unselectable image scans into searchable, copyable documents.
                  </p>
                  <button
                    onClick={runSimulation}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>{isProcessing ? '🔍 Scanning Document…' : '⚡ Simulate OCR Extraction'}</span>
                  </button>
                </div>

                {/* Scanned Image to Text Live Comparison */}
                <div className="bg-[#050B14] border border-cyan-500/30 rounded-2xl p-5 font-mono text-xs text-slate-300 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-cyan-400 pb-2 border-b border-white/5">
                    <span>STATUS: OCR_RECOGNITION_ACTIVE</span>
                    <span>CONFIDENCE: 99.4%</span>
                  </div>
                  <p className="text-slate-400">=== EXTRACTED TEXT STREAM ===</p>
                  <p className="text-cyan-200 bg-cyan-950/30 p-2 rounded border border-cyan-900/40 select-all">
                    កិច្ចសន្យាផ្តល់សេវាកម្ម / Service Level Agreement (SLA)<br />
                    Agreement Date: 2026-08-31 | Status: Verified Active
                  </p>
                  <p className="text-emerald-400 text-[11px]">✓ 1,420 words extracted to searchable PDF text layer</p>
                </div>
              </div>
            )}

            {activeDemo === 'reorder' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">Visual Page Organizer</h3>
                    <p className="text-xs text-slate-400">Click any page thumbnail below to rotate it 90° live!</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                    4 Pages in Workspace
                  </span>
                </div>

                {/* Interactive Clickable Page Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  {[1, 2, 3, 4].map((pNum) => (
                    <div
                      key={pNum}
                      onClick={() => rotatePage(pNum)}
                      className="bg-[#050B14] border border-white/10 hover:border-red-500/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 group"
                    >
                      <div
                        className="w-16 h-20 bg-slate-900 border border-white/20 rounded-lg flex flex-col items-center justify-center p-2 mb-2 transition-transform duration-300 shadow-md"
                        style={{ transform: `rotate(${rotatedPages[pNum]}deg)` }}
                      >
                        <span className="text-xs font-bold text-slate-400">P.{pNum}</span>
                        <div className="w-8 h-0.5 bg-white/20 mt-1 rounded"></div>
                        <div className="w-6 h-0.5 bg-white/20 mt-0.5 rounded"></div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 group-hover:text-red-400 flex items-center gap-1">
                        <span>Rotate</span>
                        <span className="font-mono text-slate-500">({rotatedPages[pNum]}°)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDemo === 'convert' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center animate-fade-in">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-900/40">
                    High-Fidelity Document Conversion
                  </span>
                  <h3 className="text-2xl font-bold text-white">
                    Convert to DOCX, Excel & Images
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Convert complex multi-column PDFs into fully editable Word DOCX files while preserving exact paragraph spacing, margins, and embedded charts.
                  </p>
                </div>

                <div className="bg-[#050B14] border border-blue-500/30 rounded-2xl p-6 flex items-center justify-around shadow-inner">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-20 bg-red-950/80 border border-red-500/40 rounded-xl flex items-center justify-center text-xl shadow-lg mb-2">
                      PDF
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Input File</span>
                  </div>

                  <span className="text-2xl text-blue-400 animate-pulse">➔</span>

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-20 bg-blue-950/80 border border-blue-500/40 rounded-xl flex items-center justify-center text-xl shadow-lg mb-2">
                      DOCX
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Editable Word</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── AUTH / ACCESS STATUS CARD ────────────────────────────── */}
        <div className="max-w-xl mx-auto">
          {authLoading ? (
            <div className="bg-[#0B1221]/90 border border-red-900/30 rounded-3xl p-8 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Checking Workspace Authorization…</p>
            </div>
          ) : !session ? (
            /* STEP 1: Not signed in */
            <div className="bg-gradient-to-b from-[#0B1221]/95 to-[#050B14]/95 border border-red-900/40 rounded-3xl p-8 shadow-[0_0_40px_rgba(239,68,68,0.15)] backdrop-blur-xl animate-fade-in">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30 text-red-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Sign In to Launch Full Studio</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Sign in with your Google account to unlock complete document editing, batch exports, and 50+ modules.
              </p>
              <button
                onClick={loginWithGoogle}
                className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-4 px-6 rounded-2xl border border-white/15 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:border-red-500/40 cursor-pointer text-base hover:-translate-y-0.5"
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
              title="PDF Studio Activation"
              subtitle="Enter your active CAM-XXXX-XXXX key to initialize your Stirling-PDF workspace."
            />
          ) : (
            /* STEP 3: Verified & Ready to Launch */
            <div className="bg-gradient-to-b from-[#0B1221]/95 to-[#050B14]/95 border border-red-500/40 rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] backdrop-blur-xl animate-fade-in text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                Workspace Verified & Ready
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Stirling-PDF Studio is Active</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                Launch the dedicated full-screen PDF workspace to process batch files, OCR scans, and run all 50+ tools.
              </p>
              <a
                href="/pdf/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)] cursor-pointer text-base hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Launch Standalone PDF Studio</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. VISUAL WORKFLOW FLOWCHART ───────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-b from-[#0B1221]/90 via-[#070D18]/90 to-[#050B14]/90 border border-red-950/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-white mb-2">How Document Processing Works</h3>
            <p className="text-sm text-slate-400">Streamlined 4-stage pipeline for maximum privacy, speed, and accuracy.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {[
              { step: '01', title: 'Upload Any File', desc: 'PDF, Word, Excel, Scanned images, or ZIP archives.', icon: '📁' },
              { step: '02', title: 'AI OCR & Extract', desc: 'Deep learning recognizes Khmer & English text automatically.', icon: '🔍' },
              { step: '03', title: 'Process & Optimize', desc: 'Merge, split, redact, compress, or add watermarks.', icon: '⚙️' },
              { step: '04', title: 'Export & Encrypt', desc: 'Download instantly with optional AES-256 password protection.', icon: '🛡️' },
            ].map((st, i) => (
              <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-5 relative flex flex-col justify-between hover:border-red-500/30 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{st.icon}</span>
                    <span className="font-mono text-xs font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900/40">{st.step}</span>
                  </div>
                  <h4 className="font-bold text-white text-base mb-1">{st.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. INTERACTIVE TOOLS SHOWCASE ──────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Popular PDF Utilities</h2>
            <p className="text-slate-400 text-sm mt-1">Explore some of the 50+ built-in modules included in the suite.</p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-[#0B1221] p-1 rounded-2xl border border-red-950 overflow-x-auto max-w-full">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((t, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-b from-[#0B1221]/80 to-[#050B14]/80 border border-red-950/60 rounded-3xl p-6 hover:border-red-500/40 hover:shadow-[0_0_25px_rgba(239,68,68,0.12)] transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center group-hover:border-red-500/40 group-hover:bg-red-950/60 transition-colors shadow-inner">
                    {t.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-950/60 px-2.5 py-1 rounded-full border border-red-800/40">
                    {t.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-300 transition-colors">
                  {t.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {t.desc}
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="/pdf/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-red-600/20 text-slate-300 hover:text-red-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all duration-300 border border-slate-800 hover:border-red-500/40 cursor-pointer"
                >
                  <span>Launch in Studio</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. WHY CAMTECH PDF TOOLS (ADVANTAGES) ────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h3 className="text-2xl font-bold text-white mb-2">Why Use CamTech PDF Suite?</h3>
          <p className="text-sm text-slate-400">Engineered for professionals who handle sensitive corporate and personal files.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0B1221]/60 border border-white/5 rounded-3xl p-7 hover:border-red-500/30 transition-all">
            <div className="text-3xl mb-4">🔒</div>
            <h4 className="text-lg font-bold text-white mb-2">100% Private & Local</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your files are processed directly on your dedicated server and never transmitted to 3rd-party commercial cloud providers.
            </p>
          </div>

          <div className="bg-[#0B1221]/60 border border-white/5 rounded-3xl p-7 hover:border-red-500/30 transition-all">
            <div className="text-3xl mb-4">⚡</div>
            <h4 className="text-lg font-bold text-white mb-2">No File Limits & Fast</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Process huge 500MB+ documents, multi-thousand page books, or bulk archives without paying extra subscriptions.
            </p>
          </div>

          <div className="bg-[#0B1221]/60 border border-white/5 rounded-3xl p-7 hover:border-red-500/30 transition-all">
            <div className="text-3xl mb-4">🇰🇭</div>
            <h4 className="text-lg font-bold text-white mb-2">Khmer OCR Supported</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Specialized Tessdata optical character recognition trained to digitize Khmer script and dual Khmer-English documents.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
