import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
// import { rateLimit } from '@/lib/rate-limit'
// import { validateOrigin, generateCSP } from '@/lib/security'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/orders',
  '/vendor',
  '/admin',
  '/api/user',
  '/api/orders',
  '/api/products/create',
  '/api/vendor',
  '/api/admin',
]

// Routes that require specific roles
const roleBasedRoutes = {
  '/vendor': ['VENDOR', 'ADMIN', 'SUPER_ADMIN'],
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/api/vendor': ['VENDOR', 'ADMIN', 'SUPER_ADMIN'],
  '/api/admin': ['ADMIN', 'SUPER_ADMIN'],
}

// Public API routes that still need rate limiting
const publicAPIRoutes = [
  '/api/auth/register',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/products',
  '/api/vendors',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // Security headers
  const response = NextResponse.next()

  // CORS handling
  const allowedOrigins = [
    'http://localhost:3000',
    'https://biggbuzz.co.za',
  ]

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-CSRF-Token'
    )
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;")
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self)'
  )

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response
  }

  // Temporarily disable rate limiting to fix crypto issue
  /*
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitConfig = getRateLimitConfig(pathname)

    if (rateLimitConfig) {
      const rateLimitResult = await rateLimit(
        request,
        rateLimitConfig.action,
        rateLimitConfig.maxRequests,
        rateLimitConfig.windowMs
      )

      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(
                (rateLimitResult.resetTime - Date.now()) / 1000
              ).toString(),
              'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            },
          }
        )
      }

      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
    }
  }
  */

  // Authentication check for protected routes
  if (isProtectedRoute(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      // Redirect to login for pages, return 401 for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      const loginUrl = new URL('/auth/signin', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user is active
    if (!token.isActive) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Account inactive' },
          { status: 403 }
        )
      }

      return NextResponse.redirect(new URL('/auth/inactive', request.url))
    }

    // Role-based access control
    const requiredRoles = getRoleRequirements(pathname)
    if (requiredRoles && !requiredRoles.includes(token.role as string)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Insufficient privileges' },
          { status: 403 }
        )
      }

      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Compliance checks for cannabis-related routes
    if (isCannabiRoute(pathname)) {
      // Check age verification (18+)
      if (!token.saIdVerified) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Age verification required' },
            { status: 403 }
          )
        }

        return NextResponse.redirect(new URL('/verify-age', request.url))
      }

      // Check phone verification
      if (!token.phoneVerified) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Phone verification required' },
            { status: 403 }
          )
        }

        return NextResponse.redirect(new URL('/verify-phone', request.url))
      }
    }
  }

  return response
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function getRoleRequirements(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route)) {
      return roles
    }
  }
  return null
}

function isCannabiRoute(pathname: string): boolean {
  const cannabisRoutes = [
    '/products',
    '/orders',
    '/vendor/products',
    '/api/products/create',
    '/api/orders',
  ]

  return cannabisRoutes.some(route => pathname.startsWith(route))
}

function getRateLimitConfig(pathname: string): {
  action: string
  maxRequests: number
  windowMs: number
} | null {
  // Authentication routes - stricter limits
  if (pathname.includes('/auth/register')) {
    return { action: 'register', maxRequests: 5, windowMs: 900000 } // 5 per 15 min
  }

  if (pathname.includes('/auth/send-otp')) {
    return { action: 'send-otp', maxRequests: 10, windowMs: 900000 } // 10 per 15 min
  }

  if (pathname.includes('/auth/verify-otp')) {
    return { action: 'verify-otp', maxRequests: 15, windowMs: 900000 } // 15 per 15 min
  }

  // General API routes
  if (pathname.startsWith('/api/')) {
    return { action: 'api', maxRequests: 100, windowMs: 900000 } // 100 per 15 min
  }

  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}