import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Settings from '../Settings'
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

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <Settings />
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('token', 'test-token')
  })

  it('renders Settings page', () => {
    renderSettings()
    
    expect(screen.getByText('home/mate')).toBeInTheDocument()
    expect(screen.getByText(/Change password/i)).toBeInTheDocument()
    expect(screen.getByText(/Delete account/i)).toBeInTheDocument()
    expect(screen.getByText(/Logout/i)).toBeInTheDocument()
  })

  it('opens change password modal', async () => {
    renderSettings()
    
    const changePasswordButton = screen.getByText(/Change password/i)
    fireEvent.click(changePasswordButton)
    
    await waitFor(() => {
      expect(screen.getByText('Change Password')).toBeInTheDocument()
    })
  })

  it('opens delete account confirmation modal', async () => {
    renderSettings()
    
    const deleteButton = screen.getByText(/Delete account/i)
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(screen.getByText('Delete Account')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument()
    })
  })

  it('opens logout confirmation modal', async () => {
    renderSettings()
    
    const logoutButton = screen.getByText(/Logout/i)
    fireEvent.click(logoutButton)
    
    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument()
    })
  })

  it('navigates to about page', () => {
    renderSettings()
    
    const aboutButton = screen.getByText(/About this app/i)
    fireEvent.click(aboutButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/about')
  })

  it('redirects to login if no token', async () => {
    localStorage.removeItem('token')
    
    renderSettings()
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('handles logout confirmation', async () => {
    renderSettings()
    
    const logoutButton = screen.getByText(/Logout/i)
    fireEvent.click(logoutButton)
    
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /Logout/i })
      fireEvent.click(confirmButton)
      
      expect(localStorage.getItem('token')).toBeNull()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})

