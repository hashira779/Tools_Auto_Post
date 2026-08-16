import React from 'react'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div 
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-relaxed relative
          ${isUser 
            ? 'bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-500)] text-white rounded-br-sm' 
            : message.isError
              ? 'bg-red-500/10 text-red-500 border border-red-500/20 rounded-bl-sm'
              : 'bg-[var(--color-surface-2)] text-[var(--color-text-2)] border border-[var(--color-border)] rounded-bl-sm backdrop-blur-sm'
          }`}
      >
        {!isUser && !message.isError && (
          <div className="absolute -left-2 top-0 w-2 h-2 rounded-full bg-blue-400 opacity-50"></div>
        )}
        <div className="whitespace-pre-wrap font-sans">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current opacity-70 animate-pulse rounded-sm align-middle"></span>
          )}
        </div>
      </div>
    </div>
  )
}
