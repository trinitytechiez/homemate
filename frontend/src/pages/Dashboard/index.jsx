import { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Shimmer from '../../components/Shimmer'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import StaffCard from '../../components/StaffCard/StaffCard'
import { EmptyState } from '../../common/components'
import { getStaffData, updateStaffAttendance } from '../../utils/staffData'
import { getCachedData } from '../../utils/apiCache'
import { useToast } from '../../contexts/ToastContext'
import { useRequestCancellation } from '../../utils/useRequestCancellation'
import { useDebounce } from '../../utils/useDebounce'
import styles from './styles.module.scss'

const Dashboard = () => {
  const navigate = useNavigate()
  const { showError } = useToast()
  const { signal, trackRequest, untrackRequest } = useRequestCancellation()

  const [viewMode, setViewMode] = useState('monthly') // 'monthly' or 'weekly'
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
  }, []) // Run on every mount

  useEffect(() => {
    console.log('📊 Dashboard: useEffect triggered', {
      signalAborted: signal?.aborted,
      hasSignal: !!signal
    })

    let isMounted = true
    let hasCalled = false // Prevent double calls in StrictMode

    const loadData = async () => {
      // Prevent duplicate calls (React StrictMode causes double renders)
      if (hasCalled) {
        console.log('📊 Dashboard: loadData already called, skipping duplicate')
        return
      }
      hasCalled = true

      console.log('📊 Dashboard: loadData called')
      try {
        // Always fetch from API (bypass cache) to get fresh data
        console.log('📊 Dashboard: Calling getStaffData with useCache=false')
        const data = await getStaffData(false, signal, trackRequest, untrackRequest)
        console.log('📊 Dashboard: Received data', data)
        // Check if component is still mounted and request wasn't cancelled
        if (isMounted && !signal?.aborted) {
          const mappedData = data.map(staff => ({
            ...staff,
            id: staff._id || staff.id
          }))
          setStaffData(mappedData)
          setIsLoading(false)
          console.log('📊 Dashboard: Data set, loading false')
        } else {
          console.log('📊 Dashboard: Skipping state update', { isMounted, signalAborted: signal?.aborted })
        }
      } catch (error) {
        // Don't handle cancelled requests
        if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.message === 'Request cancelled') {
          console.log('📊 Dashboard: Request was cancelled')
          return
        }
        console.error('📊 Dashboard: Error loading staff data:', error)
        if (error.response?.status !== 200 && error.response?.status !== 404 && error.response?.status !== 401) {
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
      console.log('📊 Dashboard: Cleanup - unmounting')
      isMounted = false
    }
  }, []) // Only run once on mount

  // Memoize date formatting to avoid recalculation on every render
  const { formattedDate, monthName } = useMemo(() => {
    const currentDate = new Date()
    const dateOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    }
    return {
      formattedDate: currentDate.toLocaleDateString('en-IN', dateOptions),
      monthName: currentDate.toLocaleDateString('en-IN', { month: 'long' })
    }
  }, []) // Only calculate once on mount

  // Debounce search query to avoid filtering on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Memoize filtered staff to avoid recalculation on every render
  // Filter by both search query AND pay cycle (viewMode)
  const filteredStaff = useMemo(() => {
    // First filter by pay cycle based on view mode
    let filtered = staffData.filter(staff => {
      const payCycle = (staff.payCycle || 'Monthly').toLowerCase()
      const currentView = viewMode.toLowerCase()
      return payCycle === currentView
    })

    // Then filter by search query if present
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(staff => {
        const name = (staff.name || '').toLowerCase()
        const role = (staff.role || '').toLowerCase()
        return name.includes(query) || role.includes(query)
      })
    }

    return filtered
  }, [staffData, debouncedSearchQuery, viewMode])

  // Memoize update handlers to prevent unnecessary re-renders
  const updateStaffAbsentStatus = useCallback(async (staffId, isAbsentToday) => {
    try {
      // Update attendance - this is the critical operation
      await updateStaffAttendance(staffId, { isAbsentToday })

      // Attendance updated successfully - now try to refresh data
      // If refresh fails, we don't want to show an error since the update succeeded
      try {
        const data = await getStaffData(false)
        const mappedData = data.map(staff => ({
          ...staff,
          id: staff._id || staff.id
        }))
        setStaffData(mappedData)
      } catch (refreshError) {
        // Silently fail on refresh - the attendance was already updated successfully
        console.warn('Failed to refresh staff data after attendance update:', refreshError)
      }
    } catch (error) {
      console.error('Error updating absent status:', error)
      showError('Failed to update attendance. Please try again.')
    }
  }, [showError])

  const updateStaffAbsentDates = useCallback(async (staffId, absentDatesSet) => {
    try {
      const absentDatesArray = Array.from(absentDatesSet)

      const today = new Date()
      const formatDateKey = (year, month, day) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
      const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
      const isAbsentToday = absentDatesSet.has(todayKey)

      // Update attendance - this is the critical operation
      await updateStaffAttendance(staffId, {
        absentDates: absentDatesArray,
        isAbsentToday
      })

      // Attendance updated successfully - now try to refresh data
      // If refresh fails, we don't want to show an error since the update succeeded
      try {
        const data = await getStaffData(false)
        const mappedData = data.map(staff => ({
          ...staff,
          id: staff._id || staff.id
        }))
        setStaffData(mappedData)
      } catch (refreshError) {
        // Silently fail on refresh - the attendance was already updated successfully
        console.warn('Failed to refresh staff data after attendance update:', refreshError)
      }
    } catch (error) {
      console.error('Error updating absent dates:', error)
      showError('Failed to update attendance. Please try again.')
    }
  }, [showError])

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.appTitle}>home/mate</h1>
          <button className={styles.dateButton}>
            {formattedDate}
          </button>
          <h2 className={styles.dashboardTitle}>{monthName} Dashboard</h2>
        </header>

        {/* View Mode Toggle */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleButton} ${viewMode === 'monthly' ? styles.active : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            Monthly
          </button>
          <button
            className={`${styles.toggleButton} ${viewMode === 'weekly' ? styles.active : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            Weekly
          </button>
        </div>

        {/* Search Bar */}
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

        {/* Staff Cards */}
        <div className={styles.staffList}>
          {isLoading ? (
            <Shimmer variant="dashboard" count={3} />
          ) : (
            filteredStaff.length > 0 ? (
              filteredStaff.map((staff) => (
                <StaffCard
                  key={staff.id || staff._id}
                  staff={staff}
                  onAbsentToggle={(isAbsent) => updateStaffAbsentStatus(staff.id || staff._id, isAbsent)}
                  onAbsentDatesUpdate={(absentDates) => updateStaffAbsentDates(staff.id || staff._id, absentDates)}
                />
              ))
            ) : searchQuery ? (
              <EmptyState
                icon="🔍"
                title="No results found"
                message={`No staff members match "${searchQuery}". Try a different search term.`}
                variant="compact"
              />
            ) : staffData.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No staff members yet"
                message="Get started by adding your first staff member to manage their attendance and payments."
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

        {/* Pagination Dots */}
        {filteredStaff.length > 0 && (
          <div className={styles.paginationDots}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Dashboard
