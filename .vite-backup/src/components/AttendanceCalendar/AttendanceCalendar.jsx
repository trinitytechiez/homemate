import { useState } from 'react'
import { useModal } from '../../contexts/ModalContext'
import styles from './AttendanceCalendar.module.scss'

const AttendanceCalendar = ({
  staffName,
  staffId,
  initialAbsentDates = new Set(),
  initialHalfDayDates = new Set(),
  onAbsentDatesUpdate
}) => {
  const { closeModal } = useModal()
  const [currentDate, setCurrentDate] = useState(new Date())

  const [absentDates, setAbsentDates] = useState(() =>
    initialAbsentDates instanceof Set ? new Set(initialAbsentDates) : new Set(initialAbsentDates)
  )
  const [halfDayDates, setHalfDayDates] = useState(() =>
    initialHalfDayDates instanceof Set ? new Set(initialHalfDayDates) : new Set(initialHalfDayDates)
  )

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()

  const isCurrentMonthPast =
    currentYear < todayYear || (currentYear === todayYear && currentMonth < todayMonth)

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
  const prevMonthDays = []
  if (!isCurrentMonthPast) {
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push(prevMonthLastDay - i)
    }
  }

  const formatDateKey = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const isDateToday = (year, month, day) =>
    year === todayYear && month === todayMonth && day === todayDay

  const isDateSelectable = (year, month, day) => {
    if (year === currentYear && month === currentMonth) return true
    if (year > currentYear || (year === currentYear && month > currentMonth)) return true
    return false
  }

  const getDateState = (year, month, day) => {
    const key = formatDateKey(year, month, day)
    if (absentDates.has(key)) return 'absent'
    if (halfDayDates.has(key)) return 'halfday'
    return 'present'
  }

  // Cycle: present → absent → halfday → present
  const handleDateClick = (year, month, day) => {
    if (!isDateSelectable(year, month, day)) return
    const key = formatDateKey(year, month, day)
    const newAbsent = new Set(absentDates)
    const newHalfDay = new Set(halfDayDates)
    const state = getDateState(year, month, day)

    if (state === 'present') {
      newAbsent.add(key)
      newHalfDay.delete(key)
    } else if (state === 'absent') {
      newAbsent.delete(key)
      newHalfDay.add(key)
    } else {
      // halfday → present
      newAbsent.delete(key)
      newHalfDay.delete(key)
    }

    setAbsentDates(newAbsent)
    setHalfDayDates(newHalfDay)

    if (onAbsentDatesUpdate) {
      onAbsentDatesUpdate(newAbsent, newHalfDay)
    }
  }

  const handlePrevMonth = () => {
    if (isCurrentMonthPast) return
    const prevMonth = new Date(currentYear, currentMonth - 1, 1)
    const pY = prevMonth.getFullYear()
    const pM = prevMonth.getMonth()
    if (pY > todayYear || (pY === todayYear && pM >= todayMonth)) {
      setCurrentDate(prevMonth)
    } else {
      setCurrentDate(new Date(todayYear, todayMonth, 1))
    }
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Summary counts for the current month
  const totalDaysInMonth = daysInMonth
  let absentCount = 0
  let halfDayCount = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const key = formatDateKey(currentYear, currentMonth, d)
    if (absentDates.has(key)) absentCount++
    else if (halfDayDates.has(key)) halfDayCount++
  }
  const presentCount = totalDaysInMonth - absentCount - halfDayCount

  return (
    <div className={styles.attendanceCalendar}>
      <div className={styles.calendarHeader}>
        <button
          className={`${styles.monthNavButton} ${isCurrentMonthPast ? styles.disabled : ''}`}
          onClick={handlePrevMonth}
          disabled={isCurrentMonthPast}
          title={isCurrentMonthPast ? 'Cannot navigate to past months' : 'Previous month'}
        >
          ←
        </button>
        <h3 className={styles.monthTitle}>
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button className={styles.monthNavButton} onClick={handleNextMonth} title="Next month">
          →
        </button>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendPresent}`}></span> Present
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendAbsent}`}></span> Absent
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendHalfday}`}></span> Half Day
        </span>
      </div>

      <div className={styles.calendar}>
        <div className={styles.weekDays}>
          {weekDays.map((day) => (
            <div key={day} className={styles.weekDay}>{day}</div>
          ))}
        </div>

        <div className={styles.calendarGrid}>
          {prevMonthDays.map((day) => (
            <div key={`prev-${day}`} className={styles.calendarDayPrev}>{day}</div>
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const state = getDateState(currentYear, currentMonth, day)
            const isToday = isDateToday(currentYear, currentMonth, day)
            const selectable = isDateSelectable(currentYear, currentMonth, day)

            let dayClass = styles.calendarDay
            if (!selectable) dayClass += ` ${styles.disabled}`
            if (state === 'absent' && selectable) dayClass += ` ${styles.absent}`
            if (state === 'halfday' && selectable) dayClass += ` ${styles.halfday}`
            if (isToday && state === 'present') dayClass += ` ${styles.today}`

            return (
              <div
                key={day}
                className={dayClass}
                onClick={() => handleDateClick(currentYear, currentMonth, day)}
                title={selectable ? 'Tap to cycle: Present → Absent → Half Day' : 'Past month'}
              >
                {day}
                {state === 'halfday' && selectable && (
                  <span className={styles.halfDayIndicator}>½</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryNumber}>{presentCount}</span>
          <span className={styles.summaryLabel}>Present</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryNumber} ${styles.absentNum}`}>{absentCount}</span>
          <span className={styles.summaryLabel}>Absent</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryNumber} ${styles.halfdayNum}`}>{halfDayCount}</span>
          <span className={styles.summaryLabel}>Half Day</span>
        </div>
      </div>

      <div className={styles.calendarActions}>
        <p className={styles.tapHint}>Tap a date to cycle: Present → Absent → Half Day</p>
        <button className={styles.cancelButton} onClick={closeModal}>
          Done
        </button>
      </div>
    </div>
  )
}

export default AttendanceCalendar
