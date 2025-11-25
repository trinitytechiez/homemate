import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import api from '../../utils/api'
import Loader from '../../components/Loader/Loader'
import CountryCodeSelector from '../../components/CountryCodeSelector/CountryCodeSelector'
import styles from './Register.module.scss'

const Register = () => {
  const location = useLocation()
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: location.state?.mobileNumber || '',
    email: '',
    location: ''
  })
  const [countryCode, setCountryCode] = useState(location.state?.countryCode || '+91')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { openModal } = useModal()

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
    setFormData(prev => ({
      ...prev,
      mobileNumber: value
    }))
    if (errors.mobileNumber) {
      setErrors(prev => ({
        ...prev,
        mobileNumber: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required'
    }
    
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required'
    } else if (formData.mobileNumber.length !== 10) {
      newErrors.mobileNumber = 'Mobile Number must be 10 digits'
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
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
      const response = await api.post('/auth/register', {
        name: formData.fullName,
        email: formData.email || `${formData.mobileNumber}@homemate.com`, // Use mobile as email if not provided
        password: 'temp123', // Temporary password, will be set in SetPassword page
        phoneNumber: `${countryCode}${formData.mobileNumber}`, // Backend expects phoneNumber
        location: formData.location
      })
      
      // Navigate to Set Password page with user data
      navigate('/set-password', {
        state: {
          userId: response.data.user?.id || response.data.userId,
          token: response.data.token,
          email: response.data.user?.email || formData.email,
          name: response.data.user?.name || formData.fullName
        }
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.'
      openModal({
        title: 'Registration Failed',
        content: <p>{errorMessage}</p>,
        size: 'small'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <h1 className={styles.title}>Sign Up</h1>
        <p className={styles.subtitle}>Let's create a new account to get started!</p>

        <form onSubmit={handleSubmit} className={styles.registerForm}>
          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={styles.label}>
              Full Name*
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
              placeholder="Gaurav Singh"
            />
            {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="mobileNumber" className={styles.label}>
              Mobile No.*
            </label>
            <div className={styles.mobileInputContainer}>
              <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
              <div className={styles.mobileInput}>
                <div className={styles.separator}></div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleMobileChange}
                  className={`${styles.mobileField} ${errors.mobileNumber ? styles.inputError : ''}`}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
            </div>
            {errors.mobileNumber && <span className={styles.errorText}>{errors.mobileNumber}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email id
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="gauravsingh@gmail.com"
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location" className={styles.label}>
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={styles.input}
              placeholder="Colaba, Mumbai"
            />
          </div>

          <button
            type="submit"
            className={styles.signUpButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.buttonContent}>
                <Loader size="small" variant="button" />
                <span>Signing up...</span>
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <button
          type="button"
          className={styles.goBackButton}
          onClick={() => navigate('/login')}
        >
          ← Go back
        </button>
      </div>
    </div>
  )
}

export default Register
