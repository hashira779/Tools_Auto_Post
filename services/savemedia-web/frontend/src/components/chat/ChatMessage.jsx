import React from 'react'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in mb-6`}>
      
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 p-[1px] mr-4 mt-1 shadow-[0_0_10px_rgba(59,130,246,0.5)]">
          <div className="w-full h-full rounded-full bg-[#0B0F19] flex items-center justify-center">
            <span className="text-xs font-bold bg-gradient-to-tr from-cyan-400 to-purple-500 bg-clip-text text-transparent">C</span>
          </div>
        </div>
      )}

      <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
        <div 
          className={`px-5 py-4 text-[15px] leading-relaxed relative font-sans
            ${isUser 
              ? 'rounded-3xl rounded-br-sm bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(79,70,229,0.25)] border border-white/10' 
              : message.isError
                ? 'rounded-3xl rounded-bl-sm bg-red-500/10 text-red-400 border border-red-500/20 backdrop-blur-md'
                : 'rounded-3xl rounded-bl-sm bg-white/5 text-gray-100 border border-white/10 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]'
            }`}
        >
          <div className="whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 opacity-80 animate-pulse rounded-sm align-middle shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            )}
          </div>
        </div>
        
        <div className={`text-[10px] text-gray-500 mt-1.5 font-medium tracking-wide ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
          {isUser ? 'User' : 'AI'} • Just now
        </div>
      </div>

    </div>
  )
}
