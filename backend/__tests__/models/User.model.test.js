import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import User from '../../models/User.model.js'
import { setupTestDB, teardownTestDB, clearDatabase } from '../setup.js'

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestDB()
  })

  afterAll(async () => {
    await teardownTestDB()
  })

  beforeEach(async () => {
    await clearDatabase()
  })

  describe('User Creation', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser._id).toBeDefined()
      expect(savedUser.name).toBe(userData.name)
      expect(savedUser.email).toBe(userData.email.toLowerCase())
      expect(savedUser.password).not.toBe(userData.password) // Should be hashed
      expect(savedUser.createdAt).toBeDefined()
      expect(savedUser.updatedAt).toBeDefined()
    })

    it('should trim and lowercase email', async () => {
      const userData = {
        name: 'Test User',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123'
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.email).toBe('test@example.com')
    })

    it('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const user = new User(userData)
      const savedUser = await user.save()

      expect(savedUser.password).not.toBe(userData.password)
      expect(savedUser.password.length).toBeGreaterThan(20) // Bcrypt hash length
    })

    it('should not hash password if not modified', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const user = new User(userData)
      const savedUser = await user.save()
      const originalPassword = savedUser.password

      // Update non-password field
      savedUser.name = 'Updated Name'
      const updatedUser = await savedUser.save()

      expect(updatedUser.password).toBe(originalPassword)
    })
  })

  describe('Validation', () => {
    it('should require name field', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123'
      })

      await expect(user.save()).rejects.toThrow()
    })

    it('should require email field', async () => {
      const user = new User({
        name: 'Test User',
        password: 'password123'
      })

      await expect(user.save()).rejects.toThrow()
    })

    it('should require password field', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com'
      })

      await expect(user.save()).rejects.toThrow()
    })

    it('should validate email format', async () => {
      const user = new User({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      })

      await expect(user.save()).rejects.toThrow()
    })

    it('should enforce minimum name length', async () => {
      const user = new User({
        name: 'A',
        email: 'test@example.com',
        password: 'password123'
      })

      await expect(user.save()).rejects.toThrow()
    })

    it('should enforce minimum password length', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: '12345'
      })

      await expect(user.save()).rejects.toThrow()
    })

    it('should enforce unique email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      await new User(userData).save()

      const duplicateUser = new User(userData)
      await expect(duplicateUser.save()).rejects.toThrow()
    })
  })

  describe('Password Comparison', () => {
    it('should compare password correctly', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const user = new User(userData)
      await user.save()

      const isMatch = await user.comparePassword('password123')
      expect(isMatch).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const user = new User(userData)
      await user.save()

      const isMatch = await user.comparePassword('wrongpassword')
      expect(isMatch).toBe(false)
    })
  })

  describe('Password Selection', () => {
    it('should not return password by default', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const user = new User(userData)
      await user.save()

      const foundUser = await User.findById(user._id)
      expect(foundUser.password).toBeUndefined()
    })

    it('should return password when explicitly selected', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const user = new User(userData)
      await user.save()

      const foundUser = await User.findById(user._id).select('+password')
      expect(foundUser.password).toBeDefined()
    })
  })
})

