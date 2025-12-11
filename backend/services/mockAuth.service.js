import { generateToken, sanitizeUser, getUserId } from '../utils/auth.utils.js'

const mockUsers = new Map()

const createMockUser = (userData) => {
  return {
    id: `mock-${Date.now()}`,
    _id: `mock-${Date.now()}`,
    ...userData,
    comparePassword: async (password) => {
      return password === 'test123456' || password === 'temp123' || password === userData.password
    }
  }
}

export const mockAuthService = {
  findUserByEmail: async (email) => {
    for (const user of mockUsers.values()) {
      if (user.email === email) {
        return user
      }
    }
    return null
  },
  
  findUserById: async (id) => {
    return mockUsers.get(id) || null
  },
  
  findUserByPhoneNumber: async (phoneNumber) => {
    for (const user of mockUsers.values()) {
      if (user.phoneNumber === phoneNumber) {
        return user
      }
    }
    return null
  },
  
  createUser: async (userData) => {
    const user = createMockUser(userData)
    mockUsers.set(user.id, user)
    return user
  },
  
  verifyPassword: async (user, password) => {
    return await user.comparePassword(password)
  },
  
  generateToken,
  sanitizeUser,
  getUserId
}

