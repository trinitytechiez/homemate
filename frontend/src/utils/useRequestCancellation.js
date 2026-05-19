import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook to manage API request cancellation
 * Only cancels ongoing (in-flight) requests when component unmounts or route changes
 * Completed requests and cached responses are not affected
 * 
 * @returns {Object} { signal, cancel, isAborted }
 */
export const useRequestCancellation = () => {
  const location = useLocation()
  const abortControllerRef = useRef(new AbortController())
  const ongoingRequestsRef = useRef(new Set())
  // Track the previous pathname to detect actual route changes (not StrictMode remounts)
  const prevPathnameRef = useRef(location.pathname)

  useEffect(() => {
    // Check if pathname actually changed (not just StrictMode remount)
    const pathnameChanged = prevPathnameRef.current !== location.pathname

    if (pathnameChanged) {
      console.log('🔄 useRequestCancellation: Route changed, new controller created', {
        oldPathname: prevPathnameRef.current,
        newPathname: location.pathname,
        ongoingRequests: ongoingRequestsRef.current.size
      })

      // For actual route changes, replace the controller and abort old requests after a small delay
      const oldController = abortControllerRef.current
      abortControllerRef.current = new AbortController()
      prevPathnameRef.current = location.pathname

      // Use setTimeout to avoid blocking navigation
      // Abort old requests AFTER a small delay to allow new requests to be tracked
      const timeoutId = setTimeout(() => {
        // Only cancel ongoing requests from the OLD controller
        // New requests should already be using the new controller
        if (ongoingRequestsRef.current.size > 0) {
          console.log('🚫 useRequestCancellation: Aborting old requests', {
            count: ongoingRequestsRef.current.size
          })
          oldController.abort()
          ongoingRequestsRef.current.clear()
        }
      }, 100) // Small delay to allow new requests to start

      // Cleanup: cancel only ongoing requests on unmount or before next effect run
      return () => {
        clearTimeout(timeoutId)
        // Only abort if there are actually ongoing requests
        if (ongoingRequestsRef.current.size > 0) {
          console.log('🚫 useRequestCancellation: Cleanup - aborting requests', {
            count: ongoingRequestsRef.current.size
          })
          abortControllerRef.current.abort()
          ongoingRequestsRef.current.clear()
        }
      }
    } else {
      // Same pathname (StrictMode remount) - don't create new controller
      console.log('🔄 useRequestCancellation: Same pathname, keeping existing controller', {
        pathname: location.pathname
      })

      // Cleanup on unmount: abort only if there are actually ongoing requests
      return () => {
        if (ongoingRequestsRef.current.size > 0) {
          console.log('🚫 useRequestCancellation: Cleanup - aborting requests on unmount', {
            count: ongoingRequestsRef.current.size
          })
          abortControllerRef.current.abort()
          ongoingRequestsRef.current.clear()
        }
      }
    }
  }, [location.pathname])

  const cancel = () => {
    if (ongoingRequestsRef.current.size > 0) {
      abortControllerRef.current.abort()
      ongoingRequestsRef.current.clear()
      // Create new controller for future requests
      abortControllerRef.current = new AbortController()
    }
  }

  const trackRequest = (requestId) => {
    if (requestId) {
      ongoingRequestsRef.current.add(requestId)
    }
  }

  const untrackRequest = (requestId) => {
    if (requestId) {
      ongoingRequestsRef.current.delete(requestId)
    }
  }

  const hasOngoingRequests = () => {
    return ongoingRequestsRef.current.size > 0
  }

  return {
    signal: abortControllerRef.current.signal,
    cancel,
    isAborted: abortControllerRef.current.signal.aborted,
    trackRequest,
    untrackRequest,
    hasOngoingRequests
  }
}
