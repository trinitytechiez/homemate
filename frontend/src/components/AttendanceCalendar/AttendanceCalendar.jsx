import { useState } from 'react'
import { useModal } from '../../contexts/ModalContext'
import styles from './AttendanceCalendar.module.scss'

const AttendanceCalendar = ({ staffName, staffId, initialAbsentDates = new Set(), onAbsentDatesUpdate }) => {
  const { closeModal } = useModal()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null })
  const [isRangeMode, setIsRangeMode] = useState(false) // Auto-detect range mode
  
  // Use initial absent dates from props, or fallback to empty set
  const [absentDates, setAbsentDates] = useState(() => {
    // Convert Set to Set if needed, or use initial value
    return initialAbsentDates instanceof Set ? new Set(initialAbsentDates) : new Set(initialAbsentDates)
  })

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()

  // Check if current viewing month is in the past
  const isCurrentMonthPast = currentYear < todayYear || 
    (currentYear === todayYear && currentMonth < todayMonth)

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Get previous month's last few days (only show if current month is not in the past)
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
  const prevMonthDays = []
  if (!isCurrentMonthPast) {
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push(prevMonthLastDay - i)
    }
  }

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const isDateAbsent = (year, month, day) => {
    const dateKey = formatDateKey(year, month, day)
    return absentDates.has(dateKey)
  }

  const isDateInRange = (year, month, day) => {
    if (!selectedRange.start || !selectedRange.end) return false
    const date = new Date(year, month, day)
    const start = new Date(selectedRange.start)
    const end = new Date(selectedRange.end)
    return date >= start && date <= end
  }

  const isDateToday = (year, month, day) => {
    return (
      year === todayYear &&
      month === todayMonth &&
      day === todayDay
    )
  }

  const isDatePast = (year, month, day) => {
    const date = new Date(year, month, day)
    const todayStart = new Date(todayYear, todayMonth, todayDay)
    todayStart.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return date < todayStart
  }

  const isDateInCurrentMonth = (year, month) => {
    return year === currentYear && month === currentMonth
  }

  const isDateInPastMonth = (year, month) => {
    // Check if the date is in a month before the current month
    return year < currentYear || (year === currentYear && month < currentMonth)
  }

  const isDateSelectable = (year, month, day) => {
    // Allow dates in current month (both past and future dates within the month)
    if (year === currentYear && month === currentMonth) {
      return true
    }
    // Allow all dates in future months
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      return true
    }
    // Disallow dates from past months
    return false
  }

  const isDateSelected = (year, month, day) => {
    if (selectedDate) {
      const date = new Date(year, month, day)
      return date.getTime() === selectedDate.getTime()
    }
    return false
  }

  const handleDateClick = (year, month, day) => {
    // Don't allow clicking on dates from past months
    if (!isDateSelectable(year, month, day)) {
      return
    }

    const clickedDate = new Date(year, month, day)
    const dateKey = formatDateKey(year, month, day)

    // Auto-detect range mode: if a date is already selected and user clicks another date
    if (selectedDate && clickedDate.getTime() !== selectedDate.getTime()) {
      // Start range selection
      const start = selectedDate < clickedDate ? selectedDate : clickedDate
      const end = selectedDate > clickedDate ? selectedDate : clickedDate
      setSelectedRange({ start, end })
      setIsRangeMode(true)
      setSelectedDate(null)
    } else if (selectedRange.start && !selectedRange.end) {
      // Complete range selection
      const start = selectedRange.start
      const end = clickedDate > start ? clickedDate : start
      setSelectedRange({ start, end })
    } else {
      // Start new selection (single or range start)
      setSelectedDate(clickedDate)
      setSelectedRange({ start: null, end: null })
      setIsRangeMode(false)
    }
  }

  const handleMarkAbsent = () => {
    const newAbsentDates = new Set(absentDates)

    if (selectedRange.start && selectedRange.end) {
      // Mark range as absent
      const start = selectedRange.start
      const end = selectedRange.end
      const current = new Date(start)
      
      while (current <= end) {
        const year = current.getFullYear()
        const month = current.getMonth()
        const day = current.getDate()
        
        // Only mark dates that are selectable (current month or future months)
        if (isDateSelectable(year, month, day)) {
          const dateKey = formatDateKey(year, month, day)
          if (newAbsentDates.has(dateKey)) {
            newAbsentDates.delete(dateKey) // Undo absent
          } else {
            newAbsentDates.add(dateKey) // Mark absent
          }
        }
        current.setDate(current.getDate() + 1)
      }
    } else if (selectedDate) {
      // Mark single date as absent
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()
      const day = selectedDate.getDate()
      
      if (isDateSelectable(year, month, day)) {
        const dateKey = formatDateKey(year, month, day)
        if (newAbsentDates.has(dateKey)) {
          newAbsentDates.delete(dateKey) // Undo absent
        } else {
          newAbsentDates.add(dateKey) // Mark absent
        }
      }
    }

    setAbsentDates(newAbsentDates)
    setSelectedDate(null)
    setSelectedRange({ start: null, end: null })
    setIsRangeMode(false)
    
    // Notify parent component of the update
    if (onAbsentDatesUpdate) {
      onAbsentDatesUpdate(newAbsentDates)
    }
    
    // TODO: Add API call to save absent dates
    console.log('Absent dates:', Array.from(newAbsentDates))
  }

  const handlePrevMonth = () => {
    // Don't allow navigating to past months
    if (isCurrentMonthPast) {
      return
    }
    const prevMonth = new Date(currentYear, currentMonth - 1, 1)
    // Only allow if the previous month is current month or future
    const prevMonthYear = prevMonth.getFullYear()
    const prevMonthMonth = prevMonth.getMonth()
    if (prevMonthYear > todayYear || 
        (prevMonthYear === todayYear && prevMonthMonth >= todayMonth)) {
      setCurrentDate(prevMonth)
    } else {
      // Navigate to current month if trying to go past
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

  const canMarkAbsent = () => {
    if (selectedRange.start && selectedRange.end) {
      return true
    }
    return selectedDate !== null
  }

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


      <div className={styles.calendar}>
        <div className={styles.weekDays}>
          {weekDays.map((day) => (
            <div key={day} className={styles.weekDay}>
              {day}
            </div>
          ))}
        </div>

        <div className={styles.calendarGrid}>
          {/* Previous month days */}
          {prevMonthDays.map((day) => (
            <div key={`prev-${day}`} className={styles.calendarDayPrev}>
              {day}
            </div>
          ))}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateKey = formatDateKey(currentYear, currentMonth, day)
            const isAbsent = isDateAbsent(currentYear, currentMonth, day)
            const isToday = isDateToday(currentYear, currentMonth, day)
            const isSelected = isDateSelected(currentYear, currentMonth, day)
            const inRange = isDateInRange(currentYear, currentMonth, day)
            const isPastMonth = isDateInPastMonth(currentYear, currentMonth)
            const isSelectable = isDateSelectable(currentYear, currentMonth, day)

            let dayClass = styles.calendarDay
            if (isAbsent && isSelectable) {
              dayClass += ` ${styles.absent}`
            }
            if (isPastMonth) {
              dayClass += ` ${styles.pastMonth}`
            }
            if (isToday && !isAbsent && !isSelected) {
              dayClass += ` ${styles.today}`
            }
            if (isSelected) {
              dayClass += ` ${styles.selected}`
            }
            if (inRange && selectedRange.start && selectedRange.end) {
              dayClass += ` ${styles.inRange}`
            }
            if (!isSelectable) {
              dayClass += ` ${styles.disabled}`
            }

            return (
              <div
                key={day}
                className={dayClass}
                onClick={() => handleDateClick(currentYear, currentMonth, day)}
                title={isPastMonth ? 'Cannot modify dates from past months' : ''}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>

      {selectedRange.start && (
        <div className={styles.rangeInfo}>
          {selectedRange.end ? (
            <p>
              Selected: {selectedRange.start.toLocaleDateString()} - {selectedRange.end.toLocaleDateString()}
            </p>
          ) : (
            <p>Select end date for range</p>
          )}
        </div>
      )}

      <div className={styles.calendarActions}>
        <button
          className={styles.markAbsentButton}
          onClick={handleMarkAbsent}
          disabled={!canMarkAbsent()}
        >
          {selectedDate && absentDates.has(formatDateKey(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          )) ? 'Undo Absent' : 'Mark Absent'}
        </button>
        <button className={styles.cancelButton} onClick={closeModal}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default AttendanceCalendar

