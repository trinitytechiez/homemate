'use server'

import { redirect } from 'next/navigation'
import { setSession, clearSession, getSession } from '@/lib/auth/session'
import { postToServerAPI } from '@/lib/api/server'
import type { AuthResponse } from '@/lib/types/auth'

export async function loginAction(email: string, password: string) {
  try {
    const response = await postToServerAPI<AuthResponse>('/auth/login', {
      email,
      password,
    })

    await setSession(response.token, response.user)
    redirect('/dashboard')
  } catch (error) {
    return { error: 'Login failed. Please check your credentials.' }
  }
}

export async function registerAction(data: {
  email: string
  name: string
  password: string
}) {
  try {
    const response = await postToServerAPI<AuthResponse>('/auth/register', data)
    await setSession(response.token, response.user)
    redirect('/dashboard')
  } catch (error) {
    return { error: 'Registration failed. Please try again.' }
  }
}

export async function setPasswordAction(token: string, password: string) {
  try {
    const response = await postToServerAPI<AuthResponse>('/auth/set-password', {
      token,
      password,
    })
    await setSession(response.token, response.user)
    redirect('/dashboard')
  } catch (error) {
    return { error: 'Failed to set password.' }
  }
}

export async function logoutAction() {
  await clearSession()
  redirect('/login')
}

export async function verifyOtpAction(email: string, otp: string) {
  try {
    const response = await postToServerAPI<{ verified: boolean }>('/auth/verify-otp', {
      email,
      otp,
    })
    return { verified: response.verified }
  } catch (error) {
    return { error: 'OTP verification failed.' }
  }
}

export async function sendOtpAction(email: string) {
  try {
    await postToServerAPI('/auth/send-otp', { email })
    return { success: true }
  } catch (error) {
    return { error: 'Failed to send OTP.' }
  }
}

export async function getSessionAction() {
  const session = await getSession()
  return session
}
