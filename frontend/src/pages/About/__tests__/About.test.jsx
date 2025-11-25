import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import About from '../About'
import { ModalProvider } from '../../../contexts/ModalContext'
import { ToastProvider } from '../../../contexts/ToastContext'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderAbout = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <About />
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

describe('About Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders About page correctly', () => {
    renderAbout()
    
    expect(screen.getByText('home/mate')).toBeInTheDocument()
    expect(screen.getByText('Trinity Techiez')).toBeInTheDocument()
    expect(screen.getByText('Building innovative solutions together')).toBeInTheDocument()
  })

  it('displays all team members', () => {
    renderAbout()
    
    expect(screen.getByText('Sonal')).toBeInTheDocument()
    expect(screen.getByText('Varun')).toBeInTheDocument()
    expect(screen.getByText('Nayan')).toBeInTheDocument()
  })

  it('displays app information', () => {
    renderAbout()
    
    expect(screen.getByText(/HomeMate is a mobile-focused/)).toBeInTheDocument()
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument()
  })

  it('has back button', () => {
    renderAbout()
    
    const backButton = screen.getByRole('button', { name: /←/ })
    expect(backButton).toBeInTheDocument()
  })

  it('navigates back when back button is clicked', () => {
    renderAbout()
    
    const backButton = screen.getByRole('button', { name: /←/ })
    backButton.click()
    
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('displays team logo', () => {
    renderAbout()
    
    const logoText = screen.getByText('TT')
    expect(logoText).toBeInTheDocument()
  })
})

