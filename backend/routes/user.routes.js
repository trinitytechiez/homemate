import express from 'express'
import { body } from 'express-validator'
import User from '../models/User.model.js'
import Staff from '../models/Staff.model.js'
import authMiddleware from '../middleware/auth.middleware.js'
import { isMongoConnected, ensureMongoConnection } from '../utils/db.utils.js'
import { checkValidation } from '../utils/validation.utils.js'
import { sendErrorResponse, sendSuccessResponse } from '../utils/response.utils.js'
import { formatUserResponse } from '../utils/auth.utils.js'

const router = express.Router()

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Ensure MongoDB connection (for serverless environments)
    const isConnected = await ensureMongoConnection()
    if (!isConnected) {
      return sendErrorResponse(res, 503, 'Database not connected')
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found')
    }

    return sendSuccessResponse(res, 200, 'Profile retrieved successfully', {
      user: formatUserResponse(user)
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return sendErrorResponse(res, 500, 'Error retrieving profile', error)
  }
})

router.put(
  '/profile',
  authMiddleware,
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('phoneNumber').optional().trim(),
    body('location').optional().trim(),
    body('dob').optional().trim()
  ],
  async (req, res) => {
    try {
      const isConnected = await ensureMongoConnection()
      if (!isConnected) {
        return sendErrorResponse(res, 503, 'Database not connected')
      }

      if (!checkValidation(req, res)) return

      if (req.body.email) {
        const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: req.userId } })
        if (existingUser) {
          return sendErrorResponse(res, 400, 'Email already in use')
        }
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: req.body },
        { new: true, runValidators: true }
      )

      if (!user) {
        return sendErrorResponse(res, 404, 'User not found')
      }

      return sendSuccessResponse(res, 200, 'Profile updated successfully', {
        user: formatUserResponse(user)
      })
    } catch (error) {
      console.error('Update profile error:', error)
      return sendErrorResponse(res, 500, 'Error updating profile', error)
    }
  }
)

router.put(
  '/set-password',
  authMiddleware,
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
  ],
  async (req, res) => {
    try {
      const isConnected = await ensureMongoConnection()
      if (!isConnected) {
        return sendErrorResponse(res, 503, 'Database not connected')
      }

      if (!checkValidation(req, res)) return

      const { password } = req.body
      const user = await User.findById(req.userId)
      
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found')
      }

      user.password = password
      await user.save()

      return sendSuccessResponse(res, 200, 'Password set successfully')
    } catch (error) {
      console.error('Set password error:', error)
      return sendErrorResponse(res, 500, 'Error setting password', error)
    }
  }
)

router.put(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
  ],
  async (req, res) => {
    try {
      const isConnected = await ensureMongoConnection()
      if (!isConnected) {
        return sendErrorResponse(res, 503, 'Database not connected')
      }

      if (!checkValidation(req, res)) return

      const { currentPassword, newPassword } = req.body
      const user = await User.findById(req.userId).select('+password')
      
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found')
      }

      const isPasswordValid = await user.comparePassword(currentPassword)
      if (!isPasswordValid) {
        return sendErrorResponse(res, 401, 'Current password is incorrect')
      }

      if (currentPassword === newPassword) {
        return sendErrorResponse(res, 400, 'New password must be different from current password')
      }

      user.password = newPassword
      await user.save()

      return sendSuccessResponse(res, 200, 'Password changed successfully')
    } catch (error) {
      console.error('Change password error:', error)
      return sendErrorResponse(res, 500, 'Error changing password', error)
    }
  }
)

router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const isConnected = await ensureMongoConnection()
    if (!isConnected) {
      return sendErrorResponse(res, 503, 'Database not connected')
    }

    await Staff.deleteMany({ userId: req.userId })
    await User.findByIdAndDelete(req.userId)

    return sendSuccessResponse(res, 200, 'Account deleted successfully')
  } catch (error) {
    console.error('Delete account error:', error)
    return sendErrorResponse(res, 500, 'Error deleting account', error)
  }
})

export default router

