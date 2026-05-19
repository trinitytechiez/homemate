import { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import EmptyState from '../../components/EmptyState/EmptyState'
import Shimmer from '../../components/Shimmer'
import { getStaffData } from '../../utils/staffData'
import { getCachedData } from '../../utils/apiCache'
import { useToast } from '../../contexts/ToastContext'
import { useRequestCancellation } from '../../utils/useRequestCancellation'
import { useDebounce } from '../../utils/useDebounce'
import styles from './styles.module.scss'

const Staff = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { showError } = useToast()
  const { signal, trackRequest, untrackRequest } = useRequestCancellation()

  const [searchQuery, setSearchQuery] = useState('')
  const [staffData, setStaffData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Check cache synchronously on every mount and update state immediately
  useLayoutEffect(() => {
    const cached = getCachedData('/staff', {}, 10 * 1000)
    if (cached !== null) {
      // If cached, use it immediately without loading state
      const mappedData = cached.map(staff => ({
        ...staff,
        id: staff._id || staff.id
      }))
      setStaffData(mappedData)
      setIsLoading(false)
    } else {
      // If not cached, show shimmer
      setIsLoading(true)
    }
  }, [location.pathname]) // Re-run when route changes

  // Check authentication (non-blocking)
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || token.trim().length === 0) {
      // Use setTimeout to avoid blocking render
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 0)
    }
  }, [navigate])

  useEffect(() => {
    let isMounted = true
    let hasCalled = false // Prevent double calls in StrictMode

    const loadData = async () => {
      // Prevent duplicate calls (React StrictMode causes double renders)
      if (hasCalled) {
        return
      }
      hasCalled = true

      try {
        // Always fetch from API (bypass cache) to get fresh data
        const data = await getStaffData(false, signal, trackRequest, untrackRequest)
        // Check if component is still mounted and request wasn't cancelled
        if (isMounted && !signal?.aborted) {
          const mappedData = data.map(staff => ({
            ...staff,
            id: staff._id || staff.id
          }))
          setStaffData(mappedData)
          setIsLoading(false)
        }
      } catch (error) {
        // Don't handle cancelled requests
        if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.message === 'Request cancelled') {
          // Still set loading to false even if cancelled to prevent infinite loading
          if (isMounted) {
            setIsLoading(false)
          }
          return
        }
        console.error('Error loading staff data:', error)
        if (error.response?.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        // Only show error toast if it's not a "no data" case
        // Empty array is valid, don't show error
        if (error.response?.status !== 200 && error.response?.status !== 404) {
          showError('Failed to load staff data. Please try again.')
        }
        if (isMounted && !signal?.aborted) {
          setIsLoading(false)
        }
      }
    }

    // Always call API to refresh data
    loadData()

    return () => {
      isMounted = false
      // Ensure loading state is reset on cleanup to prevent stuck loading
      setIsLoading(false)
    }
  }, [location.pathname]) // Re-run when navigating back to staff page

  // Debounce search query to avoid filtering on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Memoize filtered staff to avoid recalculation on every render
  const filteredStaff = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return staffData
    }
    const query = debouncedSearchQuery.toLowerCase()
    return staffData.filter(staff => {
      const name = (staff.name || '').toLowerCase()
      const role = (staff.role || '').toLowerCase()
      const location = (staff.location || '').toLowerCase()
      return name.includes(query) || role.includes(query) || location.includes(query)
    })
  }, [staffData, debouncedSearchQuery])

  // Memoize handlers to prevent unnecessary re-renders
  const handleStaffClick = useCallback((staff) => {
    navigate(`/staff/${staff.id || staff._id}`, {
      state: {
        staff,
        fromStaffList: true
      }
    })
  }, [navigate])

  const handleFilterClick = useCallback(() => {
    // Filter clicked
  }, [])

  return (
    <div className={styles.staffContainer}>
      <div className={styles.staffContent}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.appTitle}>home/mate</h1>
        </header>

        {/* Search Bar */}
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.filterButton} onClick={handleFilterClick}>
            <span className={styles.filterIcon}>☰</span>
          </button>
        </div>

        {/* Staff List */}
        <div className={styles.staffList}>
          {isLoading ? (
            <Shimmer variant="list" count={5} />
          ) : (
            filteredStaff.length > 0 ? (
              filteredStaff.map((staff) => (
                <div
                  key={staff.id || staff._id}
                  className={styles.staffCard}
                  onClick={() => handleStaffClick(staff)}
                >
                  <div className={styles.staffAvatar}>
                    {staff.avatar ? (
                      <img src={staff.avatar} alt={staff.name || 'Staff Member'} />
                    ) : (
                      <span className={styles.avatarPlaceholder}>
                        {(staff.name && staff.name.charAt(0) ? staff.name.charAt(0).toUpperCase() : '?')}
                      </span>
                    )}
                  </div>
                  <div className={styles.staffInfo}>
                    <h3 className={styles.staffName}>{staff.name}</h3>
                    <p className={styles.staffRole}>{staff.role}</p>
                    <p className={styles.staffLocation}>{staff.location}</p>
                  </div>
                  <div className={styles.arrowIcon}>→</div>
                </div>
              ))
            ) : searchQuery ? (
              <EmptyState
                icon="🔍"
                title="No results found"
                message={`No staff members match "${searchQuery}". Try a different search term or clear the search.`}
                variant="compact"
              />
            ) : staffData.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No staff members yet"
                message="Start managing your staff by adding your first team member."
                actionLabel="Add Staff Member"
                onAction={() => navigate('/add')}
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="No results found"
                message="Try adjusting your search terms."
                variant="compact"
              />
            )
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Staff
