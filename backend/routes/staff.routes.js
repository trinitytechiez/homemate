import express from 'express'
import { body } from 'express-validator'
import Staff from '../models/Staff.model.js'
import authMiddleware from '../middleware/auth.middleware.js'
import { isMongoConnected } from '../utils/db.utils.js'
import { checkValidation } from '../utils/validation.utils.js'
import { sendErrorResponse, sendSuccessResponse } from '../utils/response.utils.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  console.log(`🔍 GET /api/staff - User ID: ${req.userId}`)
  try {
    if (!isMongoConnected()) {
      return sendSuccessResponse(res, 200, 'Staff retrieved successfully', { staff: [] })
    }

    const staff = await Staff.find({ userId: req.userId }).sort({ createdAt: -1 })
    return sendSuccessResponse(res, 200, 'Staff retrieved successfully', {
      staff: staff || []
    })
  } catch (error) {
    console.error('Get staff error:', error)
    return sendErrorResponse(res, 500, 'Error retrieving staff', error)
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return sendErrorResponse(res, 404, 'Staff member not found')
    }

    const staff = await Staff.findOne({ _id: req.params.id, userId: req.userId })
    if (!staff) {
      return sendErrorResponse(res, 404, 'Staff member not found')
    }

    return sendSuccessResponse(res, 200, 'Staff retrieved successfully', { staff })
  } catch (error) {
    console.error('Get staff error:', error)
    return sendErrorResponse(res, 500, 'Error retrieving staff', error)
  }
})

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
        return sendErrorResponse(res, 503, 'Database not connected. Please connect to MongoDB to create staff members.')
      }

      if (!checkValidation(req, res)) return

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

      return sendSuccessResponse(res, 201, 'Staff member created successfully', { staff })
    } catch (error) {
      console.error('Create staff error:', error)
      return sendErrorResponse(res, 500, 'Error creating staff member', error)
    }
  }
)

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
        return sendErrorResponse(res, 503, 'Database not connected. Please connect to MongoDB to create staff members.')
      }

      if (!checkValidation(req, res)) return

      const staff = await Staff.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body },
        { new: true, runValidators: true }
      )

      if (!staff) {
        return sendErrorResponse(res, 404, 'Staff member not found')
      }

      return sendSuccessResponse(res, 200, 'Staff member updated successfully', { staff })
    } catch (error) {
      console.error('Update staff error:', error)
      return sendErrorResponse(res, 500, 'Error updating staff member', error)
    }
  }
)

router.patch('/:id/attendance', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return sendErrorResponse(res, 503, 'Database not connected')
    }

    const { absentDates, isAbsentToday, halfDayDates } = req.body

    const updateData = {}
    if (absentDates !== undefined) {
      updateData.absentDates = absentDates
    }
    if (isAbsentToday !== undefined) {
      updateData.isAbsentToday = isAbsentToday
    }
    if (halfDayDates !== undefined) {
      updateData.halfDayDates = halfDayDates
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updateData },
      { new: true }
    )

    if (!staff) {
      return sendErrorResponse(res, 404, 'Staff member not found')
    }

    return sendSuccessResponse(res, 200, 'Attendance updated successfully', { staff })
  } catch (error) {
    console.error('Update attendance error:', error)
    return sendErrorResponse(res, 500, 'Error updating attendance', error)
  }
})

// --- Advance Tracking ---
router.post('/:id/advances', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return sendErrorResponse(res, 503, 'Database not connected')
    }
    const { amount, date, note } = req.body
    if (!amount || !date) {
      return sendErrorResponse(res, 400, 'Amount and date are required')
    }
    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $push: { advances: { amount, date, note: note || '', deducted: false } } },
      { new: true }
    )
    if (!staff) return sendErrorResponse(res, 404, 'Staff member not found')
    return sendSuccessResponse(res, 201, 'Advance recorded successfully', { staff })
  } catch (error) {
    console.error('Add advance error:', error)
    return sendErrorResponse(res, 500, 'Error recording advance', error)
  }
})

router.delete('/:id/advances/:advanceId', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return sendErrorResponse(res, 503, 'Database not connected')
    }
    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $pull: { advances: { _id: req.params.advanceId } } },
      { new: true }
    )
    if (!staff) return sendErrorResponse(res, 404, 'Staff member not found')
    return sendSuccessResponse(res, 200, 'Advance deleted successfully', { staff })
  } catch (error) {
    console.error('Delete advance error:', error)
    return sendErrorResponse(res, 500, 'Error deleting advance', error)
  }
})

// --- Salary Payment Recording ---
router.post('/:id/payments', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return sendErrorResponse(res, 503, 'Database not connected')
    }
    const { month, year, totalDays, presentDays, halfDays, absentDays,
            grossSalary, deductions, advanceDeducted, netSalary,
            status, amountPaid, paidOn, note } = req.body

    if (!month || !year) {
      return sendErrorResponse(res, 400, 'Month and year are required')
    }

    // Upsert payment for this month
    const staff = await Staff.findOne({ _id: req.params.id, userId: req.userId })
    if (!staff) return sendErrorResponse(res, 404, 'Staff member not found')

    const existingIdx = staff.payments.findIndex(p => p.month === month && p.year === year)
    const paymentData = {
      month, year,
      totalDays: totalDays || 0,
      presentDays: presentDays || 0,
      halfDays: halfDays || 0,
      absentDays: absentDays || 0,
      grossSalary: grossSalary || 0,
      deductions: deductions || 0,
      advanceDeducted: advanceDeducted || 0,
      netSalary: netSalary || 0,
      status: status || 'pending',
      amountPaid: amountPaid || 0,
      paidOn: paidOn || '',
      note: note || ''
    }

    if (existingIdx >= 0) {
      staff.payments[existingIdx] = { ...staff.payments[existingIdx].toObject(), ...paymentData }
    } else {
      staff.payments.push(paymentData)
    }

    // Mark advances as deducted if advanceDeducted > 0
    if (advanceDeducted > 0) {
      let remaining = advanceDeducted
      staff.advances = staff.advances.map(adv => {
        if (!adv.deducted && remaining > 0) {
          remaining -= adv.amount
          return { ...adv.toObject(), deducted: true }
        }
        return adv
      })
    }

    await staff.save()
    return sendSuccessResponse(res, 201, 'Payment recorded successfully', { staff })
  } catch (error) {
    console.error('Record payment error:', error)
    return sendErrorResponse(res, 500, 'Error recording payment', error)
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return sendErrorResponse(res, 503, 'Database not connected')
    }

    const staff = await Staff.findOneAndDelete({ _id: req.params.id, userId: req.userId })

    if (!staff) {
      return sendErrorResponse(res, 404, 'Staff member not found')
    }

    return sendSuccessResponse(res, 200, 'Staff member deleted successfully')
  } catch (error) {
    console.error('Delete staff error:', error)
    return sendErrorResponse(res, 500, 'Error deleting staff member', error)
  }
})

export default router

