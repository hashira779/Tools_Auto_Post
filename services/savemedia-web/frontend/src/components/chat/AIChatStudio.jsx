import React, { useState, useRef, useEffect } from 'react'
import { useOllama } from '../../hooks/useOllama'
import ChatMessage from './ChatMessage'

export default function AIChatStudio() {
  const { messages, loading, error, sendMessage, clearChat } = useOllama()
  const [input, setInput] = useState('')
  const [model, setModel] = useState('llama3.2')
  
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !loading) {
      sendMessage(input, model)
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-[80vh] md:h-[85vh] 
                    bg-gradient-to-br from-[#0B0F19] to-[#04060A] 
                    border border-purple-500/20 rounded-3xl shadow-[0_0_40px_rgba(139,92,246,0.1)] 
                    overflow-hidden relative animate-fade-in font-sans">
      
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 p-[1px] shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <div className="w-full h-full rounded-2xl bg-[#0B0F19] flex items-center justify-center">
              <span className="text-xl font-bold bg-gradient-to-tr from-cyan-400 to-purple-500 bg-clip-text text-transparent">C</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">COGNIS <span className="font-light">AI</span></h2>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Status: Online
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-xs text-gray-400 mr-2">Model:</span>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-transparent text-sm text-gray-200 font-medium outline-none cursor-pointer appearance-none pr-4"
              style={{ backgroundImage: 'none' }}
            >
              <option className="bg-[#0B0F19]" value="llama3.2">Llama 3.2</option>
              <option className="bg-[#0B0F19]" value="llama3.1">Llama 3.1</option>
              <option className="bg-[#0B0F19]" value="qwen2.5">Qwen 2.5</option>
            </select>
          </div>

          <button 
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-2.5 rounded-xl hover:bg-white/5 backdrop-blur-md"
            title="Clear Conversation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-80 animate-pulse-slow">
            <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-tr from-cyan-400/20 to-purple-500/20 flex items-center justify-center blur-sm absolute"></div>
            <svg className="w-16 h-16 mb-6 text-cyan-400/50 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-xl font-light text-gray-300">How can I assist you today?</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))
        )}
        {error && !messages.some(m => m.isError) && (
           <div className="text-center text-red-400 text-sm mx-auto max-w-md p-4 border border-red-500/20 bg-red-500/10 rounded-2xl backdrop-blur-md">
             {error}
           </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-6 bg-gradient-to-t from-[#04060A] to-transparent">
        <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto">
          <div className="relative w-full group">
            {/* Glowing border effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-3xl opacity-30 group-hover:opacity-60 transition duration-500 blur-[2px]"></div>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="relative w-full bg-[#0B0F19]/90 backdrop-blur-xl text-gray-100 rounded-3xl py-4 pl-6 pr-16 outline-none resize-none scrollbar-hide text-[15px] leading-relaxed transition-all placeholder-gray-500"
              rows={1}
              style={{
                height: '56px',
                minHeight: '56px',
                maxHeight: '120px',
                height: input ? Math.min(Math.max(input.split('\n').length * 24 + 32, 56), 120) + 'px' : '56px'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`absolute right-2 p-2.5 rounded-full flex items-center justify-center transition-all duration-300 z-10
              ${!input.trim() || loading 
                ? 'bg-transparent text-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-[0_0_15px_rgba(56,189,248,0.5)] hover:scale-105 active:scale-95'
              }`}
          >
            {loading && input.trim() === '' ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
      </div>

    </div>
  )
}
