import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmptyState from '../EmptyState'

describe('EmptyState Component', () => {
  it('renders empty state with icon and title', () => {
    render(<EmptyState icon="📭" title="No items" message="No items found" />)
    
    expect(screen.getByText('📭')).toBeInTheDocument()
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        icon="📭"
        title="No items"
        message="No items found"
        actionLabel="Add Item"
        onAction={onAction}
      />
    )
    
    const actionButton = screen.getByRole('button', { name: /Add Item/i })
    expect(actionButton).toBeInTheDocument()
    
    fireEvent.click(actionButton)
    expect(onAction).toHaveBeenCalled()
  })

  it('renders compact variant', () => {
    render(
      <EmptyState
        icon="🔍"
        title="No results"
        message="Try again"
        variant="compact"
      />
    )
    
    expect(screen.getByText('No results')).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('does not render action button when not provided', () => {
    render(<EmptyState icon="📭" title="No items" message="No items found" />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

