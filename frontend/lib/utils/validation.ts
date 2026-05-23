export const validateMobileNumber = (mobileNumber: string): string => {
  if (!mobileNumber || !mobileNumber.trim()) {
    return 'Mobile number is required'
  }

  const cleaned = mobileNumber.replace(/\D/g, '')

  if (cleaned.length !== 10) {
    return 'Mobile number must be 10 digits'
  }

  if (!/^[1-9]\d{9}$/.test(cleaned)) {
    return 'Mobile number must start with a digit 1-9'
  }

  return ''
}

export const validateEmail = (email: string): string => {
  if (!email || !email.trim()) {
    return 'Email is required'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address'
  }

  if (email.trim().length > 254) {
    return 'Email address is too long'
  }

  return ''
}

export const validateRequired = (value: any, fieldName: string = 'This field'): string => {
  if (value === 0 || value === false) return ''
  if (!value || !value.toString().trim()) {
    return `${fieldName} is required`
  }
  return ''
}

export const validateName = (name: string, fieldName: string = 'Name'): string => {
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
