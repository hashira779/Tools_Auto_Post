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
    <div className="w-full max-w-5xl mx-auto flex flex-col h-[80vh] md:h-[85vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-[var(--color-border-2)] bg-[var(--color-surface-1)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--color-primary-400)] to-[var(--color-primary-600)] flex items-center justify-center text-white shadow-md">
            <span className="text-xl font-bold">C</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text)] tracking-wide">CamTech <span className="font-light">AI</span></h2>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-3)] font-medium mt-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Ollama Connected
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center px-4 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-4)] mr-2">Model:</span>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-transparent text-sm text-[var(--color-text-2)] font-medium outline-none cursor-pointer appearance-none pr-4"
              style={{ backgroundImage: 'none' }}
            >
              <option value="llama3.2">Llama 3.2</option>
              <option value="llama3.1">Llama 3.1</option>
              <option value="qwen2.5">Qwen 2.5</option>
            </select>
          </div>

          <button 
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-[var(--color-text-3)] hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-2.5 rounded-xl hover:bg-[var(--color-surface-3)]"
            title="Clear Conversation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[var(--color-surface-1)]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-4)] opacity-80 animate-fade-in">
            <div className="w-20 h-20 mb-6 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--color-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xl font-medium text-[var(--color-text-2)]">How can I assist you today?</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))
        )}
        {error && !messages.some(m => m.isError) && (
           <div className="text-center text-red-500 text-sm mx-auto max-w-md p-4 border border-red-200 bg-red-50 rounded-2xl shadow-sm">
             {error}
           </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-[var(--color-surface)] border-t border-[var(--color-border-2)]">
        <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message CamTech AI..."
            className="input-field w-full py-4 pl-6 pr-16 resize-none overflow-hidden text-[15px] leading-relaxed"
            rows={1}
            style={{
              height: '56px',
              minHeight: '56px',
              maxHeight: '120px',
              height: input ? Math.min(Math.max(input.split('\n').length * 24 + 32, 56), 120) + 'px' : '56px'
            }}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`absolute right-2 p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 z-10
              ${!input.trim() || loading 
                ? 'bg-[var(--color-surface-2)] text-[var(--color-text-4)] cursor-not-allowed' 
                : 'bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-500)] shadow-md hover:shadow-lg active:scale-95'
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
        <div className="text-center mt-3 text-[11px] text-[var(--color-text-4)] font-medium tracking-wide">
          AI can make mistakes. Verify important information.
        </div>
      </div>

    </div>
  )
}
