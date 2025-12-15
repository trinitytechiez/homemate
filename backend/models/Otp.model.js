import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: false,
    index: true,
    sparse: true
  },
  email: {
    type: String,
    required: false,
    index: true,
    sparse: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired OTPs
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Max verification attempts
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index for faster lookups
otpSchema.index({ phoneNumber: 1, verified: 1 })
otpSchema.index({ email: 1, verified: 1 })

// Ensure either phoneNumber or email is provided
otpSchema.pre('validate', function(next) {
  if (!this.phoneNumber && !this.email) {
    next(new Error('Either phoneNumber or email must be provided'))
  } else {
    next()
  }
})

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema)

export default Otp





