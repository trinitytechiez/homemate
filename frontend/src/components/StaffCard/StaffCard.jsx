import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import AttendanceCalendar from '../AttendanceCalendar/AttendanceCalendar'
import { getCurrencySymbol } from '../../utils/currency'
import styles from './StaffCard.module.scss'

const StaffCard = memo(({ staff, onAbsentToggle, onAbsentDatesUpdate }) => {
  const [isAbsent, setIsAbsent] = useState(staff.isAbsentToday || false)
  const { openModal } = useModal()
  const navigate = useNavigate()
  
  const {
    name,
    role,
    avatar,
    payTillToday,
    leavesTillToday,
    monthlySalary,
    currency,
    paidLeaves,
    phoneNumber,
    absentDates = []
  } = staff
  
  // Memoize absentDatesSet to avoid recreating on every render
  const absentDatesSet = useMemo(() => new Set(absentDates), [absentDates])
  
  useEffect(() => {
    if (staff.isAbsentToday !== undefined) {
      setIsAbsent(staff.isAbsentToday)
    }
  }, [staff.isAbsentToday])

  // Memoize formatDateKey function
  const formatDateKey = useCallback((year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }, [])

  const handleAbsentToggle = useCallback(() => {
    const newAbsentStatus = !isAbsent
    setIsAbsent(newAbsentStatus)
    
    const today = new Date()
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
    const newAbsentDates = new Set(absentDatesSet)
    
    if (newAbsentStatus) {
      newAbsentDates.add(todayKey)
    } else {
      newAbsentDates.delete(todayKey)
    }
    
    if (onAbsentToggle) {
      onAbsentToggle(newAbsentStatus)
    }
    if (onAbsentDatesUpdate) {
      onAbsentDatesUpdate(newAbsentDates)
    }
  }, [isAbsent, absentDatesSet, formatDateKey, onAbsentToggle, onAbsentDatesUpdate])

  const handlePhoneClick = useCallback(() => {
    if (phoneNumber) {
      // Open phone dialer
      window.location.href = `tel:${phoneNumber}`
    } else {
      openModal({
        title: 'Phone Number',
        content: <p>Phone number not available for {name}</p>,
        size: 'small'
      })
    }
  }, [phoneNumber, name, openModal])

  const handleCalendarClick = useCallback(() => {
    // Open attendance calendar modal
    openModal({
      title: `Attendance log: ${name}`,
      content: (
        <AttendanceCalendar 
          staffName={name} 
          staffId={staff.id || staff._id}
          initialAbsentDates={absentDatesSet}
          onAbsentDatesUpdate={onAbsentDatesUpdate}
        />
      ),
      size: 'large'
    })
  }, [name, staff.id, staff._id, absentDatesSet, onAbsentDatesUpdate, openModal])

  const handleNameClick = useCallback(() => {
    navigate(`/staff/${staff.id || staff._id}`, { state: { staff } })
  }, [navigate, staff])

  // Memoize currency symbol
  const currencySymbol = useMemo(() => getCurrencySymbol(currency || 'INR'), [currency])

  return (
    <div className={styles.staffCard}>
      <div className={styles.cardHeader}>
        <div className={styles.staffInfo}>
          <div className={styles.avatar}>
            {avatar ? (
              <img src={avatar} alt={name} />
            ) : (
              <span className={styles.avatarPlaceholder}>
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className={styles.staffDetails}>
            <h3 
              className={styles.staffName}
              onClick={handleNameClick}
              style={{ cursor: 'pointer' }}
            >
              {name}
            </h3>
            <p className={styles.staffRole}>{role}</p>
          </div>
        </div>
        <div className={styles.actionIcons}>
          <button 
            className={styles.iconButton} 
            aria-label="Call"
            onClick={handlePhoneClick}
          >
            <span className={styles.icon}>📞</span>
          </button>
          <button 
            className={styles.iconButton} 
            aria-label="Calendar"
            onClick={handleCalendarClick}
          >
            <span className={styles.icon}>📅</span>
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Pay till today:</span>
              <span className={styles.infoValue}>{currencySymbol} {payTillToday}</span>
            </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Leaves till today:</span>
          <span className={styles.infoValue}>{leavesTillToday}</span>
        </div>
            <div className={styles.infoRow}>
              <span className={styles.infoText}>
                Monthly salary: {currencySymbol} {monthlySalary} | Paid leaves: {paidLeaves}
              </span>
            </div>
      </div>

      <button 
        className={`${styles.absentButton} ${isAbsent ? styles.absentButtonActive : ''}`}
        onClick={handleAbsentToggle}
      >
        {isAbsent ? 'Undo absent' : 'Mark absent today'}
      </button>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.staff.id === nextProps.staff.id &&
    prevProps.staff.isAbsentToday === nextProps.staff.isAbsentToday &&
    prevProps.staff.name === nextProps.staff.name &&
    prevProps.staff.role === nextProps.staff.role &&
    JSON.stringify(prevProps.staff.absentDates) === JSON.stringify(nextProps.staff.absentDates) &&
    prevProps.onAbsentToggle === nextProps.onAbsentToggle &&
    prevProps.onAbsentDatesUpdate === nextProps.onAbsentDatesUpdate
  )
})

StaffCard.displayName = 'StaffCard'

export default StaffCard

