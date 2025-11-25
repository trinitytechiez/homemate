// Script to check MongoDB connection status
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'

console.log('🔍 Checking MongoDB Connection Status...')
console.log('')
console.log('📍 Connection URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))
console.log('')

// Check current connection state
const currentState = mongoose.connection.readyState
const states = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
}

console.log('📊 Current Connection State:', currentState, `(${states[currentState]})`)
console.log('')

if (currentState === 1) {
  console.log('✅ MongoDB is CONNECTED!')
  console.log('✅ Database:', mongoose.connection.db?.databaseName || 'N/A')
  console.log('✅ Host:', mongoose.connection.host || 'N/A')
  console.log('✅ Port:', mongoose.connection.port || 'N/A')
  process.exit(0)
} else {
  console.log('❌ MongoDB is NOT connected')
  console.log('')
  console.log('💡 To connect MongoDB:')
  console.log('')
  console.log('Option 1: Use MongoDB Atlas (Cloud - Recommended)')
  console.log('   1. Go to https://www.mongodb.com/cloud/atlas')
  console.log('   2. Create a free account and cluster')
  console.log('   3. Get your connection string')
  console.log('   4. Update MONGODB_URI in backend/.env')
  console.log('   5. Restart the server')
  console.log('')
  console.log('Option 2: Install MongoDB locally')
  console.log('   1. Install MongoDB Community Edition')
  console.log('   2. Start MongoDB service: brew services start mongodb-community (macOS)')
  console.log('   3. Or: mongod --dbpath /path/to/data')
  console.log('   4. Restart the server')
  console.log('')
  console.log('📖 See MongoDB Atlas documentation for detailed instructions')
  console.log('')
  
  // Try to connect to see the actual error
  console.log('🔌 Attempting to connect...')
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log('✅ Connection successful!')
      console.log('✅ Database:', mongoose.connection.db?.databaseName)
      process.exit(0)
    })
    .catch((error) => {
      console.log('❌ Connection failed:')
      console.log('   Error:', error.message)
      console.log('')
      if (error.message.includes('ECONNREFUSED')) {
        console.log('💡 This usually means:')
        console.log('   - MongoDB is not running locally')
        console.log('   - Or the connection string points to wrong host/port')
      } else if (error.message.includes('authentication failed')) {
        console.log('💡 This usually means:')
        console.log('   - Wrong username or password')
        console.log('   - User doesn\'t have access to the database')
      } else if (error.message.includes('timeout')) {
        console.log('💡 This usually means:')
        console.log('   - Network issue')
        console.log('   - IP address not whitelisted in MongoDB Atlas')
        console.log('   - Cluster is paused')
      }
      process.exit(1)
    })
}

