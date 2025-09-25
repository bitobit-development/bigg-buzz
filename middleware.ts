import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-key-32-characters-minimum-length')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for admin login page to avoid redirect loop
  if (pathname === '/admin-login') {
    return NextResponse.next()
  }

  // Handle marketplace route protection
  if (pathname.startsWith('/marketplace')) {
    // Check for subscriber token
    const token = request.cookies.get('subscriber-token')?.value

    console.log('[MIDDLEWARE] Marketplace access attempt:', {
      pathname,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    })

    if (!token) {
      console.log('[MIDDLEWARE] No subscriber token found, redirecting to sign-in')
      // Redirect to sign-in if no token
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET)

      // Ensure this is a subscriber token
      if (payload.type !== 'subscriber') {
        // Invalid subscriber token, redirect to sign-in
        const response = NextResponse.redirect(new URL('/sign-in', request.url))
        // Clear invalid token
        response.cookies.set('subscriber-token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
          path: '/'
        })
        return response
      }

      // Token is valid, allow access
      return NextResponse.next()

    } catch (error) {
      console.error('Marketplace token verification failed:', error)

      // Invalid or expired token, redirect to sign-in
      const response = NextResponse.redirect(new URL('/sign-in', request.url))

      // Clear invalid token
      response.cookies.set('subscriber-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      })

      return response
    }
  }

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    // Check for admin token
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      // Redirect to admin login if no token
      return NextResponse.redirect(new URL('/admin-login', request.url))
    }

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET)

      // Ensure this is an admin token with correct role
      if (payload.type !== 'admin' || payload.role !== 'ADMIN') {
        // Invalid admin token, redirect to login
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        // Clear invalid token
        response.cookies.set('admin-token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
          path: '/'
        })
        return response
      }

      // Token is valid, allow access
      return NextResponse.next()

    } catch (error) {
      console.error('Admin token verification failed:', error)

      // Invalid or expired token, redirect to login
      const response = NextResponse.redirect(new URL('/admin-login', request.url))

      // Clear invalid token
      response.cookies.set('admin-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      })

      return response
    }
  }

  // For all other routes, continue normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all admin routes but exclude admin-login
    '/admin/:path*',
    // Match marketplace routes
    '/marketplace/:path*',
    // Exclude static files, API routes, auth pages and admin-login from general middleware
    '/((?!api|_next/static|_next/image|favicon.ico|admin-login|sign-in|register|$).*)',
  ],
}