import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Loader from '../Loader'

describe('Loader Component', () => {
  it('renders loader', () => {
    const { container } = render(<Loader />)
    
    // Loader should be rendered
    expect(container.querySelector('.loader')).toBeInTheDocument()
  })

  it('displays custom text', () => {
    render(<Loader text="Loading data..." />)
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('renders fullscreen loader', () => {
    const { container } = render(<Loader fullScreen />)
    
    const loader = container.querySelector('.loader')
    expect(loader).toBeInTheDocument()
  })

  it('renders different sizes', () => {
    const { rerender, container } = render(<Loader size="small" />)
    expect(container.querySelector('.loader')).toBeInTheDocument()
    
    rerender(<Loader size="medium" />)
    expect(container.querySelector('.loader')).toBeInTheDocument()
    
    rerender(<Loader size="large" />)
    expect(container.querySelector('.loader')).toBeInTheDocument()
  })

  it('renders button variant', () => {
    const { container } = render(<Loader variant="button" />)
    
    expect(container.querySelector('.loader')).toBeInTheDocument()
  })
})

