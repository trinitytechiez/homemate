/**
 * Validation utilities for form fields
 */

/**
 * Validate mobile number (10 digits)
 */
export const validateMobileNumber = (mobileNumber) => {
  if (!mobileNumber || !mobileNumber.trim()) {
    return 'Mobile number is required'
  }
  
  const cleaned = mobileNumber.replace(/\D/g, '')
  
  if (cleaned.length !== 10) {
    return 'Mobile number must be 10 digits'
  }
  
  // Check if it starts with valid digits (0-9, but not all zeros)
  if (!/^[1-9]\d{9}$/.test(cleaned)) {
    return 'Mobile number must start with a digit 1-9'
  }
  
  return ''
}

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email is required'
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address'
  }
  
  // Additional check for common email patterns
  if (email.trim().length > 254) {
    return 'Email address is too long'
  }
  
  return ''
}

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || !value.toString().trim()) {
    return `${fieldName} is required`
  }
  return ''
}

/**
 * Validate name field
 */
export const validateName = (name, fieldName = 'Name') => {
  if (!name || !name.trim()) {
    return `${fieldName} is required`
  }
  
  if (name.trim().length < 2) {
    return `${fieldName} must be at least 2 characters`
  }
  
  if (name.trim().length > 50) {
    return `${fieldName} must be less than 50 characters`
  }
  
  return ''
}
