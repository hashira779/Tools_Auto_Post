import { useState, useCallback } from 'react'

export function useOllama() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendMessage = useCallback(async (content, model = 'llama3.2') => {
    if (!content.trim()) return

    // Add user message immediately
    const userMsg = { role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    
    // Add an empty assistant message that we will stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true, toolProgress: [] }])
    
    setLoading(true)
    setError(null)

    try {
      // Connect to the new AI Orchestrator API
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      let buffer = ''

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          buffer += decoder.decode(value, { stream: true })
          
          // Split by SSE double newline
          const parts = buffer.split('\n\n')
          buffer = parts.pop() // keep the last incomplete part in the buffer
          
          for (const part of parts) {
            if (part.startsWith('data: ')) {
              const dataStr = part.slice(6)
              try {
                const data = JSON.parse(dataStr)
                
                if (data.type === 'chunk') {
                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: newMessages[newMessages.length - 1].content + data.content
                    }
                    return newMessages
                  })
                } else if (data.type === 'progress') {
                  setMessages(prev => {
                    const newMessages = [...prev]
                    const toolProgs = newMessages[newMessages.length - 1].toolProgress || []
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      toolProgress: [...toolProgs, data.content]
                    }
                    return newMessages
                  })
                } else if (data.type === 'error') {
                  throw new Error(data.content)
                } else if (data.type === 'done') {
                  // finished
                }
              } catch (e) {
                console.error("Error parsing SSE JSON:", dataStr, e)
              }
            }
          }
        }
      }
      
      // Remove streaming flag
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          isStreaming: false
        }
        return newMessages
      })
      
    } catch (err) {
      setError(err.message)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          isError: true,
          isStreaming: false
        }
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }, [messages])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat
  }
}
