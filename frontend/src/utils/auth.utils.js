// Authentication utility functions for frontend

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  try {
    const token = localStorage.getItem('token')
    return token && token.trim().length > 0
  } catch (error) {
    console.error('Token check error:', error)
    return false
  }
}

/**
 * Get authentication token
 * @returns {string|null} Token or null
 */
export const getToken = () => {
  return localStorage.getItem('token')
}

/**
 * Clear authentication token
 */
export const clearAuth = () => {
  localStorage.removeItem('token')
  // Dispatch logout asynchronously to avoid synchronous event re-entry
  // which can trigger handlers that call `clearAuth` again and cause
  // a synchronous infinite recursion (maximum call stack exceeded).
  setTimeout(() => window.dispatchEvent(new Event('logout')), 0)
}

/**
 * Set authentication token
 * @param {string} token - JWT token
 */
export const setAuth = (token) => {
  localStorage.setItem('token', token)
  // Dispatch login asynchronously for symmetry and to avoid re-entrancy
  setTimeout(() => window.dispatchEvent(new Event('login')), 0)
}

