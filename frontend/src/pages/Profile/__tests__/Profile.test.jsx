import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Profile from '../index'
import { ModalProvider } from '../../../contexts/ModalContext'
import { ToastProvider } from '../../../contexts/ToastContext'
import api from '../../../utils/api'

// Mock dependencies
vi.mock('../../../utils/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn()
  }
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const mockUserData = {
  user: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '+911234567890',
    location: 'Mumbai',
    dob: '01/01/1990'
  }
}

const renderProfile = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <Profile />
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('token', 'test-token')
    api.get.mockResolvedValue({ data: mockUserData })
  })

  it('renders Profile page', async () => {
    renderProfile()
    
    await waitFor(() => {
      expect(screen.getByText('home/mate')).toBeInTheDocument()
    })
  })

  it('loads and displays user profile data', async () => {
    renderProfile()
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
    })
  })

  it('enters edit mode when edit button is clicked', async () => {
    renderProfile()
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)
      
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })
  })

  it('validates required fields in edit mode', async () => {
    renderProfile()
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)
      
      const nameInput = screen.getByDisplayValue('John Doe')
      fireEvent.change(nameInput, { target: { value: '' } })
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      fireEvent.click(saveButton)
      
      expect(api.put).not.toHaveBeenCalled()
    })
  })

  it('saves profile changes', async () => {
    api.put.mockResolvedValue({ data: { user: { ...mockUserData.user, name: 'Jane Doe' } } })
    
    renderProfile()
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)
      
      const nameInput = screen.getByDisplayValue('John Doe')
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
      
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      fireEvent.click(saveButton)
      
      expect(api.put).toHaveBeenCalled()
    })
  })

  it('cancels edit mode', async () => {
    renderProfile()
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)
      
      expect(screen.queryByRole('button', { name: /Save Changes/i })).not.toBeInTheDocument()
    })
  })

  it('redirects to login if no token', async () => {
    localStorage.removeItem('token')
    
    renderProfile()
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('handles API errors gracefully', async () => {
    api.get.mockRejectedValue(new Error('API Error'))
    
    renderProfile()
    
    await waitFor(() => {
      // Should handle error without crashing
      expect(screen.getByText('home/mate')).toBeInTheDocument()
    })
  })
})



