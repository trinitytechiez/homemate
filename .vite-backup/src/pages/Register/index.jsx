import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import api from '../../utils/api'
import Loader from '../../components/Loader'
import CountryCodeSelector from '../../components/CountryCodeSelector/CountryCodeSelector'
import { validateEmail, validateMobileNumber, validateRequired, validateName } from '../../utils/validation'
import styles from './styles.module.scss'

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
  const [showOtpScreen, setShowOtpScreen] = useState(false)
  const [otp, setOtp] = useState(['', '', '', ''])
  const [otpTimer, setOtpTimer] = useState(120) // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
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
    
    const nameError = validateName(formData.fullName, 'Full Name')
    if (nameError) newErrors.fullName = nameError
    
    const mobileError = validateMobileNumber(formData.mobileNumber)
    if (mobileError) newErrors.mobileNumber = mobileError
    
    const emailError = validateEmail(formData.email)
    if (emailError) newErrors.email = emailError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // OTP Timer effect
  useEffect(() => {
    let interval = null
    if (showOtpScreen && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (otpTimer === 0) {
      setCanResend(true)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [showOtpScreen, otpTimer])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      await api.post('/auth/send-email-otp', {
        email: formData.email
      })
      
      setShowOtpScreen(true)
      setOtpTimer(120) // Reset timer to 2 minutes
      setCanResend(false)
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.'
      openModal({
        title: 'Error',
        content: <p>{errorMessage}</p>,
        size: 'small'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp]
    const digit = value.replace(/\D/g, '').slice(0, 1)
    newOtp[index] = digit
    setOtp(newOtp)
    
    // Auto-focus next input
    if (digit && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('')
    
    if (otpValue.length !== 4) {
      openModal({
        title: 'Invalid OTP',
        content: <p>Please enter the complete 4-digit OTP.</p>,
        size: 'small'
      })
      return
    }

    setIsVerifying(true)

    try {
      // Verify OTP
      await api.post('/auth/verify-email-otp', {
        email: formData.email,
        otp: otpValue
      })

      // Complete registration
      const response = await api.post('/auth/register', {
        name: formData.fullName,
        email: formData.email,
        password: 'temp123', // Temporary password, will be set in SetPassword page
        phoneNumber: `${countryCode}${formData.mobileNumber}`,
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
      const errorMessage = error.response?.data?.message || 'OTP verification failed. Please try again.'
      openModal({
        title: 'Verification Failed',
        content: <p>{errorMessage}</p>,
        size: 'small'
      })
      // Clear OTP on error
      setOtp(['', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setOtp(['', '', '', ''])
    
    try {
      await api.post('/auth/resend-email-otp', {
        email: formData.email
      })
      
      setOtpTimer(120)
      setCanResend(false)
      openModal({
        title: 'OTP Resent',
        content: <p>A new OTP has been sent to your email.</p>,
        size: 'small'
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP. Please try again.'
      openModal({
        title: 'Error',
        content: <p>{errorMessage}</p>,
        size: 'small'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <h1 className={styles.title}>Sign Up</h1>
        <p className={styles.subtitle}>Let's create a new account to get started!</p>

        <form onSubmit={handleSendOtp} className={styles.registerForm}>
          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={`${styles.label} ${errors.fullName ? styles.labelError : ''}`}>
              Full Name<span className={styles.required}>*</span>
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
            <label htmlFor="mobileNumber" className={`${styles.label} ${errors.mobileNumber ? styles.labelError : ''}`}>
              Mobile No.<span className={styles.required}>*</span>
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
            <label htmlFor="email" className={`${styles.label} ${errors.email ? styles.labelError : ''}`}>
              Email id<span className={styles.required}>*</span>
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
                <span>Sending OTP...</span>
              </span>
            ) : (
              'Send Verification Code'
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

      {/* OTP Verification Screen */}
      {showOtpScreen && (
        <div className={styles.otpOverlay}>
          <div className={styles.otpCard}>
            <h2 className={styles.otpTitle}>Verify Your Email</h2>
            <p className={styles.otpSubtitle}>
              We've sent a 4-digit code to <strong>{formData.email}</strong>
            </p>
            
            <div className={styles.otpInputContainer}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className={`${styles.otpInput} ${otpTimer === 0 ? styles.otpInputExpired : ''}`}
                  disabled={otpTimer === 0}
                />
              ))}
            </div>

            {otpTimer > 0 ? (
              <p className={styles.timerText}>
                Code expires in: <strong>{formatTime(otpTimer)}</strong>
              </p>
            ) : (
              <p className={styles.expiredText}>
                Code expired. Please request a new one.
              </p>
            )}

            <div className={styles.otpActions}>
              <button
                type="button"
                className={styles.verifyButton}
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpTimer === 0 || otp.join('').length !== 4}
              >
                {isVerifying ? (
                  <span className={styles.buttonContent}>
                    <Loader size="small" variant="button" />
                    <span>Verifying...</span>
                  </span>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              <button
                type="button"
                className={styles.resendButton}
                onClick={handleResendOtp}
                disabled={!canResend || isLoading}
              >
                {isLoading ? 'Sending...' : 'Resend Code'}
              </button>

              <button
                type="button"
                className={styles.changeEmailButton}
                onClick={() => {
                  setShowOtpScreen(false)
                  setOtp(['', '', '', ''])
                  setOtpTimer(120)
                  setCanResend(false)
                }}
                disabled={isVerifying || isLoading}
              >
                Change Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Register
