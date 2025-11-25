import { useState, useRef, useEffect } from 'react'
import styles from './CountryCodeSelector.module.scss'

const countries = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
]

const CountryCodeSelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const selectedCountry = countries.find(c => c.code === value) || countries[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (code) => {
    onChange(code)
    setIsOpen(false)
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.selector}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select country code"
      >
        <span className={styles.flag}>{selectedCountry.flag}</span>
        <span className={styles.code}>{selectedCountry.code}</span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              className={`${styles.option} ${value === country.code ? styles.selected : ''}`}
              onClick={() => handleSelect(country.code)}
            >
              <span className={styles.flag}>{country.flag}</span>
              <span className={styles.code}>{country.code}</span>
              <span className={styles.name}>{country.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CountryCodeSelector
