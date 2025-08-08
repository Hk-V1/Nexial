import { io } from 'socket.io-client'

let socket = null

export const initSocket = (token) => {
  if (socket) {
    socket.disconnect()
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    auth: {
      token: token
    }
  })

  socket.on('connect', () => {
    console.log('Connected to server')
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from server')
  })

  return socket
}

export const getSocket = () => socket
