import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import staffRoutes from './routes/staff.routes.js'
import { getMongoStatus } from './utils/db.utils.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/
  ].filter(Boolean),
  credentials: true
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'

console.log('🔌 Attempting to connect to MongoDB...')
console.log('📍 URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true
}

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions)
    console.log('✅ MongoDB connected successfully')
    console.log('📊 Using real database for authentication')
    console.log(`📈 Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`)
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed - using mock authentication service')
    console.warn('   Error:', error.message)
    console.warn('💡 To use real database:')
    console.warn('   1. Set up MongoDB Atlas')
    console.warn('   2. Update MONGODB_URI in backend/.env')
    console.warn('   3. Restart the server')
    console.warn('')
    console.warn('📝 For now, using in-memory mock service')
    console.warn('')
    console.warn('🧪 TEST CREDENTIALS (Mock Auth):')
    console.warn('   Email: test@homemate.com')
    console.warn('   Password: test123456')
    console.warn('')
    console.warn('💡 To create test users in real database, run: npm run seed')
  }
}

connectMongoDB()

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message)
})

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...')
  
  setTimeout(async () => {
    try {
      if (mongoose.connection.readyState === 0) {
        await connectMongoDB()
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error.message)
    }
  }, 5000)
})

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully')
})

process.on('SIGINT', async () => {
  await mongoose.connection.close()
  console.log('MongoDB connection closed due to application termination')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await mongoose.connection.close()
  console.log('MongoDB connection closed due to application termination')
  process.exit(0)
})

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HomeMate API is running',
    mongodb: {
      status: getMongoStatus(),
      readyState: mongoose.connection.readyState
    }
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/staff', staffRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

