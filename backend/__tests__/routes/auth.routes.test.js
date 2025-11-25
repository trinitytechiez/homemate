import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import authRoutes from '../../routes/auth.routes.js'
import User from '../../models/User.model.js'
import { setupTestDB, teardownTestDB, clearDatabase } from '../setup.js'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

describe('Auth Routes', () => {
  beforeAll(async () => {
    await setupTestDB()
  })

  afterAll(async () => {
    await teardownTestDB()
  })

  beforeEach(async () => {
    await clearDatabase()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'User registered successfully')
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('id')
      expect(response.body.user.name).toBe(userData.name)
      expect(response.body.user.email).toBe(userData.email.toLowerCase())
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should return 400 for missing name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('message', 'Validation failed')
      expect(response.body.errors).toBeDefined()
    })

    it('should return 400 for invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('message', 'Validation failed')
    })

    it('should return 400 for short password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '12345'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('message', 'Validation failed')
    })

    it('should return 400 for duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('message', 'User with this email already exists')
    })

    it('should normalize email to lowercase', async () => {
      const userData = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.user.email).toBe('test@example.com')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      await user.save()
    })

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Login successful')
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe(loginData.email.toLowerCase())
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.body).toHaveProperty('message', 'Validation failed')
    })

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: 'test@example.com'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.body).toHaveProperty('message', 'Validation failed')
    })

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('message', 'Invalid email or password')
    })

    it('should return 401 for incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('message', 'Invalid email or password')
    })

    it('should normalize email to lowercase', async () => {
      const loginData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.user.email).toBe('test@example.com')
    })
  })
})

