import React, { useState, useRef, useEffect } from 'react'
import { useOllama } from '../../hooks/useOllama'
import { useAuth } from '../../hooks/useAuth'
import ChatMessage from './ChatMessage'

export default function AIChatStudio() {
  const { user, loginWithGoogle, logout, loading: authLoading, session } = useAuth()
  const { messages, conversationId, loading, error, sendMessage, clearChat, loadConversation, fetchConversations, deleteConversation, uploadFile } = useOllama(session?.access_token)
  const [input, setInput] = useState('')
  const [model, setModel] = useState('llama3.2')
  const [aiMode, setAiMode] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState([])
  const [attachedFile, setAttachedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load chat history when authenticated or when conversation ID changes (new chat created)
  useEffect(() => {
    if (session?.access_token) {
      fetchConversations().then(setConversations)
    }
  }, [session, conversationId, fetchConversations])

  const handleConversationClick = (id) => {
    loadConversation(id)
  }

  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation()
    const success = await deleteConversation(id)
    if (success) {
      setConversations(prev => prev.filter(c => c.id !== id))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !loading && !isUploading) {
      let finalInput = input;
      if (attachedFile) {
        finalInput = `[Attached File: ${attachedFile.filepath}]\n\n${input}`;
        setAttachedFile(null); // Clear attachment after sending
      }
      sendMessage(finalInput, model)
      setInput('')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      try {
        const result = await uploadFile(file)
        setAttachedFile(result)
      } catch (err) {
        alert("Failed to upload file: " + err.message)
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (authLoading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] bg-white flex items-center justify-center">
        <svg className="w-10 h-10 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="black" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 sm:p-12 flex flex-col items-center text-center animate-slide-up border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center shadow-lg mb-6">
            <span className="text-3xl font-bold text-white">C</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">CAMTECH AI</h1>
          <p className="text-gray-500 mb-10 text-lg leading-relaxed">
            Sign in to start chatting.<br/>
            <span className="text-sm">Your account lets CAMTECH securely save your conversations and AI history.</span>
          </p>
          <button 
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    )
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
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-hide">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Your Conversations</h3>
            {conversations.length === 0 ? (
               <div className="text-sm text-gray-500 px-2 italic">No previous chats.</div>
            ) : (
               conversations.map(conv => (
                 <div key={conv.id} className={`group flex items-center justify-between w-full px-2 py-2 text-sm rounded-md transition-colors ${conversationId === conv.id ? 'bg-gray-200 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-200'}`}>
                   <button 
                     onClick={() => handleConversationClick(conv.id)}
                     className="flex-1 text-left truncate pr-2"
                   >
                     {conv.title || 'New Conversation'}
                   </button>
                   <button 
                     onClick={(e) => handleDeleteConversation(e, conv.id)}
                     className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                     title="Delete Chat"
                   >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </button>
                 </div>
               ))
            )}
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2 border-t border-gray-200">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-gray-700 truncate">{user.user_metadata?.full_name || user.email}</p>
            </div>
            <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 transition-colors" title="Sign out">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
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
              <h1 className="text-3xl font-semibold mb-2">Hello, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}</h1>
              <p className="text-gray-500">How can I help you today?</p>
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
          {/* File Attachment Pill */}
          {attachedFile && (
            <div className="absolute -top-12 left-2 flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-full text-sm animate-fade-in">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-gray-700 font-medium truncate max-w-[200px]">{attachedFile.filename}</span>
              <button 
                onClick={() => setAttachedFile(null)}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {isUploading && (
            <div className="absolute -top-12 left-2 flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-full text-sm animate-fade-in">
              <svg className="w-4 h-4 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-700 font-medium">Uploading...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-center bg-gray-50 border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow px-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
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
              disabled={!input.trim() || loading || isUploading}
              className={`p-2 rounded-full flex items-center justify-center transition-all duration-200 z-10 mr-1
                ${!input.trim() || loading || isUploading
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
