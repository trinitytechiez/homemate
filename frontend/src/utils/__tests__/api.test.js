import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import api from '../api'

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: {
        use: vi.fn()
      },
      response: {
        use: vi.fn()
      }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
  return {
    default: mockAxios
  }
})

describe('API Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates axios instance with correct base URL', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.stringContaining('/api'),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )
  })

  it('adds authorization header when token exists', () => {
    localStorage.setItem('token', 'test-token')
    
    // Re-import to trigger interceptor setup
    vi.resetModules()
    require('../api')
    
    // Get the request interceptor
    const requestInterceptor = axios.interceptors.request.use.mock.calls[0][0]
    const config = { headers: {} }
    
    const result = requestInterceptor(config)
    
    expect(result.headers.Authorization).toBe('Bearer test-token')
  })

  it('does not add authorization header when token does not exist', () => {
    localStorage.removeItem('token')
    
    // Re-import to trigger interceptor setup
    vi.resetModules()
    require('../api')
    
    // Get the request interceptor
    const requestInterceptor = axios.interceptors.request.use.mock.calls[0][0]
    const config = { headers: {} }
    
    const result = requestInterceptor(config)
    
    expect(result.headers.Authorization).toBeUndefined()
  })

  it('handles 401 response by clearing token and redirecting', () => {
    const mockWindowLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockWindowLocation,
      writable: true
    })
    
    localStorage.setItem('token', 'test-token')
    
    // Re-import to trigger interceptor setup
    vi.resetModules()
    require('../api')
    
    // Get the response interceptor error handler
    const responseInterceptor = axios.interceptors.response.use.mock.calls[0][1]
    const error = {
      response: {
        status: 401
      }
    }
    
    responseInterceptor(error)
    
    expect(localStorage.getItem('token')).toBeNull()
    expect(mockWindowLocation.href).toBe('/login')
  })

  it('does not redirect on non-401 errors', () => {
    const mockWindowLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockWindowLocation,
      writable: true
    })
    
    localStorage.setItem('token', 'test-token')
    
    // Re-import to trigger interceptor setup
    vi.resetModules()
    require('../api')
    
    // Get the response interceptor error handler
    const responseInterceptor = axios.interceptors.response.use.mock.calls[0][1]
    const error = {
      response: {
        status: 500
      }
    }
    
    responseInterceptor(error)
    
    expect(localStorage.getItem('token')).toBe('test-token')
    expect(mockWindowLocation.href).toBe('')
  })
})

