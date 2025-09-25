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
  console.log('[LOGIN] Starting login process')

  const body = await request.json()
  const { phone, otp } = LoginSchema.parse(body)

  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phone)
  console.log(`[LOGIN] Normalized phone: ${normalizedPhone}`)

  // Verify OTP using the existing SMS verification system
  const isValidOTP = await verifyOTP(normalizedPhone, otp)
  console.log(`[LOGIN] OTP verification result: ${isValidOTP}`)

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
    return // This line never executes, but TypeScript needs it
  }

  if (!subscriber.isActive) {
    throwError.authorization('Account is not active')
  }

  if (!subscriber.phoneVerified) {
    throwError.authorization('Phone number not verified')
  }

  // Validate required fields
  if (!subscriber.firstName || !subscriber.lastName || !subscriber.phone) {
    throwError.validation('Account profile is incomplete. Please contact support.')
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

  // Create JWT token
  const token = await createSubscriberToken({
    id: subscriber.id,
    firstName: subscriber.firstName,
    lastName: subscriber.lastName,
    phone: subscriber.phone,
    email: subscriber.email,
    isActive: subscriber.isActive,
    phoneVerified: !!subscriber.phoneVerified,
    termsAccepted: subscriber.termsAccepted
  })

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
})