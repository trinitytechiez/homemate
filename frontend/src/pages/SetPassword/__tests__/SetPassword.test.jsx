import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SetPassword from '../SetPassword'
import { ModalProvider } from '../../../contexts/ModalContext'
import { ToastProvider } from '../../../contexts/ToastContext'
import api from '../../../utils/api'

// Mock dependencies
vi.mock('../../../utils/api', () => ({
  default: {
    put: vi.fn()
  }
}))

const mockNavigate = vi.fn()
const mockLocation = {
  state: {
    userId: '123',
    token: 'test-token',
    email: 'test@example.com',
    name: 'Test User'
  }
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation
  }
})

const renderSetPassword = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <SetPassword />
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

describe('SetPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders SetPassword form', () => {
    renderSetPassword()
    
    expect(screen.getByText('Set a Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/Enter New Password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument()
  })

  it('validates password length', async () => {
    renderSetPassword()
    
    const passwordInput = screen.getByLabelText(/Enter New Password/i)
    const confirmInput = screen.getByLabelText(/Confirm Password/i)
    const confirmButton = screen.getByRole('button', { name: /Confirm/i })
    
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.change(confirmInput, { target: { value: '123' } })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(api.put).not.toHaveBeenCalled()
    })
  })

  it('validates password match', async () => {
    renderSetPassword()
    
    const passwordInput = screen.getByLabelText(/Enter New Password/i)
    const confirmInput = screen.getByLabelText(/Confirm Password/i)
    const confirmButton = screen.getByRole('button', { name: /Confirm/i })
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password456' } })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(api.put).not.toHaveBeenCalled()
    })
  })

  it('submits form with valid password', async () => {
    api.put.mockResolvedValue({ data: { message: 'Password set successfully' } })
    
    renderSetPassword()
    
    const passwordInput = screen.getByLabelText(/Enter New Password/i)
    const confirmInput = screen.getByLabelText(/Confirm Password/i)
    const confirmButton = screen.getByRole('button', { name: /Confirm/i })
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password123' } })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/user/set-password', {
        password: 'password123'
      })
    })
  })

  it('has back button', () => {
    renderSetPassword()
    
    const backButton = screen.getByRole('button', { name: /Go back/i })
    expect(backButton).toBeInTheDocument()
  })

  it('navigates back when back button is clicked', () => {
    renderSetPassword()
    
    const backButton = screen.getByRole('button', { name: /Go back/i })
    fireEvent.click(backButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('handles API errors', async () => {
    api.put.mockRejectedValue(new Error('API Error'))
    
    renderSetPassword()
    
    const passwordInput = screen.getByLabelText(/Enter New Password/i)
    const confirmInput = screen.getByLabelText(/Confirm Password/i)
    const confirmButton = screen.getByRole('button', { name: /Confirm/i })
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password123' } })
    fireEvent.click(confirmButton)
    
    await waitFor(() => {
      // Should handle error gracefully
      expect(api.put).toHaveBeenCalled()
    })
  })
})

