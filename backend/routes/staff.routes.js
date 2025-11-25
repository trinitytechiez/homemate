import express from 'express'
import { body, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import Staff from '../models/Staff.model.js'
import authMiddleware from '../middleware/auth.middleware.js'

const router = express.Router()

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1
}

// Get all staff for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Return empty array if MongoDB not connected (graceful degradation)
      return res.json({
        message: 'Staff retrieved successfully',
        staff: []
      })
    }

    const staff = await Staff.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json({
      message: 'Staff retrieved successfully',
      staff: staff || []
    })
  } catch (error) {
    console.error('Get staff error:', error)
    res.status(500).json({
      message: 'Error retrieving staff',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
})

// Get single staff member
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(404).json({
        message: 'Staff member not found'
      })
    }

    const staff = await Staff.findOne({ _id: req.params.id, userId: req.userId })
    if (!staff) {
      return res.status(404).json({
        message: 'Staff member not found'
      })
    }

    res.json({
      message: 'Staff retrieved successfully',
      staff
    })
  } catch (error) {
    console.error('Get staff error:', error)
    res.status(500).json({
      message: 'Error retrieving staff',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
})

// Create new staff member
router.post(
  '/',
  authMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
    body('location').trim().notEmpty().withMessage('Location is required')
  ],
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          message: 'Database not connected. Please connect to MongoDB to create staff members.',
          error: 'MongoDB is not connected'
        })
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const today = new Date()
      const formattedDate = today.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      const staffData = {
        ...req.body,
        userId: req.userId,
        addedOn: formattedDate,
        payTillToday: req.body.payTillToday || 0,
        leavesTillToday: req.body.leavesTillToday || 0,
        isAbsentToday: req.body.isAbsentToday || false,
        absentDates: req.body.absentDates || [],
        monthlySalary: req.body.monthlySalary || 0,
        currency: req.body.currency || 'INR',
        payCycle: req.body.payCycle || 'Monthly',
        paidLeaves: req.body.paidLeaves || 0,
        visitingTime: req.body.visitingTime || '9.00 AM'
      }

      const staff = new Staff(staffData)
      await staff.save()

      res.status(201).json({
        message: 'Staff member created successfully',
        staff
      })
    } catch (error) {
      console.error('Create staff error:', error)
      res.status(500).json({
        message: 'Error creating staff member',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

// Update staff member
router.put(
  '/:id',
  authMiddleware,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phoneNumber').optional().trim().notEmpty().withMessage('Phone number cannot be empty'),
    body('location').optional().trim().notEmpty().withMessage('Location cannot be empty')
  ],
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          message: 'Database not connected. Please connect to MongoDB to create staff members.',
          error: 'MongoDB is not connected'
        })
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const staff = await Staff.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body },
        { new: true, runValidators: true }
      )

      if (!staff) {
        return res.status(404).json({
          message: 'Staff member not found'
        })
      }

      res.json({
        message: 'Staff member updated successfully',
        staff
      })
    } catch (error) {
      console.error('Update staff error:', error)
      res.status(500).json({
        message: 'Error updating staff member',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      })
    }
  }
)

// Update staff absent dates
router.patch('/:id/attendance', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        message: 'Database not connected',
        error: 'MongoDB is not connected'
      })
    }

    const { absentDates, isAbsentToday } = req.body

    const updateData = {}
    if (absentDates !== undefined) {
      updateData.absentDates = absentDates
    }
    if (isAbsentToday !== undefined) {
      updateData.isAbsentToday = isAbsentToday
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updateData },
      { new: true }
    )

    if (!staff) {
      return res.status(404).json({
        message: 'Staff member not found'
      })
    }

    res.json({
      message: 'Attendance updated successfully',
      staff
    })
  } catch (error) {
    console.error('Update attendance error:', error)
    res.status(500).json({
      message: 'Error updating attendance',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
})

// Delete staff member
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        message: 'Database not connected',
        error: 'MongoDB is not connected'
      })
    }

    const staff = await Staff.findOneAndDelete({ _id: req.params.id, userId: req.userId })

    if (!staff) {
      return res.status(404).json({
        message: 'Staff member not found'
      })
    }

    res.json({
      message: 'Staff member deleted successfully'
    })
  } catch (error) {
    console.error('Delete staff error:', error)
    res.status(500).json({
      message: 'Error deleting staff member',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
})

export default router

