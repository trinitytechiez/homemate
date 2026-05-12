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
    
    // Set userId directly from decoded token for better performance
    // Most routes only need req.userId, and user-specific routes fetch the user themselves
    req.userId = decoded.userId

    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export default authMiddleware
export { authMiddleware as authenticate }

