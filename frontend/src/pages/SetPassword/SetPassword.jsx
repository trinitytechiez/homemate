import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import api from '../../utils/api'
import Loader from '../../components/Loader/Loader'
import styles from './SetPassword.module.scss'

const SetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { openModal } = useModal()

  // Get user data from location state (passed from Register)
  const userData = location.state || {}

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

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      // Set token if available (from registration)
      if (userData.token) {
        localStorage.setItem('token', userData.token)
      }
      
      // Update user password via API
      await api.put('/user/set-password', {
        password: formData.password
      })
      
      // Dispatch custom event to notify ProtectedRoute of login
      if (userData.token) {
        window.dispatchEvent(new Event('login'))
      }
      
      // Show success message
      openModal({
        title: 'Password Set',
        content: <p>Your password has been set successfully! Redirecting to dashboard...</p>,
        size: 'small',
        onClose: () => {
          navigate('/dashboard', { replace: true })
        }
      })
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1500)
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.'
      openModal({
        title: 'Error',
        content: <p>{errorMessage}</p>,
        size: 'small'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    navigate(-1) // Go back to previous page
  }

  return (
    <div className={styles.setPasswordContainer}>
      <div className={styles.setPasswordCard}>
        <h1 className={styles.title}>Set a Password</h1>
        
        <div className={styles.instructions}>
          <p className={styles.instructionText}>Your password must be minimum 8 characters.</p>
          <p className={styles.instructionText}>You can change this later under the settings tab.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.passwordForm}>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Enter New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="Password"
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              placeholder="Password"
            />
            {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className={styles.confirmButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.buttonContent}>
                <Loader size="small" variant="button" />
                <span>Setting password...</span>
              </span>
            ) : (
              'Confirm'
            )}
          </button>
        </form>

        <button
          type="button"
          className={styles.goBackButton}
          onClick={handleGoBack}
        >
          ← Go back
        </button>
      </div>
    </div>
  )
}

export default SetPassword

