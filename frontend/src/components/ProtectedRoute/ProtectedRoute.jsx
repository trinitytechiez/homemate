import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Loader from '../Loader/Loader'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(null)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setIsAuthenticated(false)
        return
      }

      // Basic token validation - check if it exists and is not empty
      // For production, you might want to decode and check expiration
      try {
        // Simple check - token should be a non-empty string
        if (token && token.trim().length > 0) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setIsAuthenticated(false)
        localStorage.removeItem('token')
      }
    }

    // Immediate check
    checkAuth()
    
    // Also check after a small delay to catch token updates
    // This helps with race conditions when token is set right before navigation
    const timeoutId = setTimeout(() => {
      checkAuth()
    }, 100)
    
    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === null) {
        checkAuth()
      }
    }
    
    // Listen for custom logout events
    const handleLogout = () => {
      setIsAuthenticated(false)
    }
    
    // Listen for custom login events
    const handleLogin = () => {
      checkAuth()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('logout', handleLogout)
    window.addEventListener('login', handleLogin)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('logout', handleLogout)
      window.removeEventListener('login', handleLogin)
    }
  }, [])

  // Show loader while checking authentication
  if (isAuthenticated === null) {
    return <Loader fullScreen text="Checking authentication..." />
  }

  // Redirect to login if not authenticated, preserving the attempted route
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

export default ProtectedRoute

