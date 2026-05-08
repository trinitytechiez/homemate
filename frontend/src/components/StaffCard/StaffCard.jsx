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
    monthlySalary,
    currency,
    paidLeaves,
    phoneNumber,
    payCycle,
    absentDates = [],
    halfDayDates = [],
    advances = [],
    payments = []
  } = staff

  // Memoize date sets
  const absentDatesSet = useMemo(() => new Set(absentDates), [absentDates])
  const halfDayDatesSet = useMemo(() => new Set(halfDayDates), [halfDayDates])

  useEffect(() => {
    if (staff.isAbsentToday !== undefined) {
      setIsAbsent(staff.isAbsentToday)
    }
  }, [staff.isAbsentToday])

  const formatDateKey = useCallback((year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }, [])

  const handleAbsentToggle = useCallback(() => {
    const newAbsentStatus = !isAbsent
    setIsAbsent(newAbsentStatus)

    const today = new Date()
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
    const newAbsentDates = new Set(absentDatesSet)
    const newHalfDayDates = new Set(halfDayDatesSet)

    if (newAbsentStatus) {
      newAbsentDates.add(todayKey)
      newHalfDayDates.delete(todayKey) // can't be both
    } else {
      newAbsentDates.delete(todayKey)
    }

    if (onAbsentToggle) onAbsentToggle(newAbsentStatus)
    if (onAbsentDatesUpdate) onAbsentDatesUpdate(newAbsentDates, newHalfDayDates)
  }, [isAbsent, absentDatesSet, halfDayDatesSet, formatDateKey, onAbsentToggle, onAbsentDatesUpdate])

  const handlePhoneClick = useCallback(() => {
    if (phoneNumber) {
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
    openModal({
      title: `Attendance log: ${name}`,
      content: (
        <AttendanceCalendar
          staffName={name}
          staffId={staff.id || staff._id}
          initialAbsentDates={absentDatesSet}
          initialHalfDayDates={halfDayDatesSet}
          onAbsentDatesUpdate={onAbsentDatesUpdate}
        />
      ),
      size: 'large'
    })
  }, [name, staff.id, staff._id, absentDatesSet, halfDayDatesSet, onAbsentDatesUpdate, openModal])

  const handleNameClick = useCallback(() => {
    navigate(`/staff/${staff.id || staff._id}`, { state: { staff } })
  }, [navigate, staff])

  const currencySymbol = useMemo(() => getCurrencySymbol(currency || 'INR'), [currency])

  // Pending advance total
  const pendingAdvanceTotal = useMemo(
    () => advances.filter(a => !a.deducted).reduce((s, a) => s + a.amount, 0),
    [advances]
  )

  // Current month payment status
  const today = new Date()
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const currentPayment = useMemo(
    () => payments.find(p => p.month === currentMonthKey),
    [payments, currentMonthKey]
  )

  const payStatusColors = { paid: '#28a745', partial: '#fd7e14', pending: '#dc3545' }

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
          <button className={styles.iconButton} aria-label="Call" onClick={handlePhoneClick}>
            <span className={styles.icon}>📞</span>
          </button>
          <button className={styles.iconButton} aria-label="Calendar" onClick={handleCalendarClick}>
            <span className={styles.icon}>📅</span>
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Monthly salary:</span>
          <span className={styles.infoValue}>{currencySymbol} {monthlySalary?.toLocaleString('en-IN') || 0}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Paid leaves:</span>
          <span className={styles.infoValue}>{paidLeaves || 0} / month</span>
        </div>
        {pendingAdvanceTotal > 0 && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Pending advance:</span>
            <span className={styles.infoValue} style={{ color: '#fd7e14', fontWeight: 700 }}>
              {currencySymbol} {pendingAdvanceTotal.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        {currentPayment && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>This month:</span>
            <span
              className={styles.infoValue}
              style={{ color: payStatusColors[currentPayment.status], fontWeight: 700 }}
            >
              {currentPayment.status === 'paid'
                ? `✅ Paid ${currencySymbol}${currentPayment.amountPaid?.toLocaleString('en-IN')}`
                : currentPayment.status === 'partial'
                ? `⚠️ Partial ${currencySymbol}${currentPayment.amountPaid?.toLocaleString('en-IN')}`
                : '🔴 Pending'}
            </span>
          </div>
        )}
        <div className={styles.infoRow}>
          <span className={styles.infoText}>
            {payCycle || 'Monthly'} | {currency || 'INR'}
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
  return (
    prevProps.staff.id === nextProps.staff.id &&
    prevProps.staff.isAbsentToday === nextProps.staff.isAbsentToday &&
    prevProps.staff.name === nextProps.staff.name &&
    prevProps.staff.role === nextProps.staff.role &&
    prevProps.staff.monthlySalary === nextProps.staff.monthlySalary &&
    JSON.stringify(prevProps.staff.absentDates) === JSON.stringify(nextProps.staff.absentDates) &&
    JSON.stringify(prevProps.staff.halfDayDates) === JSON.stringify(nextProps.staff.halfDayDates) &&
    JSON.stringify(prevProps.staff.advances) === JSON.stringify(nextProps.staff.advances) &&
    JSON.stringify(prevProps.staff.payments) === JSON.stringify(nextProps.staff.payments) &&
    prevProps.onAbsentToggle === nextProps.onAbsentToggle &&
    prevProps.onAbsentDatesUpdate === nextProps.onAbsentDatesUpdate
  )
})

StaffCard.displayName = 'StaffCard'

export default StaffCard
