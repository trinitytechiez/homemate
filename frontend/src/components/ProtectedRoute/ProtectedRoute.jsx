import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import Shimmer from '../Shimmer'
import { isAuthenticated, clearAuth } from '../../utils/auth.utils'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const [authStatus, setAuthStatus] = useState(null)

  // Check auth synchronously first for instant response
  const initialAuth = useMemo(() => {
    try {
      return isAuthenticated()
    } catch (error) {
      return false
    }
  }, [])

  useEffect(() => {
    // If already authenticated, set immediately
    if (initialAuth) {
      setAuthStatus(true)
      return
    }

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

    // Check immediately
    checkAuth()
    
    const timeoutId = setTimeout(checkAuth, 50) // Reduced timeout
    
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
  }, [initialAuth])

  if (authStatus === null) {
    // Show shimmer instead of full screen loader for better UX
    return <Shimmer variant="dashboard" count={3} />
  }

  if (!authStatus) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

export default ProtectedRoute

