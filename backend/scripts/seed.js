/**
 * Seed script to create test users in the database
 * Run with: npm run seed
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import User from '../models/User.model.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env file')
  process.exit(1)
}

const testUsers = [
  {
    name: 'Test User',
    email: 'test@homemate.com',
    password: 'test123456',
    phoneNumber: '+919876543210',
    location: 'Test Location'
  },
  {
    name: 'Admin User',
    email: 'admin@homemate.com',
    password: 'admin123456',
    phoneNumber: '+919876543211',
    location: 'Admin Location'
  },
  {
    name: 'Demo User',
    email: 'demo@homemate.com',
    password: 'demo123456',
    phoneNumber: '+919876543212',
    location: 'Demo Location'
  }
]

const seedUsers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    })
    console.log('✅ Connected to MongoDB')

    // Clear existing test users (optional - comment out if you want to keep existing users)
    console.log('🧹 Cleaning up existing test users...')
    for (const userData of testUsers) {
      await User.deleteOne({ email: userData.email })
    }

    // Create test users
    console.log('🌱 Seeding test users...')
    const createdUsers = []

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email })
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`)
        createdUsers.push(existingUser)
      } else {
        const user = new User(userData)
        await user.save()
        console.log(`✅ Created user: ${userData.email} (Password: ${userData.password})`)
        createdUsers.push(user)
      }
    }

    console.log('\n📋 Test Users Created:')
    console.log('='.repeat(60))
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Password: ${user.password}`)
      console.log(`   Phone: ${user.phoneNumber}`)
      console.log('')
    })
    console.log('='.repeat(60))
    console.log('✅ Seeding completed successfully!')
    
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedUsers()

