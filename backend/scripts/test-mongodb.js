import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'

console.log('🧪 Testing MongoDB Connection...')
console.log('📍 URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))
console.log('')

// Check current IP
import https from 'https'
const getCurrentIP = () => {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.ipify.org',
      port: 443,
      path: '/',
      method: 'GET'
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => resolve(data.trim()))
    })
    req.on('error', reject)
    req.end()
  })
}

getCurrentIP().then(currentIP => {
  console.log('🌐 Your current public IP:', currentIP)
  console.log('📝 Make sure this IP is whitelisted in MongoDB Atlas as:', currentIP + '/32')
  console.log('')
  
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
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
      console.error('   1. IP address not whitelisted or wrong format')
      console.error('      - Your IP:', currentIP)
      console.error('      - Should be whitelisted as:', currentIP + '/32')
      console.error('      - Or use 0.0.0.0/0 for testing (allows all IPs)')
      console.error('   2. Wrong connection string format')
      console.error('   3. Wrong username or password')
      console.error('   4. Cluster is paused or not running')
      console.error('   5. Changes may take 1-2 minutes to propagate')
      console.error('')
      console.error('📖 See MongoDB Atlas documentation for detailed setup instructions')
      process.exit(1)
    })
}).catch(() => {
  // If IP check fails, still try connection
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
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
})

