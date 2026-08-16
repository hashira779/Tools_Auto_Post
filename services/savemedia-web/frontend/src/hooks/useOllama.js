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
    const assistantMsgIndex = messages.length + 1
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }])
    
    setLoading(true)
    setError(null)

    try {
      // The API endpoint is proxied by Nginx
      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          // Ollama streams JSON-lines
          const lines = chunk.split('\n').filter(line => line.trim() !== '')
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              if (data.message?.content) {
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: newMessages[newMessages.length - 1].content + data.message.content
                  }
                  return newMessages
                })
              }
            } catch (e) {
              console.error("Error parsing JSON line from stream:", line, e)
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
