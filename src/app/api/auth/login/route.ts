import { NextRequest, NextResponse } from 'next/server'

const APP_PASSWORD = process.env.APP_PASSWORD || 'orb-companion-2024'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password === APP_PASSWORD) {
      const response = NextResponse.json({ success: true })
      
      // Set authentication cookie
      response.cookies.set('app-auth', APP_PASSWORD, {
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