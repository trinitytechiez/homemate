import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../models/User.model.js'

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId).select('-password')
      if (!user) {
        return res.status(401).json({ message: 'User not found' })
      }
      req.user = user
      req.userId = decoded.userId
    } else {
      // If MongoDB not connected, just set userId from token
      req.userId = decoded.userId
    }

    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export default authMiddleware
export { authMiddleware as authenticate }

