import mongoose from 'mongoose'

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      default: '',
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    dob: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    avatar: {
      type: String,
      default: null
    },
    monthlySalary: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AED'],
      default: 'INR'
    },
    payCycle: {
      type: String,
      enum: ['Monthly', 'Weekly', 'Daily'],
      default: 'Monthly'
    },
    paidLeaves: {
      type: Number,
      default: 0
    },
    visitingTime: {
      type: String,
      default: '9.00 AM'
    },
    payTillToday: {
      type: Number,
      default: 0
    },
    leavesTillToday: {
      type: Number,
      default: 0
    },
    isAbsentToday: {
      type: Boolean,
      default: false
    },
    absentDates: {
      type: [String],
      default: []
    },
    addedOn: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    }
  },
  {
    timestamps: true
  }
)

// Index for faster queries
staffSchema.index({ userId: 1 })
staffSchema.index({ name: 1 })

const Staff = mongoose.model('Staff', staffSchema)

export default Staff

