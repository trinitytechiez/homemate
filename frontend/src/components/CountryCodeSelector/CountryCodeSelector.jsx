import { useState, useRef, useEffect } from 'react'
import styles from './CountryCodeSelector.module.scss'

const countries = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: '+84', flag: '🇻🇳', name: 'Vietnam' }
]

const CountryCodeSelector = ({ value = '+91', onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedCountry = countries.find(country => country.code === value) || countries[0]

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

  const handleSelect = (country) => {
    onChange(country.code)
    setIsOpen(false)
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.selector}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select country code"
        aria-expanded={isOpen}
      >
        <span className={styles.flag}>{selectedCountry.flag}</span>
        <span className={styles.code}>{selectedCountry.code}</span>
        <span className={styles.arrow} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              className={`${styles.option} ${value === country.code ? styles.selected : ''}`}
              onClick={() => handleSelect(country)}
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

