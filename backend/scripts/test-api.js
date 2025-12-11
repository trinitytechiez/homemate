/**
 * Simple script to test API and MongoDB connection
 * Works with older Node.js versions
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

// Read PORT from .env file
dotenv.config({ path: path.join(__dirname, '../.env') })
const PORT = parseInt(process.env.PORT) || 5001
const API_URL = `http://localhost:${PORT}`

console.log('🧪 Testing API and MongoDB Connection')
console.log('=' .repeat(50))
console.log('')

// Test 1: Check if server is running
console.log('1️⃣  Testing if backend server is running...')
const testHealth = () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`${API_URL}/health`, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve(json)
        } catch (e) {
          resolve({ raw: data, status: res.statusCode })
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

// Test 2: Test login endpoint
const testLogin = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'test@homemate.com',
      password: 'test123456'
    })
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, data: json })
        } catch (e) {
          resolve({ status: res.statusCode, raw: data })
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    req.write(postData)
    req.end()
  })
}

// Run tests
(async () => {
  try {
    // Test health endpoint
    console.log(`   Checking: ${API_URL}/health`)
    const health = await testHealth()
    console.log('   ✅ Backend server is running!')
    console.log('   Response:', JSON.stringify(health, null, 2))
    console.log('')
    
    if (health.mongodb) {
      console.log('   📊 MongoDB Status:', health.mongodb.status)
      if (health.mongodb.status === 'connected') {
        console.log('   ✅ MongoDB is CONNECTED!')
      } else {
        console.log('   ⚠️  MongoDB is NOT connected (using mock auth)')
      }
    }
    console.log('')
    
    // Test login endpoint
    console.log('2️⃣  Testing login endpoint...')
    console.log(`   Testing: ${API_URL}/api/auth/login`)
    console.log('   Credentials: test@homemate.com / test123456')
    const loginResult = await testLogin()
    console.log('   Status:', loginResult.status)
    if (loginResult.status === 200) {
      console.log('   ✅ Login endpoint is working!')
      if (loginResult.data?.token) {
        console.log('   ✅ Token received successfully!')
      }
    } else {
      console.log('   ⚠️  Login failed:', loginResult.data?.message || loginResult.raw)
    }
    console.log('')
    
  } catch (error) {
    console.log('   ❌ Backend server is NOT running!')
    console.log('   Error:', error.message)
    console.log('')
    console.log('💡 To start the backend:')
    console.log('   1. cd backend')
    console.log('   2. npm run dev')
    console.log('')
    process.exit(1)
  }
  
  console.log('=' .repeat(50))
  console.log('✅ All tests completed!')
})()

