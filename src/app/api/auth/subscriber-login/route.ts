import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SignJWT } from 'jose'

// Import with try-catch protection
let prisma: any
let sanitizeInput: any
let normalizePhoneNumber: any

try {
  prisma = require('@/lib/prisma').prisma
  sanitizeInput = require('@/lib/security').sanitizeInput
  normalizePhoneNumber = require('@/lib/validation').normalizePhoneNumber
} catch (importError) {
  console.error('[LOGIN] Import error:', importError)
}

// Direct OTP verification function to avoid import issues
async function verifyOTPDirect(phone: string, code: string): Promise<boolean> {
  try {
    if (!prisma) return false

    console.log(`[OTP] Verifying OTP for ${phone}: ${code}`)

    // Check subscriber tokens
    const expectedToken = `${phone}:${code}`
    const subscriberToken = await prisma.subscriberToken.findFirst({
      where: {
        token: expectedToken,
        type: 'OTP_VERIFICATION',
        isUsed: false,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      include: {
        subscriber: {
          select: {
            phone: true
          }
        }
      }
    })

    if (subscriberToken && subscriberToken.subscriber?.phone === phone) {
      console.log(`[OTP] Subscriber database verification successful`)
      // Mark as used immediately to prevent reuse
      await prisma.subscriberToken.update({
        where: { id: subscriberToken.id },
        data: { isUsed: true },
      })
      return true
    }

    // Also check user tokens as fallback
    const userToken = await prisma.userToken.findFirst({
      where: {
        token: expectedToken,
        type: 'OTP_VERIFICATION',
        isUsed: false,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      include: {
        user: {
          select: {
            phone: true
          }
        }
      }
    })

    if (userToken && userToken.user?.phone === phone) {
      console.log(`[OTP] User database verification successful`)
      // Mark as used immediately to prevent reuse
      await prisma.userToken.update({
        where: { id: userToken.id },
        data: { isUsed: true },
      })
      return true
    }

    console.log(`[OTP] No valid token found for ${expectedToken}`)
    return false
  } catch (error) {
    console.error('OTP verification error:', error)
    return false
  }
}

// Direct token creation function to avoid import issues
async function createTokenDirect(subscriber: any): Promise<string> {
  try {
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-key-32-characters-minimum-length')

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
  } catch (error) {
    console.error('Direct token creation error:', error)
    throw error
  }
}

const LoginSchema = z.object({
  phone: z.string()
    .min(1, 'Phone number is required')
    .transform(val => sanitizeInput ? sanitizeInput(val) : val),
  otp: z.string()
    .min(4, 'OTP must be at least 4 characters')
    .max(6, 'OTP must be at most 6 characters')
    .regex(/^\d+$/, 'OTP must contain only numbers')
    .transform(val => sanitizeInput ? sanitizeInput(val) : val)
})

export async function POST(request: NextRequest) {
  try {
    console.log('[LOGIN] Starting login process')

    // Check if all dependencies are available
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      )
    }

    // OTP verification and token creation are now handled directly in this file

    const body = await request.json()
    const { phone, otp } = LoginSchema.parse(body)

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber ? normalizePhoneNumber(phone) : phone
    console.log(`[LOGIN] Normalized phone: ${normalizedPhone}`)

    // Verify OTP using direct database check
    const isValidOTP = await verifyOTPDirect(normalizedPhone, otp)
    console.log(`[LOGIN] OTP verification result: ${isValidOTP}`)

    if (!isValidOTP) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code' },
        { status: 401 }
      )
    }

    // Find subscriber
    const subscriber = await prisma.subscriber.findUnique({
      where: { phone: normalizedPhone },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        isActive: true,
        phoneVerified: true,
        termsAccepted: true
      }
    })

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    if (!subscriber.isActive) {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      )
    }

    if (!subscriber.phoneVerified) {
      return NextResponse.json(
        { error: 'Phone number not verified' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!subscriber.firstName || !subscriber.lastName || !subscriber.phone) {
      return NextResponse.json(
        { error: 'Account profile is incomplete. Please contact support.' },
        { status: 400 }
      )
    }

    // Update last login
    try {
      await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: { updatedAt: new Date() }
      })
    } catch (error) {
      console.log('[LOGIN] Could not update last login time:', error)
    }

    // Create JWT token using direct function
    const token = await createTokenDirect(subscriber)

    console.log(`[LOGIN] Successfully created token for subscriber: ${subscriber.id}`)

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: subscriber.id,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        phone: subscriber.phone,
        email: subscriber.email
      },
      token
    })

    // Set secure cookie
    response.cookies.set('subscriber-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return response
  } catch (error) {
    console.error('[LOGIN] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}