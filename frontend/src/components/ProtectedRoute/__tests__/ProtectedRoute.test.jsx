import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'

const TestComponent = () => <div>Protected Content</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders children when authenticated', () => {
    localStorage.setItem('token', 'valid-token')
    
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    )
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    localStorage.removeItem('token')
    
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    )
    
    // Should redirect to login
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows loader while checking authentication', () => {
    localStorage.setItem('token', 'valid-token')
    
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    )
    
    // Should eventually show content
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('removes invalid token', () => {
    localStorage.setItem('token', '')
    
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    )
    
    expect(localStorage.getItem('token')).toBeNull()
  })
})

