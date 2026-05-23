import { NextRequest, NextResponse } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/set-password']

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/staff', '/add', '/settings', '/profile', '/about']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const token = request.cookies.get('homemate_token')?.value

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isRootPath = pathname === '/'

  // If accessing root, redirect based on auth status
  if (isRootPath) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If accessing public route with token, redirect to dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
