// Authentication utility functions
import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  })
}

/**
 * Sanitize user object by removing sensitive fields
 * @param {Object} user - User object (Mongoose document or plain object)
 * @returns {Object} Sanitized user object
 */
export const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user
  const { password, ...userWithoutPassword } = userObj
  return userWithoutPassword
}

/**
 * Get user ID from user object (handles both _id and id)
 * @param {Object} user - User object
 * @returns {string} User ID as string
 */
export const getUserId = (user) => {
  return user._id ? user._id.toString() : user.id
}

/**
 * Format user response for API
 * @param {Object} user - User object
 * @returns {Object} Formatted user object
 */
export const formatUserResponse = (user) => {
  const sanitized = sanitizeUser(user)
  return {
    id: sanitized._id || sanitized.id,
    name: sanitized.name,
    email: sanitized.email,
    phoneNumber: sanitized.phoneNumber || '',
    location: sanitized.location || '',
    dob: sanitized.dob || '',
    avatar: sanitized.avatar || null
  }
}

