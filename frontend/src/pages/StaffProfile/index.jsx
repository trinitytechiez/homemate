import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import { useToast } from '../../contexts/ToastContext'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import AttendanceCalendar from '../../components/AttendanceCalendar/AttendanceCalendar'
import EmptyState from '../../components/EmptyState/EmptyState'
import Shimmer from '../../components/Shimmer'
import { getStaffMember, updateStaffMember, updateStaffAttendance } from '../../utils/staffData'
import { getCachedData } from '../../utils/apiCache'
import { getCurrencySymbol } from '../../utils/currency'
import { useRequestCancellation } from '../../utils/useRequestCancellation'
import { validateMobileNumber, validateRequired, validateName } from '../../utils/validation'
import styles from './styles.module.scss'

const StaffProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { openModal } = useModal()
  const { showSuccess } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Check if accessed from Staff list page (hide attendance log button)
  const fromStaffList = location.state?.fromStaffList || false
  
  // Get staff data from location state or fetch from API
  const [staff, setStaff] = useState(location.state?.staff || null)

  const { signal, trackRequest, untrackRequest } = useRequestCancellation()

  // Check authentication and load staff data on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token || token.trim().length === 0) {
      navigate('/login', { replace: true })
      return
    }

    // If staff data is already in location state, use it immediately (no loading)
    if (staff && staff.id) {
      const mappedStaff = {
        ...staff,
        id: staff._id || staff.id
      }
      setStaff(mappedStaff)
      setIsLoading(false)
      return
    }

    // If no staff data, show loading and fetch
    if (!id) {
      navigate('/staff', { replace: true })
      return
    }

    const loadData = async () => {
      // Check cache synchronously first
      const cached = getCachedData(`/staff/${id}`, {}, 30 * 1000)
      if (cached !== null) {
        // If cached, use it immediately without loading state
        const mappedStaff = {
          ...cached,
          id: cached._id || cached.id
        }
        setStaff(mappedStaff)
        setIsLoading(false)
        return
      }

      // If not cached, show shimmer and fetch
      setIsLoading(true)

      try {
        const staffData = await getStaffMember(id, true, signal, trackRequest, untrackRequest)
        // Check if component is still mounted and request wasn't cancelled
        if (!signal?.aborted) {
          // Map MongoDB _id to id for compatibility
          const mappedStaff = {
            ...staffData,
            id: staffData._id || staffData.id
          }
          setStaff(mappedStaff)
        }
      } catch (error) {
        // Don't handle cancelled requests
        if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.message === 'Request cancelled') {
          return
        }
        console.error('Error loading staff data:', error)
        if (error.response?.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        if (error.response?.status === 404) {
          navigate('/staff', { replace: true })
          return
        }
        if (!signal?.aborted) {
          openModal({
            title: 'Error',
            content: <p>Failed to load staff data. Please try again.</p>,
            size: 'small'
          })
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadData()
  }, [id, navigate, openModal, signal, trackRequest, untrackRequest, staff])

  const [formData, setFormData] = useState({
    name: staff?.name || '',
    location: staff?.location || '',
    phoneNumber: staff?.phoneNumber?.replace('+91', '') || '',
    dob: staff?.dob || '',
    role: staff?.role || '',
    monthlySalary: staff?.monthlySalary || '',
    currency: staff?.currency || 'INR',
    payCycle: staff?.payCycle || 'Monthly',
    paidLeaves: staff?.paidLeaves || '',
    visitingTime: staff?.visitingTime || ''
  })

  // Update formData when staff changes
  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        location: staff.location || '',
        phoneNumber: staff.phoneNumber?.replace('+91', '') || '',
        dob: staff.dob || '',
        role: staff.role || '',
        monthlySalary: staff.monthlySalary || '',
        currency: staff.currency || 'INR',
        payCycle: staff.payCycle || 'Monthly',
        paidLeaves: staff.paidLeaves || '',
        visitingTime: staff.visitingTime || ''
      })
    }
  }, [staff])

  const [errors, setErrors] = useState({})

  const handleBack = () => {
    navigate(-1)
  }

  const handleViewAttendanceLog = () => {
    const absentDatesSet = new Set(staff.absentDates || [])
    openModal({
      title: `Attendance log: ${staff.name}`,
      content: (
        <AttendanceCalendar 
          staffName={staff.name} 
          staffId={staff.id || staff._id}
          initialAbsentDates={absentDatesSet}
          onAbsentDatesUpdate={async (absentDatesSet) => {
            try {
              const absentDatesArray = Array.from(absentDatesSet)
              const today = new Date()
              const formatDateKey = (year, month, day) => {
                return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              }
              const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
              const isAbsentToday = absentDatesSet.has(todayKey)
              
              await updateStaffAttendance(staff.id || staff._id, {
                absentDates: absentDatesArray,
                isAbsentToday
              })
              
              // Refresh staff data
              const updatedStaff = await getStaffMember(staff.id || staff._id)
              const mappedStaff = {
                ...updatedStaff,
                id: updatedStaff._id || updatedStaff.id
              }
              setStaff(mappedStaff)
            } catch (error) {
              console.error('Error updating attendance:', error)
              openModal({
                title: 'Error',
                content: <p>Failed to update attendance. Please try again.</p>,
                size: 'small'
              })
            }
          }}
        />
      ),
      size: 'large'
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original staff data
    setFormData({
      name: staff.name || '',
      location: staff.location || '',
      phoneNumber: staff.phoneNumber?.replace('+91', '') || '',
      dob: staff.dob || '',
      role: staff.role || '',
        monthlySalary: staff.monthlySalary || '',
        currency: staff.currency || 'INR',
        payCycle: staff.payCycle || 'Monthly',
        paidLeaves: staff.paidLeaves || '',
        visitingTime: staff.visitingTime || ''
      })
    setErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Reset error when field changes
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
    // Reset error when field changes
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }))
    }
  }

  const handleSave = async () => {
    const newErrors = {}
    
    const nameError = validateName(formData.name, 'Name')
    if (nameError) newErrors.name = nameError
    
    const locationError = validateRequired(formData.location, 'Location')
    if (locationError) newErrors.location = locationError
    
    const phoneError = validateMobileNumber(formData.phoneNumber)
    if (phoneError) newErrors.phoneNumber = phoneError
    
    const roleError = validateRequired(formData.role, 'Category')
    if (roleError) newErrors.role = roleError
    
    const salaryError = validateRequired(formData.monthlySalary, 'Pay')
    if (salaryError) newErrors.monthlySalary = salaryError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Update staff data via API
      const updateData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        phoneNumber: formData.phoneNumber.startsWith('+91') 
          ? formData.phoneNumber 
          : `+91${formData.phoneNumber}`,
        dob: formData.dob || '',
        role: formData.role || '',
        monthlySalary: parseInt(formData.monthlySalary) || 0,
        currency: formData.currency || 'INR',
        payCycle: formData.payCycle || 'Monthly',
        paidLeaves: parseInt(formData.paidLeaves) || 0,
        visitingTime: formData.visitingTime || ''
      }

      const updatedStaff = await updateStaffMember(staff.id || staff._id, updateData)
      // Map MongoDB _id to id for compatibility
      const mappedStaff = {
        ...updatedStaff,
        id: updatedStaff._id || updatedStaff.id
      }
      setStaff(mappedStaff)
      setIsEditing(false)
      setErrors({})
      
      showSuccess('Staff member updated successfully!')
    } catch (error) {
      console.error('Error updating staff:', error)
      openModal({
        title: 'Error',
        content: <p>Failed to update staff member. Please try again.</p>,
        size: 'small'
      })
    }
  }

  // Show loading or redirect if no staff data
  if (!staff || !staff.id) {
    if (isLoading) {
      return (
        <div className={styles.profileContainer}>
          <div className={styles.profileContent}>
            <div className={styles.header}>
              <button className={styles.backButton} onClick={handleBack}>
                ←
              </button>
              <span className={styles.appName}>home/mate</span>
            </div>
            <Shimmer variant="profile" count={1} />
          </div>
          <BottomNavigation />
        </div>
      )
    }
    return null // Will redirect via useEffect
  }

  return (
    <div className={`${styles.profileContainer} ${isEditing ? styles.editing : ''}`}>
      <div className={styles.profileContent}>
        {/* Header */}
        <div className={`${styles.header} ${isEditing ? styles.headerEditing : ''}`}>
          <button className={styles.backButton} onClick={handleBack}>
            ←
          </button>
          <span className={styles.appName}>home/mate</span>
        </div>

        {/* Profile Picture and Name */}
        <div className={styles.profileSection}>
          <div className={styles.avatar}>
            {staff.avatar ? (
              <img src={staff.avatar} alt={staff.name} />
            ) : (
              <span className={styles.avatarPlaceholder}>
                {staff.name ? staff.name.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`${styles.nameInput} ${errors.name ? styles.inputError : ''}`}
            />
          ) : (
            <h1 className={styles.staffName}>{staff.name || 'Unnamed Staff'}</h1>
          )}
          {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          <p className={styles.addedDate}>Added on {staff.addedOn || 'Unknown date'}</p>
          {!fromStaffList && (
            <button className={styles.attendanceButton} onClick={handleViewAttendanceLog}>
              View attendance log
            </button>
          )}
        </div>

        {/* Personal Details */}
        <div className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>Personal details</h2>
          <div className={styles.detailItem}>
            <span className={`${styles.detailLabel} ${errors.name ? styles.labelError : ''}`}>Name</span>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${styles.detailInput} ${errors.name ? styles.inputError : ''}`}
              />
            ) : (
              <span className={styles.detailValue}>{staff.name || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>
          <div className={styles.detailItem}>
            <span className={`${styles.detailLabel} ${errors.location ? styles.labelError : ''}`}>Location</span>
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`${styles.detailInput} ${errors.location ? styles.inputError : ''}`}
              />
            ) : (
              <span className={styles.detailValue}>{staff.location || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
            {errors.location && <span className={styles.errorText}>{errors.location}</span>}
          </div>
          <div className={styles.detailItem}>
            <span className={`${styles.detailLabel} ${errors.phoneNumber ? styles.labelError : ''}`}>Mobile no.</span>
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
              <span className={styles.detailValue}>{staff.phoneNumber?.replace('+91', '') || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
            {errors.phoneNumber && <span className={styles.errorText}>{errors.phoneNumber}</span>}
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>DOB</span>
            {isEditing ? (
              <input
                type="text"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={`${styles.detailInput} ${errors.dob ? styles.inputError : ''}`}
                placeholder="DD/MM/YYYY"
              />
            ) : (
              <span className={styles.detailValue}>{staff.dob || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
            {errors.dob && <span className={styles.errorText}>{errors.dob}</span>}
          </div>
        </div>

        {/* Work Details */}
        <div className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>Work details</h2>
          <div className={styles.detailItem}>
            <span className={`${styles.detailLabel} ${errors.role ? styles.labelError : ''}`}>Category</span>
            {isEditing ? (
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`${styles.detailInput} ${errors.role ? styles.inputError : ''}`}
              />
            ) : (
              <span className={styles.detailValue}>{staff.role || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
            {errors.role && <span className={styles.errorText}>{errors.role}</span>}
          </div>
          <div className={styles.detailItem}>
            <span className={`${styles.detailLabel} ${errors.monthlySalary ? styles.labelError : ''}`}>Salary</span>
            {isEditing ? (
              <div className={styles.salaryInputGroup}>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className={styles.currencySelect}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                  <option value="AED">د.إ AED</option>
                </select>
                <input
                  type="number"
                  name="monthlySalary"
                  value={formData.monthlySalary}
                  onChange={handleChange}
                  className={`${styles.salaryInput} ${errors.monthlySalary ? styles.inputError : ''}`}
                  min="0"
                />
              </div>
            ) : (
              <span className={styles.detailValue}>
                {staff.monthlySalary 
                  ? `${getCurrencySymbol(staff.currency || 'INR')} ${staff.monthlySalary}` 
                  : <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}
              </span>
            )}
            {errors.monthlySalary && <span className={styles.errorText}>{errors.monthlySalary}</span>}
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Salary Type</span>
            {isEditing ? (
              <select
                name="payCycle"
                value={formData.payCycle}
                onChange={handleChange}
                className={styles.detailInput}
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            ) : (
              <span className={styles.detailValue}>{staff.payCycle || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Paid leaves</span>
            {isEditing ? (
              <input
                type="number"
                name="paidLeaves"
                value={formData.paidLeaves}
                onChange={handleChange}
                className={styles.detailInput}
                min="0"
              />
            ) : (
              <span className={styles.detailValue}>{staff.paidLeaves ? `${staff.paidLeaves} per month` : <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
            )}
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Visiting time</span>
            {isEditing ? (
              <input
                type="text"
                name="visitingTime"
                value={formData.visitingTime}
                onChange={handleChange}
                className={styles.detailInput}
                placeholder="10.30 AM"
              />
            ) : (
              <span className={styles.detailValue}>{staff.visitingTime || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not set</span>}</span>
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
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default StaffProfile
