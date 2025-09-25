import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSubscriberToken } from '@/lib/auth/subscriber-auth'
import { withErrorHandler, throwError } from '@/lib/error-handler'
import { sanitizeInput } from '@/lib/security'
import { normalizePhoneNumber } from '@/lib/validation'
import { z } from 'zod'

const SessionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  phone: z.string()
    .min(1, 'Phone number is required')
    .transform(val => sanitizeInput(val))
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { userId, phone } = SessionSchema.parse(body)

  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phone)

  // Find subscriber to ensure they exist and are active
  const subscriber = await prisma.subscriber.findUnique({
    where: {
      id: userId,
      phone: normalizedPhone
    },
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

  if (!subscriber.isActive) {
    throwError.authorization('Account is not active')
  }

  if (!subscriber.phoneVerified) {
    throwError.authorization('Phone number not verified')
  }

  // Validate required fields are not null
  if (!subscriber.firstName || !subscriber.lastName || !subscriber.phone) {
    throwError.validation('Account profile is incomplete. Please contact support.')
  }

  // Update last login time
  try {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { updatedAt: new Date() }
    })
  } catch (error) {
    console.log('Could not update last login time:', error)
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

  // Create response with user data
  const response = NextResponse.json({
    success: true,
    message: 'Session created successfully',
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