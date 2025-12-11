import styles from './Loader.module.scss'

const Loader = ({ 
  fullScreen = false, 
  text = '', 
  size = 'medium',
  variant = 'default'
}) => {
  const loaderClasses = [
    styles.loader,
    fullScreen && styles.fullScreen,
    styles[size],
    styles[variant]
  ].filter(Boolean).join(' ')

  if (fullScreen) {
    return (
      <div className={loaderClasses}>
        <div className={styles.spinner}></div>
        {text && <p className={styles.text}>{text}</p>}
      </div>
    )
  }

  return (
    <div className={loaderClasses}>
      <div className={styles.spinner}></div>
      {text && <span className={styles.text}>{text}</span>}
    </div>
  )
}

export default Loader

