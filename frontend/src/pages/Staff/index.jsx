import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import EmptyState from '../../components/EmptyState/EmptyState'
import Shimmer from '../../components/Shimmer'
import { getStaffData } from '../../utils/staffData'
import { useToast } from '../../contexts/ToastContext'
import { useRequestCancellation } from '../../utils/useRequestCancellation'
import styles from './styles.module.scss'

const Staff = () => {
  const navigate = useNavigate()
  const { showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [staffData, setStaffData] = useState([])
  const { signal, trackRequest, untrackRequest } = useRequestCancellation()

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token')
      
      if (!token || token.trim().length === 0) {
        navigate('/login', { replace: true })
        return
      }

      try {
        const data = await getStaffData(true, signal, trackRequest, untrackRequest)
        // Check if component is still mounted and request wasn't cancelled
        if (!signal?.aborted) {
          const mappedData = data.map(staff => ({
            ...staff,
            id: staff._id || staff.id
          }))
          setStaffData(mappedData)
        }
      } catch (error) {
        // Don't handle cancelled requests
        if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.message === 'Request cancelled') {
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
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadData()
  }, [navigate, showError, signal, trackRequest, untrackRequest])

  // Filter staff based on search query
  const filteredStaff = (staffData || []).filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStaffClick = (staff) => {
    navigate(`/staff/${staff.id || staff._id}`, { 
      state: { 
        staff,
        fromStaffList: true
      } 
    })
  }

  const handleFilterClick = () => {
    console.log('Filter clicked')
  }

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
                      <img src={staff.avatar} alt={staff.name} />
                    ) : (
                      <span className={styles.avatarPlaceholder}>
                        {staff.name.charAt(0).toUpperCase()}
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
