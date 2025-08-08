import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ChatInput from './ChatInput'
import { getSocket } from '../utils/socket'

export default function ChatBox({ contact, currentUser }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (contact.isAI) {
      // Load AI chat history from localStorage
      const aiHistory = localStorage.getItem('ai-chat-history')
      if (aiHistory) {
        setMessages(JSON.parse(aiHistory))
      } else {
        setMessages([])
      }
    } else {
      fetchMessages()
    }

    // Socket listeners
    const socket = getSocket()
    if (socket && !contact.isAI) {
      socket.on('new_message', handleNewMessage)
      
      return () => {
        socket.off('new_message', handleNewMessage)
      }
    }
  }, [contact])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNewMessage = (message) => {
    if (message.sender_id === contact.id || message.receiver_id === contact.id) {
      setMessages(prev => [...prev, message])
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/messages/${contact.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessages(response.data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async (content) => {
    if (!content.trim()) return

    const newMessage = {
      id: Date.now(),
      content,
      sender_id: currentUser.id,
      receiver_id: contact.id,
      timestamp: new Date().toISOString(),
      sender: currentUser
    }

    if (contact.isAI) {
      // Add user message to AI chat
      setMessages(prev => [...prev, newMessage])
      setLoading(true)

      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/assistant`,
          { message: content },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        const aiResponse = {
          id: Date.now() + 1,
          content: response.data.response,
          sender_id: 'ai-assistant',
          receiver_id: currentUser.id,
          timestamp: new Date().toISOString(),
          sender: contact
        }

        const updatedMessages = [...messages, newMessage, aiResponse]
        setMessages(updatedMessages)
        
        // Save to localStorage
        localStorage.setItem('ai-chat-history', JSON.stringify(updatedMessages))
      } catch (error) {
        console.error('AI Assistant error:', error)
        const errorMessage = {
          id: Date.now() + 1,
          content: 'Sorry, I encountered an error. Please try again.',
          sender_id: 'ai-assistant',
          receiver_id: currentUser.id,
          timestamp: new Date().toISOString(),
          sender: contact
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setLoading(false)
      }
    } else {
      // Send regular message
      try {
        const token = localStorage.getItem('token')
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/send`,
          {
            receiver_id: contact.id,
            content
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        setMessages(prev => [...prev, newMessage])
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="bg-gray-100 p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
            contact.isAI ? 'bg-blue-500' : 'bg-primary'
          }`}>
            {contact.isAI ? '🤖' : contact.username.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <div className="font-medium text-gray-900">
              {contact.username}
              {contact.isAI && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">AI Assistant</span>}
            </div>
            <div className="text-sm text-gray-500">
              {contact.isAI ? 'Always available' : 'Online'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && !loading ? (
          <div className="text-center text-gray-500 mt-8">
            {contact.isAI ? 'Start a conversation with AI Assistant' : 'No messages yet. Start the conversation!'}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === currentUser.id
                    ? 'bg-primary text-white'
                    : contact.isAI
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-white text-gray-900'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.sender_id === currentUser.id ? 'text-green-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-blue-100 text-blue-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center">
                <div className="animate-pulse">AI is thinking...</div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
    </div>
  )
}
