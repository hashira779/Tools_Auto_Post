import React from 'react'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up mb-6`}>
      
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary-100)] mr-3 mt-0.5 shadow-sm">
          <div className="w-full h-full rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-[var(--color-primary-600)]">C</span>
          </div>
        </div>
      )}

      <div className="flex flex-col max-w-[85%] sm:max-w-[75%]">
        <div 
          className={`px-5 py-4 text-[15px] leading-relaxed relative font-sans
            ${isUser 
              ? 'rounded-2xl rounded-tr-sm bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-500)] text-white shadow-md' 
              : message.isError
                ? 'rounded-2xl rounded-tl-sm bg-red-50 text-red-600 border border-red-200'
                : 'rounded-2xl rounded-tl-sm bg-[var(--color-surface)] text-[var(--color-text-2)] border border-[var(--color-border-2)] shadow-sm'
            }`}
        >
          <div className="whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current opacity-70 animate-pulse rounded-sm align-middle"></span>
            )}
          </div>
        </div>
        
        <div className={`text-[10px] text-[var(--color-text-4)] mt-1.5 font-medium tracking-wide ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
          {isUser ? 'User' : 'CamTech AI'}
        </div>
      </div>

    </div>
  )
}
