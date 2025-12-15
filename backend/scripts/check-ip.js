#!/usr/bin/env node

/**
 * Script to check your current public IP address
 * This helps you know which IP to whitelist in MongoDB Atlas
 */

import https from 'https'

console.log('🔍 Checking your current public IP address...')
console.log('')

const options = {
  hostname: 'api.ipify.org',
  port: 443,
  path: '/',
  method: 'GET'
}

const req = https.request(options, (res) => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    const ip = data.trim()
    console.log('✅ Your current public IP address is:', ip)
    console.log('')
    console.log('📝 To whitelist this IP in MongoDB Atlas:')
    console.log('   1. Go to MongoDB Atlas Dashboard')
    console.log('   2. Navigate to Network Access (or IP Access List)')
    console.log('   3. Click "Add IP Address"')
    console.log(`   4. Enter: ${ip}/32`)
    console.log('   5. Click "Confirm"')
    console.log('   6. Wait 1-2 minutes for changes to propagate')
    console.log('')
    console.log('⚠️  Note: If your IP changes frequently, consider:')
    console.log('   - Using 0.0.0.0/0 (allows all IPs - for testing only)')
    console.log('   - Setting up a VPN or static IP')
    console.log('')
  })
})

req.on('error', (error) => {
  console.error('❌ Error checking IP address:', error.message)
  console.error('')
  console.error('💡 You can manually check your IP at: https://api.ipify.org')
  process.exit(1)
})

req.end()



