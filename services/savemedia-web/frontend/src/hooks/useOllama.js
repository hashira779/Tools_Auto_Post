import { useState, useCallback } from 'react'

export function useOllama(accessToken = null) {
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
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
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          model,
          conversation_id: conversationId,
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
                
                if (data.type === 'meta' && data.conversation_id) {
                  setConversationId(data.conversation_id)
                } else if (data.type === 'chunk') {
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
  }, [messages, accessToken, conversationId])

  const clearChat = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  const loadConversation = useCallback(async (id) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai/conversations/${id}/messages`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error('Failed to load conversation');
      const data = await response.json();
      setConversationId(id);
      setMessages(data.map(m => ({ role: m.role, content: m.content })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const fetchConversations = useCallback(async () => {
    if (!accessToken) return [];
    try {
      const response = await fetch('/api/ai/conversations', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return await response.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [accessToken]);

  const deleteConversation = useCallback(async (id) => {
    if (!accessToken) return false;
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok && conversationId === id) {
        clearChat();
      }
      return response.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [accessToken, conversationId, clearChat]);

  const uploadFile = useCallback(async (file) => {
    if (!accessToken) throw new Error("Must be logged in to upload files.");
    const formData = new FormData();
    formData.append("file", file);
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  return {
    messages,
    conversationId,
    loading,
    error,
    sendMessage,
    clearChat,
    loadConversation,
    fetchConversations,
    deleteConversation,
    uploadFile
  }
}
