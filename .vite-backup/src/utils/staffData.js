// API utility for staff data - replaces localStorage-based storage
import api from './api'
import { cachedRequest, invalidateCachePattern, getCachedData, getOrCreateRequest, setCachedData } from './apiCache'

// Helper to generate cache key (same as in apiCache)
const getCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  return `${url}${sortedParams ? `?${sortedParams}` : ''}`
}

// Get all staff data from API with caching
export const getStaffData = async (useCache = true, signal = null, trackRequest = null, untrackRequest = null) => {
  const requestId = `getStaffData-${Date.now()}-${Math.random()}`
  
  const requestFn = async () => {
    console.log('🔄 getStaffData requestFn: Starting API call', { 
      signalAborted: signal?.aborted,
      hasSignal: !!signal,
      requestId 
    })

    // Track this request as ongoing FIRST, before making the API call
    // This ensures the request is tracked before any cancellation can happen
    if (trackRequest) {
      console.log('📝 getStaffData: Tracking request', requestId)
      trackRequest(requestId)
    }

    // Don't check signal.aborted here - let the API call proceed
    // The axios call will handle abort properly, and we want to allow
    // requests to complete even if signal was briefly aborted during route changes
    if (signal?.aborted) {
      console.log('⚠️ getStaffData: Signal appears aborted, but proceeding (may be from old route)')
    }

    try {
      console.log('🌐 getStaffData: Making API call to /staff', { 
        hasSignal: !!signal,
        signalAborted: signal?.aborted 
      })
      const response = await api.get('/staff', { signal })
      console.log('✅ getStaffData: API call successful', response.data)
      // Untrack when request completes successfully
      if (untrackRequest) {
        console.log('✅ getStaffData: Untracking request', requestId)
        untrackRequest(requestId)
      }
      // Return empty array if no staff data (valid case)
      return response.data.staff || []
    } catch (error) {
      // Untrack when request fails or is cancelled
      if (untrackRequest) {
        console.log('❌ getStaffData: Untracking request due to error', requestId)
        untrackRequest(requestId)
      }
      // Don't log cancelled requests - they're expected when route changes
      if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.message === 'Request cancelled') {
        console.log('🚫 getStaffData: Request was cancelled', {
          code: error.code,
          name: error.name,
          message: error.message
        })
        throw error
      }
      console.error('❌ getStaffData: Error fetching staff data:', error)
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

  // Always use request deduplication to prevent duplicate calls
  const cacheKey = getCacheKey('/staff', {})
  
  if (useCache) {
    // Check cache first synchronously - if cached, return immediately without making request
    // Cached responses don't need tracking since they're not ongoing requests
    const cached = getCachedData('/staff', {}, 10 * 1000)
    if (cached !== null) {
      // Return cached data immediately (synchronously wrapped in Promise)
      // But still make API call in background to refresh cache
      // Fire and forget - don't wait for it
      setTimeout(() => {
        if (!signal?.aborted) {
          cachedRequest('/staff', {}, requestFn, 10 * 1000).catch(() => {
            // Silently fail background refresh
          })
        }
      }, 0)
      return Promise.resolve(cached)
    }
    
    // Only make request if not cached and not already cancelled
    if (signal?.aborted) {
      throw new Error('Request cancelled')
    }
    
    // Cache for 10 seconds for staff list (frequently updated)
    // Use deduplication to prevent duplicate calls
    return getOrCreateRequest(cacheKey, async () => {
      try {
        const data = await requestFn()
        // Cache the result
        setCachedData('/staff', {}, data, 10 * 1000)
        return data
      } catch (error) {
        throw error
      }
    })
  }
  
  // Bypass cache - always make API call, but use deduplication to prevent duplicates
  console.log('🔄 getStaffData: Bypassing cache, making API call (with deduplication)')
  return getOrCreateRequest(cacheKey, async () => {
    try {
      const data = await requestFn()
      // Still cache the result even when bypassing cache check
      setCachedData('/staff', {}, data, 10 * 1000)
      return data
    } catch (error) {
      throw error
    }
  })
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
    // Get current cached data and append new staff
    const cached = getCachedData('/staff', {}, 10 * 1000)
    if (cached && Array.isArray(cached)) {
      // Optimistically add the new staff to cache
      const newStaff = response.data.staff
      const updatedCache = [...cached, newStaff]
      setCachedData('/staff', {}, updatedCache, 10 * 1000)
    } else {
      // If no cache, just invalidate to force refresh
      invalidateCachePattern('/staff')
    }
    return response.data.staff
  } catch (error) {
    console.error('Error adding staff member:', error)
    throw error
  }
}

