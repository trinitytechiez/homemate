import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '../../components/Loader/Loader'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import StaffCard from '../../components/StaffCard/StaffCard'
import EmptyState from '../../components/EmptyState/EmptyState'
import { getStaffData, updateStaffAttendance } from '../../utils/staffData'
import { useToast } from '../../contexts/ToastContext'
import styles from './Dashboard.module.scss'

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState('monthly') // 'monthly' or 'weekly'
  const [searchQuery, setSearchQuery] = useState('')
  const [staffData, setStaffData] = useState([])
  const navigate = useNavigate()
  const { showError } = useToast()

  // Check authentication and load staff data on mount
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token')
      
      if (!token || token.trim().length === 0) {
        navigate('/login', { replace: true })
        return
      }

      try {
        const data = await getStaffData()
        // Map MongoDB _id to id for compatibility
        const mappedData = data.map(staff => ({
          ...staff,
          id: staff._id || staff.id
        }))
        setStaffData(mappedData)
      } catch (error) {
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
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [navigate, showError])

  // Get current date
  const currentDate = new Date()
  const dateOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric', 
    weekday: 'long' 
  }
  const formattedDate = currentDate.toLocaleDateString('en-IN', dateOptions)
  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long' })

  // Update staff absent status
  const updateStaffAbsentStatus = async (staffId, isAbsentToday) => {
    try {
      await updateStaffAttendance(staffId, { isAbsentToday })
      // Refresh staff data
      const data = await getStaffData()
      const mappedData = data.map(staff => ({
        ...staff,
        id: staff._id || staff.id
      }))
      setStaffData(mappedData)
    } catch (error) {
      console.error('Error updating absent status:', error)
      showError('Failed to update attendance. Please try again.')
    }
  }

  // Update staff absent dates
  const updateStaffAbsentDates = async (staffId, absentDatesSet) => {
    try {
      // Convert Set to Array
      const absentDatesArray = Array.from(absentDatesSet)
      
      // Also update isAbsentToday based on today's date
      const today = new Date()
      const formatDateKey = (year, month, day) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
      const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
      const isAbsentToday = absentDatesSet.has(todayKey)
      
      await updateStaffAttendance(staffId, {
        absentDates: absentDatesArray,
        isAbsentToday
      })
      
      // Refresh staff data
      const data = await getStaffData()
      const mappedData = data.map(staff => ({
        ...staff,
        id: staff._id || staff.id
      }))
      setStaffData(mappedData)
    } catch (error) {
      console.error('Error updating absent dates:', error)
      showError('Failed to update attendance. Please try again.')
    }
  }

  // Filter staff based on search query
  const filteredStaff = staffData.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

      if (isLoading) {
        return <Loader fullScreen text="Loading dashboard..." />
      }

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
          {filteredStaff.length > 0 ? (
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
