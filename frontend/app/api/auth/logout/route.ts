import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    await clearSession()
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
