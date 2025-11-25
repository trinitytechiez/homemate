import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../Modal'

describe('Modal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('does not render title when not provided', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    )
    
    const closeButton = screen.getByLabelText('Close modal')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    const overlay = document.querySelector('[class*="modalOverlay"]')
    fireEvent.click(overlay)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when modal content is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    const content = screen.getByText('Modal Content')
    fireEvent.click(content)
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('sets body overflow to hidden when modal opens', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    expect(document.body.style.overflow).toBe('')
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow when modal closes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    expect(document.body.style.overflow).toBe('hidden')
    
    rerender(
      <Modal isOpen={false} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    expect(document.body.style.overflow).toBe('unset')
  })

  it('applies correct size class', () => {
    const { container, rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="small">
        <div>Modal Content</div>
      </Modal>
    )
    
    let modalContent = container.querySelector('[class*="modalContent"]')
    expect(modalContent.className).toContain('small')
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="large">
        <div>Modal Content</div>
      </Modal>
    )
    
    modalContent = container.querySelector('[class*="modalContent"]')
    expect(modalContent.className).toContain('large')
  })
})

