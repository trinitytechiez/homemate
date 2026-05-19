import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useModal } from '../../contexts/ModalContext'
import { useToast } from '../../contexts/ToastContext'
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation'
import AttendanceCalendar from '../../components/AttendanceCalendar/AttendanceCalendar'
import SalaryModal from '../../components/SalaryModal/SalaryModal'
import EmptyState from '../../components/EmptyState/EmptyState'
import Shimmer from '../../components/Shimmer'
import { getStaffMember, updateStaffMember, updateStaffAttendance, deleteStaffMember, getFreshStaffMember } from '../../utils/staffData'
import { getCachedData } from '../../utils/apiCache'
import { getCurrencySymbol } from '../../utils/currency'
import { useRequestCancellation } from '../../utils/useRequestCancellation'
import { validateMobileNumber, validateRequired, validateName } from '../../utils/validation'
import Loader from '../../components/Loader'
import styles from './styles.module.scss'

const StaffProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { openModal, closeModal } = useModal()
  const { showSuccess, showError } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if accessed from Staff list page (hide attendance log button)
  const fromStaffList = location.state?.fromStaffList || false

  // Staff data state - initialized empty, always fetched fresh from API using URL params
  const [staff, setStaff] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 4
  const retryDelayMs = (attempt) => Math.pow(2, attempt) * 500 // Exponential backoff: 500ms, 1s, 2s, 4s

  const { signal, trackRequest, untrackRequest } = useRequestCancellation()

  // Check authentication and load staff data from API using URL params
  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token || token.trim().length === 0) {
      navigate('/login', { replace: true })
      return
    }

    // Get staff ID from URL params - this is the source of truth
    if (!id) {
      navigate('/staff', { replace: true })
      return
    }

    const loadData = async () => {
      // Check cache synchronously first for instant UI update
      const cached = getCachedData(`/staff/${id}`, {}, 30 * 1000)
      if (cached !== null) {
        const mappedStaff = {
          ...cached,
          id: cached._id || cached.id
        }
        setStaff(mappedStaff)
        setIsLoading(false)
      } else {
        // If not cached, show shimmer
        setIsLoading(true)
      }

      try {
        // Always fetch fresh data from API for non-edit mode display
        const staffData = await getStaffMember(id, false, signal, trackRequest, untrackRequest)
        // Check if component is still mounted and request wasn't cancelled
        if (!signal?.aborted) {
          // Map MongoDB _id to id for compatibility
          const mappedStaff = {
            ...staffData,
            id: staffData._id || staffData.id
          }
          setStaff(mappedStaff)
          setRetryCount(0) // Reset retry count on success
        }
      } catch (error) {
        // Don't handle cancelled requests
        if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.message === 'Request cancelled') {
          return
        }

        // Handle non-retryable errors (auth/not found)
        if (error.response?.status === 401) {
          console.error('Authentication failed:', error)
          navigate('/login', { replace: true })
          return
        }
        if (error.response?.status === 404) {
          console.error('Staff member not found:', error)
          navigate('/staff', { replace: true })
          return
        }

        // Retryable errors
        console.error(`Error loading staff data (attempt ${retryCount + 1}/${maxRetries + 1}):`, error)

        if (retryCount < maxRetries && !signal?.aborted) {
          // Schedule retry with exponential backoff
          const delay = retryDelayMs(retryCount)
          console.log(`Retrying in ${delay}ms...`)
          setTimeout(() => {
            setRetryCount(retryCount + 1)
          }, delay)
        } else if (!signal?.aborted) {
          // Max retries exhausted
          console.error('Max retries exhausted, showing error to user')
          openModal({
            title: 'Error',
            content: <p>Failed to load staff data after {maxRetries + 1} attempts. Please check your connection and try again.</p>,
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
  }, [id, navigate, openModal, retryCount])

  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    location: '',
    phoneNumber: '',
    dob: '',
    role: '',
    monthlySalary: '',
    currency: 'INR',
    payCycle: 'Monthly',
    paidLeaves: '',
    visitingTime: ''
  })

  // Initialize formData when staff first loads
  useEffect(() => {
    if (staff && !isEditing) {
      setFormData({
        staffId: staff.id || staff._id || '',
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
  }, [staff, isEditing])

  const [errors, setErrors] = useState({})

  const handleBack = () => {
    navigate(-1)
  }

  const handleViewAttendanceLog = () => {
    const absentDatesSet = new Set(staff.absentDates || [])
    const halfDayDatesSet = new Set(staff.halfDayDates || [])
    openModal({
      title: `Attendance log: ${staff.name}`,
      content: (
        <AttendanceCalendar
          staffName={staff.name}
          staffId={staff.id || staff._id}
          initialAbsentDates={absentDatesSet}
          initialHalfDayDates={halfDayDatesSet}
          onAbsentDatesUpdate={async (absentDatesSet, halfDayDatesSet) => {
            try {
              const absentDatesArray = Array.from(absentDatesSet)
              const halfDayDatesArray = Array.from(halfDayDatesSet)
              const today = new Date()
              const formatDateKey = (year, month, day) => {
                return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              }
              const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
              const isAbsentToday = absentDatesSet.has(todayKey)

              // Update attendance - this is the critical operation
              await updateStaffAttendance(staff.id || staff._id, {
                absentDates: absentDatesArray,
                halfDayDates: halfDayDatesArray,
                isAbsentToday
              })

              // Attendance updated successfully - now try to refresh data
              try {
                const updatedStaff = await getStaffMember(staff.id || staff._id)
                const mappedStaff = {
                  ...updatedStaff,
                  id: updatedStaff._id || updatedStaff.id
                }
                setStaff(mappedStaff)
              } catch (refreshError) {
                console.warn('Failed to refresh staff data after attendance update:', refreshError)
              }
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

  const handleViewSalary = () => {
    openModal({
      title: `Salary & Payments — ${staff.name}`,
      content: (
        <SalaryModal
          staff={staff}
          onStaffUpdate={(updatedStaff) => {
            const mapped = { ...updatedStaff, id: updatedStaff._id || updatedStaff.id }
            setStaff(mapped)
          }}
          onClose={closeModal}
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
      staffId: staff.id || staff._id || '',
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


    // Category (role) is now optional to prevent blocking the user
    // const roleError = validateRequired(formData.role, 'Category')
    // if (roleError) newErrors.role = roleError

    const salaryError = validateRequired(formData.monthlySalary, 'Pay')
    if (salaryError) newErrors.monthlySalary = salaryError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
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

      console.log('📤 Updating staff with data:', updateData)
      // API returns updated staff with { new: true } - use as single source of truth
      const updatedStaff = await updateStaffMember(staff.id || staff._id, updateData)
      console.log('✅ API response - updated staff data:', updatedStaff)

      // Map MongoDB _id to id for compatibility
      const mappedStaff = {
        ...updatedStaff,
        id: updatedStaff._id || updatedStaff.id
      }

      // Update state with API response (single source of truth)
      setStaff(mappedStaff)
      setFormData({
        staffId: mappedStaff.id || mappedStaff._id || '',
        name: mappedStaff.name || '',
        location: mappedStaff.location || '',
        phoneNumber: mappedStaff.phoneNumber?.replace('+91', '') || '',
        dob: mappedStaff.dob || '',
        role: mappedStaff.role || '',
        monthlySalary: mappedStaff.monthlySalary || '',
        currency: mappedStaff.currency || 'INR',
        payCycle: mappedStaff.payCycle || 'Monthly',
        paidLeaves: mappedStaff.paidLeaves || '',
        visitingTime: mappedStaff.visitingTime || ''
      })
      setIsEditing(false)
      setErrors({})

      showSuccess('Staff member updated successfully!')
    } catch (error) {
      console.error('Error updating staff:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update staff member. Please try again.'
      showError(errorMessage)
    }
  }

  // Delete staff member with confirmation modal
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = () => {
    openModal({
      title: 'Delete Staff',
      content: (
        <div className={styles.confirmationContent}>
          <p className={styles.confirmationMessage}>
            Are you sure you want to delete <strong>{staff.name}</strong>? This action cannot be undone.
          </p>
          <div className={styles.confirmationActions}>
            <button
              className={styles.editButton}
              onClick={async () => {
                try {
                  setIsDeleting(true)
                  await deleteStaffMember(staff.id || staff._id)
                  // Close modal, show success toast and navigate back to staff list
                  closeModal()
                  showSuccess('Staff member deleted successfully!')
                  navigate('/staff', { replace: true })
                } catch (error) {
                  console.error('Error deleting staff member:', error)
                  const errorMessage = error.response?.data?.message || 'Failed to delete staff member. Please try again.'
                  openModal({
                    title: 'Error',
                    content: <p>{errorMessage}</p>,
                    size: 'small'
                  })
                } finally {
                  setIsDeleting(false)
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader size="small" variant="button" /> : 'Delete'}
            </button>
            <button
              className={styles.cancelButton}
              onClick={closeModal}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      size: 'small'
    })
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
            <div className={styles.profileActionButtons}>
              <button className={styles.attendanceButton} onClick={handleViewAttendanceLog}>
                📅 Attendance
              </button>
              <button className={styles.salaryButton} onClick={handleViewSalary}>
                💰 Salary
              </button>
            </div>
          )}
        </div>

        {/* Personal Details */}
        <div className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>Personal details</h2>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Staff ID</span>
            <span className={styles.detailValue}>{formData.staffId || <span style={{ color: '#999999', fontStyle: 'italic' }}>Not available</span>}</span>
          </div>
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
                className={`${styles.detailInput} ${errors.payCycle ? styles.inputError : ''}`}
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
                className={`${styles.detailInput} ${errors.paidLeaves ? styles.inputError : ''}`}
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
                className={`${styles.detailInput} ${errors.visitingTime ? styles.inputError : ''}`}
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
          <div className={styles.actionRow}>
            <button className={styles.editButton} onClick={handleEdit} disabled={isDeleting}>
              Edit info
            </button>
            <button className={styles.deleteButton} onClick={handleDelete} disabled={isDeleting}>
              Delete staff
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

export default StaffProfile
