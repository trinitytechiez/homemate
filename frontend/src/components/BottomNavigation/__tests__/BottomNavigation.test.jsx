import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import BottomNavigation from '../BottomNavigation'

const renderBottomNav = (initialPath = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNavigation />
    </MemoryRouter>
  )
}

describe('BottomNavigation Component', () => {
  it('renders all navigation items', () => {
    renderBottomNav()
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Staff')).toBeInTheDocument()
    expect(screen.getByText('Add')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('highlights active route', () => {
    renderBottomNav('/dashboard')
    
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveClass(/active/)
  })

  it('navigates to correct routes', () => {
    renderBottomNav()
    
    const staffLink = screen.getByText('Staff').closest('a')
    expect(staffLink).toHaveAttribute('href', '/staff')
    
    const addLink = screen.getByText('Add').closest('a')
    expect(addLink).toHaveAttribute('href', '/add')
    
    const settingsLink = screen.getByText('Settings').closest('a')
    expect(settingsLink).toHaveAttribute('href', '/settings')
    
    const profileLink = screen.getByText('Profile').closest('a')
    expect(profileLink).toHaveAttribute('href', '/profile')
  })

  it('highlights staff route when on staff profile', () => {
    renderBottomNav('/staff/123')
    
    const staffLink = screen.getByText('Staff').closest('a')
    expect(staffLink).toHaveClass(/active/)
  })
})

