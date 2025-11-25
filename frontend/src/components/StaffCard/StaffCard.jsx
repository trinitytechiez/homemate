import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import AttendanceCalendar from '../AttendanceCalendar/AttendanceCalendar'
import { getCurrencySymbol } from '../../utils/currency'
import styles from './StaffCard.module.scss'

const StaffCard = ({ staff, onAbsentToggle, onAbsentDatesUpdate }) => {
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
  
  // Convert absentDates array to Set for easier manipulation
  const absentDatesSet = new Set(absentDates)
  
  // Sync local state with prop
  useEffect(() => {
    if (staff.isAbsentToday !== undefined) {
      setIsAbsent(staff.isAbsentToday)
    }
  }, [staff.isAbsentToday])

  const handleAbsentToggle = () => {
    const newAbsentStatus = !isAbsent
    setIsAbsent(newAbsentStatus)
    
    // Update today's absent status
    const today = new Date()
    const formatDateKey = (year, month, day) => {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
    const newAbsentDates = new Set(absentDatesSet)
    
    if (newAbsentStatus) {
      newAbsentDates.add(todayKey)
    } else {
      newAbsentDates.delete(todayKey)
    }
    
    // Notify parent component
    if (onAbsentToggle) {
      onAbsentToggle(newAbsentStatus)
    }
    if (onAbsentDatesUpdate) {
      onAbsentDatesUpdate(newAbsentDates)
    }
    
    // TODO: Add API call to update absent status
  }

  const handlePhoneClick = () => {
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
  }

  const handleCalendarClick = () => {
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
  }

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
              onClick={() => {
                // Navigate to staff profile
                navigate(`/staff/${staff.id || staff._id}`, { state: { staff } })
              }}
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
              <span className={styles.infoValue}>{getCurrencySymbol(currency || 'INR')} {payTillToday}</span>
            </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Leaves till today:</span>
          <span className={styles.infoValue}>{leavesTillToday}</span>
        </div>
            <div className={styles.infoRow}>
              <span className={styles.infoText}>
                Monthly salary: {getCurrencySymbol(currency || 'INR')} {monthlySalary} | Paid leaves: {paidLeaves}
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
}

export default StaffCard

