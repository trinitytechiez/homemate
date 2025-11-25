import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from '../ToastContext'

const TestComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  
  return (
    <div>
      <button onClick={() => showSuccess('Success!')}>Show Success</button>
      <button onClick={() => showError('Error!')}>Show Error</button>
      <button onClick={() => showWarning('Warning!')}>Show Warning</button>
      <button onClick={() => showInfo('Info!')}>Show Info</button>
    </div>
  )
}

describe('ToastContext', () => {
  it('provides toast functions', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    
    expect(screen.getByText('Show Success')).toBeInTheDocument()
  })

  it('shows success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    
    const button = screen.getByText('Show Success')
    button.click()
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })
  })

  it('shows error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    
    const button = screen.getByText('Show Error')
    button.click()
    
    await waitFor(() => {
      expect(screen.getByText('Error!')).toBeInTheDocument()
    })
  })

  it('shows multiple toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    
    screen.getByText('Show Success').click()
    screen.getByText('Show Error').click()
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(screen.getByText('Error!')).toBeInTheDocument()
    })
  })
})

