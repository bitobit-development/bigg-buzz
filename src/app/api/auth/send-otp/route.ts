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

    // Check if subscriber exists (skip for test users)
    let subscriber = null
    if (!isTestUser) {
      subscriber = await prisma.subscriber.findUnique({
        where: { phone: normalizedPhone },
      })

      if (!subscriber) {
        return NextResponse.json(
          { error: 'Subscriber not found with this phone number' },
          { status: 404 }
        )
      }
    }

    // For registration flow, allow sending OTP to inactive subscribers (newly registered)
    // For login flow, check if account is active (this would be a separate endpoint)
    if (subscriber && !subscriber.isActive && !subscriber.phoneVerified) {
      // Subscriber is in registration flow - this is allowed
    } else if (subscriber && !subscriber.isActive && subscriber.phoneVerified) {
      // Subscriber was previously active but account is now deactivated
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      )
    }

    // Send OTP (use test userId for test users)
    const userId = isTestUser ? `test-user-${Date.now()}` : subscriber?.id
    const otpSent = await sendOTP(normalizedPhone, channel as 'sms' | 'whatsapp', userId)

    if (!otpSent) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    // Log compliance event (skip for test users)
    if (subscriber && !isTestUser) {
      await prisma.complianceEvent.create({
        data: {
          subscriberId: subscriber.id,
          eventType: 'LOGIN_ATTEMPT',
          description: 'OTP requested for login',
          metadata: JSON.stringify({
            phone: phone.substring(0, 3) + '***' + phone.substring(phone.length - 2),
            method: 'OTP',
          }),
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Environment check:', {
      CLICKATEL_API_KEY: process.env.CLICKATEL_API_KEY ? 'Set' : 'Not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV
    })

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    )
  }
}