import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'
import { ModalProvider } from '../../../contexts/ModalContext'
import { ToastProvider } from '../../../contexts/ToastContext'
import { getStaffData } from '../../../utils/staffData'

// Mock dependencies
vi.mock('../../../utils/staffData', () => ({
  getStaffData: vi.fn(),
  updateStaffAttendance: vi.fn(),
  updateStaffMember: vi.fn()
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <Dashboard />
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

const mockStaffData = [
  {
    id: '1',
    _id: '1',
    name: 'John Doe',
    role: 'Cleaner',
    monthlySalary: 5000,
    currency: 'INR',
    payTillToday: 2500,
    leavesTillToday: 2,
    isAbsentToday: false,
    absentDates: []
  },
  {
    id: '2',
    _id: '2',
    name: 'Jane Smith',
    role: 'Cook',
    monthlySalary: 6000,
    currency: 'INR',
    payTillToday: 3000,
    leavesTillToday: 1,
    isAbsentToday: true,
    absentDates: []
  }
]

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('token', 'test-token')
  })

  it('renders dashboard header', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('home/mate')).toBeInTheDocument()
    })
  })

  it('displays current date', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderDashboard()
    
    await waitFor(() => {
      const dateButton = screen.getByRole('button', { name: /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i })
      expect(dateButton).toBeInTheDocument()
    })
  })

  it('displays monthly/weekly toggle', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('Monthly')).toBeInTheDocument()
      expect(screen.getByText('Weekly')).toBeInTheDocument()
    })
  })

  it('displays search bar', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderDashboard()
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search/i)
      expect(searchInput).toBeInTheDocument()
    })
  })

  it('displays staff cards when data is loaded', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('displays empty state when no staff', async () => {
    getStaffData.mockResolvedValue([])
    
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText(/No staff members yet/i)).toBeInTheDocument()
    })
  })

  it('filters staff based on search query', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText(/Search/i)
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })

  it('toggles between monthly and weekly view', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderDashboard()
    
    await waitFor(() => {
      const weeklyButton = screen.getByText('Weekly')
      fireEvent.click(weeklyButton)
      
      expect(weeklyButton.closest('button')).toHaveClass(/active/)
    })
  })

  it('redirects to login if no token', async () => {
    localStorage.removeItem('token')
    
    renderDashboard()
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('handles API errors gracefully', async () => {
    getStaffData.mockRejectedValue(new Error('API Error'))
    
    renderDashboard()
    
    await waitFor(() => {
      // Should handle error without crashing
      expect(screen.getByText('home/mate')).toBeInTheDocument()
    })
  })
})

