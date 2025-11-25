import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const PublicRoute = ({ children }) => {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(null)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setIsAuthenticated(false)
        return
      }

      // Basic token validation
      try {
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

    checkAuth()
  }, [])

  // Show nothing while checking (prevents flash of content)
  if (isAuthenticated === null) {
    return null
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }
  
  return children
}

export default PublicRoute

