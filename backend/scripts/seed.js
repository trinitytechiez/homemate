import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.model.js'

dotenv.config()

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate')
    console.log('✅ Connected to MongoDB')

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@homemate.com' })
    if (existingUser) {
      console.log('ℹ️  Test user already exists')
      console.log('   Email: test@homemate.com')
      console.log('   Password: test123456')
      await mongoose.connection.close()
      return
    }

    // Create test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@homemate.com',
      password: 'test123456'
    })

    await testUser.save()
    console.log('✅ Test user created successfully!')
    console.log('')
    console.log('📧 Login Credentials:')
    console.log('   Email: test@homemate.com')
    console.log('   Password: test123456')
    console.log('')

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()

