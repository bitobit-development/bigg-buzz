import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { phoneSchema, normalizePhoneNumber } from '@/lib/validation'
import { sendOTP, cleanupExpiredOTPs } from '@/lib/sms'
import { rateLimit } from '@/lib/rate-limit'

// Note: Using Node.js runtime for Prisma compatibility

export async function POST(request: NextRequest) {
  try {
    // Clean up expired OTPs first
    await cleanupExpiredOTPs()

    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, 'send-otp', 5, 900000) // 5 requests per 15 minutes
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { phone, channel = 'sms' } = body

    // Validate phone number
    const validatedPhone = phoneSchema.parse(phone)
    const normalizedPhone = normalizePhoneNumber(validatedPhone)

    // Check if this is a test user
    const isTestUser = normalizedPhone === normalizePhoneNumber(process.env.TEST_USER_PHONE || '')

    // Check if user exists (skip for test users)
    let user = null
    if (!isTestUser) {
      user = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found with this phone number' },
          { status: 404 }
        )
      }
    }

    // For registration flow, allow sending OTP to inactive users (newly registered)
    // For login flow, check if account is active (this would be a separate endpoint)
    if (user && !user.isActive && !user.phoneVerified) {
      // User is in registration flow - this is allowed
    } else if (user && !user.isActive && user.phoneVerified) {
      // User was previously active but account is now deactivated
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      )
    }

    // Send OTP (use test userId for test users)
    const userId = isTestUser ? `test-user-${Date.now()}` : user?.id
    const otpSent = await sendOTP(normalizedPhone, channel as 'sms' | 'whatsapp', userId)

    if (!otpSent) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    // Log compliance event (skip for test users)
    if (user && !isTestUser) {
      await prisma.complianceEvent.create({
        data: {
          userId: user.id,
          eventType: 'LOGIN_ATTEMPT',
          description: 'OTP requested for login',
          metadata: {
            phone: phone.substring(0, 3) + '***' + phone.substring(phone.length - 2),
            method: 'OTP',
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent successfully via ${channel}`,
      expiresIn: 600, // 10 minutes
      channel,
    })

  } catch (error) {
    console.error('Send OTP error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}