'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()

  const logout = useCallback(async () => {
    // Call logout API to clear server session
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch {
      // Continue with redirect even if API call fails
    }

    // Clear localStorage fallback
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }

    // Redirect to login
    router.push('/login')
    router.refresh()
  }, [router])

  const redirectToLogin = useCallback(() => {
    router.push('/login')
  }, [router])

  return {
    logout,
    redirectToLogin,
    currentPath: pathname,
  }
}

export function getClientToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('token')
}

export function setClientToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem('token', token)
}

export function clearClientToken(): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem('token')
}

export function isAuthenticatedClient(): boolean {
  return getClientToken() !== null
}