// Update staff member via API
export const updateStaffMember = async (staffId, updates) => {
  try {
    console.log(`🔄 Updating staff ${staffId} with data:`, updates)
    const response = await api.put(`/staff/${staffId}`, updates)

    const updatedStaff = response.data.staff
    console.log(`✅ Backend returned updated staff:`, updatedStaff)

    // Update cache with modified staff member
    const cached = getCachedData('/staff', {}, 10 * 1000)
    if (cached && Array.isArray(cached)) {
      const updatedCache = cached.map(staff =>
        (staff._id === staffId || staff.id === staffId) ? updatedStaff : staff
      )
      setCachedData('/staff', {}, updatedCache, 10 * 1000)
      console.log('✅ Updated staff list cache')
    } else {
      invalidateCachePattern('/staff')
      console.log('⚠️ No cached staff list, invalidating pattern')
    }

    // Also update the individual staff cache with fresh data
    setCachedData(`/staff/${staffId}`, {}, updatedStaff, 30 * 1000)
    console.log('✅ Updated individual staff cache')

    return updatedStaff
  } catch (error) {
    console.error('Error updating staff member:', error)
    throw error
  }
}

// Update staff attendance via API
export const updateStaffAttendance = async (staffId, { absentDates, isAbsentToday, halfDayDates }) => {
  try {
    const payload = {}
    if (absentDates !== undefined) {
      payload.absentDates = Array.isArray(absentDates) ? absentDates : Array.from(absentDates)
    }
    if (isAbsentToday !== undefined) payload.isAbsentToday = isAbsentToday
    if (halfDayDates !== undefined) {
      payload.halfDayDates = Array.isArray(halfDayDates) ? halfDayDates : Array.from(halfDayDates)
    }
    const response = await api.patch(`/staff/${staffId}/attendance`, payload)
    // Update cache with modified staff member
    const cached = getCachedData('/staff', {}, 10 * 1000)
    if (cached && Array.isArray(cached)) {
      const updatedCache = cached.map(staff =>
        (staff._id === staffId || staff.id === staffId) ? response.data.staff : staff
      )
      setCachedData('/staff', {}, updatedCache, 10 * 1000)
    } else {
      invalidateCachePattern('/staff')
    }
    // Also update/set cache for individual staff member to ensure fresh data on profile page
    setCachedData(`/staff/${staffId}`, {}, response.data.staff, 30 * 1000)
    return response.data.staff
  } catch (error) {
    console.error('Error updating attendance:', error)
    throw error
  }
}

// Add a cash advance for a staff member
export const addAdvance = async (staffId, { amount, date, note }) => {
  try {
    const response = await api.post(`/staff/${staffId}/advances`, { amount, date, note })
    invalidateCachePattern('/staff')
    return response.data.staff
  } catch (error) {
    console.error('Error adding advance:', error)
    throw error
  }
}

// Delete an advance record
export const deleteAdvance = async (staffId, advanceId) => {
  try {
    const response = await api.delete(`/staff/${staffId}/advances/${advanceId}`)
    invalidateCachePattern('/staff')
    return response.data.staff
  } catch (error) {
    console.error('Error deleting advance:', error)
    throw error
  }
}

// Record / update a salary payment
export const recordPayment = async (staffId, paymentData) => {
  try {
    const response = await api.post(`/staff/${staffId}/payments`, paymentData)
    invalidateCachePattern('/staff')
    return response.data.staff
  } catch (error) {
    console.error('Error recording payment:', error)
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
      console.log(`📡 Fetching staff member ${staffId} from backend`)
      const response = await api.get(`/staff/${staffId}`, { signal })
      // Untrack when request completes successfully
      if (untrackRequest) untrackRequest(requestId)
      const data = response.data.staff
      // Cache the result
      setCachedData(`/staff/${staffId}`, {}, data, 30 * 1000)
      console.log(`✅ Staff member ${staffId} fetched and cached`)
      return data
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
    // Check cache first synchronously - if cached, return immediately without making request
    const cached = getCachedData(`/staff/${staffId}`, {}, 30 * 1000)
    if (cached !== null) {
      // Return cached data immediately (synchronously wrapped in Promise)
      // But still make API call in background to refresh cache
      setTimeout(() => {
        if (!signal?.aborted) {
          requestFn().catch(() => {
            // Silently fail background refresh
          })
        }
      }, 0)
      return Promise.resolve(cached)
    }

    // Only make request if not cached and not already cancelled
    if (signal?.aborted) {
      throw new Error('Request cancelled')
    }

    // Cache for 30 seconds for individual staff
    return requestFn()
  }

  return requestFn()
}

// Get fresh staff data bypassing cache - use after updates
export const getFreshStaffMember = async (staffId) => {
  try {
    console.log(`🔄 Fetching fresh staff data for ${staffId} (bypassing cache)`)
    const response = await api.get(`/staff/${staffId}`)
    const data = response.data.staff
    // Update cache with fresh data
    setCachedData(`/staff/${staffId}`, {}, data, 30 * 1000)
    console.log(`✅ Fresh staff data cached for ${staffId}`)
    return data
  } catch (error) {
    console.error('Error fetching fresh staff member:', error)
    throw error
  }
}
