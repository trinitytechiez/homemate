import express from 'express'
import { body } from 'express-validator'
import User from '../models/User.model.js'
import { getAuthService } from '../services/auth.service.js'
import { isMongoConnected } from '../utils/db.utils.js'
import { checkValidation } from '../utils/validation.utils.js'
import { sendErrorResponse, sendSuccessResponse } from '../utils/response.utils.js'
import { formatUserResponse } from '../utils/auth.utils.js'

const router = express.Router()

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
      if (!checkValidation(req, res)) return

      const { name, email, password, phoneNumber, location } = req.body
      const authService = getAuthService()

      const existingUser = await authService.findUserByEmail(email)
      if (existingUser) {
        return sendErrorResponse(res, 400, 'User with this email already exists')
      }

      const user = await authService.createUser({
        name,
        email,
        password,
        phoneNumber: phoneNumber || '',
        location: location || ''
      })

      const token = authService.generateToken(authService.getUserId(user))
      const userResponse = formatUserResponse(user)

      return sendSuccessResponse(res, 201, 'User registered successfully', {
        token,
        user: {
          id: userResponse.id,
          name: userResponse.name,
          email: userResponse.email
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      
      if (error.message?.includes('buffering timed out')) {
        return sendErrorResponse(res, 503, 'Database connection failed', error)
      }
      
      return sendErrorResponse(res, 500, 'Server error during registration', error)
    }
  }
)

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
      if (!checkValidation(req, res)) return

      const { phoneNumber } = req.body
      const { otpService } = await import('../services/otp.service.js')
      
      const result = await otpService.sendOTP(phoneNumber)

      return sendSuccessResponse(res, 200, result.message, {
        expiresIn: result.expiresIn
      })
    } catch (error) {
      console.error('Send OTP error:', error)
      return sendErrorResponse(res, 500, error.message || 'Failed to send OTP. Please try again.', error)
    }
  }
)

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
      if (!checkValidation(req, res)) return

      const { phoneNumber, otp } = req.body
      const { otpService } = await import('../services/otp.service.js')
      
      const result = await otpService.verifyOTP(phoneNumber, otp)

      if (!result.success) {
        return res.status(400).json({
          message: result.message,
          attemptsRemaining: result.attemptsRemaining
        })
      }

      const authService = getAuthService()
      const user = isMongoConnected() 
        ? await User.findOne({ phoneNumber })
        : await authService.findUserByPhoneNumber?.(phoneNumber) || null

      if (!user) {
        return res.status(404).json({
          message: 'No user found with this phone number. Please register first.',
          code: 'USER_NOT_FOUND',
          requiresRegistration: true
        })
      }

      const token = authService.generateToken(authService.getUserId(user))
      const userResponse = formatUserResponse(user)

      return sendSuccessResponse(res, 200, 'OTP verified successfully', {
        token,
        user: {
          ...userResponse,
          phoneNumber: userResponse.phoneNumber
        }
      })
    } catch (error) {
      console.error('Verify OTP error:', error)
      return sendErrorResponse(res, 500, error.message || 'Failed to verify OTP. Please try again.', error)
    }
  }
)

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
      if (!checkValidation(req, res)) return

      const { phoneNumber } = req.body
      const { otpService } = await import('../services/otp.service.js')
      
      const result = await otpService.resendOTP(phoneNumber)

      return sendSuccessResponse(res, 200, result.message, {
        expiresIn: result.expiresIn
      })
    } catch (error) {
      console.error('Resend OTP error:', error)
      return sendErrorResponse(res, 500, error.message || 'Failed to resend OTP. Please try again.', error)
    }
  }
)

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
      if (!checkValidation(req, res)) return

      const { email, password } = req.body
      const authService = getAuthService()

      const user = await authService.findUserByEmail(email)
      if (!user) {
        return sendErrorResponse(res, 401, 'Invalid email or password')
      }

      const isPasswordValid = await authService.verifyPassword(user, password)
      
      if (!isPasswordValid) {
        return sendErrorResponse(res, 401, 'Invalid email or password')
      }

      const token = authService.generateToken(authService.getUserId(user))
      const userResponse = formatUserResponse(user)

      return sendSuccessResponse(res, 200, 'Login successful', {
        token,
        user: {
          id: userResponse.id,
          name: userResponse.name,
          email: userResponse.email
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      
      if (error.message?.includes('buffering timed out')) {
        return sendErrorResponse(res, 503, 'Database connection failed', error)
      }
      
      return sendErrorResponse(res, 500, 'Server error during login', error)
    }
  }
)

export default router

