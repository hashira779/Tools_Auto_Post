import React from 'react'

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up mb-6`}>
      
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black mr-4 mt-0.5 flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-bold text-white">C</span>
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'max-w-[70%]' : 'max-w-[100%] w-full'}`}>
        <div 
          className={`text-[16px] leading-relaxed relative font-sans
            ${isUser 
              ? 'px-5 py-3 rounded-3xl bg-gray-100 text-gray-900' 
              : message.isError
                ? 'px-4 py-3 rounded-2xl bg-red-50 text-red-600'
                : 'py-1 text-gray-800'
            }`}
        >
          <div className="whitespace-pre-wrap font-[400]">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-black opacity-40 animate-pulse rounded-sm align-middle"></span>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
