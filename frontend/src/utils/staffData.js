// API utility for staff data - replaces localStorage-based storage
import api from './api'

// Get all staff data from API
export const getStaffData = async () => {
  try {
    const response = await api.get('/staff')
    // Return empty array if no staff data (valid case)
    return response.data.staff || []
  } catch (error) {
    console.error('Error fetching staff data:', error)
    if (error.response?.status === 401) {
      // Token expired or invalid, will be handled by interceptor
      throw error
    }
    // If 404 or empty response, return empty array (no staff data is valid)
    if (error.response?.status === 404 || error.response?.status === 200) {
      return []
    }
    // For other errors, throw to be handled by caller
    throw error
  }
}

// Save staff data (for bulk updates if needed)
export const saveStaffData = async (staffData) => {
  // This is not typically used, but kept for compatibility
  // Individual updates should use updateStaffMember
  console.warn('saveStaffData: Bulk save not implemented. Use individual update methods.')
  return false
}

// Add new staff member via API
export const addStaffMember = async (staffData) => {
  try {
    const response = await api.post('/staff', staffData)
    return response.data.staff
  } catch (error) {
    console.error('Error adding staff member:', error)
    throw error
  }
}

// Update staff member via API
export const updateStaffMember = async (staffId, updates) => {
  try {
    const response = await api.put(`/staff/${staffId}`, updates)
    return response.data.staff
  } catch (error) {
    console.error('Error updating staff member:', error)
    throw error
  }
}

// Update staff attendance via API
export const updateStaffAttendance = async (staffId, { absentDates, isAbsentToday }) => {
  try {
    const response = await api.patch(`/staff/${staffId}/attendance`, {
      absentDates: Array.isArray(absentDates) ? absentDates : Array.from(absentDates),
      isAbsentToday
    })
    return response.data.staff
  } catch (error) {
    console.error('Error updating attendance:', error)
    throw error
  }
}

// Delete staff member via API
export const deleteStaffMember = async (staffId) => {
  try {
    await api.delete(`/staff/${staffId}`)
    return true
  } catch (error) {
    console.error('Error deleting staff member:', error)
    throw error
  }
}

// Get single staff member via API
export const getStaffMember = async (staffId) => {
  try {
    const response = await api.get(`/staff/${staffId}`)
    return response.data.staff
  } catch (error) {
    console.error('Error fetching staff member:', error)
    throw error
  }
}
