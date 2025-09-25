import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpVerificationSchema, normalizePhoneNumber } from '@/lib/validation'
import { verifyOTP, cleanupExpiredOTPs } from '@/lib/sms'
import { createSubscriberToken } from '@/lib/auth/subscriber-auth'

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
    // Clean up expired OTPs first
    await cleanupExpiredOTPs()

    const body = await request.json()
    console.log(`[API] Received OTP verification request:`, { phone: body.phone, otp: body.otp?.substring(0, 3) + '***', createSession: body.createSession })

    // Check if this is a login request (create JWT session)
    const createSession = body.createSession === true

    // Validate input
    const validatedData = otpVerificationSchema.parse(body)
    const { phone, otp } = validatedData

    const normalizedPhone = normalizePhoneNumber(phone)
    console.log(`[API] Normalized phone: ${normalizedPhone}`)

    // Check if this is a test user
    const testUser = isTestUserPhone(phone)
    console.log(`[API] Is test user: ${testUser}`)

    // Verify OTP
    const isValidOTP = await verifyOTP(normalizedPhone, otp)
    console.log(`[API] OTP verification result: ${isValidOTP}`)

    if (!isValidOTP) {
      // For debugging: log the verification attempt
      console.log(`[API] OTP verification failed for ${normalizedPhone}: ${otp}`)
      return NextResponse.json(
        {
          error: 'Invalid or expired verification code',
          code: 'INVALID_OTP',
          details: 'The verification code you entered is either invalid or has expired. Please request a new code.'
        },
        { status: 400 }
      )
    }

    // For test users, we still need to update the database since a real subscriber was created
    // The test user flag just affects OTP verification logic, not database operations

    // Find subscriber and update verification status
    console.log(`[API] Looking for subscriber with phone: ${normalizedPhone}`)
    const subscriber = await prisma.subscriber.findUnique({
      where: { phone: normalizedPhone },
    })

    if (!subscriber) {
      console.log(`[API] Subscriber not found with phone: ${normalizedPhone}`)
      return NextResponse.json(
        {
          error: 'Subscriber not found',
          code: 'SUBSCRIBER_NOT_FOUND',
          details: 'No subscriber account found with this phone number. Please register first.'
        },
        { status: 404 }
      )
    }

    console.log(`[API] Found subscriber: ${subscriber.id}, current phoneVerified: ${subscriber.phoneVerified}`)

    // Update phone verification - don't activate account yet (that happens in complete-registration)
    const updatedSubscriber = await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        phoneVerified: new Date(),
        // Don't set lastLoginAt for registration flow - only for login flow
        // lastLoginAt: new Date(),
      },
    })
    console.log(`[API] Updated subscriber phone verification: ${updatedSubscriber.id}`)

    // Log compliance event
    await prisma.complianceEvent.create({
      data: {
        subscriberId: subscriber.id,
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

    console.log(`[API] Verification successful for subscriber: ${subscriber.id}`)

    // Prepare response data
    const responseData = {
      success: true,
      message: createSession ? 'Login successful' : 'Phone number verified successfully',
      user: {
        id: subscriber.id,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        phone: subscriber.phone,
        phoneVerified: true,
        isActive: subscriber.isActive,
        needsTermsAcceptance: !subscriber.termsAccepted,
        isTestUser: testUser,
      },
    }

    // If login session requested, create JWT token
    if (createSession && subscriber.isActive && subscriber.firstName && subscriber.lastName) {
      try {
        const token = await createSubscriberToken({
          id: subscriber.id,
          firstName: subscriber.firstName,
          lastName: subscriber.lastName,
          phone: subscriber.phone,
          email: subscriber.email,
          isActive: subscriber.isActive,
          phoneVerified: true,
          termsAccepted: subscriber.termsAccepted || false
        })

        const response = NextResponse.json({
          ...responseData,
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
        console.error(`[API] JWT token creation failed:`, error)
        // Fall back to basic response if token creation fails
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('[API] OTP verification error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      console.error('[API] Validation error:', error)
      return NextResponse.json(
        {
          error: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: error
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        details: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    )
  }
}