/**
 * API Cache utility for optimal API calling
 * Prevents duplicate requests and caches responses
 */

const cache = new Map()
const pendingRequests = new Map()

// Default cache TTL: 30 seconds
const DEFAULT_TTL = 30 * 1000

/**
 * Generate cache key from request config
 */
const getCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  return `${url}${sortedParams ? `?${sortedParams}` : ''}`
}

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cachedData) => {
  if (!cachedData) return false
  return Date.now() - cachedData.timestamp < cachedData.ttl
}

/**
 * Get cached data if valid
 */
export const getCachedData = (url, params = {}, ttl = DEFAULT_TTL) => {
  const key = getCacheKey(url, params)
  const cached = cache.get(key)
  
  if (cached && isCacheValid(cached)) {
    return cached.data
  }
  
  // Remove expired cache
  if (cached) {
    cache.delete(key)
  }
  
  return null
}

/**
 * Set cached data
 */
export const setCachedData = (url, params = {}, data, ttl = DEFAULT_TTL) => {
  const key = getCacheKey(url, params)
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

/**
 * Clear specific cache entry
 */
export const clearCache = (url, params = {}) => {
  const key = getCacheKey(url, params)
  cache.delete(key)
}

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cache.clear()
  pendingRequests.clear()
}

/**
 * Get or create pending request promise
 * Prevents duplicate simultaneous requests
 * Exported for use in staffData.js
 */
export const getOrCreateRequest = (key, requestFn) => {
  // If request is already pending, return the existing promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }
  
  // Create new request promise
  const requestPromise = requestFn()
    .then((data) => {
      pendingRequests.delete(key)
      return data
    })
    .catch((error) => {
      pendingRequests.delete(key)
      throw error
    })
  
  pendingRequests.set(key, requestPromise)
  return requestPromise
}

/**
 * Cached API request wrapper
 * Combines caching and request deduplication
 */
export const cachedRequest = async (url, params = {}, requestFn, ttl = DEFAULT_TTL) => {
  const key = getCacheKey(url, params)
  
  // Check cache first
  const cached = getCachedData(url, params, ttl)
  if (cached !== null) {
    return cached
  }
  
  // Use request deduplication
  return getOrCreateRequest(key, async () => {
    try {
      const data = await requestFn()
      // Only cache if request wasn't cancelled
      if (data !== undefined) {
        setCachedData(url, params, data, ttl)
      }
      return data
    } catch (error) {
      // If request was cancelled, remove from pending requests
      if (error.code === 'ERR_CANCELED' || error.name === 'AbortError') {
        pendingRequests.delete(key)
      }
      throw error
    }
  })
}

/**
 * Invalidate cache for a specific endpoint pattern
 * Useful when data is updated and cache needs to be refreshed
 */
export const invalidateCachePattern = (pattern) => {
  const keysToDelete = []
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => cache.delete(key))
}
