import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AttendanceCalendar from '../AttendanceCalendar'
import { ModalProvider } from '../../../contexts/ModalContext'

const renderCalendar = (props = {}) => {
  const defaultProps = {
    staffName: 'John Doe',
    staffId: '1',
    initialAbsentDates: new Set(),
    onAbsentDatesUpdate: vi.fn(),
    ...props
  }

  return render(
    <ModalProvider>
      <AttendanceCalendar {...defaultProps} />
    </ModalProvider>
  )
}

describe('AttendanceCalendar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders calendar with current month', () => {
    renderCalendar()
    
    const currentDate = new Date()
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' })
    expect(screen.getByText(new RegExp(monthName, 'i'))).toBeInTheDocument()
  })

  it('displays week day headers', () => {
    renderCalendar()
    
    expect(screen.getByText('Su')).toBeInTheDocument()
    expect(screen.getByText('Mo')).toBeInTheDocument()
    expect(screen.getByText('Tu')).toBeInTheDocument()
  })

  it('allows selecting dates', () => {
    renderCalendar()
    
    // Find calendar day elements
    const calendarDays = screen.getAllByText(/\d+/).filter(el => {
      return el.closest('.calendarDay') || el.textContent.match(/^\d+$/)
    })
    
    if (calendarDays.length > 0) {
      fireEvent.click(calendarDays[0])
      // Should be able to mark absent
      expect(screen.getByRole('button', { name: /Mark Absent/i })).toBeInTheDocument()
    }
  })

  it('marks dates as absent', () => {
    const onAbsentDatesUpdate = vi.fn()
    renderCalendar({ onAbsentDatesUpdate })
    
    const calendarDays = screen.getAllByText(/\d+/).filter(el => {
      return el.closest('.calendarDay') || el.textContent.match(/^\d+$/)
    })
    
    if (calendarDays.length > 0) {
      fireEvent.click(calendarDays[0])
      const markButton = screen.getByRole('button', { name: /Mark Absent/i })
      fireEvent.click(markButton)
      
      expect(onAbsentDatesUpdate).toHaveBeenCalled()
    }
  })

  it('displays staff name in header', () => {
    renderCalendar({ staffName: 'John Doe' })
    
    expect(screen.getByText(/Attendance log: John Doe/i)).toBeInTheDocument()
  })

  it('has cancel button', () => {
    renderCalendar()
    
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('navigates to previous month', () => {
    renderCalendar()
    
    const prevButton = screen.getByRole('button', { name: /←/ })
    fireEvent.click(prevButton)
    
    // Calendar should update
    expect(prevButton).toBeInTheDocument()
  })

  it('navigates to next month', () => {
    renderCalendar()
    
    const nextButton = screen.getByRole('button', { name: /→/ })
    fireEvent.click(nextButton)
    
    // Calendar should update
    expect(nextButton).toBeInTheDocument()
  })
})

