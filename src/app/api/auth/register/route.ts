import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateSAID, parseSAID, registrationSchema, normalizePhoneNumber } from '@/lib/validation'
import { sendOTP, cleanupExpiredOTPs } from '@/lib/sms'
import { encrypt } from '@/lib/security'

// Note: Using Node.js runtime for Prisma compatibility
// Security functions use Web Crypto API for Edge compatibility

// Test user configuration
const TEST_USER = {
  firstName: process.env.TEST_USER_FIRST_NAME || '',
  lastName: process.env.TEST_USER_LAST_NAME || '',
  email: process.env.TEST_USER_EMAIL || '',
  phone: process.env.TEST_USER_PHONE || '',
  saId: process.env.TEST_USER_SA_ID || '',
}

// Check if the provided credentials match the test user
function isTestUser(data: { saId: string; phone: string; firstName: string; lastName: string; email?: string }): boolean {
  const normalizedInputPhone = normalizePhoneNumber(data.phone)
  const normalizedTestPhone = normalizePhoneNumber(TEST_USER.phone)

  return (
    data.saId === TEST_USER.saId &&
    normalizedInputPhone === normalizedTestPhone &&
    data.firstName.toLowerCase() === TEST_USER.firstName.toLowerCase() &&
    data.lastName.toLowerCase() === TEST_USER.lastName.toLowerCase() &&
    (data.email?.toLowerCase() === TEST_USER.email.toLowerCase() || !data.email)
  )
}

export async function POST(request: NextRequest) {
  try {
    // Clean up expired OTPs first
    await cleanupExpiredOTPs()

    const body = await request.json()

    // Validate partial input (terms will be validated later)
    const partialSchema = registrationSchema.omit({ termsAccepted: true, privacyAccepted: true })
    const validatedData = partialSchema.parse(body)
    const { saId, phone, firstName, lastName, email, marketingConsent } = validatedData
    const { channel = 'sms' } = body // Default to SMS if not specified

    // Parse SA ID for additional validation
    const saIdInfo = parseSAID(saId)

    if (!saIdInfo.isValidAge) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old to register' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhoneNumber(phone)

    // Check if this is a test user
    const testUser = isTestUser({
      saId,
      phone: normalizedPhone,
      firstName,
      lastName,
      email,
    })

    // If not a test user, check for existing users in database
    if (!testUser) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { saId: await encrypt(saId) },
            { phone: normalizedPhone },
            ...(email ? [{ email }] : []),
          ],
        },
      })

      if (existingUser) {
        // Determine which field already exists
        let conflictField = 'account'
        if (existingUser.phone === normalizedPhone) {
          conflictField = 'phone number'
        } else if (existingUser.email === email) {
          conflictField = 'email address'
        } else {
          conflictField = 'SA ID number'
        }

        return NextResponse.json(
          {
            error: `An account with this ${conflictField} already exists. Please sign in instead.`,
            code: 'USER_EXISTS',
            redirectTo: '/sign-in'
          },
          { status: 409 }
        )
      }
    }

    // For test users, don't create database records but simulate the process
    if (testUser) {
      // Generate a fake user ID for the test user
      const testUserId = `test-user-${Date.now()}`

      // Simulate OTP sending for test user
      const otpSent = await sendOTP(normalizedPhone, channel as 'sms' | 'whatsapp', testUserId)

      if (!otpSent) {
        return NextResponse.json(
          { error: 'Failed to send verification code' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Test user registration successful. Please verify your phone number.',
        userId: testUserId,
        requiresPhoneVerification: true,
        isTestUser: true,
      })
    }

    // Create user with encrypted SA ID (terms will be updated after verification)
    const newUser = await prisma.user.create({
      data: {
        saId: await encrypt(saId),
        phone: normalizedPhone,
        firstName,
        lastName,
        email,
        dateOfBirth: saIdInfo.dateOfBirth,
        role: 'CUSTOMER',
        isActive: false, // Will be activated after OTP verification
        marketingConsent,
        marketingConsentDate: marketingConsent ? new Date() : null,
        termsAccepted: false, // Will be updated in final step
        termsAcceptedDate: null,
        privacyAccepted: false, // Will be updated in final step
        privacyAcceptedDate: null,
      },
    })

    // Send OTP for phone verification
    const otpSent = await sendOTP(normalizedPhone, channel as 'sms' | 'whatsapp', newUser.id)

    if (!otpSent) {
      // Rollback user creation if OTP fails
      await prisma.user.delete({ where: { id: newUser.id } })
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    // Log compliance event
    await prisma.complianceEvent.create({
      data: {
        userId: newUser.id,
        eventType: 'USER_REGISTRATION',
        description: 'New user registered',
        metadata: JSON.stringify({
          age: saIdInfo.age,
          gender: saIdInfo.gender,
          citizenship: saIdInfo.isSACitizen ? 'SA' : 'Foreign',
          registrationMethod: 'SA_ID',
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please verify your phone number.',
      userId: newUser.id,
      requiresPhoneVerification: true,
    })

  } catch (error) {
    console.error('Registration error:', error)

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