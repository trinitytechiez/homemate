// API utility for staff data - replaces localStorage-based storage
import api from './api'
import { cachedRequest, invalidateCachePattern, getCachedData } from './apiCache'

// Get all staff data from API with caching
export const getStaffData = async (useCache = true, signal = null, trackRequest = null, untrackRequest = null) => {
  const requestId = `getStaffData-${Date.now()}-${Math.random()}`
  
  const requestFn = async () => {
    // Only make request if signal is not already aborted (prevents unnecessary requests)
    if (signal?.aborted) {
      if (untrackRequest) untrackRequest(requestId)
      throw new Error('Request cancelled')
    }

    // Track this request as ongoing
    if (trackRequest) trackRequest(requestId)

    try {
      const response = await api.get('/staff', { signal })
      // Untrack when request completes successfully
      if (untrackRequest) untrackRequest(requestId)
      // Return empty array if no staff data (valid case)
      return response.data.staff || []
    } catch (error) {
      // Untrack when request fails or is cancelled
      if (untrackRequest) untrackRequest(requestId)
      // Don't log cancelled requests - they're expected when route changes
      if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.message === 'Request cancelled') {
        throw error
      }
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

  if (useCache) {
    // Check cache first - if cached, return immediately without making request
    // Cached responses don't need tracking since they're not ongoing requests
    const cached = getCachedData('/staff', {}, 10 * 1000)
    if (cached !== null) {
      return cached
    }
    
    // Only make request if not cached and not already cancelled
    if (signal?.aborted) {
      throw new Error('Request cancelled')
    }
    
    // Cache for 10 seconds for staff list (frequently updated)
    return cachedRequest('/staff', {}, requestFn, 10 * 1000)
  }
  
  return requestFn()
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
    // Invalidate staff list cache
    invalidateCachePattern('/staff')
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
    // Invalidate staff list and individual staff caches
    invalidateCachePattern('/staff')
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
    // Invalidate staff list and individual staff caches
    invalidateCachePattern('/staff')
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
    // Invalidate staff list cache
    invalidateCachePattern('/staff')
    return true
  } catch (error) {
    console.error('Error deleting staff member:', error)
    throw error
  }
}

// Get single staff member via API
export const getStaffMember = async (staffId, useCache = true, signal = null, trackRequest = null, untrackRequest = null) => {
  const requestId = `getStaffMember-${staffId}-${Date.now()}-${Math.random()}`
  
  const requestFn = async () => {
    // Only make request if signal is not already aborted
    if (signal?.aborted) {
      if (untrackRequest) untrackRequest(requestId)
      throw new Error('Request cancelled')
    }

    // Track this request as ongoing
    if (trackRequest) trackRequest(requestId)

    try {
      const response = await api.get(`/staff/${staffId}`, { signal })
      // Untrack when request completes successfully
      if (untrackRequest) untrackRequest(requestId)
      return response.data.staff
    } catch (error) {
      // Untrack when request fails or is cancelled
      if (untrackRequest) untrackRequest(requestId)
      // Don't log cancelled requests
      if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.message === 'Request cancelled') {
        throw error
      }
      console.error('Error fetching staff member:', error)
      throw error
    }
  }

  if (useCache) {
    // Check cache first - if cached, return immediately without making request
    const cached = getCachedData(`/staff/${staffId}`, {}, 30 * 1000)
    if (cached !== null) {
      return cached
    }
    
    // Only make request if not cached and not already cancelled
    if (signal?.aborted) {
      throw new Error('Request cancelled')
    }
    
    // Cache for 30 seconds for individual staff (less frequently updated)
    return cachedRequest(`/staff/${staffId}`, {}, requestFn, 30 * 1000)
  }
  
  return requestFn()
}
