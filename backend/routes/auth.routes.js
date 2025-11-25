import express from 'express'
import { body, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'
import { mockAuthService } from '../services/mockAuth.service.js'

const router = express.Router()

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1
}

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  })
}

// Use mock service if MongoDB not connected, otherwise use real DB
const getAuthService = () => {
  if (isMongoConnected()) {
    return {
      findUserByEmail: async (email) => {
        return await User.findOne({ email }).select('+password')
      },
      findUserById: async (id) => {
        return await User.findById(id)
      },
      createUser: async (userData) => {
        const user = new User(userData)
        await user.save()
        return user
      },
      verifyPassword: async (user, password) => {
        return await user.comparePassword(password)
      },
      generateToken,
      sanitizeUser: (user) => {
        const userObj = user.toObject ? user.toObject() : user
        const { password, ...userWithoutPassword } = userObj
        return userWithoutPassword
      }
    }
  }
  return mockAuthService
}

// Register route
router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { name, email, password, phoneNumber, location } = req.body

      const authService = getAuthService()

      // Check if user already exists
      const existingUser = await authService.findUserByEmail(email)
      if (existingUser) {
        return res.status(400).json({
          message: 'User with this email already exists'
        })
      }

      // Create new user
      const user = await authService.createUser({
        name,
        email,
        password,
        phoneNumber: phoneNumber || '',
        location: location || ''
      })

      // Generate token
      const userId = user._id ? user._id.toString() : user.id
      const token = authService.generateToken(userId)

      // Sanitize user (remove password)
      const sanitizedUser = authService.sanitizeUser(user)

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: sanitizedUser._id || sanitizedUser.id,
          name: sanitizedUser.name,
          email: sanitizedUser.email
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      
      // Check if it's a MongoDB connection error
      if (error.message && error.message.includes('buffering timed out')) {
        return res.status(503).json({
          message: 'Database connection failed',
          error: 'MongoDB is not connected. Please check your MongoDB connection string in backend/.env file.',
          help: 'See MongoDB Atlas documentation for setup instructions'
        })
      }
      
      res.status(500).json({
        message: 'Server error during registration',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

// Send OTP route
router.post(
  '/send-otp',
  [
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { phoneNumber } = req.body

      // Import OTP service
      const { otpService } = await import('../services/otp.service.js')
      
      const result = await otpService.sendOTP(phoneNumber)

      res.json({
        message: result.message,
        expiresIn: result.expiresIn
      })
    } catch (error) {
      console.error('Send OTP error:', error)
      res.status(500).json({
        message: error.message || 'Failed to send OTP. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

// Verify OTP route
router.post(
  '/verify-otp',
  [
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required'),
    body('otp')
      .trim()
      .isLength({ min: 4, max: 4 })
      .withMessage('OTP must be 4 digits')
      .isNumeric()
      .withMessage('OTP must be numeric')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { phoneNumber, otp } = req.body

      // Import OTP service
      const { otpService } = await import('../services/otp.service.js')
      
      const result = await otpService.verifyOTP(phoneNumber, otp)

      if (!result.success) {
        return res.status(400).json({
          message: result.message,
          attemptsRemaining: result.attemptsRemaining
        })
      }

      // Find user by phone number
      const authService = getAuthService()
      let user

      if (isMongoConnected()) {
        user = await User.findOne({ phoneNumber })
      } else {
        // For mock service, check if user exists by phone number
        // Mock service doesn't support phone number lookup directly
        // So we'll return an error asking user to register
        user = null
      }

      // If user doesn't exist, return error asking to register
      if (!user) {
        return res.status(404).json({
          message: 'No user found with this phone number. Please register first.',
          code: 'USER_NOT_FOUND',
          requiresRegistration: true
        })
      }

      // Generate token
      const userId = user._id ? user._id.toString() : user.id
      const token = authService.generateToken(userId)

      // Sanitize user (remove password)
      const sanitizedUser = authService.sanitizeUser(user)

      res.json({
        message: 'OTP verified successfully',
        token,
        user: {
          id: sanitizedUser._id || sanitizedUser.id,
          name: sanitizedUser.name,
          email: sanitizedUser.email,
          phoneNumber: sanitizedUser.phoneNumber
        }
      })
    } catch (error) {
      console.error('Verify OTP error:', error)
      res.status(500).json({
        message: error.message || 'Failed to verify OTP. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

// Resend OTP route
router.post(
  '/resend-otp',
  [
    body('phoneNumber')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { phoneNumber } = req.body

      // Import OTP service
      const { otpService } = await import('../services/otp.service.js')
      
      const result = await otpService.resendOTP(phoneNumber)

      res.json({
        message: result.message,
        expiresIn: result.expiresIn
      })
    } catch (error) {
      console.error('Resend OTP error:', error)
      res.status(500).json({
        message: error.message || 'Failed to resend OTP. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

// Login route
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { email, password } = req.body

      const authService = getAuthService()

      // Find user and include password for comparison
      const user = await authService.findUserByEmail(email)
      if (!user) {
        console.log(`Login attempt failed: User not found for email: ${email}`)
        return res.status(401).json({
          message: 'Invalid email or password'
        })
      }

      // Compare password
      const isPasswordValid = await authService.verifyPassword(user, password)
      
      if (!isPasswordValid) {
        console.log(`Login attempt failed: Invalid password for email: ${email}`)
        return res.status(401).json({
          message: 'Invalid email or password'
        })
      }
      
      console.log(`Login successful for user: ${user.email} (ID: ${user._id || user.id})`)

      // Generate token
      const userId = user._id ? user._id.toString() : user.id
      const token = authService.generateToken(userId)

      // Sanitize user (remove password)
      const sanitizedUser = authService.sanitizeUser(user)

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: sanitizedUser._id || sanitizedUser.id,
          name: sanitizedUser.name,
          email: sanitizedUser.email
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      
      // Check if it's a MongoDB connection error
      if (error.message && error.message.includes('buffering timed out')) {
        return res.status(503).json({
          message: 'Database connection failed',
          error: 'MongoDB is not connected. Please check your MongoDB connection string in backend/.env file.',
          help: 'See MongoDB Atlas documentation for setup instructions'
        })
      }
      
      res.status(500).json({
        message: 'Server error during login',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

export default router

