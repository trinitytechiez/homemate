import axios from 'axios'
import { clearAuth } from './auth.utils'

// Get API URL from environment variable or use default
const getApiUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // In production (deployed)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // If we're on Vercel, try using a relative path /api
    // This works if the project is configured as a monorepo with routes
    console.warn('⚠️ VITE_API_URL is not set! Using relative /api fallback.')
    return '/api'
  }
  
  // Development - use localhost
  return 'http://localhost:5001/api'
}

const API_URL = getApiUrl()

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Handle response errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Don't handle cancelled requests
    if (error.code === 'ERR_CANCELED' || error.message === 'canceled' || error.name === 'AbortError') {
      return Promise.reject(error)
    }

    // Log error responses
    console.error('API Error:', {
      status: error.response?.status,
      message: error.message
    })

    if (error.response?.status === 401) {
      // Clear auth state and dispatch logout so app-wide listeners redirect to login
      clearAuth()
    }
    return Promise.reject(error)
  }
)

export default api

