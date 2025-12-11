// Validation utility functions
import { validationResult } from 'express-validator'
import { sendValidationError } from './response.utils.js'

/**
 * Check validation results and send error if invalid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} True if validation passed, false otherwise
 */
export const checkValidation = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    sendValidationError(res, errors)
    return false
  }
  return true
}

