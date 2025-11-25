// Mock Authentication Service
// This simulates user authentication without MongoDB
// Used as fallback when MongoDB is not connected

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// In-memory user store (will be replaced with MongoDB when connected)
const users = []

// Generate JWT token (same as real auth)
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  })
}

export const mockAuthService = {
  // Find user by email
  async findUserByEmail(email) {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
  },

  // Find user by ID
  async findUserById(id) {
    return users.find(u => u.id === id) || null
  },

  // Create new user
  async createUser(userData) {
    const { name, email, password } = userData
    
    // Check if user exists
    const existingUser = await this.findUserByEmail(email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user object
    const newUser = {
      id: String(users.length + 1),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    users.push(newUser)
    return newUser
  },

  // Verify password
  async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password)
  },

  // Generate token
  generateToken,

  // Get user without password
  sanitizeUser(user) {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }
}

