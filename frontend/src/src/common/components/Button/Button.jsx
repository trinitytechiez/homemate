import styles from './Button.module.scss'

/**
 * Reusable Button component with multiple variants and states
 * 
 * @param {string} variant - Button style variant: 'primary', 'secondary', 'ghost', 'danger'
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} isLoading - Show loading state
 * @param {boolean} disabled - Disable button
 * @param {string} type - Button type: 'button', 'submit', 'reset'
 * @param {string} className - Additional CSS classes
 * @param {ReactNode} children - Button content
 * @param {function} onClick - Click handler
 * @param {object} ...props - Other button props
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  onClick,
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className={styles.buttonContent}>
          <span className={styles.spinner}></span>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default Button

