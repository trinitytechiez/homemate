import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import styles from './About.module.scss'

const About = () => {
  const navigate = useNavigate()

  return (
    <div className={styles.aboutContainer}>
      <div className={styles.aboutContent}>
        {/* Header */}
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            ←
          </button>
          <h1 className={styles.appTitle}>home/mate</h1>
          <div style={{ width: '36px' }}></div> {/* Spacer for centering */}
        </header>

        {/* About Section */}
        <div className={styles.aboutSection}>
          <div className={styles.logoContainer}>
            <div className={styles.logoCircle}>
              <span className={styles.logoText}>TT</span>
            </div>
          </div>

          <h2 className={styles.teamName}>Trinity Techiez</h2>
          <p className={styles.tagline}>Building innovative solutions together</p>

          <div className={styles.divider}></div>

          <h3 className={styles.sectionTitle}>Developed By</h3>
          
          <div className={styles.teamMembers}>
            <div className={styles.memberCard}>
              <div className={styles.memberAvatar}>
                <span>S</span>
              </div>
              <h4 className={styles.memberName}>Sonal</h4>
            </div>

            <div className={styles.memberCard}>
              <div className={styles.memberAvatar}>
                <span>V</span>
              </div>
              <h4 className={styles.memberName}>Varun</h4>
            </div>

            <div className={styles.memberCard}>
              <div className={styles.memberAvatar}>
                <span>N</span>
              </div>
              <h4 className={styles.memberName}>Nayan</h4>
            </div>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.appInfo}>
            <p className={styles.infoText}>
              HomeMate is a mobile-focused Progressive Web App designed to help you manage your staff, 
              track attendance, and handle payroll efficiently.
            </p>
            <p className={styles.versionText}>Version 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default About

