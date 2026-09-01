import React from 'react'

export default function PdfTools() {
  const tools = [
    {
      title: 'Google Drive Image to PDF',
      desc: 'Fetch images from Google Drive links or Photos and convert them to PDF.',
      path: '/pdf/img-to-pdf',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'PDF to High-Res Images',
      desc: 'Convert PDF document pages into PNG or JPG image files.',
      path: '/pdf/pdf-to-img',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    {
      title: 'Add Google Drive Image to PDF',
      desc: 'Overlay Google Drive image logos or signatures onto PDF pages.',
      path: '/pdf/add-image',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      title: 'Merge PDFs',
      desc: 'Combine multiple PDF documents into a single organized file.',
      path: '/pdf/merge-pdfs',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      )
    },
    {
      title: 'Compress PDF',
      desc: 'Reduce file size while preserving high visual quality and text sharpness.',
      path: '/pdf/compress-pdf',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    },
    {
      title: 'PDF to Word (DOCX)',
      desc: 'Convert PDF files into editable Microsoft Word documents effortlessly.',
      path: '/pdf/pdf-to-word',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Split PDF',
      desc: 'Extract specific pages or separate each page into distinct files.',
      path: '/pdf/split-pages',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      title: 'OCR & Text Recognition',
      desc: 'Extract and make scanned non-selectable PDF text searchable.',
      path: '/pdf/ocr-pdf',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Rotate & Organize',
      desc: 'Reorder, rotate, or remove unwanted pages inside your PDF.',
      path: '/pdf/rotate-pdf',
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B1221]/90 via-[#130d1a]/80 to-[#050B14]/90 border border-red-900/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_0_40px_rgba(239,68,68,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600/30 to-rose-900/30 border border-red-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(248,113,113,0.25)] shrink-0">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-300">
              CamTech PDF Tools
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              High-performance Stirling-PDF suite with 50+ tools for document editing, OCR, conversion, and optimization.
            </p>
          </div>
        </div>

        <a
          href="/pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 text-sm whitespace-nowrap cursor-pointer"
        >
          <span>Open Full Studio</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((t, idx) => (
          <div
            key={idx}
            style={{ animationDelay: `${idx * 40}ms` }}
            className="bg-gradient-to-b from-[#0B1221]/90 to-[#050B14]/90 border border-red-950/60 rounded-3xl p-6 hover:border-red-500/40 hover:shadow-[0_0_25px_rgba(239,68,68,0.12)] transition-all duration-300 backdrop-blur-md flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center mb-5 group-hover:border-red-500/40 group-hover:bg-red-950/60 transition-colors shadow-inner">
                {t.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-300 transition-colors">
                {t.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {t.desc}
              </p>
            </div>

            <a
              href={t.path}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-red-600/20 text-slate-300 hover:text-red-300 font-bold px-4 py-3 rounded-xl text-xs transition-all duration-300 border border-slate-800 hover:border-red-500/40 cursor-pointer shadow-sm"
            >
              <span>Launch Tool</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
