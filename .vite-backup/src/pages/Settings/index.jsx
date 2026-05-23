import { useNavigate } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import ChangePasswordModal from '../../components/ChangePasswordModal/ChangePasswordModal'
import api from '../../utils/api'
import { clearAuth } from '../../utils/auth.utils'
import styles from './styles.module.scss'

const Settings = () => {
  const navigate = useNavigate()
  const { openModal, closeModal } = useModal()

  const handleChangePassword = () => {
    openModal({
      title: 'Change Password',
      content: <ChangePasswordModal onClose={closeModal} />,
      size: 'medium'
    })
  }

  const handleDeleteAccount = () => {
    openModal({
      title: 'Delete Account',
      content: (
        <div className={styles.confirmationContent}>
          <p className={styles.confirmationMessage}>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
          </p>
          <div className={styles.confirmationActions}>
            <button
              className={styles.confirmButton}
              onClick={async () => {
                try {
                  await api.delete('/user/account')
                  // Clear all local storage
                  clearAuth()
                  localStorage.removeItem('homemate_user_profile')
                  localStorage.removeItem('homemate_staff_data')
                  closeModal()
                  navigate('/login')
                } catch (error) {
                  console.error('Error deleting account:', error)
                  const errorMessage = error.response?.data?.message || 'Failed to delete account. Please try again.'
                  openModal({
                    title: 'Error',
                    content: <p>{errorMessage}</p>,
                    size: 'small'
                  })
                }
              }}
            >
              Delete Account
            </button>
            <button
              className={styles.cancelButton}
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      size: 'small'
    })
  }

  const handleLogout = () => {
    openModal({
      title: 'Logout',
      content: (
        <div className={styles.confirmationContent}>
          <p className={styles.confirmationMessage}>
            Are you sure you want to logout?
          </p>
          <div className={styles.confirmationActions}>
            <button
              className={styles.confirmButton}
              onClick={() => {
                clearAuth()
                closeModal()
                navigate('/login')
              }}
            >
              Logout
            </button>
            <button
              className={styles.cancelButton}
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      size: 'small'
    })
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsContent}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.appTitle}>home/mate</h1>
        </header>

        {/* Settings Options */}
        <div className={styles.settingsList}>
          <button className={styles.settingItem} onClick={handleChangePassword}>
            <div className={styles.settingIcon}>
              <span className={styles.iconPerson}>👤</span>
            </div>
            <span className={styles.settingLabel}>Change password</span>
            <span className={styles.settingArrow}>→</span>
          </button>

          <div className={styles.divider}></div>

          <button className={styles.settingItem} onClick={handleDeleteAccount}>
            <div className={styles.settingIcon}>
              <span className={styles.iconPersonCard}>👤📄</span>
            </div>
            <span className={styles.settingLabel}>Delete account</span>
            <span className={styles.settingArrow}>→</span>
          </button>

          <div className={styles.divider}></div>

          <button className={styles.settingItem} onClick={handleLogout}>
            <div className={styles.settingIcon}>
              <span className={styles.iconLogout}>🚪</span>
            </div>
            <span className={styles.settingLabel}>Logout</span>
            <span className={styles.settingArrow}>→</span>
          </button>

          <div className={styles.divider}></div>
        </div>

        {/* About this app */}
        <div className={styles.aboutSection}>
          <button 
            className={styles.aboutLink}
            onClick={() => navigate('/about')}
          >
            <span className={styles.infoIcon}>ℹ️</span>
            <span className={styles.aboutText}>About this app</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Settings
