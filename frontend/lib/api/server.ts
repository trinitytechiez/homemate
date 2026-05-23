'use server'

import { getToken } from '../auth/session'

const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api'

export async function fetchFromServerAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()
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
    throw new Error(`API error: ${response.statusText}`)
  }

  return response.json()
}

export async function postToServerAPI<T>(
  endpoint: string,
  body: any
): Promise<T> {
  return fetchFromServerAPI<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function putToServerAPI<T>(
  endpoint: string,
  body: any
): Promise<T> {
  return fetchFromServerAPI<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteFromServerAPI<T>(endpoint: string): Promise<T> {
  return fetchFromServerAPI<T>(endpoint, {
    method: 'DELETE',
  })
}
