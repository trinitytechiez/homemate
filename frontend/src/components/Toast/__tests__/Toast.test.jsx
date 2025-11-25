import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Toast from '../Toast'

describe('Toast Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders toast message', () => {
    render(<Toast message="Test message" />)
    
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('displays different toast types', () => {
    const { rerender } = render(<Toast message="Info" type="info" />)
    expect(screen.getByText('Info')).toBeInTheDocument()
    
    rerender(<Toast message="Success" type="success" />)
    expect(screen.getByText('Success')).toBeInTheDocument()
    
    rerender(<Toast message="Error" type="error" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    
    rerender(<Toast message="Warning" type="warning" />)
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('has close button', () => {
    render(<Toast message="Test" />)
    
    const closeButton = screen.getByRole('button', { name: /×/ })
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Toast message="Test" onClose={onClose} />)
    
    const closeButton = screen.getByRole('button', { name: /×/ })
    closeButton.click()
    
    expect(onClose).toHaveBeenCalled()
  })

  it('auto-closes after duration', async () => {
    const onClose = vi.fn()
    render(<Toast message="Test" duration={1000} onClose={onClose} />)
    
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})

