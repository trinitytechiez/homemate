import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import jwt from 'jsonwebtoken'
import User from '../../models/User.model.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { setupTestDB, teardownTestDB, clearDatabase } from '../setup.js'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

describe('Auth Middleware', () => {
  beforeAll(async () => {
    await setupTestDB()
  })

  afterAll(async () => {
    await teardownTestDB()
  })

  beforeEach(async () => {
    await clearDatabase()
  })

  it('should authenticate user with valid token', async () => {
    // Create a test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })
    await user.save()

    // Generate token
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET)

    // Mock request and response
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
    const res = {}
    const next = jest.fn()

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.user).toBeDefined()
    expect(req.user._id.toString()).toBe(user._id.toString())
    expect(req.user.email).toBe(user.email)
    expect(req.user).not.toHaveProperty('password')
  })

  it('should return 401 when token is missing', async () => {
    const req = {
      headers: {}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const next = jest.fn()

    await authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when authorization header is missing Bearer prefix', async () => {
    const req = {
      headers: {
        authorization: 'invalid-token'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const next = jest.fn()

    await authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when token is invalid', async () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid-token'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const next = jest.fn()

    await authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when token is expired', async () => {
    // Create a test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })
    await user.save()

    // Generate expired token
    const token = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: '-1h' }
    )

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const next = jest.fn()

    await authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 when user does not exist', async () => {
    // Generate token for non-existent user
    const fakeUserId = new User()._id
    const token = jwt.sign({ userId: fakeUserId.toString() }, JWT_SECRET)

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const next = jest.fn()

    await authenticate(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should handle token without Bearer prefix correctly', async () => {
    // Create a test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })
    await user.save()

    // Generate token
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET)

    const req = {
      headers: {
        authorization: token // Without Bearer prefix
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    const next = jest.fn()

    await authenticate(req, res, next)

    // Should fail because replace('Bearer ', '') won't work
    expect(res.status).toHaveBeenCalledWith(401)
  })
})

