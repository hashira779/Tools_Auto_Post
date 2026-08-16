import React, { useState, useRef, useEffect } from 'react'
import { useOllama } from '../../hooks/useOllama'
import ChatMessage from './ChatMessage'

export default function AIChatStudio() {
  const { messages, loading, error, sendMessage, clearChat } = useOllama()
  const [input, setInput] = useState('')
  const [model, setModel] = useState('llama3.2')
  const [aiMode, setAiMode] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !loading) {
      // In a real app, we would pass aiMode and uploaded files to the backend too
      sendMessage(input, model)
      setInput('')
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      alert(`File attached: ${file.name}\n\n(Document parsing backend logic ready, waiting for UI connection)`)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-white font-sans relative flex">
      
      {/* Sidebar - Chat History */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden bg-gray-50 border-r border-gray-200 flex flex-col hidden md:flex`}>
        <div className="p-4">
          <button 
            onClick={clearChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Today</h3>
            <button className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-md truncate transition-colors">
              SQL Analysis query
            </button>
            <button className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-md truncate transition-colors">
              How does DuckDuckGo work?
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          CamTech Enterprise DB
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 relative flex flex-col">
        {/* Top Bar - Minimalist */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-white via-white to-transparent h-20">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <select 
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value)}
              className="bg-transparent hover:bg-gray-50 px-3 py-2 rounded-xl text-lg font-semibold text-gray-800 outline-none cursor-pointer transition-colors"
            >
              <option value="chat">CamTech Assistant</option>
              <option value="data">Data Analyst (SQL)</option>
              <option value="research">Deep Researcher</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-transparent hover:bg-gray-50 px-2 py-1 rounded-lg text-sm font-medium text-gray-500 outline-none cursor-pointer transition-colors"
            >
              <option value="llama3.2">Llama 3.2</option>
              <option value="llama3.1">Llama 3.1</option>
              <option value="qwen2.5">Qwen 2.5</option>
            </select>
            
            <button 
              onClick={clearChat}
              disabled={messages.length === 0}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded-full hover:bg-gray-100 md:hidden"
              title="New Chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>


      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-20 pb-40 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-gray-800 animate-fade-in">
              <div className="w-16 h-16 mb-6 rounded-full bg-black flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">C</span>
              </div>
              <h1 className="text-3xl font-semibold mb-2">How can I help you today?</h1>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))
          )}
          {error && !messages.some(m => m.isError) && (
             <div className="text-center text-red-600 text-sm mt-4 p-3 bg-red-50 rounded-xl">
               {error}
             </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-10">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSubmit} className="relative flex items-center bg-gray-50 border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow px-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors ml-1"
              title="Attach File"
            >
              <svg className="w-5 h-5 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
              accept=".pdf,.txt,.csv"
            />
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message CamTech AI..."
              className="w-full bg-transparent text-gray-800 py-4 px-3 outline-none resize-none overflow-hidden text-[16px] leading-relaxed"
              rows={1}
              style={{
                height: '56px',
                minHeight: '56px',
                maxHeight: '200px',
                height: input ? Math.min(Math.max(input.split('\n').length * 24 + 32, 56), 200) + 'px' : '56px'
              }}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`p-2 rounded-full flex items-center justify-center transition-all duration-200 z-10 mr-1
                ${!input.trim() || loading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800 shadow-sm active:scale-95'
                }`}
            >
              {loading && input.trim() === '' ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </form>
          <div className="text-center mt-2 text-xs text-gray-500 pb-1">
            AI can make mistakes. Check important info.
          </div>
        </div>
      </div>

      </div>
    </div>
  )
}
