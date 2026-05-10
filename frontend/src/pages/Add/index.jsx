import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import { useToast } from '../../contexts/ToastContext'
import { addStaffMember } from '../../utils/staffData'
import { validateMobileNumber, validateRequired, validateName } from '../../utils/validation'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import Loader from '../../components/Loader'
import styles from './styles.module.scss'

const Add = () => {
  const navigate = useNavigate()
  const { openModal } = useModal()
  const { showError, showSuccess } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    location: '',
    dob: '',
    monthlySalary: '',
    currency: 'INR',
    payCycle: 'Monthly',
    role: '',
    paidLeaves: '',
    visitingTime: '9:00 AM'
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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

    const firstNameError = validateName(formData.firstName, 'First Name')
    if (firstNameError) newErrors.firstName = firstNameError

    const lastNameError = validateName(formData.lastName, 'Last Name')
    if (lastNameError) newErrors.lastName = lastNameError

    const mobileError = validateMobileNumber(formData.mobileNumber)
    if (mobileError) newErrors.mobileNumber = mobileError

    const locationError = validateRequired(formData.location, 'Location')
    if (locationError) newErrors.location = locationError

    // Category (role) is now optional
    // const roleError = validateRequired(formData.role, 'Category')
    // if (roleError) newErrors.role = roleError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    let didNavigate = false

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()

      const newStaff = {
        name: fullName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: `+91${formData.mobileNumber}`,
        location: formData.location.trim(),
        dob: formData.dob || '',
        role: formData.role.trim(),
        monthlySalary: parseInt(formData.monthlySalary) || 0,
        currency: formData.currency || 'INR',
        payCycle: formData.payCycle || 'Monthly',
        paidLeaves: parseInt(formData.paidLeaves) || 0,
        visitingTime: formData.visitingTime
      }

      await addStaffMember(newStaff)

      showSuccess(`Staff member "${fullName}" has been added successfully!`)

      didNavigate = true
      navigate('/dashboard', { replace: true })
      return
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add staff member. Please try again.'

      if (error.response?.status === 503) {
        showError('Database not connected. Please connect to MongoDB to create staff members.')
      } else {
        showError(errorMessage)
      }
    } finally {
      if (!didNavigate) setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: '',
      lastName: '',
      mobileNumber: '',
      location: '',
      dob: '',
      monthlySalary: '',
      currency: 'INR',
      payCycle: 'Monthly',
      role: '',
      paidLeaves: '',
      visitingTime: '9:00 AM'
    })
    setErrors({})
    navigate(-1)
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
              <label htmlFor="firstName" className={`${styles.label} ${errors.firstName ? styles.labelError : ''}`}>
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
              <label htmlFor="lastName" className={`${styles.label} ${errors.lastName ? styles.labelError : ''}`}>
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
              <label htmlFor="mobileNumber" className={`${styles.label} ${errors.mobileNumber ? styles.labelError : ''}`}>
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
              <label htmlFor="location" className={`${styles.label} ${errors.location ? styles.labelError : ''}`}>
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
            
            <div className={styles.formGroup}>
              <label htmlFor="role" className={`${styles.label} ${errors.role ? styles.labelError : ''}`}>
                Category<span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`${styles.input} ${errors.role ? styles.inputError : ''}`}
                placeholder="e.g. Cook, Driver, Maid"
              />
              {errors.role && <span className={styles.errorText}>{errors.role}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="paidLeaves" className={styles.label}>
                Paid Leaves (per month)
              </label>
              <input
                type="number"
                id="paidLeaves"
                name="paidLeaves"
                value={formData.paidLeaves}
                onChange={handleChange}
                className={styles.input}
                placeholder="0"
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="visitingTime" className={styles.label}>
                Visiting Time
              </label>
              <select
                id="visitingTime"
                name="visitingTime"
                value={formData.visitingTime}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="6:00 AM">6:00 AM</option>
                <option value="7:00 AM">7:00 AM</option>
                <option value="8:00 AM">8:00 AM</option>
                <option value="9:00 AM">9:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="1:00 PM">1:00 PM</option>
                <option value="2:00 PM">2:00 PM</option>
                <option value="3:00 PM">3:00 PM</option>
                <option value="4:00 PM">4:00 PM</option>
                <option value="5:00 PM">5:00 PM</option>
                <option value="6:00 PM">6:00 PM</option>
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