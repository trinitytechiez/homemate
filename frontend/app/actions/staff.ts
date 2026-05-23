'use server'

import { revalidatePath } from 'next/cache'
import {
  fetchFromServerAPI,
  postToServerAPI,
  putToServerAPI,
  deleteFromServerAPI,
} from '@/lib/api/server'

export interface StaffMember {
  id: string
  name: string
  email: string
  mobileNumber: string
  position: string
  department: string
  status: 'active' | 'inactive'
  [key: string]: any
}

export async function getStaffList() {
  try {
    const data = await fetchFromServerAPI<StaffMember[]>('/staff')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch staff list' }
  }
}

export async function getStaffMember(id: string) {
  try {
    const data = await fetchFromServerAPI<StaffMember>(`/staff/${id}`)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch staff member' }
  }
}

export async function createStaffMember(data: Omit<StaffMember, 'id'>) {
  try {
    const response = await postToServerAPI<StaffMember>('/staff', data)
    revalidatePath('/staff')
    return { success: true, data: response }
  } catch (error) {
    return { success: false, error: 'Failed to create staff member' }
  }
}

export async function updateStaffMember(id: string, data: Partial<StaffMember>) {
  try {
    const response = await putToServerAPI<StaffMember>(`/staff/${id}`, data)
    revalidatePath('/staff')
    revalidatePath(`/staff/${id}`)
    return { success: true, data: response }
  } catch (error) {
    return { success: false, error: 'Failed to update staff member' }
  }
}

export async function deleteStaffMember(id: string) {
  try {
    await deleteFromServerAPI(`/staff/${id}`)
    revalidatePath('/staff')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete staff member' }
  }
}

export async function updateStaffAttendance(
  id: string,
  attendanceDate: string,
  status: 'present' | 'absent' | 'half-day'
) {
  try {
    const response = await putToServerAPI(`/staff/${id}/attendance`, {
      date: attendanceDate,
      status,
    })
    revalidatePath(`/staff/${id}`)
    return { success: true, data: response }
  } catch (error) {
    return { success: false, error: 'Failed to update attendance' }
  }
}

export async function addStaffAdvance(
  id: string,
  amount: number,
  reason: string
) {
  try {
    const response = await postToServerAPI(`/staff/${id}/advances`, {
      amount,
      reason,
    })
    revalidatePath(`/staff/${id}`)
    return { success: true, data: response }
  } catch (error) {
    return { success: false, error: 'Failed to add advance' }
  }
}

export async function deleteStaffAdvance(staffId: string, advanceId: string) {
  try {
    await deleteFromServerAPI(`/staff/${staffId}/advances/${advanceId}`)
    revalidatePath(`/staff/${staffId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete advance' }
  }
}

export async function recordStaffPayment(
  id: string,
  amount: number,
  date: string
) {
  try {
    const response = await postToServerAPI(`/staff/${id}/payments`, {
      amount,
      date,
    })
    revalidatePath(`/staff/${id}`)
    return { success: true, data: response }
  } catch (error) {
    return { success: false, error: 'Failed to record payment' }
  }
}
