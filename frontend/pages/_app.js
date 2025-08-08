import '../styles/globals.css'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    // Check auth on protected routes
    const token = localStorage.getItem('token')
    const publicRoutes = ['/login', '/register']
    
    if (!token && !publicRoutes.includes(router.pathname)) {
      router.push('/login')
    }
  }, [router.pathname])

  return <Component {...pageProps} />
}
