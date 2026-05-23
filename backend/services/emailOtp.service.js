// Email OTP Service - Handles OTP generation and email sending
// Supports multiple email providers: Nodemailer (SMTP), SendGrid, or console (development)

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

// Email Provider Interface
class EmailProvider {
  async sendEmail(to, subject, html) {
    throw new Error('sendEmail must be implemented by email provider')
  }
}

// Console Email Provider (for development)
class ConsoleEmailProvider extends EmailProvider {
  async sendEmail(to, subject, html) {
    return { success: true, messageId: `dev-${Date.now()}` }
  }
}

// Nodemailer Email Provider
class NodemailerProvider extends EmailProvider {
  constructor() {
    super()
    try {
      this.nodemailer = require('nodemailer')
    } catch (error) {
      console.warn('Nodemailer not installed. Install with: npm install nodemailer')
      this.nodemailer = null
    }
  }

  async sendEmail(to, subject, html) {
    if (!this.nodemailer) {
      throw new Error('Nodemailer is not installed. Install with: npm install nodemailer')
    }

    const transporter = this.nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in .env')
    }

    try {
      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html
      })
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Nodemailer error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }
}

// Get Email Provider based on environment
const getEmailProvider = () => {
  const provider = process.env.EMAIL_PROVIDER || 'console'

  switch (provider.toLowerCase()) {
    case 'nodemailer':
    case 'smtp':
      return new NodemailerProvider()
    case 'console':
    default:
      return new ConsoleEmailProvider()
  }
}

// Email OTP Service
export const emailOtpService = {
  // Send OTP to email address
  async sendOTP(email) {
    try {
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes expiry

      // Store OTP
      let otpRecord
      if (isMongoConnected()) {
        // Delete any existing OTPs for this email
        await Otp.deleteMany({ email, verified: false })

        // Create new OTP record
        otpRecord = new Otp({
          email,
          otp,
          expiresAt,
          attempts: 0,
          verified: false
        })
        await otpRecord.save()
      } else {
        // Use in-memory store for development
        inMemoryOtpStore.set(email, {
          otp,
          expiresAt,
          attempts: 0,
          verified: false,
          createdAt: new Date()
        })
      }

      // Send Email
      const emailProvider = getEmailProvider()
      const subject = 'HomeMate Email Verification'
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4A90E2;">Email Verification</h2>
          <p>Your HomeMate verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #4A90E2; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>
          <p>This code will expire in 2 minutes.</p>
          <p style="color: #999999; font-size: 12px; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `
      
      await emailProvider.sendEmail(email, subject, html)

      return {
        success: true,
        message: 'OTP sent successfully to your email',
        expiresIn: 120 // 2 minutes in seconds
      }
    } catch (error) {
      console.error('Send Email OTP error:', error)
      throw error
    }
  },

  // Verify OTP
  async verifyOTP(email, otp) {
    try {
      let otpRecord

      if (isMongoConnected()) {
        // Find OTP record
        otpRecord = await Otp.findOne({
          email,
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
        const stored = inMemoryOtpStore.get(email)
        
        if (!stored) {
          return {
            success: false,
            message: 'OTP not found or already used'
          }
        }

        // Check if expired
        if (new Date() > stored.expiresAt) {
          inMemoryOtpStore.delete(email)
          return {
            success: false,
            message: 'OTP has expired. Please request a new one.'
          }
        }

        // Check max attempts
        if (stored.attempts >= 5) {
          inMemoryOtpStore.delete(email)
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
        inMemoryOtpStore.delete(email)
      }

      return {
        success: true,
        message: 'OTP verified successfully'
      }
    } catch (error) {
      console.error('Verify Email OTP error:', error)
      throw error
    }
  },

  // Resend OTP
  async resendOTP(email) {
    return await this.sendOTP(email)
  }
}

export default emailOtpService
