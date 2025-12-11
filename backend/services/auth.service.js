// Authentication service - handles user authentication operations
import mongoose from 'mongoose'
import User from '../models/User.model.js'
import { generateToken, sanitizeUser, getUserId } from '../utils/auth.utils.js'
import { mockAuthService } from './mockAuth.service.js'

/**
 * Check if MongoDB is connected
 */
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1
}

/**
 * Get authentication service (real DB or mock)
 */
export const getAuthService = () => {
  if (isMongoConnected()) {
    return {
      findUserByEmail: async (email) => {
        return await User.findOne({ email }).select('+password')
      },
      findUserById: async (id) => {
        return await User.findById(id)
      },
      findUserByPhoneNumber: async (phoneNumber) => {
        return await User.findOne({ phoneNumber })
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
      sanitizeUser,
      getUserId
    }
  }
  return mockAuthService
}

