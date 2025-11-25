import styles from './Loader.module.scss'

const Loader = ({ 
  size = 'medium', 
  fullScreen = false, 
  text = '', 
  variant = 'default',
  className = '' 
}) => {
  const loaderClasses = `${styles.loader} ${styles[size]} ${fullScreen ? styles.fullScreen : ''} ${variant === 'button' ? styles.button : ''} ${variant === 'inline' ? styles.inline : ''} ${className}`
  
  return (
    <div className={loaderClasses}>
      <div className={styles.spinner}>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
      </div>
      {text && <p className={styles.loaderText}>{text}</p>}
    </div>
  )
}

export default Loader

