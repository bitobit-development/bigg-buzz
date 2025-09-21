import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpVerificationSchema, normalizePhoneNumber } from '@/lib/validation'
import { verifyOTP } from '@/lib/sms'

// Note: Using Node.js runtime for Prisma compatibility

// Test user configuration
const TEST_USER_PHONE = process.env.TEST_USER_PHONE || ''

// Check if the phone number belongs to the test user
function isTestUserPhone(phone: string): boolean {
  const normalizedInputPhone = normalizePhoneNumber(phone)
  const normalizedTestPhone = normalizePhoneNumber(TEST_USER_PHONE)
  return normalizedInputPhone === normalizedTestPhone
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = otpVerificationSchema.parse(body)
    const { phone, otp } = validatedData

    const normalizedPhone = normalizePhoneNumber(phone)

    // Check if this is a test user
    const testUser = isTestUserPhone(phone)

    // Verify OTP
    const isValidOTP = await verifyOTP(normalizedPhone, otp)

    if (!isValidOTP) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // For test users, return simulated response without database operations
    if (testUser) {
      return NextResponse.json({
        success: true,
        message: 'Test user phone number verified successfully',
        user: {
          id: `test-user-${Date.now()}`,
          firstName: process.env.TEST_USER_FIRST_NAME || 'Test',
          lastName: process.env.TEST_USER_LAST_NAME || 'User',
          phone: normalizedPhone,
          phoneVerified: true,
          isActive: false,
          needsTermsAcceptance: true,
          isTestUser: true,
        },
      })
    }

    // Find user and update verification status
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update phone verification - don't activate account yet (that happens in complete-registration)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: new Date(),
        // Don't set lastLoginAt for registration flow - only for login flow
        // lastLoginAt: new Date(),
      },
    })

    // Log compliance event
    await prisma.complianceEvent.create({
      data: {
        userId: user.id,
        eventType: 'ID_VERIFICATION',
        description: 'Phone number verified via OTP',
        metadata: JSON.stringify({
          verificationMethod: 'OTP',
          phone: phone.substring(0, 3) + '***' + phone.substring(phone.length - 2),
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        phoneVerified: true,
        isActive: user.isActive,
        needsTermsAcceptance: !user.termsAccepted, // Indicate if terms acceptance is needed
      },
    })

  } catch (error) {
    console.error('OTP verification error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}