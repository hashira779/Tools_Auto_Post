import React from 'react'

export default function PdfTools() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-900/30 border border-red-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(248,113,113,0.2)]">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-red-200">PDF Tools</h2>
            <p className="text-xs text-slate-500 mt-0.5">Process, merge, and convert PDF documents</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-gradient-to-r from-[#0B1221]/80 to-[#050B14]/80 border border-cyan-900/30 rounded-2xl p-6 hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(248,113,113,0.05)] transition-all duration-300">
          <h4 className="text-base font-bold text-white mb-2">Merge PDFs</h4>
          <p className="text-slate-400 text-sm mb-6">Combine multiple PDF documents into a single file easily.</p>
          <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-all duration-300 border border-slate-700">
            Open Tool
          </button>
        </div>
        <div className="bg-gradient-to-r from-[#0B1221]/80 to-[#050B14]/80 border border-cyan-900/30 rounded-2xl p-6 hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(248,113,113,0.05)] transition-all duration-300">
          <h4 className="text-base font-bold text-white mb-2">Compress PDF</h4>
          <p className="text-slate-400 text-sm mb-6">Reduce file size while optimizing for maximal PDF quality.</p>
          <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-all duration-300 border border-slate-700">
            Open Tool
          </button>
        </div>
        <div className="bg-gradient-to-r from-[#0B1221]/80 to-[#050B14]/80 border border-cyan-900/30 rounded-2xl p-6 hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(248,113,113,0.05)] transition-all duration-300">
          <h4 className="text-base font-bold text-white mb-2">PDF to Word</h4>
          <p className="text-slate-400 text-sm mb-6">Convert your PDF files to easy to edit DOC and DOCX documents.</p>
          <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-all duration-300 border border-slate-700">
            Open Tool
          </button>
        </div>
      </div>
    </div>
  )
}
