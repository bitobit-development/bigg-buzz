import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSubscriberToken } from '@/lib/auth/subscriber-auth'
import { withErrorHandler, throwError } from '@/lib/error-handler'
import { sanitizeInput } from '@/lib/security'
import { verifyOTP } from '@/lib/sms'
import { normalizePhoneNumber } from '@/lib/validation'
import { z } from 'zod'

const LoginSchema = z.object({
  phone: z.string()
    .min(1, 'Phone number is required')
    .transform(val => sanitizeInput(val)),
  otp: z.string()
    .min(4, 'OTP must be at least 4 characters')
    .max(6, 'OTP must be at most 6 characters')
    .regex(/^\d+$/, 'OTP must contain only numbers')
    .transform(val => sanitizeInput(val))
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { phone, otp } = LoginSchema.parse(body)

  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phone)

  // Verify OTP using the existing SMS verification system
  const isValidOTP = await verifyOTP(normalizedPhone, otp)

  if (!isValidOTP) {
    throwError.authentication('Invalid or expired OTP code')
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
    throwError.notFound('Subscriber not found')
  }

  // Use non-null assertion since we've checked above
  const validatedSubscriber = subscriber!

  if (!validatedSubscriber.isActive) {
    throwError.authorization('Account is not active')
  }

  if (!validatedSubscriber.phoneVerified) {
    throwError.authorization('Phone number not verified')
  }

  // Validate required fields are not null
  if (!validatedSubscriber.firstName || !validatedSubscriber.lastName || !validatedSubscriber.phone) {
    throwError.validation('Account profile is incomplete. Please contact support.')
  }

  // Update last login if the field exists
  try {
    await prisma.subscriber.update({
      where: { id: validatedSubscriber.id },
      data: { updatedAt: new Date() } // Use updatedAt instead of lastLoginAt which might not exist
    })
  } catch (error) {
    // If lastLoginAt field doesn't exist, just continue
    console.log('Could not update last login time:', error)
  }

  // Create JWT token
  const token = await createSubscriberToken({
    id: validatedSubscriber.id,
    firstName: validatedSubscriber.firstName,
    lastName: validatedSubscriber.lastName,
    phone: validatedSubscriber.phone,
    email: validatedSubscriber.email,
    isActive: validatedSubscriber.isActive,
    phoneVerified: !!validatedSubscriber.phoneVerified,
    termsAccepted: validatedSubscriber.termsAccepted
  })

  // Set cookie
  const response = NextResponse.json({
    success: true,
    message: 'Login successful',
    user: {
      id: validatedSubscriber.id,
      firstName: validatedSubscriber.firstName,
      lastName: validatedSubscriber.lastName,
      phone: validatedSubscriber.phone,
      email: validatedSubscriber.email
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
})