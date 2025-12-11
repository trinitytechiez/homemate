import PropTypes from 'prop-types'
import Button from '../Button/Button'
import styles from './EmptyState.module.scss'

/**
 * Reusable EmptyState component
 * 
 * @param {string} icon - Icon/emoji to display
 * @param {string} title - Title text
 * @param {string} message - Message text
 * @param {string} actionLabel - Action button label
 * @param {function} onAction - Action button click handler
 * @param {string} variant - Visual variant: 'default', 'minimal', 'centered'
 * @param {string} className - Additional CSS classes
 */
const EmptyState = ({ 
  icon = '📭', 
  title, 
  message, 
  actionLabel, 
  onAction,
  variant = 'default',
  className = ''
}) => {
  const containerClasses = [
    styles.emptyState,
    styles[variant],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {icon && <div className={styles.icon}>{icon}</div>}
      {title && <h3 className={styles.title}>{title}</h3>}
      {message && <p className={styles.message}>{message}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className={styles.actionButton}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'minimal', 'centered']),
  className: PropTypes.string,
}

export default EmptyState

