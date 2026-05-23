import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../utils/auth.utils'

const PublicRoute = ({ children }) => {
  const location = useLocation()

  // Check authentication synchronously - no loading state needed
  const authenticated = isAuthenticated()

  // Redirect to dashboard if already authenticated
  if (authenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }
  
  return children
}

export default PublicRoute



