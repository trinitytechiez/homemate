// Database utility functions
import mongoose from 'mongoose'

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
      // Use environment variable (should be set by dotenv in server.js)
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'
      
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
      }
      
      // Connection options optimized for serverless
      const options = {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        maxPoolSize: 1,
        minPoolSize: 0,
        retryWrites: true,
        retryReads: true,
        bufferCommands: true
      }
      
      if (isAtlasConnection) {
        options.connectTimeoutMS = 20000
        options.serverSelectionTimeoutMS = 15000
      }
      
      await mongoose.connect(connectionUri, options)
      
      return mongoose.connection.readyState === 1
    } catch (error) {
      console.error('ensureMongoConnection error:', error.message)
      return false
    }
  }

  return false
}

