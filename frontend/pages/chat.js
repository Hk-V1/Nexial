import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import ContactList from '../components/ContactList'
import ChatBox from '../components/ChatBox'
import { initSocket, getSocket } from '../utils/socket'

export default function Chat() {
  const [selectedContact, setSelectedContact] = useState(null)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token) {
      router.push('/login')
      return
    }

    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      initSocket(token)
    }

    return () => {
      const socket = getSocket()
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    const socket = getSocket()
    if (socket) {
      socket.disconnect()
    }
    router.push('/login')
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="flex-1 flex">
        <div className="w-1/3 border-r border-gray-300">
          <ContactList 
            selectedContact={selectedContact}
            onContactSelect={setSelectedContact}
          />
        </div>
        
        <div className="flex-1">
          {selectedContact ? (
            <ChatBox 
              contact={selectedContact}
              currentUser={user}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <h3 className="text-xl text-gray-600 mb-2">Welcome to Nexial</h3>
                <p className="text-gray-500">Select a contact to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
