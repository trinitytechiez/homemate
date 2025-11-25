import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModalProvider, useModal } from '../ModalContext'
import Modal from '../../components/Modal/Modal'

// Test component that uses the modal context
const TestComponent = () => {
  const { openModal, closeModal, isModalOpen } = useModal()

  return (
    <div>
      <button onClick={() => openModal({ 
        content: <div>Test Content</div>, 
        title: 'Test Title' 
      })}>
        Open Modal
      </button>
      <button onClick={closeModal}>Close Modal</button>
      <div data-testid="modal-state">{isModalOpen ? 'open' : 'closed'}</div>
    </div>
  )
}

describe('ModalContext', () => {
  it('provides modal context to children', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )
    
    expect(screen.getByText('Open Modal')).toBeInTheDocument()
  })

  it('throws error when useModal is used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useModal must be used within a ModalProvider')
    
    consoleError.mockRestore()
  })

  it('opens modal with openModal function', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )
    
    expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
    
    fireEvent.click(screen.getByText('Open Modal'))
    
    expect(screen.getByTestId('modal-state')).toHaveTextContent('open')
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('closes modal with closeModal function', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    )
    
    fireEvent.click(screen.getByText('Open Modal'))
    expect(screen.getByTestId('modal-state')).toHaveTextContent('open')
    
    fireEvent.click(screen.getByText('Close Modal'))
    expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
  })

  it('calls onClose callback when modal closes', () => {
    const onCloseCallback = vi.fn()
    
    const TestComponentWithCallback = () => {
      const { openModal, closeModal } = useModal()
      
      return (
        <div>
          <button onClick={() => openModal({ 
            content: <div>Test</div>,
            onClose: onCloseCallback
          })}>
            Open
          </button>
          <button onClick={closeModal}>Close</button>
        </div>
      )
    }
    
    render(
      <ModalProvider>
        <TestComponentWithCallback />
      </ModalProvider>
    )
    
    fireEvent.click(screen.getByText('Open'))
    fireEvent.click(screen.getByText('Close'))
    
    expect(onCloseCallback).toHaveBeenCalledTimes(1)
  })
})

