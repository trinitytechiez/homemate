import PropTypes from 'prop-types'
import styles from './Input.module.scss'

/**
 * Reusable Input component with validation states
 * 
 * @param {string} type - Input type: 'text', 'email', 'password', 'tel', etc.
 * @param {string} variant - Input variant: 'default', 'outlined'
 * @param {string} size - Input size: 'sm', 'md', 'lg'
 * @param {boolean} hasError - Show error state
 * @param {string} errorMessage - Error message to display
 * @param {string} label - Input label
 * @param {string} placeholder - Placeholder text
 * @param {string} className - Additional CSS classes
 * @param {object} ...props - Other input props
 */
const Input = ({
  type = 'text',
  variant = 'default',
  size = 'md',
  hasError = false,
  errorMessage,
  label,
  placeholder,
  className = '',
  id,
  name,
  ...props
}) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`
  
  const inputClasses = [
    styles.input,
    styles[variant],
    styles[size],
    hasError && styles.error,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.inputWrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        className={inputClasses}
        aria-invalid={hasError}
        aria-describedby={hasError && errorMessage ? `${inputId}-error` : undefined}
        {...props}
      />
      {hasError && errorMessage && (
        <span id={`${inputId}-error`} className={styles.errorMessage} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  )
}

Input.propTypes = {
  type: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'outlined']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  hasError: PropTypes.bool,
  errorMessage: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
}

export default Input

