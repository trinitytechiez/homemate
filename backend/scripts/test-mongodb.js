import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'

console.log('🧪 Testing MongoDB Connection...')
console.log('📍 URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))
console.log('')

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log('✅ SUCCESS: MongoDB connection works!')
    console.log('✅ Database:', mongoose.connection.db.databaseName)
    console.log('✅ Ready to use MongoDB')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ FAILED: MongoDB connection error')
    console.error('')
    console.error('Error details:', error.message)
    console.error('')
    console.error('💡 Common issues:')
    console.error('   1. Wrong connection string format')
    console.error('   2. IP address not whitelisted in MongoDB Atlas')
    console.error('   3. Wrong username or password')
    console.error('   4. Cluster is paused or not running')
    console.error('')
    console.error('📖 See MongoDB Atlas documentation for detailed setup instructions')
    process.exit(1)
  })

