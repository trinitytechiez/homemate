// Database utility functions
import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Ensure dotenv is loaded (important for serverless environments)
dotenv.config()

/**
 * Check if MongoDB is connected
 * @returns {boolean} True if connected, false otherwise
 */
export const isMongoConnected = () => {
  return mongoose.connection.readyState === 1
}

/**
 * Get MongoDB connection status
 * @returns {string} Connection status string
 */
export const getMongoStatus = () => {
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }
  return statusMap[mongoose.connection.readyState] || 'unknown'
}

/**
 * Ensure MongoDB connection (for serverless environments)
 * Attempts to connect if not connected and waits for connection
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export const ensureMongoConnection = async () => {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return true
  }

  // If connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    const maxWait = 5000 // 5 seconds
    const startTime = Date.now()
    while (mongoose.connection.readyState === 2 && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (mongoose.connection.readyState === 1) {
      return true
    }
  }

  // Try to connect if disconnected
  if (mongoose.connection.readyState === 0) {
    try {
      // Use environment variable (Vercel sets this automatically)
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'
      
      if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/homemate') {
        console.error('ensureMongoConnection: MONGODB_URI not set in environment variables')
        return false
      }
      
      // Ensure database name is in connection string
      let connectionUri = MONGODB_URI
      const isAtlasConnection = connectionUri.includes('mongodb+srv://')
      
      if (isAtlasConnection) {
        // Check if database name is present
        const hasDbName = /\/[^\/\?]+(\?|$)/.test(connectionUri.split('@')[1] || '')
        if (!hasDbName) {
          if (connectionUri.includes('?')) {
            connectionUri = connectionUri.replace('?', '/homemate?')
          } else {
            connectionUri = connectionUri.endsWith('/') 
              ? `${connectionUri}homemate` 
              : `${connectionUri}/homemate`
          }
        }
        
        // Add required query parameters if not present
        const hasQueryParams = connectionUri.includes('?')
        const params = []
        
        if (!connectionUri.includes('retryWrites=')) {
          params.push('retryWrites=true')
        }
        
        if (!connectionUri.includes('w=')) {
          params.push('w=majority')
        }
        
        if (params.length > 0) {
          const separator = hasQueryParams ? '&' : '?'
          connectionUri = `${connectionUri}${separator}${params.join('&')}`
        }
      }
      
      // Connection options optimized for serverless
      const options = {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 20000,
        maxPoolSize: 1,
        minPoolSize: 0,
        retryWrites: true,
        retryReads: true,
        bufferCommands: true
      }
      
      console.log('ensureMongoConnection: Attempting to connect to MongoDB...')
      await mongoose.connect(connectionUri, options)
      
      // Verify connection
      if (mongoose.connection.readyState === 1) {
        console.log('ensureMongoConnection: Successfully connected to MongoDB')
        return true
      } else {
        console.error('ensureMongoConnection: Connection completed but state is not connected:', mongoose.connection.readyState)
        return false
      }
    } catch (error) {
      console.error('ensureMongoConnection error:', error.message)
      console.error('Error stack:', error.stack)
      return false
    }
  }

  return false
}

