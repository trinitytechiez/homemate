import { Link, useLocation } from 'react-router-dom'
import styles from './BottomNavigation.module.scss'

const BottomNavigation = () => {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', icon: '🏠', label: 'Home' },
    { path: '/staff', icon: '👥', label: 'Staff' },
    { path: '/add', icon: '➕', label: 'Add' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
    { path: '/profile', icon: '👤', label: 'Profile' }
  ]

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span className={styles.navLabel}>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default BottomNavigation

