// Database utility functions
import mongoose from 'mongoose'

/**
 * Check if MongoDB is connected
 * @returns {boolean} True if connected, false otherwise
 */
export const isMongoConnected = () => {
  return mongoose.connection.readyState === 1
}

/**
 * Get MongoDB connection status
 * @returns {string} Connection status string
 */
export const getMongoStatus = () => {
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }
  return statusMap[mongoose.connection.readyState] || 'unknown'
}

