import { useEffect, useState } from 'react'
import styles from './Toast.module.scss'

const Toast = ({ message, type = 'info', onClose, duration = 2000 }) => {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsClosing(true)
        // Wait for animation to complete before calling onClose
        setTimeout(() => {
          onClose()
        }, 300) // Match animation duration
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match animation duration
  }

  return (
    <div className={`${styles.toast} ${styles[type]} ${isClosing ? styles.closing : ''}`}>
      <div className={styles.content}>
        <span className={styles.message}>{message}</span>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  )
}

export default Toast

