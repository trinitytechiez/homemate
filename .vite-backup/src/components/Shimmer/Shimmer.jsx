import styles from './Shimmer.module.scss'

/**
 * Shimmer loading component for seamless loading experience
 * 
 * @param {string} variant - 'card', 'list', 'profile', 'dashboard'
 * @param {number} count - Number of shimmer items to show
 */
const Shimmer = ({ variant = 'card', count = 3 }) => {
  const renderShimmer = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={styles.shimmerCard}>
            <div className={styles.shimmerAvatar}></div>
            <div className={styles.shimmerContent}>
              <div className={styles.shimmerLine} style={{ width: '60%' }}></div>
              <div className={styles.shimmerLine} style={{ width: '40%' }}></div>
              <div className={styles.shimmerLine} style={{ width: '50%' }}></div>
            </div>
          </div>
        )
      
      case 'list':
        return (
          <div className={styles.shimmerListItem}>
            <div className={styles.shimmerAvatar}></div>
            <div className={styles.shimmerContent}>
              <div className={styles.shimmerLine} style={{ width: '70%' }}></div>
              <div className={styles.shimmerLine} style={{ width: '50%' }}></div>
              <div className={styles.shimmerLine} style={{ width: '40%' }}></div>
            </div>
            <div className={styles.shimmerArrow}></div>
          </div>
        )
      
      case 'profile':
        return (
          <div className={styles.shimmerProfile}>
            <div className={styles.shimmerLargeAvatar}></div>
            <div className={styles.shimmerContent}>
              <div className={styles.shimmerLine} style={{ width: '50%', marginBottom: '1rem' }}></div>
              <div className={styles.shimmerLine} style={{ width: '80%' }}></div>
              <div className={styles.shimmerLine} style={{ width: '60%' }}></div>
              <div className={styles.shimmerLine} style={{ width: '70%' }}></div>
            </div>
          </div>
        )
      
      case 'dashboard':
        return (
          <div className={styles.shimmerCard}>
            <div className={styles.shimmerHeader}>
              <div className={styles.shimmerLine} style={{ width: '40%' }}></div>
              <div className={styles.shimmerBadge}></div>
            </div>
            <div className={styles.shimmerAvatar}></div>
            <div className={styles.shimmerContent}>
              <div className={styles.shimmerLine} style={{ width: '60%' }}></div>
              <div className={styles.shimmerLine} style={{ width: '50%' }}></div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className={styles.shimmerCard}>
            <div className={styles.shimmerLine}></div>
          </div>
        )
    }
  }

  return (
    <div className={styles.shimmerContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderShimmer()}
        </div>
      ))}
    </div>
  )
}

export default Shimmer
