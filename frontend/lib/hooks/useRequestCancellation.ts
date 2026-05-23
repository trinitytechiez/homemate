'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export const useRequestCancellation = () => {
  const pathname = usePathname()
  const abortControllerRef = useRef(new AbortController())
  const ongoingRequestsRef = useRef(new Set<string>())
  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    const pathnameChanged = prevPathnameRef.current !== pathname

    if (pathnameChanged) {
      console.log('🔄 useRequestCancellation: Route changed, new controller created', {
        oldPathname: prevPathnameRef.current,
        newPathname: pathname,
        ongoingRequests: ongoingRequestsRef.current.size
      })

      const oldController = abortControllerRef.current
      abortControllerRef.current = new AbortController()
      prevPathnameRef.current = pathname

      const timeoutId = setTimeout(() => {
        if (ongoingRequestsRef.current.size > 0) {
          console.log('🚫 useRequestCancellation: Aborting old requests', {
            count: ongoingRequestsRef.current.size
          })
          oldController.abort()
          ongoingRequestsRef.current.clear()
        }
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        if (ongoingRequestsRef.current.size > 0) {
          console.log('🚫 useRequestCancellation: Cleanup - aborting requests', {
            count: ongoingRequestsRef.current.size
          })
          abortControllerRef.current.abort()
          ongoingRequestsRef.current.clear()
        }
      }
    } else {
      console.log('🔄 useRequestCancellation: Same pathname, keeping existing controller', {
        pathname
      })

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
  }, [pathname])

  const cancel = () => {
    if (ongoingRequestsRef.current.size > 0) {
      abortControllerRef.current.abort()
      ongoingRequestsRef.current.clear()
      abortControllerRef.current = new AbortController()
    }
  }

  const trackRequest = (requestId: string) => {
    if (requestId) {
      ongoingRequestsRef.current.add(requestId)
    }
  }

  const untrackRequest = (requestId: string) => {
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
