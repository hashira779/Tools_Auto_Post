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
          {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Tool Progress Indicators */}
                {message.toolProgress && message.toolProgress.map((prog, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-400 font-mono animate-fade-in">
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></span>
                    {prog}
                  </div>
                ))}
                
                {/* Actual Content */}
                {message.content ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : message.isStreaming ? (
                  <div className="flex items-center gap-1 h-6">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                ) : null}
              </div>
            )}
        </div>
      </div>

    </div>
  )
}
