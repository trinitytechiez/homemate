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
const PORT = process.env.PORT || 5001

// CORS configuration
const getAllowedOrigins = () => {
  const origins = [
    // Localhost for development
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    // Production frontend URL
    'https://homemate-beta.vercel.app',
    // Environment variable override
    process.env.FRONTEND_URL
  ].filter(Boolean)

  // Add Vercel app origins dynamically
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`)
  }
  if (process.env.VERCEL_ENV === 'production' && process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL)
  }

  return origins
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl requests)
    if (!origin) {
      return callback(null, true)
    }

    const allowedOrigins = getAllowedOrigins()
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Check if origin matches Vercel pattern (more permissive for Vercel deployments)
    // Matches: *.vercel.app, vercel.app, and any subdomain
    const vercelPattern = /^https?:\/\/[a-zA-Z0-9-]+\.vercel\.app$/
    if (vercelPattern.test(origin)) {
      console.log(`✅ CORS allowed Vercel origin: ${origin}`)
      return callback(null, true)
    }

    // In development, allow all origins for easier testing
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      console.log(`✅ CORS allowed (development): ${origin}`)
      return callback(null, true)
    }

    // Log blocked origin for debugging
    console.warn(`⚠️  CORS blocked origin: ${origin}`)
    console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`)
    console.warn(`   Environment: ${process.env.NODE_ENV || 'development'}`)
    
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`)
  next()
})

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'

// Ensure database name is in the connection string
let connectionUri = MONGODB_URI
const isAtlasConnection = connectionUri.includes('mongodb+srv://')

if (connectionUri.includes('mongodb+srv://') || connectionUri.includes('mongodb://')) {
  // Check if database name is already in the path
  // This matches host/dbname? or host/dbname$
  const hasDbName = /\/[^\/\?]+(\?|$)/.test(connectionUri.split('@')[1] || '')
  
  if (!hasDbName) {
    // Add database name before query string or at the end
    // First, remove any trailing slash to avoid double slashes
    if (connectionUri.includes('?')) {
      // Handle the case where URI might look like ...net/?appName=...
      connectionUri = connectionUri.replace('/?', '?')
      connectionUri = connectionUri.replace('?', '/homemate?')
    } else {
      connectionUri = connectionUri.endsWith('/') 
        ? `${connectionUri}homemate` 
        : `${connectionUri}/homemate`
    }
  }
  
  // For MongoDB Atlas, ensure connection string has proper SSL/TLS parameters
  if (isAtlasConnection) {
    // Add required query parameters if not present
    const hasQueryParams = connectionUri.includes('?')
    const params = []
    
    // Check and add retryWrites
    if (!connectionUri.includes('retryWrites=')) {
      params.push('retryWrites=true')
    }
    
    // Check and add write concern
    if (!connectionUri.includes('w=')) {
      params.push('w=majority')
    }
    
    // Add parameters to connection string
    if (params.length > 0) {
      const separator = hasQueryParams ? '&' : '?'
      connectionUri = `${connectionUri}${separator}${params.join('&')}`
    }
  }
}

console.log('🔌 Attempting to connect to MongoDB...')
console.log('📍 URI:', connectionUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))
console.log('🔧 Node.js version:', process.version)

// Check Node.js version compatibility
const nodeVersion = process.version.match(/^v(\d+)\./)?.[1]
if (nodeVersion && parseInt(nodeVersion) < 18) {
  console.warn('⚠️  WARNING: Node.js version', process.version, 'is too old!')
  console.warn('   MongoDB Atlas requires Node.js 18+ for proper SSL/TLS support')
  console.warn('   Current version may cause SSL/TLS connection errors')
  console.warn('   Please upgrade: https://nodejs.org/')
  console.warn('')
}

// Optimized options for Vercel serverless functions
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Reduced for faster serverless response
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000, // Increased for SSL handshake
  maxPoolSize: 1, // Reduced for serverless (each function instance)
  minPoolSize: 0, // Allow no connections when idle
  maxIdleTimeMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  // Important for serverless: buffer commands if not connected
  bufferCommands: true
}

// For MongoDB Atlas (mongodb+srv://), SSL/TLS is automatically handled
// Do NOT set explicit TLS options as they can cause conflicts
// Only adjust timeouts for better reliability
if (isAtlasConnection) {
  // Increase timeouts for SSL handshake and server selection
  mongooseOptions.connectTimeoutMS = 20000
  mongooseOptions.serverSelectionTimeoutMS = 15000
  // Let Mongoose handle SSL/TLS automatically for mongodb+srv://
}

// Cache connection to reuse across serverless invocations
let cachedConnection = null

// Export connection function and URI for use in other modules
export const getConnectionUri = () => connectionUri
export const getMongooseOptions = () => mongooseOptions

const connectMongoDB = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected')
    return
  }

  // If connecting, wait a bit and check again
  if (mongoose.connection.readyState === 2) {
    console.log('⏳ MongoDB connection in progress, waiting...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connected after wait')
      return
    }
  }

  try {
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }

    await mongoose.connect(connectionUri, mongooseOptions)
    console.log('✅ MongoDB connected successfully')
    console.log('📊 Using real database for authentication')
    console.log(`📈 Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`)
    cachedConnection = mongoose.connection
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed - using mock authentication service')
    console.warn('   Error:', error.message)
    
    // Provide specific guidance for SSL/TLS errors
    if (error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('tlsv1')) {
      console.warn('')
      console.warn('🔒 SSL/TLS Connection Error Detected:')
      console.warn('   This error often indicates:')
      console.warn('   1. IP address not whitelisted in MongoDB Atlas Network Access')
      console.warn('   2. Node.js/OpenSSL version compatibility issue')
      console.warn('   3. Connection string format issue')
      console.warn('')
      console.warn('💡 Troubleshooting steps:')
      const nodeVersion = process.version.match(/^v(\d+)\./)?.[1]
      if (nodeVersion && parseInt(nodeVersion) < 18) {
        console.warn('   ⚠️  CRITICAL: Node.js version', process.version, 'is too old!')
        console.warn('      MongoDB Atlas requires Node.js 18+ for SSL/TLS')
        console.warn('      This is likely the cause of your SSL error!')
        console.warn('      Upgrade Node.js: https://nodejs.org/ or use nvm: nvm install 18')
        console.warn('')
      }
      console.warn('   1. Check MongoDB Atlas → Network Access → Add your IP (or 0.0.0.0/0 for testing)')
      console.warn('   2. Your current public IP may be different from what you whitelisted')
      console.warn('   3. Verify your connection string format')
      console.warn('   4. Ensure Node.js version is 18+ (current:', process.version, ')')
      console.warn('   5. Try updating mongoose: npm install mongoose@latest')
      console.warn('')
      console.warn('📌 IMPORTANT: If you whitelisted a specific IP, make sure it matches your current public IP')
      console.warn('   You can check your IP at: https://api.ipify.org')
      console.warn('   Or temporarily allow all IPs: 0.0.0.0/0 (for testing only)')
      console.warn('')
    }
    
    console.warn('💡 To use real database:')
    console.warn('   1. Set up MongoDB Atlas')
    console.warn('   2. Update MONGODB_URI in environment variables')
    console.warn('   3. Ensure MongoDB Atlas Network Access allows your IP (0.0.0.0/0 for all)')
    console.warn('   4. Restart the server')
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

// Connect on startup (for traditional servers)
// For serverless, connection will be established on first request
if (process.env.VERCEL !== '1') {
  connectMongoDB()
} else {
  // In Vercel, connect lazily on first request
  console.log('🚀 Running on Vercel - MongoDB will connect on first request')
}

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

// Middleware to ensure MongoDB connection (for serverless)
app.use(async (req, res, next) => {
  // Skip health check
  if (req.path === '/health') {
    return next()
  }
  
  // If not connected, try to connect and wait for it
  if (mongoose.connection.readyState === 0) {
    try {
      await connectMongoDB()
    } catch (error) {
      // Connection failed, but continue (routes will handle 503)
      console.warn('Middleware: MongoDB connection attempt failed:', error.message)
    }
  }
  
  // If connecting, wait for connection to complete (with timeout)
  if (mongoose.connection.readyState === 2) {
    const maxWait = 5000 // 5 seconds max wait
    const startTime = Date.now()
    while (mongoose.connection.readyState === 2 && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // If still not connected after waiting, log but continue
  if (mongoose.connection.readyState !== 1) {
    console.warn(`Middleware: MongoDB not connected (state: ${mongoose.connection.readyState}) for ${req.path}`)
  }
  
  next()
})

app.get('/health', async (req, res) => {
  // Try to connect if not connected
  if (mongoose.connection.readyState === 0) {
    try {
      await connectMongoDB()
    } catch (error) {
      console.error('Health check: Connection attempt failed:', error.message)
    }
  }
  
  const mongoStatus = getMongoStatus()
  const hasMongoUri = !!process.env.MONGODB_URI
  
  res.json({ 
    status: mongoStatus === 'connected' ? 'OK' : 'WARNING', 
    message: 'HomeMate API is running',
    mongodb: {
      status: mongoStatus,
      readyState: mongoose.connection.readyState,
      uriConfigured: hasMongoUri,
      environment: process.env.NODE_ENV || 'development'
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

// Only start HTTP server if not on Vercel (Vercel handles this)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

// Export app for Vercel serverless
export default app

