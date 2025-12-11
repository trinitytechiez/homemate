import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Staff from '../index.jsx'
import { ModalProvider } from '../../../contexts/ModalContext'
import { ToastProvider } from '../../../contexts/ToastContext'
import { getStaffData } from '../../../utils/staffData'

// Mock dependencies
vi.mock('../../../utils/staffData', () => ({
  getStaffData: vi.fn()
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderStaff = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <Staff />
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
    currency: 'INR'
  }
]

describe('Staff Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('token', 'test-token')
  })

  it('renders Staff page', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderStaff()
    
    await waitFor(() => {
      expect(screen.getByText('home/mate')).toBeInTheDocument()
    })
  })

  it('displays staff list when data is loaded', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderStaff()
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('displays empty state when no staff', async () => {
    getStaffData.mockResolvedValue([])
    
    renderStaff()
    
    await waitFor(() => {
      expect(screen.getByText(/No staff members yet/i)).toBeInTheDocument()
    })
  })

  it('navigates to add staff page from empty state', async () => {
    getStaffData.mockResolvedValue([])
    
    renderStaff()
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /Add Staff Member/i })
      fireEvent.click(addButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/add')
    })
  })

  it('filters staff based on search query', async () => {
    getStaffData.mockResolvedValue(mockStaffData)
    
    renderStaff()
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText(/Search/i)
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('redirects to login if no token', async () => {
    localStorage.removeItem('token')
    
    renderStaff()
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('handles API errors gracefully', async () => {
    getStaffData.mockRejectedValue(new Error('API Error'))
    
    renderStaff()
    
    await waitFor(() => {
      // Should handle error without crashing
      expect(screen.getByText('home/mate')).toBeInTheDocument()
    })
  })
})



