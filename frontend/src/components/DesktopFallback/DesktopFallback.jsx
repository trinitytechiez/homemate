import { useState, useEffect } from 'react'
import styles from './DesktopFallback.module.scss'

const DesktopFallback = ({ children }) => {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 769)
    }

    // Check on mount
    checkScreenSize()

    // Check on resize
    window.addEventListener('resize', checkScreenSize)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  if (isDesktop) {
    return (
      <div className={styles.desktopFallback}>
        <div className={styles.content}>
          <div className={styles.icon}>📱</div>
          <h1 className={styles.title}>Mobile Experience Required</h1>
          <p className={styles.message}>
            Please check on mobile browser for optimal experience
          </p>
        </div>
      </div>
    )
  }

  return children
}

export default DesktopFallback
