import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PublicRoute from '../PublicRoute'

const TestComponent = () => <div>Public Content</div>

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders children when not authenticated', () => {
    localStorage.removeItem('token')
    
    render(
      <MemoryRouter>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </MemoryRouter>
    )
    
    expect(screen.getByText('Public Content')).toBeInTheDocument()
  })

  it('redirects to dashboard when authenticated', () => {
    localStorage.setItem('token', 'valid-token')
    
    render(
      <MemoryRouter initialEntries={['/login']}>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </MemoryRouter>
    )
    
    // Should redirect to dashboard
    expect(screen.queryByText('Public Content')).not.toBeInTheDocument()
  })

  it('removes invalid token', () => {
    localStorage.setItem('token', '')
    
    render(
      <MemoryRouter>
        <PublicRoute>
          <TestComponent />
        </PublicRoute>
      </MemoryRouter>
    )
    
    expect(localStorage.getItem('token')).toBeNull()
  })
})

