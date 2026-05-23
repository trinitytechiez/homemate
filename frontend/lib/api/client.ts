'use client'

import axios from 'axios'
import { getClientToken, clearClientToken } from '../auth/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = getClientToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      clearClientToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export async function fetchFromAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getClientToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (options.headers && typeof options.headers === 'object') {
    Object.assign(headers, options.headers)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearClientToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}
