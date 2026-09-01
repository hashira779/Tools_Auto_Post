import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import VerificationOverlay from '../components/VerificationOverlay'

export default function PdfToolsPage() {
  const { dbUser, session, loading: authLoading, loginWithGoogle } = useAuth()
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Interactive Live Simulator State
  const [activeDemo, setActiveDemo] = useState('compress')
  const [isProcessing, setIsProcessing] = useState(false)
  const [demoProgress, setDemoProgress] = useState(100)
  const [rotatedPages, setRotatedPages] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 })

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

  // Google Drive & Web Image Fetcher State
  const [driveUrlInput, setDriveUrlInput] = useState('')
  const [fetchedImage, setFetchedImage] = useState<string | null>(null)
  const [isFetchingImage, setIsFetchingImage] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const parseGoogleDriveUrl = (inputUrl: string) => {
    if (!inputUrl) return ''
    const fileIdMatch = inputUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`
    }
    const idMatch = inputUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`
    }
    return inputUrl.trim()
  }

  const handleFetchImage = (urlToFetch?: string) => {
    const targetUrl = urlToFetch || driveUrlInput
    if (!targetUrl) {
      setFetchError('Please enter a valid Google Drive share link or Web Image URL.')
      return
    }
    setFetchError(null)
    setIsFetchingImage(true)
    
    const resolvedUrl = parseGoogleDriveUrl(targetUrl)
    
    setTimeout(() => {
      setFetchedImage(resolvedUrl)
      setIsFetchingImage(false)
    }, 500)
  }

  const storyStages = [
    {
      id: 0,
      title: 'Neural Deep OCR Engine',
      badge: 'Khmer & English Recognition',
      desc: 'High-speed OCR scanner automatically detects scanned image layers, deskews warped documents, and creates selectable, searchable Unicode text overlays.',
      stats: '99.4% Character Accuracy',
      image: '/images/pdf-ocr-card.jpg'
    },
    {
      id: 1,
      title: 'Multi-Layer Vector Optimizer',
      badge: 'Up to 90% Compression',
      desc: 'Strikes down bloat by deduplicating font streams, re-encoding raster assets, and flattening unused structural objects with 0 dpi loss.',
      stats: '48MB ➔ 4.6MB Lossless',
      image: null
    },
    {
      id: 2,
      title: 'Cryptographic Privacy & Redactor',
      badge: 'Zero-Knowledge Security',
      desc: 'Permanently burns black redaction boxes directly into vector paths so redacted text can never be recovered through copy-paste or decompilation.',
      stats: 'AES-256 Military Encryption',
      image: null
    },
    {
      id: 3,
      title: 'Instant Multi-Format Transpiler',
      badge: 'Native Office Export',
      desc: 'Reconstructs complex PDF tables, nested grids, and paragraph margins directly into editable Microsoft Word (DOCX) and Excel (XLSX) sheets.',
      stats: 'Pixel-Perfect Reconstruction',
      image: null
    }
  ]

  const categories = [
    { id: 'all', label: 'All 50+ Tools' },
    { id: 'gdrive', label: '☁️ Google Drive & Image Tools' },
    { id: 'organize', label: 'Organize & Merge' },
    { id: 'convert', label: 'Convert & Export' },
    { id: 'ai', label: 'AI & OCR' },
    { id: 'security', label: 'Security & Privacy' },
    { id: 'optimize', label: 'Compress & Repair' },
  ]

  const toolCards = [
    {
      category: 'gdrive',
      title: 'Google Drive Image to PDF',
      badge: 'Google Integration',
      desc: 'Fetch images directly from Google Drive share links or Google Photos and convert them into clean PDF documents.',
      image: '/images/pdf-ocr-card.jpg',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      category: 'gdrive',
      title: 'PDF to High-Res Images',
      badge: 'Export JPG/PNG',
      desc: 'Convert PDF document pages into high-resolution PNG or JPG image files ready for sharing.',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    {
      category: 'gdrive',
      title: 'Add Google Drive Image to PDF',
      badge: 'Watermark & Stamp',
      desc: 'Overlay logos, signatures, or image pages from Google Drive directly into any PDF file.',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      category: 'ai',
      title: 'AI OCR & Text Extraction',
      badge: 'AI Powered',
      desc: 'Extract text from scanned documents & photos with high accuracy Khmer and English OCR recognition.',
      image: '/images/pdf-ocr-card.jpg',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      category: 'organize',
      title: 'Merge PDF Documents',
      badge: 'Popular',
      desc: 'Combine unlimited PDF files into one clean, organized document with custom page sorting.',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      category: 'optimize',
      title: 'Extreme PDF Compressor',
      badge: 'Up to 90% Less',
      desc: 'Shrink massive PDF files for email attachment without losing visual crispness or vector text sharpness.',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    }
  ]

  const filteredTools = toolCards.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    const matchesSearch = searchQuery === '' || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <main className="w-full flex flex-col items-center animate-fade-in text-[var(--color-text)] relative z-10">
      
      {/* ── 1. HERO BANNER SECTION ───────────────────────────────────── */}
      <section className="w-full pt-4 pb-12 text-center relative">
        <div className="badge badge-primary mb-6 text-xs sm:text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Enterprise PDF Suite
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
          Professional Document Processing.
          <br className="hidden sm:inline" />
          <span className="text-slate-600"> Secured On-Premises.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-12">
          50+ offline-ready tools to edit, convert, merge, and sanitize documents with zero file size limits. Built for privacy-first enterprises.
        </p>

        {/* ── 2. REAL INTERACTIVE CODE-DRIVEN PLAYGROUND ──────────────── */}
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
                Stirling-PDF Studio · Live Simulator
              </span>
            </div>

            {/* Interactive Module Selector */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
              {[
                { id: 'gdrive', label: '☁️ Google Drive & Image' },
                { id: 'compress', label: '🗜️ Compress' },
                { id: 'ocr', label: '🔍 AI OCR' },
                { id: 'reorder', label: '📑 Organizer' },
                { id: 'convert', label: '📄 to Word' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setActiveDemo(m.id); if (m.id !== 'gdrive') runSimulation(); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeDemo === m.id
                      ? 'bg-red-500/20 text-red-700 border border-red-500/40 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Workspace Body */}
          <div className="py-6">
            {activeDemo === 'gdrive' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-fade-in">
                <div className="md:col-span-7 space-y-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Cloud & Web Image Integration
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Fetch Google Drive & Web Images to PDF
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Paste any public Google Drive sharing link, Google Photos URL, or web image address to preview and process directly into Stirling PDF.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste Google Drive link or Image URL..."
                        value={driveUrlInput}
                        onChange={(e) => setDriveUrlInput(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={() => handleFetchImage()}
                        disabled={isFetchingImage}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                      >
                        {isFetchingImage ? (
                          <span className="animate-pulse">Fetching...</span>
                        ) : (
                          <>
                            <span>Fetch Image</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-slate-500">Quick Samples:</span>
                      <button
                        onClick={() => {
                          const url = '/images/pdf-ocr-card.jpg'
                          setDriveUrlInput(url)
                          handleFetchImage(url)
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                      >
                        📄 Google Scan Sample
                      </button>
                      <button
                        onClick={() => {
                          const url = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view'
                          setDriveUrlInput(url)
                          handleFetchImage(url)
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                      >
                        📁 Drive Link Demo
                      </button>
                    </div>

                    {fetchError && (
                      <p className="text-xs text-red-600 font-medium">{fetchError}</p>
                    )}
                  </div>
                </div>

                {/* Preview Visualizer Card */}
                <div className="md:col-span-5 bg-slate-50 border border-emerald-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-inner relative min-h-[220px]">
                  {fetchedImage ? (
                    <div className="w-full space-y-3 animate-fade-in">
                      <div className="relative rounded-xl overflow-hidden border border-slate-300 max-h-40 bg-white flex items-center justify-center shadow-sm">
                        <img
                          src={fetchedImage}
                          alt="Fetched Google Drive Preview"
                          className="max-h-36 object-contain"
                          onError={() => {
                            setFetchedImage('/images/pdf-ocr-card.jpg')
                          }}
                        />
                        <span className="absolute top-2 right-2 text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow">
                          ✓ Image Fetched
                        </span>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <a
                          href="/pdf/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[11px] font-bold shadow hover:bg-red-500 transition-colors"
                        >
                          Convert to PDF
                        </a>
                        <a
                          href="/pdf/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[11px] font-bold shadow hover:bg-slate-700 transition-colors"
                        >
                          Add to PDF Page
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                      </div>
                      <span className="text-xs font-medium text-slate-600">Enter a Google Drive link or Web URL to preview image</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeDemo === 'compress' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center animate-fade-in">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-slate-200">
                    Smart Vector Compression
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Shrink Heavy PDFs up to 90%
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Preserve crystal-clear vector fonts, table formatting, and hi-res image resolutions while purging redundant internal metadata streams.
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-600">Original: 48.2 MB</span>
                      <span className="text-emerald-400 font-bold">Optimized: 4.6 MB (-90.4%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-200 p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        style={{ width: `${demoProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={runSimulation}
                    disabled={isProcessing}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-700 border border-red-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>{isProcessing ? '⚡ Optimizing…' : '🔄 Run Test Compression'}</span>
                  </button>
                </div>

                {/* Animated File Visualizer */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                  <div className="w-20 h-24 bg-gradient-to-b from-red-950/80 to-slate-900 border border-red-500/40 rounded-xl flex flex-col items-center justify-center p-2 mb-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <span className="text-2xl mb-1">📄</span>
                    <span className="text-[10px] font-mono font-bold text-red-700">ANNUAL.PDF</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 mb-1">Corporate_Annual_Report_2026.pdf</span>
                  <span className="text-[11px] text-emerald-400 font-mono">⚡ 124 Pages Processed in 0.48s</span>
                </div>
              </div>
            )}

            {activeDemo === 'ocr' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center animate-fade-in">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                    Neural Deep OCR (Khmer + English)
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Convert Scanned Photos to Selectable Text
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Trained on specialized Khmer language fonts and complex table structures. Turn unselectable image scans into searchable, copyable documents.
                  </p>
                  <button
                    onClick={runSimulation}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 border border-cyan-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>{isProcessing ? '🔍 Scanning Document…' : '⚡ Simulate OCR Extraction'}</span>
                  </button>
                </div>

                {/* Scanned Image to Text Live Comparison with Laser Scan Effect */}
                <div className="bg-slate-50 border border-cyan-200 rounded-2xl p-5 font-mono text-xs text-slate-700 space-y-2 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanline shadow-[0_0_12px_rgba(34,211,238,0.8)] pointer-events-none"></div>
                  <div className="flex items-center justify-between text-[11px] text-cyan-700 pb-2 border-b border-slate-200">
                    <span>STATUS: OCR_RECOGNITION_ACTIVE</span>
                    <span>CONFIDENCE: 99.4%</span>
                  </div>
                  <p className="text-slate-600">=== EXTRACTED TEXT STREAM ===</p>
                  <p className="text-cyan-800 bg-cyan-50 p-2 rounded border border-cyan-200 select-all">
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
                    <h3 className="text-lg font-bold text-slate-900">Visual Page Organizer</h3>
                    <p className="text-xs text-slate-600">Click any page thumbnail below to rotate it 90° live!</p>
                  </div>
                  <span className="text-xs font-mono text-slate-600 bg-white shadow-sm px-3 py-1 rounded-lg border border-slate-200">
                    4 Pages in Workspace
                  </span>
                </div>

                {/* Interactive Clickable Page Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                  {[1, 2, 3, 4].map((pNum) => (
                    <div
                      key={pNum}
                      onClick={() => rotatePage(pNum)}
                      className="bg-slate-50 border border-slate-200 hover:border-red-500/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 group"
                    >
                      <div
                        className="w-14 h-18 sm:w-16 sm:h-20 bg-slate-100 border border-white/20 rounded-lg flex flex-col items-center justify-center p-2 mb-2 transition-transform duration-300 shadow-md"
                        style={{ transform: `rotate(${rotatedPages[pNum]}deg)` }}
                      >
                        <span className="text-xs font-bold text-slate-600">P.{pNum}</span>
                        <div className="w-8 h-0.5 bg-white/20 mt-1 rounded"></div>
                        <div className="w-6 h-0.5 bg-white/20 mt-0.5 rounded"></div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-red-600 flex items-center gap-1">
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
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Convert to DOCX, Excel & Images
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Convert complex multi-column PDFs into fully editable Word DOCX files while preserving exact paragraph spacing, margins, and embedded charts.
                  </p>
                </div>

                <div className="bg-slate-50 border border-blue-500/30 rounded-2xl p-6 flex items-center justify-around shadow-inner">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-18 sm:w-16 sm:h-20 bg-red-950/80 border border-red-500/40 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-lg mb-2">
                      PDF
                    </div>
                    <span className="text-xs text-slate-600 font-medium">Input File</span>
                  </div>

                  <span className="text-xl sm:text-2xl text-blue-400 animate-pulse">➔</span>

                  <div className="flex flex-col items-center">
                    <div className="w-14 h-18 sm:w-16 sm:h-20 bg-blue-950/80 border border-blue-500/40 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-lg mb-2">
                      DOCX
                    </div>
                    <span className="text-xs text-slate-600 font-medium">Editable Word</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── AUTH / ACCESS STATUS CARD ────────────────────────────── */}
        <div className="w-full max-w-xl mx-auto my-8">
          {authLoading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
              <p className="text-xs uppercase tracking-widest text-slate-600 font-bold">Checking Workspace Authorization…</p>
            </div>
          ) : !session ? (
            /* STEP 1: Not signed in */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(239,68,68,0.15)] backdrop-blur-xl animate-fade-in">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30 text-red-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Sign In to Launch Full Studio</h3>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mb-6">
                Sign in with your Google account to unlock complete document editing, batch exports, and 50+ modules.
              </p>
              <button
                onClick={loginWithGoogle}
                className="w-full bg-white/10 hover:bg-white/15 text-slate-900 font-bold py-3.5 sm:py-4 px-6 rounded-2xl border border-white/15 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:border-red-500/40 cursor-pointer text-sm sm:text-base hover:-translate-y-0.5"
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
            <div className="bg-white border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] backdrop-blur-xl animate-fade-in text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/20 text-red-700 border border-red-500/30 text-xs font-bold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                Workspace Verified & Ready
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Stirling-PDF Studio is Active</h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 max-w-md mx-auto">
                Launch the dedicated full-screen PDF workspace to process batch files, OCR scans, and run all 50+ tools.
              </p>
              <a
                href="/pdf/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-slate-900 font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl transition-all duration-300 shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)] cursor-pointer text-sm sm:text-base hover:-translate-y-0.5 active:translate-y-0"
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

      {/* ── 3. APPLE-STYLE SCROLL-PINNED STORYTELLING SECTION ───────── */}
      <section ref={scrollyContainerRef} className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative h-[250vh] sm:h-[300vh]">
        {/* Sticky Pinned Container */}
        <div className="sticky top-20 sm:top-24 w-full bg-white/95 border border-slate-200 rounded-3xl p-5 sm:p-10 shadow-2xl backdrop-blur-2xl text-left overflow-hidden">
          
          {/* Section Header & Apple Scroll Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-6 border-b border-slate-200 mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-red-600 font-bold">The Architecture of Speed</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">Engineered for Extreme Precision</h2>
            </div>
            {/* Real Scroll Progress Tracker */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-600">Scroll Story</span>
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full transition-all duration-150"
                  style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono font-bold text-red-600">0{storyStage + 1}/04</span>
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
                      ? 'bg-white shadow-md border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.25)] scale-[1.02]'
                      : 'bg-slate-50 border-slate-200 opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-red-600 uppercase tracking-widest">
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
                <div className="space-y-4 animate-fade-in w-full max-w-md">
                  <div className="relative rounded-2xl overflow-hidden border border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
                    <img src="/images/pdf-ocr-card.jpg" alt="Deep OCR Scanning" className="w-full h-44 object-cover" />
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-scanline"></div>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">Khmer & Dual Script OCR Engine</h4>
                  <p className="text-xs text-slate-600">99.4% accuracy with automated deskewing and orientation correction.</p>
                </div>
              )}

              {storyStage === 1 && (
                <div className="space-y-4 animate-fade-in w-full max-w-sm">
                  <div className="relative w-32 h-40 sm:w-36 sm:h-44 mx-auto bg-gradient-to-b from-red-950/60 to-slate-900 border border-red-500/40 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                    <span className="text-4xl mb-2">🗜️</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">-90.4%</span>
                    <span className="text-[10px] text-slate-600 mt-1">Lossless Vector Pass</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">Lossless Vector Optimization</h4>
                  <p className="text-xs text-slate-600">Reduces storage costs and ensures instant email transmission.</p>
                </div>
              )}

              {storyStage === 2 && (
                <div className="space-y-4 animate-fade-in w-full max-w-sm">
                  <div className="relative w-32 h-40 sm:w-36 sm:h-44 mx-auto bg-gradient-to-b from-purple-950/60 to-slate-900 border border-purple-500/40 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                    <span className="text-4xl mb-2">🛡️</span>
                    <span className="text-xs font-mono font-bold text-purple-300">METADATA STRIPPED</span>
                    <span className="text-[10px] text-slate-600 mt-1">Zero Recovery Redaction</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">Cryptographic Redaction</h4>
                  <p className="text-xs text-slate-600">Permanently destroys redacted vectors from raw PDF bytecode.</p>
                </div>
              )}

              {storyStage === 3 && (
                <div className="space-y-4 animate-fade-in w-full max-w-sm">
                  <div className="relative w-32 h-40 sm:w-36 sm:h-44 mx-auto bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <span className="text-4xl mb-2">⚡</span>
                    <span className="text-xs font-mono font-bold text-emerald-300">DOCX · XLSX · PNG</span>
                    <span className="text-[10px] text-slate-600 mt-1">Native Microsoft Office</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">Native Office Transpiler</h4>
                  <p className="text-xs text-slate-600">Preserves complex table spans, headers, and bullet hierarchies.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ── 4. STIRLING-PDF TOOLS SHOWCASE WITH SEARCH & CATEGORIES ── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-600">Stirling PDF Core Suite</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Popular PDF Utilities</h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">Explore 50+ built-in modules for editing, OCR, conversion, and cloud image integration.</p>
            </div>

            {/* Instant Search Bar */}
            <div className="relative min-w-[280px] sm:min-w-[320px]">
              <input
                type="text"
                placeholder="🔍 Search tools (e.g. OCR, Merge, Google, Compress)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 focus:border-red-500 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs with Counts */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
            {categories.map((c) => {
              const count = c.id === 'all'
                ? toolCards.length
                : toolCards.filter(t => t.category === c.id).length
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === c.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeCategory === c.id ? 'bg-red-800 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {filteredTools.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm my-6 space-y-3">
            <div className="text-3xl">🔍</div>
            <h3 className="text-lg font-bold text-slate-800">No PDF Tools Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">No tools match your search "{searchQuery}". Try searching for terms like "OCR", "Merge", or "Google".</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 cursor-pointer transition-colors"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((t, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 hover:border-red-500/40 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-[0_0_30px_rgba(239,68,68,0.12)] hover:-translate-y-1"
              >
                <div className="flex flex-col h-full justify-between">
                  {t.image && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                      <img src={t.image} alt={t.title} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200/60 flex items-center justify-center group-hover:border-red-500/40 group-hover:bg-red-100/50 transition-colors shadow-inner">
                      {t.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                      {t.badge}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 group-hover:text-red-600 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                    {t.desc}
                  </p>
                </div>

                <div className="pt-4 mt-auto border-t border-slate-100">
                  <a
                    href="/pdf/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all duration-300 shadow-sm cursor-pointer"
                  >
                    <span>Launch Tool</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 5. WHY CAMTECH PDF TOOLS ───────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Why Use CamTech PDF Suite?</h3>
          <p className="text-xs sm:text-sm text-slate-600">Engineered for professionals who handle sensitive corporate and personal files.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:border-red-500/30 transition-all">
            <div className="text-3xl mb-4">🔒</div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">100% Private & Local</h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Your files are processed directly on your dedicated server and never transmitted to 3rd-party commercial cloud providers.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:border-red-500/30 transition-all">
            <div className="text-3xl mb-4">⚡</div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">No File Limits & Fast</h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Process huge 500MB+ documents, multi-thousand page books, or bulk archives without paying extra subscriptions.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:border-red-500/30 transition-all">
            <div className="text-3xl mb-4">🇰🇭</div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Khmer OCR Supported</h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Specialized Tessdata optical character recognition trained to digitize Khmer script and dual Khmer-English documents.
            </p>
          </div>
        </div>
      </section>

    </main>
  )
}
