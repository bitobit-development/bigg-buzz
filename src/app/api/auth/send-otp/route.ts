import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { phoneSchema, normalizePhoneNumber } from '@/lib/validation'
import { sendOTP } from '@/lib/sms'
import { rateLimit } from '@/lib/rate-limit'

// Note: Using Node.js runtime for Prisma compatibility

export async function POST(request: NextRequest) {
  try {
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found with this phone number' },
        { status: 404 }
      )
    }

    // For registration flow, allow sending OTP to inactive users (newly registered)
    // For login flow, check if account is active (this would be a separate endpoint)
    if (!user.isActive && !user.phoneVerified) {
      // User is in registration flow - this is allowed
    } else if (!user.isActive && user.phoneVerified) {
      // User was previously active but account is now deactivated
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      )
    }

    // Send OTP
    const otpSent = await sendOTP(normalizedPhone, channel as 'sms' | 'whatsapp', user.id)

    if (!otpSent) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    // Log compliance event
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