#!/usr/bin/env node

/**
 * Comprehensive MongoDB Atlas connection diagnostic script
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import https from 'https'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homemate'

console.log('🔍 MongoDB Atlas Connection Diagnostic')
console.log('=' .repeat(50))
console.log('')

// Get current IP
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
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
    req.end()
  })
}

const runDiagnostics = async () => {
  console.log('📋 Diagnostic Information:')
  console.log('')
  
  // Node.js version
  console.log('1. Node.js Version:', process.version)
  const nodeVersion = parseInt(process.version.match(/^v(\d+)\./)?.[1] || '0')
  if (nodeVersion < 18) {
    console.log('   ⚠️  WARNING: Node.js 18+ required for MongoDB Atlas')
  } else {
    console.log('   ✅ Node.js version is compatible')
  }
  console.log('')
  
  // Current IP
  let currentIP = 'Unable to determine'
  try {
    currentIP = await getCurrentIP()
    console.log('2. Your Current Public IP:', currentIP)
    console.log('   📝 Should be whitelisted as:', currentIP + '/32')
    console.log('')
  } catch (error) {
    console.log('2. Your Current Public IP: Unable to determine')
    console.log('   ⚠️  Could not fetch IP address')
    console.log('')
  }
  
  // Connection string info
  console.log('3. Connection String:')
  const maskedURI = MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
  console.log('   URI:', maskedURI)
  
  const isAtlas = MONGODB_URI.includes('mongodb+srv://')
  console.log('   Type:', isAtlas ? 'MongoDB Atlas (mongodb+srv://)' : 'Standard MongoDB')
  
  if (isAtlas) {
    const hasDbName = /\/[^\/\?]+(\?|$)/.test(MONGODB_URI.split('@')[1] || '')
    console.log('   Database name:', hasDbName ? 'Present' : 'Missing (will be added)')
    
    const hasRetryWrites = MONGODB_URI.includes('retryWrites=')
    const hasW = MONGODB_URI.includes('w=')
    console.log('   retryWrites:', hasRetryWrites ? 'Present' : 'Missing (will be added)')
    console.log('   w=majority:', hasW ? 'Present' : 'Missing (will be added)')
  }
  console.log('')
  
  // Test connection
  console.log('4. Testing Connection...')
  console.log('')
  
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    })
    
    console.log('✅ SUCCESS: Connection established!')
    console.log('   Database:', mongoose.connection.db.databaseName)
    console.log('   Host:', mongoose.connection.host)
    console.log('   Ready State:', mongoose.connection.readyState)
    console.log('')
    console.log('🎉 MongoDB Atlas is working correctly!')
    
    await mongoose.connection.close()
    process.exit(0)
    
  } catch (error) {
    console.log('❌ FAILED: Connection error')
    console.log('')
    console.log('Error Message:', error.message)
    console.log('')
    
    // Detailed error analysis
    console.log('🔍 Error Analysis:')
    console.log('')
    
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.log('❌ IP Whitelisting Issue Detected')
      console.log('')
      console.log('   Your current IP:', currentIP)
      console.log('   Required format in MongoDB Atlas:', currentIP + '/32')
      console.log('')
      console.log('   📝 Steps to fix:')
      console.log('   1. Go to MongoDB Atlas Dashboard')
      console.log('   2. Navigate to: Network Access (or IP Access List)')
      console.log('   3. Click "Add IP Address"')
      console.log('   4. Enter exactly:', currentIP + '/32')
      console.log('   5. Click "Confirm"')
      console.log('   6. Wait 2-3 minutes for changes to propagate')
      console.log('')
      console.log('   OR temporarily allow all IPs (testing only):')
      console.log('   - Add: 0.0.0.0/0')
      console.log('   - Wait 2-3 minutes')
      console.log('')
    } else if (error.message.includes('authentication') || error.message.includes('password')) {
      console.log('❌ Authentication Issue Detected')
      console.log('')
      console.log('   📝 Steps to fix:')
      console.log('   1. Verify username and password in connection string')
      console.log('   2. Check MongoDB Atlas → Database Access')
      console.log('   3. Ensure user has proper permissions')
      console.log('   4. Try resetting the password in Atlas')
      console.log('')
    } else if (error.message.includes('timeout')) {
      console.log('❌ Connection Timeout Detected')
      console.log('')
      console.log('   📝 Possible causes:')
      console.log('   1. IP not whitelisted')
      console.log('   2. Network/firewall blocking connection')
      console.log('   3. MongoDB Atlas cluster is paused')
      console.log('   4. Connection string format issue')
      console.log('')
    } else {
      console.log('❌ Unknown Error')
      console.log('')
      console.log('   Full error:', error)
      console.log('')
    }
    
    console.log('💡 Additional Troubleshooting:')
    console.log('   1. Verify cluster is running (not paused) in MongoDB Atlas')
    console.log('   2. Check MongoDB Atlas → Network Access for IP entries')
    console.log('   3. Verify connection string from Atlas Dashboard')
    console.log('   4. Try copying connection string directly from Atlas')
    console.log('   5. Ensure Node.js 18+ is being used')
    console.log('')
    
    process.exit(1)
  }
}

runDiagnostics()

