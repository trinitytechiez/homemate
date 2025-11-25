import mongoose from 'mongoose'

let mongoServer

export const setupTestDB = async () => {
  try {
    // Dynamic import to handle ESM modules properly
    const mms = await import('mongodb-memory-server')
    
    // Handle different export formats
    const MongoMemoryServer = 
      mms.MongoMemoryServer || 
      mms.default?.MongoMemoryServer || 
      (mms.default && typeof mms.default === 'function' ? mms.default : null)
    
    if (!MongoMemoryServer) {
      // Fallback: use a test MongoDB URI if available, or throw error
      const testUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/homemate-test'
      console.warn('MongoMemoryServer not available, using:', testUri)
      await mongoose.connect(testUri)
      return
    }
    
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'jest-test'
      }
    })
    const mongoUri = mongoServer.getUri()
    
    await mongoose.connect(mongoUri)
  } catch (error) {
    console.error('Error setting up test database:', error.message)
    // Fallback to test database if MongoMemoryServer fails
    const testUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/homemate-test'
    console.warn('Falling back to:', testUri)
    try {
      await mongoose.connect(testUri)
    } catch (fallbackError) {
      throw new Error(`Failed to connect to test database: ${fallbackError.message}`)
    }
  }
}

export const teardownTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  }
  if (mongoServer) {
    try {
      await mongoServer.stop()
    } catch (error) {
      // Ignore stop errors
    }
  }
}

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

