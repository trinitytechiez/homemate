// Response utility functions for consistent API responses

/**
 * Send error response with consistent format
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Error} error - Optional error object for development
 * @returns {Object} Express response
 */
export const sendErrorResponse = (res, statusCode, message, error = null) => {
  const response = {
    message
  }
  
  // Include error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error.message
  }
  
  return res.status(statusCode).json(response)
}

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors array
 * @returns {Object} Express response
 */
export const sendValidationError = (res, errors) => {
  return res.status(400).json({
    message: 'Validation failed',
    errors: errors.array()
  })
}

/**
 * Send success response with data
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {Object} data - Optional data to include
 * @returns {Object} Express response
 */
export const sendSuccessResponse = (res, statusCode = 200, message, data = null) => {
  const response = { message }
  if (data) {
    Object.assign(response, data)
  }
  return res.status(statusCode).json(response)
}

