import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { isAuthenticated, clearAuth } from '../../utils/auth.utils'

const PublicRoute = ({ children }) => {
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
  }, [])

  // Show nothing while checking (prevents flash of content)
  if (authStatus === null) {
    return null
  }

  // Redirect to dashboard if already authenticated
  if (authStatus) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }
  
  return children
}

export default PublicRoute



