import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { sessions } from '@/lib/session-store'

const APP_PASSWORD = process.env.APP_PASSWORD || 'orb-companion-2024'

const generateSessionToken = (): string => {
  return randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password === APP_PASSWORD) {
      // Generate a random session token
      const sessionToken = generateSessionToken()
      const now = Date.now()
      const expiresAt = now + (60 * 60 * 24 * 30 * 1000) // 30 days

      // Store session
      sessions.set(sessionToken, {
        createdAt: now,
        expiresAt
      })

      const response = NextResponse.json({ success: true })
      
      // Set authentication cookie with session token
      response.cookies.set('app-auth', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })

      return response
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}

