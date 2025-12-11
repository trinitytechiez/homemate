import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Loader from '../Loader'
import { isAuthenticated, clearAuth } from '../../utils/auth.utils'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const [authStatus, setAuthStatus] = useState(null)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = isAuthenticated()
        if (!authenticated) {
          clearAuth()
        }
        setAuthStatus(authenticated)
      } catch (error) {
        console.error('Token validation error:', error)
        clearAuth()
        setAuthStatus(false)
      }
    }

    checkAuth()
    
    const timeoutId = setTimeout(checkAuth, 100)
    
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === null) {
        checkAuth()
      }
    }
    
    const handleAuthChange = () => checkAuth()
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('logout', handleAuthChange)
    window.addEventListener('login', handleAuthChange)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('logout', handleAuthChange)
      window.removeEventListener('login', handleAuthChange)
    }
  }, [])

  if (authStatus === null) {
    return <Loader fullScreen text="Checking authentication..." />
  }

  if (!authStatus) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

export default ProtectedRoute

