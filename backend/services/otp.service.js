// OTP Service - Handles OTP generation and SMS sending
// Supports multiple SMS providers: Twilio, AWS SNS, or console (development)

import Otp from '../models/Otp.model.js'
import mongoose from 'mongoose'

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1
}

// Generate random 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// In-memory OTP store for development (when MongoDB not connected)
const inMemoryOtpStore = new Map()

// SMS Provider Interface
class SMSProvider {
  async sendSMS(phoneNumber, message) {
    throw new Error('sendSMS must be implemented by SMS provider')
  }
}

// Console SMS Provider (for development)
class ConsoleSMSProvider extends SMSProvider {
  async sendSMS(phoneNumber, message) {
    console.log('\n📱 SMS (Development Mode):')
    console.log(`To: ${phoneNumber}`)
    console.log(`Message: ${message}`)
    console.log('---\n')
    return { success: true, messageId: `dev-${Date.now()}` }
  }
}

// Twilio SMS Provider
class TwilioSMSProvider extends SMSProvider {
  constructor() {
    super()
    // Lazy load Twilio to avoid errors if not installed
    try {
      this.twilio = require('twilio')
    } catch (error) {
      console.warn('Twilio not installed. Install with: npm install twilio')
      this.twilio = null
    }
  }

  async sendSMS(phoneNumber, message) {
    if (!this.twilio) {
      throw new Error('Twilio is not installed. Install with: npm install twilio')
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env')
    }

    const client = this.twilio(accountSid, authToken)

    try {
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: phoneNumber
      })
      return { success: true, messageId: result.sid }
    } catch (error) {
      console.error('Twilio SMS error:', error)
      throw new Error(`Failed to send SMS: ${error.message}`)
    }
  }
}

// AWS SNS Provider
class AWSSNSProvider extends SMSProvider {
  constructor() {
    super()
    // Lazy load AWS SDK
    try {
      this.AWS = require('aws-sdk')
    } catch (error) {
      console.warn('AWS SDK not installed. Install with: npm install aws-sdk')
      this.AWS = null
    }
  }

  async sendSMS(phoneNumber, message) {
    if (!this.AWS) {
      throw new Error('AWS SDK is not installed. Install with: npm install aws-sdk')
    }

    const sns = new this.AWS.SNS({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env')
    }

    try {
      const params = {
        Message: message,
        PhoneNumber: phoneNumber
      }

      const result = await sns.publish(params).promise()
      return { success: true, messageId: result.MessageId }
    } catch (error) {
      console.error('AWS SNS error:', error)
      throw new Error(`Failed to send SMS: ${error.message}`)
    }
  }
}

// Get SMS Provider based on environment
const getSMSProvider = () => {
  const provider = process.env.SMS_PROVIDER || 'console'

  switch (provider.toLowerCase()) {
    case 'twilio':
      return new TwilioSMSProvider()
    case 'aws':
    case 'sns':
      return new AWSSNSProvider()
    case 'console':
    default:
      return new ConsoleSMSProvider()
  }
}

// OTP Service
export const otpService = {
  // Send OTP to phone number
  async sendOTP(phoneNumber) {
    try {
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

      // Store OTP
      let otpRecord
      if (isMongoConnected()) {
        // Delete any existing OTPs for this phone number
        await Otp.deleteMany({ phoneNumber, verified: false })

        // Create new OTP record
        otpRecord = new Otp({
          phoneNumber,
          otp,
          expiresAt,
          attempts: 0,
          verified: false
        })
        await otpRecord.save()
      } else {
        // Use in-memory store for development
        inMemoryOtpStore.set(phoneNumber, {
          otp,
          expiresAt,
          attempts: 0,
          verified: false,
          createdAt: new Date()
        })
      }

      // Send SMS
      const smsProvider = getSMSProvider()
      const message = `Your HomeMate verification code is ${otp}. Valid for 10 minutes.`
      
      await smsProvider.sendSMS(phoneNumber, message)

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 600 // 10 minutes in seconds
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      throw error
    }
  },

  // Verify OTP
  async verifyOTP(phoneNumber, otp) {
    try {
      let otpRecord

      if (isMongoConnected()) {
        // Find OTP record
        otpRecord = await Otp.findOne({
          phoneNumber,
          verified: false
        }).sort({ createdAt: -1 }) // Get most recent OTP

        if (!otpRecord) {
          return {
            success: false,
            message: 'OTP not found or already used'
          }
        }

        // Check if expired
        if (new Date() > otpRecord.expiresAt) {
          await Otp.deleteOne({ _id: otpRecord._id })
          return {
            success: false,
            message: 'OTP has expired. Please request a new one.'
          }
        }

        // Check max attempts
        if (otpRecord.attempts >= 5) {
          await Otp.deleteOne({ _id: otpRecord._id })
          return {
            success: false,
            message: 'Maximum verification attempts exceeded. Please request a new OTP.'
          }
        }

        // Increment attempts
        otpRecord.attempts += 1
        await otpRecord.save()

        // Verify OTP
        if (otpRecord.otp !== otp) {
          return {
            success: false,
            message: 'Invalid OTP. Please try again.',
            attemptsRemaining: 5 - otpRecord.attempts
          }
        }

        // Mark as verified
        otpRecord.verified = true
        await otpRecord.save()
      } else {
        // Use in-memory store for development
        const stored = inMemoryOtpStore.get(phoneNumber)
        
        if (!stored) {
          return {
            success: false,
            message: 'OTP not found or already used'
          }
        }

        // Check if expired
        if (new Date() > stored.expiresAt) {
          inMemoryOtpStore.delete(phoneNumber)
          return {
            success: false,
            message: 'OTP has expired. Please request a new one.'
          }
        }

        // Check max attempts
        if (stored.attempts >= 5) {
          inMemoryOtpStore.delete(phoneNumber)
          return {
            success: false,
            message: 'Maximum verification attempts exceeded. Please request a new OTP.'
          }
        }

        // Increment attempts
        stored.attempts += 1

        // Verify OTP
        if (stored.otp !== otp) {
          return {
            success: false,
            message: 'Invalid OTP. Please try again.',
            attemptsRemaining: 5 - stored.attempts
          }
        }

        // Mark as verified and delete
        stored.verified = true
        inMemoryOtpStore.delete(phoneNumber)
      }

      return {
        success: true,
        message: 'OTP verified successfully'
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      throw error
    }
  },

  // Resend OTP
  async resendOTP(phoneNumber) {
    return await this.sendOTP(phoneNumber)
  }
}

export default otpService

