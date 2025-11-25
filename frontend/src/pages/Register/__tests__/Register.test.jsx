import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Register from '../Register'
import { ModalProvider } from '../../../contexts/ModalContext'
import api from '../../../utils/api'

// Mock the API module
vi.mock('../../../utils/api', () => ({
  default: {
    post: vi.fn()
  }
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <ModalProvider>
        <Register />
      </ModalProvider>
    </BrowserRouter>
  )
}

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders register form', () => {
    renderRegister()
    
    expect(screen.getByText('HomeMate')).toBeInTheDocument()
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows validation error for empty name', async () => {
    renderRegister()
    
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('shows validation error for short name', async () => {
    renderRegister()
    
    const nameInput = screen.getByLabelText('Full Name')
    fireEvent.change(nameInput, { target: { value: 'A' } })
    
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
    })
  })

  it('shows validation error when passwords do not match', async () => {
    renderRegister()
    
    const nameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } })
    
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const mockResponse = {
      data: {
        message: 'User registered successfully'
      }
    }
    
    api.post.mockResolvedValue(mockResponse)
    
    renderRegister()
    
    const nameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const termsCheckbox = screen.getByRole('checkbox')
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)
    
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Account created successfully!')).toBeInTheDocument()
    })
  })

  it('redirects to login after successful registration', async () => {
    const mockResponse = {
      data: {
        message: 'User registered successfully'
      }
    }
    
    api.post.mockResolvedValue(mockResponse)
    
    renderRegister()
    
    const nameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const termsCheckbox = screen.getByRole('checkbox')
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)
    
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
    
    // Fast-forward timers
    vi.advanceTimersByTime(2000)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('shows error modal on registration failure', async () => {
    const mockError = {
      response: {
        data: {
          message: 'User with this email already exists'
        }
      }
    }
    
    api.post.mockRejectedValue(mockError)
    
    renderRegister()
    
    const nameInput = screen.getByLabelText('Full Name')
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const termsCheckbox = screen.getByRole('checkbox')
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
    fireEvent.click(termsCheckbox)
    
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Registration Failed')).toBeInTheDocument()
      expect(screen.getByText('User with this email already exists')).toBeInTheDocument()
    })
  })

  it('renders link to login page', () => {
    renderRegister()
    
    const signInLink = screen.getByRole('link', { name: /sign in/i })
    expect(signInLink).toHaveAttribute('href', '/login')
  })
})

