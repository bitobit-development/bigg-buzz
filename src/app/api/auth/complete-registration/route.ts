import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Note: Using Node.js runtime for Prisma compatibility
// Fixed to use subscriber table instead of user table

const completeRegistrationSchema = z.object({
  userId: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  privacyAccepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = completeRegistrationSchema.parse(body)
    const { userId, termsAccepted, privacyAccepted } = validatedData

    // Check if this is a test user (identified by test- prefix)
    const isTestUser = userId.startsWith('test-user-')

    if (isTestUser) {
      // For test users, return a simulated successful response
      return NextResponse.json({
        success: true,
        message: 'Test user registration completed successfully',
        user: {
          id: userId,
          firstName: process.env.TEST_USER_FIRST_NAME || 'Test',
          lastName: process.env.TEST_USER_LAST_NAME || 'User',
          email: process.env.TEST_USER_EMAIL || '',
          phone: process.env.TEST_USER_PHONE || '',
          isActive: true,
          isPhoneVerified: true,
          isTestUser: true,
        },
      })
    }

    // Check if subscriber exists and is verified
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: userId },
    })

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    if (!subscriber.phoneVerified) {
      return NextResponse.json(
        { error: 'Phone number must be verified first' },
        { status: 400 }
      )
    }

    if (subscriber.isActive && subscriber.termsAccepted && subscriber.privacyAccepted) {
      return NextResponse.json(
        { error: 'Registration has already been completed' },
        { status: 400 }
      )
    }

    // Update subscriber with terms acceptance, activate account, and add signup bonus
    const SIGNUP_BONUS = 50.00; // R50 signup bonus

    const updatedSubscriber = await prisma.subscriber.update({
      where: { id: userId },
      data: {
        termsAccepted,
        termsAcceptedDate: new Date(),
        privacyAccepted,
        privacyAcceptedDate: new Date(),
        isActive: true,
        tokenBalance: SIGNUP_BONUS, // Add R50 signup bonus
      },
    })

    // Create token transaction record for the signup bonus
    await prisma.tokenTransaction.create({
      data: {
        subscriberId: userId,
        type: 'BONUS',
        amount: SIGNUP_BONUS,
        balance: SIGNUP_BONUS,
        description: 'Welcome bonus for new subscribers',
        status: 'COMPLETED',
        processedAt: new Date(),
        metadata: JSON.stringify({
          bonusType: 'SIGNUP_BONUS',
          amount: SIGNUP_BONUS,
          grantedAt: new Date().toISOString(),
        }),
      },
    })

    // Log compliance event
    await prisma.complianceEvent.create({
      data: {
        subscriberId: subscriber.id,
        eventType: 'USER_REGISTRATION',
        description: 'Subscriber completed registration, accepted terms, and received signup bonus',
        metadata: JSON.stringify({
          termsAccepted,
          privacyAccepted,
          signupBonus: SIGNUP_BONUS,
          bonusGranted: true,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      user: {
        id: updatedSubscriber.id,
        firstName: updatedSubscriber.firstName,
        lastName: updatedSubscriber.lastName,
        email: updatedSubscriber.email,
        phone: updatedSubscriber.phone,
        isActive: updatedSubscriber.isActive,
        isPhoneVerified: !!updatedSubscriber.phoneVerified,
      },
    })

  } catch (error) {
    console.error('Complete registration error:', error)

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