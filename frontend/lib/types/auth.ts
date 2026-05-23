export interface AuthCredentials {
  email?: string
  mobileNumber?: string
  password?: string
  otp?: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface AuthError {
  message: string
  code?: string
}

export interface Session {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
  expiresAt: number
}
