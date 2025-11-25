import express from 'express'
import { body, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.model.js'
import Staff from '../models/Staff.model.js'
import authMiddleware from '../middleware/auth.middleware.js'

const router = express.Router()

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1
}

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        message: 'Database not connected',
        error: 'MongoDB is not connected'
      })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      })
    }

    res.json({
      message: 'Profile retrieved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        location: user.location || '',
        dob: user.dob || '',
        avatar: user.avatar || null
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      message: 'Error retrieving profile',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
})

// Update user profile
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
      if (!isMongoConnected()) {
        return res.status(503).json({
          message: 'Database not connected',
          error: 'MongoDB is not connected'
        })
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      // Check if email is being changed and if it's already taken
      if (req.body.email) {
        const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: req.userId } })
        if (existingUser) {
          return res.status(400).json({
            message: 'Email already in use'
          })
        }
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: req.body },
        { new: true, runValidators: true }
      )

      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        })
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          location: user.location || '',
          dob: user.dob || '',
          avatar: user.avatar || null
        }
      })
    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({
        message: 'Error updating profile',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

// Set password (for new users during registration - doesn't require current password)
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
      if (!isMongoConnected()) {
        return res.status(503).json({
          message: 'Database not connected',
          error: 'MongoDB is not connected'
        })
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { password } = req.body

      // Get user
      const user = await User.findById(req.userId)
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        })
      }

      // Update password (will be hashed by pre-save hook)
      user.password = password
      await user.save()

      res.json({
        message: 'Password set successfully'
      })
    } catch (error) {
      console.error('Set password error:', error)
      res.status(500).json({
        message: 'Error setting password',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

// Change password
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
      if (!isMongoConnected()) {
        return res.status(503).json({
          message: 'Database not connected',
          error: 'MongoDB is not connected'
        })
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { currentPassword, newPassword } = req.body

      // Get user with password
      const user = await User.findById(req.userId).select('+password')
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        })
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword)
      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Current password is incorrect'
        })
      }

      // Check if new password is different
      if (currentPassword === newPassword) {
        return res.status(400).json({
          message: 'New password must be different from current password'
        })
      }

      // Update password
      user.password = newPassword
      await user.save()

      res.json({
        message: 'Password changed successfully'
      })
    } catch (error) {
      console.error('Change password error:', error)
      res.status(500).json({
        message: 'Error changing password',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

// Delete account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        message: 'Database not connected',
        error: 'MongoDB is not connected'
      })
    }

    // Delete all staff associated with this user
    await Staff.deleteMany({ userId: req.userId })

    // Delete user account
    await User.findByIdAndDelete(req.userId)

    res.json({
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({
      message: 'Error deleting account',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
})

export default router

