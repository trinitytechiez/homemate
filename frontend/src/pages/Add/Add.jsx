import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import { useToast } from '../../contexts/ToastContext'
import { addStaffMember } from '../../utils/staffData'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import Loader from '../../components/Loader/Loader'
import styles from './Add.module.scss'

const Add = () => {
  const navigate = useNavigate()
  const { openModal } = useModal()
  const { showError, showSuccess } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      
      if (!token || token.trim().length === 0) {
        navigate('/login', { replace: true })
        return false
      }
      
      setIsLoading(false)
      return true
    }

    checkAuth()
  }, [navigate])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    location: '',
    dob: '',
    monthlySalary: '',
    currency: 'INR',
    payCycle: 'Monthly'
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setFormData(prev => ({ ...prev, mobileNumber: value }))
    if (errors.mobileNumber) {
      setErrors(prev => ({ ...prev, mobileNumber: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required'
    }
    
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required'
    } else if (formData.mobileNumber.length !== 10) {
      newErrors.mobileNumber = 'Mobile Number must be 10 digits'
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Combine first and last name
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
      
      // Create staff member data
      const newStaff = {
        name: fullName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: `+91${formData.mobileNumber}`,
        location: formData.location.trim(),
        dob: formData.dob || '',
        role: '', // Will be set in next step or default
        monthlySalary: parseInt(formData.monthlySalary) || 0,
        currency: formData.currency || 'INR',
        payCycle: formData.payCycle || 'Monthly',
        paidLeaves: 0,
        visitingTime: '9.00 AM'
      }

      // Add via API
      await addStaffMember(newStaff)
      
      // Show success toast
      showSuccess(`Staff member "${fullName}" has been added successfully!`)
      
      // Navigate to staff list after a short delay
      setTimeout(() => {
        navigate('/staff')
      }, 500)
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add staff member. Please try again.'
      
      // Check if it's a database connection error
      if (error.response?.status === 503) {
        showError('Database not connected. Please connect to MongoDB to create staff members.')
      } else {
        showError(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Clear form and navigate back
    setFormData({
      firstName: '',
      lastName: '',
      mobileNumber: '',
      location: '',
      dob: '',
      monthlySalary: '',
      currency: 'INR',
      payCycle: 'Monthly'
    })
    setErrors({})
    navigate(-1)
  }

  if (isLoading) {
    return <Loader fullScreen text="Loading..." />
  }

  return (
    <div className={styles.addContainer}>
      <div className={styles.addContent}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.appTitle}>home/mate</h1>
        </header>

        {/* Form Section */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Personal details</h2>
          
          <form className={styles.addForm}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.label}>
                First Name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                placeholder="Pooja"
                autoComplete="given-name"
              />
              {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.label}>
                Last Name<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                placeholder="Kadam"
                autoComplete="family-name"
              />
              {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="mobileNumber" className={styles.label}>
                Mobile No.<span className={styles.required}>*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleMobileChange}
                className={`${styles.input} ${errors.mobileNumber ? styles.inputError : ''}`}
                placeholder="9876543210"
                maxLength={10}
                autoComplete="tel"
              />
              {errors.mobileNumber && <span className={styles.errorText}>{errors.mobileNumber}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="location" className={styles.label}>
                Location<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`${styles.input} ${errors.location ? styles.inputError : ''}`}
                placeholder="Andheri East, Mumbai"
                autoComplete="address-level2"
              />
              {errors.location && <span className={styles.errorText}>{errors.location}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="dob" className={styles.label}>
                DOB
              </label>
              <input
                type="text"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={styles.input}
                placeholder="12/10/1990"
                autoComplete="bday"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="monthlySalary" className={styles.label}>
                Salary
              </label>
              <div className={styles.salaryInputGroup}>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className={styles.currencySelect}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                  <option value="AED">د.إ AED</option>
                </select>
                <input
                  type="number"
                  id="monthlySalary"
                  name="monthlySalary"
                  value={formData.monthlySalary}
                  onChange={handleChange}
                  className={styles.salaryInput}
                  placeholder="0"
                  min="0"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="payCycle" className={styles.label}>
                Salary Type
              </label>
              <select
                id="payCycle"
                name="payCycle"
                value={formData.payCycle}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.continueButton}
            onClick={handleContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.buttonContent}>
                <Loader size="small" variant="button" />
                <span>Saving...</span>
              </span>
            ) : (
              'Continue'
            )}
          </button>
          <button
            type="button"
            className={styles.discardButton}
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Add
