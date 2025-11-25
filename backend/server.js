import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import staffRoutes from './routes/staff.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
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

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'

console.log('🔌 Attempting to connect to MongoDB...')
console.log('📍 URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')) // Hide credentials in logs

// Connection options for better stability
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // Increased to 10s for Atlas
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  heartbeatFrequencyMS: 10000, // Check server status every 10 seconds
  retryWrites: true,
  retryReads: true
}

// Function to connect to MongoDB
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
    console.warn('   Dummy user: test@homemate.com / test123456')
    // Don't exit - use mock service instead
  }
}

// Initial connection
connectMongoDB()

// Connection event listeners for monitoring and reconnection
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message)
})

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...')
  
  // Attempt to reconnect after a delay
  setTimeout(async () => {
    try {
      if (mongoose.connection.readyState === 0) {
        await connectMongoDB()
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error.message)
    }
  }, 5000) // Wait 5 seconds before reconnecting
})

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully')
})

// Handle application termination
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

// Health check endpoint with MongoDB status
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }
  
  res.json({ 
    status: 'OK', 
    message: 'HomeMate API is running',
    mongodb: {
      status: statusMap[mongoStatus] || 'unknown',
      readyState: mongoStatus
    }
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/staff', staffRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Error handler
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

