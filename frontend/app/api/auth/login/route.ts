import { NextRequest, NextResponse } from 'next/server'
import { setSession } from '@/lib/auth/session'

const BACKEND_API_URL = process.env.API_URL || 'http://localhost:5001/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward to backend API
    const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const { token, user } = data

    // Set session cookies
    await setSession(token, user)

    return NextResponse.json(
      { success: true, token, user },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
