import { useState } from 'react'
import { useModal } from '../../contexts/ModalContext'
import Loader from '../Loader/Loader'
import api from '../../utils/api'
import styles from './ChangePasswordModal.module.scss'

const ChangePasswordModal = ({ onClose }) => {
  const { openModal } = useModal()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

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

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
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
      // Change password via API
      await api.put('/user/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      
      openModal({
        title: 'Success',
        content: <p>Password changed successfully!</p>,
        size: 'small',
        onClose: () => {
          onClose()
        }
      })
      
      // Close modal after success
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password. Please try again.'
      openModal({
        title: 'Error',
        content: <p>{errorMessage}</p>,
        size: 'small'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.changePasswordForm}>
      <div className={styles.formGroup}>
        <label htmlFor="currentPassword" className={styles.label}>
          Current Password
        </label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          className={`${styles.input} ${errors.currentPassword ? styles.inputError : ''}`}
          placeholder="Enter current password"
          autoComplete="current-password"
        />
        {errors.currentPassword && (
          <span className={styles.errorText}>{errors.currentPassword}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="newPassword" className={styles.label}>
          New Password
        </label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`}
          placeholder="Enter new password (min 8 characters)"
          autoComplete="new-password"
        />
        {errors.newPassword && (
          <span className={styles.errorText}>{errors.newPassword}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword" className={styles.label}>
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <span className={styles.errorText}>{errors.confirmPassword}</span>
        )}
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.buttonContent}>
              <Loader size="small" variant="button" />
              <span>Changing...</span>
            </span>
          ) : (
            'Change Password'
          )}
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default ChangePasswordModal

