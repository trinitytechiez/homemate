import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import api from '../../utils/api'
import Loader from '../../components/Loader'
import CountryCodeSelector from '../../components/CountryCodeSelector/CountryCodeSelector'
import { setAuth } from '../../utils/auth.utils'
import styles from './styles.module.scss'

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('otp') // 'otp' or 'password'
  const [mobileNumber, setMobileNumber] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [otp, setOtp] = useState(['', '', '', '']) // 4-digit OTP
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [resendTimer, setResendTimer] = useState(0) // Timer in seconds
  const [canResend, setCanResend] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // Password visibility toggle

  // Password login state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { openModal, closeModal } = useModal()

  // Note: PublicRoute component handles redirect if already authenticated

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setMobileNumber(value)
  }

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp]
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(0, 1)
    newOtp[index] = digit

    // Auto-focus next input
    if (digit && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }

    setOtp(newOtp)
  }

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    const newOtp = [...otp]
    for (let i = 0; i < 4; i++) {
      newOtp[i] = pastedData[i] || ''
    }
    setOtp(newOtp)
    // Focus last filled input or first empty
    const lastFilledIndex = Math.min(pastedData.length - 1, 3)
    const nextInput = document.getElementById(`otp-${lastFilledIndex + 1}`)
    if (nextInput) nextInput.focus()
  }

  const getOtpString = () => {
    return otp.join('')
  }

  // Timer effect for resend OTP
  useEffect(() => {
    if (showOtpInput && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [showOtpInput, resendTimer])

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}s`
  }

  const handleResendOtp = async () => {
    if (!canResend) return

    setIsLoading(true)
    try {
      const fullPhoneNumber = `${countryCode}${mobileNumber}`
      const response = await api.post('/auth/resend-otp', {
        phoneNumber: fullPhoneNumber
      })

      setResendTimer(response.data.expiresIn || 600) // Reset timer
      setCanResend(false)
      setOtp(['', '', '', ''])
      openModal({
        title: 'OTP Resent',
        content: <p>OTP has been resent to {countryCode} {mobileNumber}</p>,
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

  const handleSendOtp = async () => {
    if (mobileNumber.length !== 10) {
      openModal({
        title: 'Invalid Mobile Number',
        content: <p>Please enter a valid 10-digit mobile number.</p>,
        size: 'small'
      })
      return
    }

    setIsLoading(true)
    try {
      const fullPhoneNumber = `${countryCode}${mobileNumber}`
      const response = await api.post('/auth/send-otp', {
        phoneNumber: fullPhoneNumber
      })

      setShowOtpInput(true)
      setResendTimer(response.data.expiresIn || 600) // Use expiresIn from API or default to 600 seconds
      setCanResend(false)
      openModal({
        title: 'OTP Sent',
        content: <p>OTP has been sent to {countryCode} {mobileNumber}</p>,
        size: 'small'
      })
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

  const handleVerifyOtp = async () => {
    const otpString = getOtpString()
    if (otpString.length !== 4) {
      openModal({
        title: 'Invalid OTP',
        content: <p>Please enter a valid 4-digit OTP.</p>,
        size: 'small'
      })
      return
    }

    setIsLoading(true)

    try {
      const fullPhoneNumber = `${countryCode}${mobileNumber}`
      const response = await api.post('/auth/verify-otp', {
        phoneNumber: fullPhoneNumber,
        otp: otpString
      })

      // Store token and navigate to dashboard
      setAuth(response.data.token)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      // Close any existing modals first
      closeModal()

      const errorData = error.response?.data || {}
      const errorStatus = error.response?.status
      const errorMessage = errorData.message || 'The OTP you entered is incorrect. Please try again.'
      const attemptsRemaining = errorData.attemptsRemaining

      // Check if user not found (404 status or specific error code)
      const isUserNotFound = errorStatus === 404 ||
        errorData.code === 'USER_NOT_FOUND' ||
        errorData.requiresRegistration === true ||
        (errorMessage && (
          errorMessage.toLowerCase().includes('no user found') ||
          errorMessage.toLowerCase().includes('register first') ||
          errorMessage.toLowerCase().includes('please register')
        ))

      // Small delay to ensure previous modal is closed
      setTimeout(() => {
        // If user not found, show registration prompt
        if (isUserNotFound) {
          openModal({
            title: 'User Not Found',
            content: (
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem' }}>No user found with this phone number. Please register first.</p>
                <button
                  onClick={() => {
                    closeModal()
                    navigate('/register', {
                      state: {
                        phoneNumber: `${countryCode}${mobileNumber}`,
                        countryCode,
                        mobileNumber
                      }
                    })
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#4A90E2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: '0.5rem'
                  }}
                >
                  Go to Register
                </button>
              </div>
            ),
            size: 'small'
          })
        } else {
          // Regular OTP error
          openModal({
            title: 'Invalid OTP',
            content: (
              <div>
                <p>{errorMessage}</p>
                {attemptsRemaining !== undefined && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                    Attempts remaining: {attemptsRemaining}
                  </p>
                )}
              </div>
            ),
            size: 'small'
          })
        }
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()

    // Trim email and password to remove any whitespace
    const trimmedEmail = formData.email.trim()
    const trimmedPassword = formData.password.trim()

    if (!trimmedEmail) {
      setErrors({ email: 'Email is required' })
      return
    }
    if (!trimmedPassword) {
      setErrors({ password: 'Password is required' })
      return
    }

    setIsLoading(true)

    try {
      // Send trimmed values
      const loginData = {
        email: trimmedEmail,
        password: trimmedPassword
      }

      // Debug logging (only in development)
      if (process.env.NODE_ENV === 'development' && import.meta.env.DEV) {
        // Logging disabled - remove if needed for debugging
      }

      // Log the request for debugging
      console.log('🔐 Attempting login with:', { email: trimmedEmail, passwordLength: trimmedPassword.length })
      console.log('🔗 API Base URL:', api.defaults.baseURL)

      const response = await api.post('/auth/login', loginData)

      console.log('✅ Login response received:', response.status)

      // Check if token exists in response
      if (!response.data.token) {
        console.error('❌ No token in response:', response.data)
        throw new Error('No token received from server')
      }

      // Save token and navigate
      setAuth(response.data.token)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('❌ Login error:', error)
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method
        }
      })

      // Check for network errors
      if (!error.response) {
        const networkError = error.message || 'Network error - unable to reach server'
        openModal({
          title: 'Connection Error',
          content: (
            <div>
              <p>{networkError}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                Please check:
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  {import.meta.env.DEV && <li>Backend server is running (usually on port 5001)</li>}
                  <li>API URL is correct: {api.defaults.baseURL}</li>
                  <li>You have a stable internet connection</li>
                  <li>No CORS errors in browser console</li>
                </ul>
              </p>
            </div>
          ),
          size: 'small'
        })
        return
      }

      const errorMessage = error.response?.data?.message || error.message || 'Something went wrong. Please try again.'

      // Check if it's a password mismatch error
      if (error.response?.status === 401) {
        openModal({
          title: 'Login Failed',
          content: (
            <div>
              <p>{errorMessage}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                <strong>Important:</strong> If you just registered, your temporary password is <code style={{ backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>temp123</code> (not "test123").
                Please use <code style={{ backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>temp123</code> to login, or use OTP login instead.
              </p>
            </div>
          ),
          size: 'small'
        })
      } else {
        openModal({
          title: 'Login Failed',
          content: <p>{errorMessage}</p>,
          size: 'small'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Header with Logo */}
        <div className={styles.header}>
          <div className={styles.logoDecoration}>
            <div className={styles.dottedLine}></div>
            <div className={styles.logoCircle}></div>
            <div className={styles.logoCircle}></div>
          </div>
          <h1 className={styles.logo}>home/mate</h1>
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeDot}></div>
            <h2 className={styles.welcomeText}>Welcome!</h2>
          </div>
          <p className={styles.tagline}>Please Login or SignUp to continue</p>
        </div>

        {/* OTP Login Section */}
        {loginMethod === 'otp' && !showOtpInput && (
          <div className={styles.otpSection}>
            <label className={styles.label}>Mobile no.</label>
            <div className={styles.mobileInputContainer}>
              <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
              <div className={styles.mobileInput}>
                <div className={styles.separator}></div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={styles.mobileField}
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
            </div>

            <button
              type="button"
              className={styles.sendOtpButton}
              onClick={handleSendOtp}
              disabled={isLoading || mobileNumber.length !== 10}
            >
              {isLoading ? (
                <span className={styles.buttonContent}>
                  <Loader size="small" variant="button" />
                  <span>Sending...</span>
                </span>
              ) : (
                'Send OTP'
              )}
            </button>

            <div className={styles.separatorLine}>
              <div className={styles.line}></div>
              <span className={styles.orText}>Or</span>
              <div className={styles.line}></div>
            </div>

            <div className={styles.alternativeLinks}>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setLoginMethod('password')}
              >
                Login with Password
              </button>
              <Link to="/register" className={styles.linkButton}>
                New user? Sign up
              </Link>
            </div>
          </div>
        )}

        {/* OTP Input Section */}
        {loginMethod === 'otp' && showOtpInput && (
          <div className={styles.otpInputSection}>
            <h2 className={styles.otpTitle}>OTP Verification</h2>
            <p className={styles.otpInstruction}>
              Enter the 4 digit code sent on your mobile number to login
            </p>

            <div className={styles.otpInputGroup}>
              <label className={styles.otpLabel}>OTP</label>
              <div className={styles.otpInputs}>
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`${styles.otpInput} ${index === 0 ? styles.otpInputActive : ''}`}
                    value={otp[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    onFocus={(e) => {
                      e.target.classList.add(styles.otpInputActive)
                    }}
                    onBlur={(e) => {
                      if (!otp[index]) {
                        e.target.classList.remove(styles.otpInputActive)
                      }
                    }}
                    maxLength={1}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className={styles.loginButton}
              onClick={handleVerifyOtp}
              disabled={isLoading || getOtpString().length !== 4}
            >
              {isLoading ? (
                <span className={styles.buttonContent}>
                  <Loader size="small" variant="button" />
                  <span>Logging in...</span>
                </span>
              ) : (
                'Login'
              )}
            </button>

            <div className={styles.resendSection}>
              <span className={styles.resendText}>Resend OTP in</span>
              {resendTimer > 0 ? (
                <span className={styles.resendTimer}>{formatTimer(resendTimer)}</span>
              ) : (
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={handleResendOtp}
                  disabled={!canResend || isLoading}
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button
              type="button"
              className={styles.goBackButton}
              onClick={() => {
                setShowOtpInput(false)
                setOtp(['', '', '', ''])
                setResendTimer(0)
                setCanResend(false)
              }}
            >
              ← Go back
            </button>
          </div>
        )}

        {/* Password Login Section */}
        {loginMethod === 'password' && (
          <div className={styles.passwordSection}>
            <form onSubmit={handlePasswordLogin} className={styles.passwordForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handlePasswordChange}
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="Enter your email"
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      // Eye-off icon (password visible → click to hide)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      // Eye icon (password hidden → click to show)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className={styles.buttonContent}>
                    <Loader size="small" variant="button" />
                    <span>Logging in...</span>
                  </span>
                ) : (
                  'Login'
                )}
              </button>

              <button
                type="button"
                className={styles.backButton}
                onClick={() => setLoginMethod('otp')}
              >
                ← Back to OTP Login
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}

export default Login
