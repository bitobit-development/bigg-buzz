import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { AuthenticationError, AuthorizationError } from '@/lib/error-handler'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-key-32-characters-minimum-length')

export interface SubscriberUser {
  id: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  email?: string | null
  isActive: boolean
  phoneVerified: boolean
  termsAccepted: boolean
}

/**
 * Create JWT token for subscriber
 */
export async function createSubscriberToken(subscriber: SubscriberUser): Promise<string> {
  const token = new SignJWT({
    id: subscriber.id,
    firstName: subscriber.firstName || '',
    lastName: subscriber.lastName || '',
    phone: subscriber.phone || '',
    email: subscriber.email || null,
    isActive: subscriber.isActive,
    phoneVerified: subscriber.phoneVerified,
    termsAccepted: subscriber.termsAccepted,
    type: 'subscriber',
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d') // 30 days
    .setIssuedAt()

  return await token.sign(JWT_SECRET)
}

/**
 * Verify subscriber token from cookies (server-side)
 */
export async function verifySubscriberToken(): Promise<SubscriberUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('subscriber-token')?.value

    if (!token) {
      return null
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Ensure this is a subscriber token
    if (payload.type !== 'subscriber') {
      return null
    }

    return {
      id: payload.id as string,
      firstName: (payload.firstName as string) || null,
      lastName: (payload.lastName as string) || null,
      phone: (payload.phone as string) || null,
      email: (payload.email as string) || null,
      isActive: payload.isActive as boolean,
      phoneVerified: payload.phoneVerified as boolean,
      termsAccepted: payload.termsAccepted as boolean
    }
  } catch (error) {
    console.error('Subscriber token verification error:', error)
    return null
  }
}

/**
 * Verify subscriber token from Authorization header (API requests)
 */
export async function verifySubscriberTokenFromHeader(request: NextRequest): Promise<SubscriberUser | null> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Ensure this is a subscriber token
    if (payload.type !== 'subscriber') {
      return null
    }

    return {
      id: payload.id as string,
      firstName: (payload.firstName as string) || null,
      lastName: (payload.lastName as string) || null,
      phone: (payload.phone as string) || null,
      email: (payload.email as string) || null,
      isActive: payload.isActive as boolean,
      phoneVerified: payload.phoneVerified as boolean,
      termsAccepted: payload.termsAccepted as boolean
    }
  } catch (error) {
    console.error('Subscriber token verification error:', error)
    return null
  }
}

/**
 * Get subscriber from token (tries both cookie and header)
 */
export async function getSubscriberUser(request?: NextRequest): Promise<SubscriberUser | null> {
  // Try header first (for API requests)
  if (request) {
    const headerUser = await verifySubscriberTokenFromHeader(request)
    if (headerUser) return headerUser
  }

  // Fall back to cookie (for server-side rendering)
  return await verifySubscriberToken()
}

/**
 * Require subscriber authentication
 */
export async function requireSubscriberAuth(request?: NextRequest): Promise<SubscriberUser> {
  const subscriber = await getSubscriberUser(request)

  if (!subscriber) {
    throw new AuthenticationError('Authentication required')
  }

  if (!subscriber.isActive) {
    throw new AuthorizationError('Account is not active')
  }

  if (!subscriber.phoneVerified) {
    throw new AuthorizationError('Phone verification required')
  }

  return subscriber
}

/**
 * Check if current request has subscriber authentication
 */
export async function isSubscriberAuthenticated(request?: NextRequest): Promise<boolean> {
  const subscriber = await getSubscriberUser(request)
  return !!subscriber && subscriber.isActive && subscriber.phoneVerified
}