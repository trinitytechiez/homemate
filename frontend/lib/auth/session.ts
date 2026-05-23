'use server'

import { cookies } from 'next/headers'
import type { Session } from '../types/auth'

const SESSION_COOKIE = 'homemate_session'
const TOKEN_COOKIE = 'homemate_token'

export async function setSession(token: string, user: any): Promise<void> {
  const cookieStore = await cookies()
  const session: Session = {
    token,
    user,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  })

  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60,
    path: '/',
  })
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE)

    if (!sessionCookie?.value) {
      return null
    }

    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_COOKIE)?.value || null
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_COOKIE)
  cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return !!token
}
