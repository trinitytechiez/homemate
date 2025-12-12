import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import { useToast } from '../../contexts/ToastContext'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import Shimmer from '../../components/Shimmer'
import EmptyState from '../../components/EmptyState/EmptyState'
import api from '../../utils/api'
import { useRequestCancellation } from '../../utils/useRequestCancellation'
import styles from './styles.module.scss'

const Profile = () => {
  const navigate = useNavigate()
  const { openModal } = useModal()
  const { showSuccess } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState({
    name: '',
    location: '',
    phoneNumber: '',
    email: '',
    dob: '',
    avatar: null
  })
  const [formData, setFormData] = useState(profile)
  const [errors, setErrors] = useState({})

  const { signal, trackRequest, untrackRequest } = useRequestCancellation()

  // Check authentication and load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token')
      
      if (!token || token.trim().length === 0) {
        navigate('/login', { replace: true })
        return
      }

      const requestId = `getProfile-${Date.now()}-${Math.random()}`
      
      // Track this request as ongoing
      trackRequest(requestId)

      try {
        const response = await api.get('/user/profile', { signal })
        // Untrack when request completes successfully
        untrackRequest(requestId)
        // Check if component is still mounted and request wasn't cancelled
        if (!signal?.aborted) {
          const userData = response.data.user
          const profileData = {
            name: userData.name || '',
            location: userData.location || '',
            phoneNumber: userData.phoneNumber || '',
            email: userData.email || '',
            dob: userData.dob || '',
            avatar: userData.avatar || null
          }
          setProfile(profileData)
          setFormData(profileData)
        }
      } catch (error) {
        // Untrack when request fails or is cancelled
        untrackRequest(requestId)
        // Don't handle cancelled requests
        if (error.code === 'ERR_CANCELED' || error.name === 'AbortError') {
          return
        }
        console.error('Error loading profile:', error)
        if (error.response?.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        if (!signal?.aborted) {
          openModal({
            title: 'Error',
            content: <p>Failed to load profile. Please try again.</p>,
            size: 'small'
          })
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()
  }, [navigate, openModal, signal, trackRequest, untrackRequest])

  useEffect(() => {
    setFormData(profile)
  }, [profile])

  // Removed handleBack - no back button in Profile header

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData(profile) // Revert changes
    setErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setFormData(prev => ({ ...prev, phoneNumber: value }))
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }))
    }
  }

  const handleSave = async () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Mobile number is required'
    } else if (formData.phoneNumber.length !== 10) {
      newErrors.phoneNumber = 'Mobile number must be 10 digits'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Update profile via API
      const updateData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        phoneNumber: formData.phoneNumber.startsWith('+91') 
          ? formData.phoneNumber 
          : `+91${formData.phoneNumber}`,
        email: formData.email.trim(),
        dob: formData.dob || ''
      }

      const response = await api.put('/user/profile', updateData)
      const userData = response.data.user
      const updatedProfile = {
        name: userData.name || '',
        location: userData.location || '',
        phoneNumber: userData.phoneNumber || '',
        email: userData.email || '',
        dob: userData.dob || '',
        avatar: userData.avatar || null
      }

      setProfile(updatedProfile)
      setIsEditing(false)
      setErrors({})
      
      showSuccess('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.'
      openModal({
        title: 'Error',
        content: <p>{errorMessage}</p>,
        size: 'small'
      })
    }
  }

  return (
    <div className={`${styles.profileContainer} ${isEditing ? styles.editing : ''}`}>
      <div className={styles.profileContent}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.appTitle}>home/mate</h1>
        </header>

        {isLoading ? (
          <Shimmer variant="profile" count={1} />
        ) : (
          <>
            {/* Profile Section */}
            <div className={styles.profileSection}>
              <div className={styles.avatar}>
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name || 'User'} />
            ) : (
              <span className={styles.avatarPlaceholder}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
        </div>

        {/* Personal Details */}
        <div className={styles.detailsSection}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Name</span>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${styles.detailInput} ${errors.name ? styles.inputError : ''}`}
              />
            ) : (
              <span className={styles.detailValue}>{profile.name || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Location</span>
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`${styles.detailInput} ${errors.location ? styles.inputError : ''}`}
              />
            ) : (
              <span className={styles.detailValue}>{profile.location || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
            {errors.location && <span className={styles.errorText}>{errors.location}</span>}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Mobile no.</span>
            {isEditing ? (
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleMobileChange}
                className={`${styles.detailInput} ${errors.phoneNumber ? styles.inputError : ''}`}
                maxLength={10}
              />
            ) : (
              <span className={styles.detailValue}>{profile.phoneNumber || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
            {errors.phoneNumber && <span className={styles.errorText}>{errors.phoneNumber}</span>}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Email Id</span>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${styles.detailInput} ${errors.email ? styles.inputError : ''}`}
              />
            ) : (
              <span className={styles.detailValue}>{profile.email || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>DOB</span>
            {isEditing ? (
              <input
                type="text"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={styles.detailInput}
                placeholder="DD/MM/YYYY"
              />
            ) : (
              <span className={styles.detailValue}>{profile.dob || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing ? (
          <div className={styles.editActions}>
            <button className={styles.saveButton} onClick={handleSave}>
              Save Changes
            </button>
            <button className={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        ) : (
          <button className={styles.editButton} onClick={handleEdit}>
            Edit info
          </button>
        )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default Profile
