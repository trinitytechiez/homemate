'use server'

import { revalidatePath } from 'next/cache'
import { fetchFromServerAPI, putToServerAPI } from '@/lib/api/server'
import { getSession } from '@/lib/auth/session'

export interface UserProfile {
  id: string
  name: string
  email: string
  mobileNumber: string
  role: string
  [key: string]: any
}

export async function getUserProfile() {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const data = await fetchFromServerAPI<UserProfile>('/user/profile')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch profile' }
  }
}

export async function updateUserProfile(data: Partial<UserProfile>) {
  try {
    const response = await putToServerAPI<UserProfile>('/user/profile', data)
    revalidatePath('/profile')
    return { success: true, data: response }
  } catch (error) {
    return { success: false, error: 'Failed to update profile' }
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  try {
    await putToServerAPI('/user/change-password', {
      currentPassword,
      newPassword,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to change password' }
  }
}

export async function deleteAccount(password: string) {
  try {
    await fetchFromServerAPI('/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
      headers: { 'Content-Type': 'application/json' },
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete account' }
  }
}
