import { Link, useLocation } from 'react-router-dom'
import { useMemo, memo } from 'react'
import styles from './BottomNavigation.module.scss'

const BottomNavigation = memo(() => {
  const location = useLocation()

  const navItems = useMemo(() => [
    { path: '/dashboard', icon: '🏠', label: 'Home' },
    { path: '/staff', icon: '👥', label: 'Staff' },
    { path: '/add', icon: '➕', label: 'Add' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
    { path: '/profile', icon: '👤', label: 'Profile' }
  ], [])

  const isActive = useMemo(() => {
    return (path) => {
      if (path === '/dashboard') {
        return location.pathname === '/dashboard'
      }
      return location.pathname.startsWith(path)
    }
  }, [location.pathname])

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
})

BottomNavigation.displayName = 'BottomNavigation'

export default BottomNavigation





