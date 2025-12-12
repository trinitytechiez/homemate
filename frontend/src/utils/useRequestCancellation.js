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

  useEffect(() => {
    // Only cancel ongoing requests when route changes
    if (ongoingRequestsRef.current.size > 0) {
      abortControllerRef.current.abort()
      ongoingRequestsRef.current.clear()
    }

    // Create new AbortController for current route
    abortControllerRef.current = new AbortController()

    // Cleanup: cancel only ongoing requests on unmount
    return () => {
      if (ongoingRequestsRef.current.size > 0) {
        abortControllerRef.current.abort()
        ongoingRequestsRef.current.clear()
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
