import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ContactList({ selectedContact, onContactSelect }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/chat/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Add AI Assistant as first contact
      const aiAssistant = {
        id: 'ai-assistant',
        username: 'AI Assistant',
        email: 'ai@nexial.com',
        isAI: true
      }
      
      setContacts([aiAssistant, ...response.data])
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">Loading contacts...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Contacts</h2>
      </div>
      
      <div className="overflow-y-auto">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onContactSelect(contact)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              selectedContact?.id === contact.id ? 'bg-gray-100' : ''
            }`}
          >
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                contact.isAI ? 'bg-blue-500' : 'bg-primary'
              }`}>
                {contact.isAI ? '🤖' : contact.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <div className="font-medium text-gray-900">
                  {contact.username}
                  {contact.isAI && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">AI</span>}
                </div>
                <div className="text-sm text-gray-500">{contact.email}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
