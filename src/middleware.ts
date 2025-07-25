import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ENABLE_PASSWORD_PROTECTION = process.env.ENABLE_PASSWORD_PROTECTION === 'true'
const APP_PASSWORD = process.env.APP_PASSWORD || 'orb-companion-2024'

export function middleware(request: NextRequest) {
  // Skip password protection if not enabled
  if (!ENABLE_PASSWORD_PROTECTION) {
    return NextResponse.next()
  }

  // Skip password protection for API routes and static assets
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get('app-auth')
  
  if (!authCookie || authCookie.value !== APP_PASSWORD) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}