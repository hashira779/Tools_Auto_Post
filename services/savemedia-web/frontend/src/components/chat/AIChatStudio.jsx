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
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[75vh] md:h-[80vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden glassmorphism animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-2)] bg-[var(--color-surface-2)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">CamTech AI</h2>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-3)] font-medium mt-0.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Ollama Connected
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text)] focus-ring cursor-pointer outline-none transition-colors hover:bg-[var(--color-surface-4)]"
          >
            <option value="llama3.2">Llama 3.2 (Fast)</option>
            <option value="llama3.1">Llama 3.1 (Capable)</option>
            <option value="qwen2.5">Qwen 2.5 (Coding)</option>
          </select>

          <button 
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-[var(--color-text-3)] hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg hover:bg-[var(--color-surface-3)]"
            title="Clear Chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-3)] opacity-60">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg">How can I help you today?</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))
        )}
        {error && !messages.some(m => m.isError) && (
           <div className="text-center text-red-500 text-sm mt-4 p-3 bg-red-500/10 rounded-lg">
             {error}
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--color-surface-2)] border-t border-[var(--color-border-2)]">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message CamTech AI..."
            className="w-full bg-[var(--color-surface-3)] text-[var(--color-text)] border border-[var(--color-border)] rounded-2xl py-3.5 pl-5 pr-14 outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all resize-none min-h-[54px] max-h-32 scrollbar-thin"
            rows={1}
            style={{
              height: input ? 'auto' : '54px',
              height: Math.min(Math.max(input.split('\n').length * 24 + 30, 54), 128) + 'px'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`absolute right-2 bottom-2 p-2 rounded-xl flex items-center justify-center transition-all
              ${!input.trim() || loading 
                ? 'bg-transparent text-[var(--color-text-4)] cursor-not-allowed' 
                : 'bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-500)] hover:scale-105 active:scale-95 shadow-md'
              }`}
          >
            {loading && input.trim() === '' ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
        <div className="text-center mt-2 text-[11px] text-[var(--color-text-4)]">
          AI can make mistakes. Verify important information.
        </div>
      </div>

    </div>
  )
}
