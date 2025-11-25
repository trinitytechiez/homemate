import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CountryCodeSelector from '../CountryCodeSelector'

describe('CountryCodeSelector Component', () => {
  it('renders country code selector', () => {
    const onChange = vi.fn()
    render(<CountryCodeSelector value="+91" onChange={onChange} />)
    
    expect(screen.getByText('+91')).toBeInTheDocument()
  })

  it('displays selected country flag', () => {
    const onChange = vi.fn()
    render(<CountryCodeSelector value="+91" onChange={onChange} />)
    
    // Should display India flag
    expect(screen.getByText('🇮🇳')).toBeInTheDocument()
  })

  it('opens dropdown when clicked', () => {
    const onChange = vi.fn()
    render(<CountryCodeSelector value="+91" onChange={onChange} />)
    
    const selector = screen.getByText('+91').closest('button')
    fireEvent.click(selector)
    
    // Should show dropdown options
    expect(screen.getByText('USA')).toBeInTheDocument()
    expect(screen.getByText('UK')).toBeInTheDocument()
  })

  it('calls onChange when country is selected', () => {
    const onChange = vi.fn()
    render(<CountryCodeSelector value="+91" onChange={onChange} />)
    
    const selector = screen.getByText('+91').closest('button')
    fireEvent.click(selector)
    
    const usaOption = screen.getByText('USA').closest('button')
    fireEvent.click(usaOption)
    
    expect(onChange).toHaveBeenCalledWith('+1')
  })

  it('closes dropdown after selection', () => {
    const onChange = vi.fn()
    render(<CountryCodeSelector value="+91" onChange={onChange} />)
    
    const selector = screen.getByText('+91').closest('button')
    fireEvent.click(selector)
    
    const usaOption = screen.getByText('USA').closest('button')
    fireEvent.click(usaOption)
    
    // Dropdown should close
    expect(screen.queryByText('USA')).not.toBeInTheDocument()
  })
})

