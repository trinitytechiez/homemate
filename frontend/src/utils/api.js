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

// Always log API URL for debugging (helps identify caching issues)
console.log('🔗 API URL configured:', API_URL)
console.log('🔗 VITE_API_URL env var:', import.meta.env.VITE_API_URL || 'NOT SET')
console.log('🔗 Current hostname:', window.location.hostname)

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
    
    // If signal is provided, use it for cancellation
    // Otherwise, create a new AbortController if not already present
    if (!config.signal && !config.signal?.aborted) {
      // Signal will be provided by components using useRequestCancellation
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        cancelled: config.signal?.aborted || false
      })
    }
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log('📥 API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      })
    }
    return response
  },
  (error) => {
    // Don't log or handle cancelled requests
    if (error.code === 'ERR_CANCELED' || error.message === 'canceled' || error.name === 'AbortError') {
      if (import.meta.env.DEV) {
        console.log('🚫 Request cancelled:', error.config?.url)
      }
      return Promise.reject(error)
    }
    
    // Log error responses
    console.error('📥 API Error Response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      message: error.message,
      data: error.response?.data
    })
    
    // Check for network errors (no response)
    if (!error.response) {
      console.error('🌐 Network Error - No response from server:', {
        message: error.message,
        code: error.code,
        config: error.config
      })
    }
    
    if (error.response?.status === 401) {
      // Clear auth state and dispatch logout so app-wide listeners redirect to login
      clearAuth()
    }
    return Promise.reject(error)
  }
)

export default api

