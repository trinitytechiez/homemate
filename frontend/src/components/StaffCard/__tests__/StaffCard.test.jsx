import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import StaffCard from '../StaffCard'
import { ModalProvider } from '../../../contexts/ModalContext'
import { ToastProvider } from '../../../contexts/ToastContext'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderStaffCard = (props = {}) => {
  const defaultProps = {
    staff: {
      id: '1',
      _id: '1',
      name: 'John Doe',
      role: 'Cleaner',
      monthlySalary: 5000,
      currency: 'INR',
      payTillToday: 2500,
      leavesTillToday: 2,
      isAbsentToday: false,
      absentDates: [],
      phoneNumber: '+911234567890'
    },
    onAbsentToggle: vi.fn(),
    onAbsentDatesUpdate: vi.fn(),
    ...props
  }

  return render(
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <StaffCard {...defaultProps} />
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

describe('StaffCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders staff information', () => {
    renderStaffCard()
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Cleaner')).toBeInTheDocument()
    expect(screen.getByText(/Pay till today/i)).toBeInTheDocument()
    expect(screen.getByText(/Leaves till today/i)).toBeInTheDocument()
  })

  it('displays absent button', () => {
    renderStaffCard()
    
    expect(screen.getByRole('button', { name: /Mark absent today/i })).toBeInTheDocument()
  })

  it('toggles absent status', () => {
    const onAbsentToggle = vi.fn()
    renderStaffCard({ onAbsentToggle })
    
    const absentButton = screen.getByRole('button', { name: /Mark absent today/i })
    fireEvent.click(absentButton)
    
    expect(onAbsentToggle).toHaveBeenCalled()
  })

  it('shows "Undo absent" when staff is absent', () => {
    renderStaffCard({
      staff: {
        id: '1',
        name: 'John Doe',
        role: 'Cleaner',
        isAbsentToday: true,
        monthlySalary: 5000,
        currency: 'INR',
        payTillToday: 2500,
        leavesTillToday: 2,
        absentDates: []
      }
    })
    
    expect(screen.getByRole('button', { name: /Undo absent/i })).toBeInTheDocument()
  })

  it('navigates to staff profile when name is clicked', () => {
    renderStaffCard()
    
    const nameLink = screen.getByText('John Doe')
    fireEvent.click(nameLink)
    
    expect(mockNavigate).toHaveBeenCalledWith('/staff/1', expect.any(Object))
  })

  it('opens phone dialer when phone icon is clicked', () => {
    const originalLocation = window.location
    delete window.location
    window.location = { href: '' }
    
    renderStaffCard()
    
    const phoneButton = screen.getByRole('button', { name: /Call/i })
    fireEvent.click(phoneButton)
    
    expect(window.location.href).toBe('tel:+911234567890')
    
    window.location = originalLocation
  })

  it('opens attendance calendar when calendar icon is clicked', () => {
    renderStaffCard()
    
    const calendarButton = screen.getByRole('button', { name: /Calendar/i })
    fireEvent.click(calendarButton)
    
    expect(screen.getByText(/Attendance log/i)).toBeInTheDocument()
  })
})

