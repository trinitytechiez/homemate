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
 * Uses the same connection logic as server.js
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
      // Try to import connection function from server.js (if available)
      // Otherwise, use the same logic
      let connectionUri, mongooseOptions
      
      try {
        // Try to get from server.js exports (works if server.js has been loaded)
        const serverModule = await import('../server.js')
        connectionUri = serverModule.getConnectionUri?.() || null
        mongooseOptions = serverModule.getMongooseOptions?.() || null
      } catch (importError) {
        // Server.js not loaded yet, build connection string ourselves
        connectionUri = null
        mongooseOptions = null
      }
      
      // If we couldn't get from server.js, build it ourselves
      if (!connectionUri) {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'
        
        if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/homemate') {
          console.error('ensureMongoConnection: MONGODB_URI not set in environment variables')
          console.error('   This is required for Vercel deployment')
          console.error('   Set MONGODB_URI in Vercel Dashboard → Settings → Environment Variables')
          return false
        }
        
        // Process connection string (same logic as server.js)
        connectionUri = MONGODB_URI
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
        }
        
        // Build options (same as server.js)
        mongooseOptions = {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          maxPoolSize: process.env.VERCEL === '1' ? 1 : 10, // Increased for non-serverless environments
          minPoolSize: 0,
          maxIdleTimeMS: 30000,
          heartbeatFrequencyMS: 10000,
          retryWrites: true,
          retryReads: true,
          bufferCommands: true
        }
        
        if (isAtlasConnection) {
          mongooseOptions.connectTimeoutMS = 20000
          mongooseOptions.serverSelectionTimeoutMS = 15000
        }
      }
      
      console.log('ensureMongoConnection: Attempting to connect to MongoDB...')
      console.log('ensureMongoConnection: URI configured:', !!connectionUri)
      
      await mongoose.connect(connectionUri, mongooseOptions)
      
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
      console.error('Error name:', error.name)
      if (error.message.includes('IP')) {
        console.error('   → IP whitelisting issue. Check MongoDB Atlas Network Access')
      }
      if (error.message.includes('authentication')) {
        console.error('   → Authentication issue. Check username/password in connection string')
      }
      return false
    }
  }

  return false
}

