import styles from './EmptyState.module.scss'

const EmptyState = ({ 
  icon = '📭', 
  title, 
  message, 
  actionLabel, 
  onAction,
  variant = 'default' 
}) => {
  return (
    <div className={`${styles.emptyState} ${styles[variant]}`}>
      <div className={styles.icon}>{icon}</div>
      {title && <h3 className={styles.title}>{title}</h3>}
      {message && <p className={styles.message}>{message}</p>}
      {actionLabel && onAction && (
        <button className={styles.actionButton} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState

