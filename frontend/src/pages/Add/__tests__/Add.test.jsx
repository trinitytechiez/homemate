import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Add from '../Add'
import { ModalProvider } from '../../../contexts/ModalContext'
import { ToastProvider } from '../../../contexts/ToastContext'
import { addStaffMember } from '../../../utils/staffData'

// Mock dependencies
vi.mock('../../../utils/staffData', () => ({
  addStaffMember: vi.fn()
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderAdd = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <ModalProvider>
          <Add />
        </ModalProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

describe('Add Staff Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('token', 'test-token')
  })

  it('renders Add staff form', () => {
    renderAdd()
    
    expect(screen.getByText('home/mate')).toBeInTheDocument()
    expect(screen.getByText('Personal details')).toBeInTheDocument()
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mobile No/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument()
  })

  it('displays salary and currency fields', () => {
    renderAdd()
    
    expect(screen.getByLabelText(/Salary/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Salary Type/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    renderAdd()
    
    const continueButton = screen.getByRole('button', { name: /Continue/i })
    fireEvent.click(continueButton)
    
    // Form should not submit without required fields
    await waitFor(() => {
      expect(addStaffMember).not.toHaveBeenCalled()
    })
  })

  it('allows input in form fields', () => {
    renderAdd()
    
    const firstNameInput = screen.getByLabelText(/First Name/i)
    const lastNameInput = screen.getByLabelText(/Last Name/i)
    const mobileInput = screen.getByLabelText(/Mobile No/i)
    const locationInput = screen.getByLabelText(/Location/i)
    
    fireEvent.change(firstNameInput, { target: { value: 'John' } })
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
    fireEvent.change(mobileInput, { target: { value: '1234567890' } })
    fireEvent.change(locationInput, { target: { value: 'Mumbai' } })
    
    expect(firstNameInput.value).toBe('John')
    expect(lastNameInput.value).toBe('Doe')
    expect(mobileInput.value).toBe('1234567890')
    expect(locationInput.value).toBe('Mumbai')
  })

  it('validates mobile number length', async () => {
    renderAdd()
    
    const mobileInput = screen.getByLabelText(/Mobile No/i)
    const continueButton = screen.getByRole('button', { name: /Continue/i })
    
    fireEvent.change(mobileInput, { target: { value: '12345' } })
    fireEvent.click(continueButton)
    
    await waitFor(() => {
      expect(addStaffMember).not.toHaveBeenCalled()
    })
  })

  it('submits form with valid data', async () => {
    addStaffMember.mockResolvedValue({ id: '1', name: 'John Doe' })
    
    renderAdd()
    
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/Mobile No/i), { target: { value: '1234567890' } })
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Mumbai' } })
    
    const continueButton = screen.getByRole('button', { name: /Continue/i })
    fireEvent.click(continueButton)
    
    await waitFor(() => {
      expect(addStaffMember).toHaveBeenCalled()
    })
  })

  it('has cancel button', () => {
    renderAdd()
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    expect(cancelButton).toBeInTheDocument()
  })

  it('allows currency selection', () => {
    renderAdd()
    
    const currencySelect = screen.getByLabelText(/Salary Type/i).closest('select') || 
                          screen.getByRole('combobox', { name: /currency/i })
    
    if (currencySelect) {
      fireEvent.change(currencySelect, { target: { value: 'USD' } })
      expect(currencySelect.value).toBe('USD')
    }
  })
})

