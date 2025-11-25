import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import StaffProfile from '../StaffProfile'
import { ModalProvider } from '../../../contexts/ModalContext'
import { ToastProvider } from '../../../contexts/ToastContext'
import { getStaffMember, updateStaffMember } from '../../../utils/staffData'

// Mock dependencies
vi.mock('../../../utils/staffData', () => ({
  getStaffMember: vi.fn(),
  updateStaffMember: vi.fn(),
  updateStaffAttendance: vi.fn()
}))

const mockNavigate = vi.fn()
const mockParams = { id: '1' }
const mockLocation = { state: null }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useLocation: () => mockLocation
  }
})

const renderStaffProfile = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <StaffProfile />
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

const mockStaffData = {
  id: '1',
  _id: '1',
  name: 'John Doe',
  role: 'Cleaner',
  location: 'Mumbai',
  phoneNumber: '+911234567890',
  monthlySalary: 5000,
  currency: 'INR',
  payCycle: 'Monthly',
  paidLeaves: 2,
  visitingTime: '9.00 AM',
  dob: '01/01/1990',
  isAbsentToday: false,
  absentDates: []
}

describe('StaffProfile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('token', 'test-token')
    getStaffMember.mockResolvedValue(mockStaffData)
  })

  it('renders StaffProfile page', async () => {
    renderStaffProfile()
    
    await waitFor(() => {
      expect(screen.getByText('home/mate')).toBeInTheDocument()
    })
  })

  it('loads and displays staff data', async () => {
    renderStaffProfile()
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Cleaner')).toBeInTheDocument()
    })
  })

  it('enters edit mode when edit button is clicked', async () => {
    renderStaffProfile()
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)
      
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })
  })

  it('validates required fields in edit mode', async () => {
    renderStaffProfile()
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)
      
      const nameInput = screen.getByDisplayValue('John Doe')
      fireEvent.change(nameInput, { target: { value: '' } })
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      fireEvent.click(saveButton)
      
      expect(updateStaffMember).not.toHaveBeenCalled()
    })
  })

  it('saves staff changes', async () => {
    updateStaffMember.mockResolvedValue({ ...mockStaffData, name: 'Jane Doe' })
    
    renderStaffProfile()
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)
      
      const nameInput = screen.getByDisplayValue('John Doe')
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      fireEvent.click(saveButton)
      
      expect(updateStaffMember).toHaveBeenCalled()
    })
  })

  it('opens attendance calendar', async () => {
    renderStaffProfile()
    
    await waitFor(() => {
      const calendarButton = screen.getByRole('button', { name: /Attendance log/i })
      fireEvent.click(calendarButton)
      
      expect(screen.getByText(/Attendance log/i)).toBeInTheDocument()
    })
  })

  it('redirects to login if no token', async () => {
    localStorage.removeItem('token')
    
    renderStaffProfile()
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('handles API errors gracefully', async () => {
    getStaffMember.mockRejectedValue(new Error('API Error'))
    
    renderStaffProfile()
    
    await waitFor(() => {
      // Should handle error without crashing
      expect(screen.getByText('home/mate')).toBeInTheDocument()
    })
  })
})

