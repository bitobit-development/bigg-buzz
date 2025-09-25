import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Import with try-catch protection
let prisma: any
let createSubscriberToken: any
let sanitizeInput: any
let verifyOTP: any
let normalizePhoneNumber: any

try {
  prisma = require('@/lib/prisma').prisma
  createSubscriberToken = require('@/lib/auth/subscriber-auth').createSubscriberToken
  sanitizeInput = require('@/lib/security').sanitizeInput
  verifyOTP = require('@/lib/sms').verifyOTP
  normalizePhoneNumber = require('@/lib/validation').normalizePhoneNumber
} catch (importError) {
  console.error('[LOGIN] Import error:', importError)
}

const LoginSchema = z.object({
  phone: z.string()
    .min(1, 'Phone number is required')
    .transform(val => sanitizeInput ? sanitizeInput(val) : val),
  otp: z.string()
    .min(4, 'OTP must be at least 4 characters')
    .max(6, 'OTP must be at most 6 characters')
    .regex(/^\d+$/, 'OTP must contain only numbers')
    .transform(val => sanitizeInput ? sanitizeInput(val) : val)
})

export async function POST(request: NextRequest) {
  try {
    console.log('[LOGIN] Starting login process')

    // Check if all dependencies are available
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 500 }
      )
    }

    if (!verifyOTP) {
      return NextResponse.json(
        { error: 'OTP verification service unavailable' },
        { status: 500 }
      )
    }

    if (!createSubscriberToken) {
      return NextResponse.json(
        { error: 'Token service unavailable' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { phone, otp } = LoginSchema.parse(body)

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber ? normalizePhoneNumber(phone) : phone
    console.log(`[LOGIN] Normalized phone: ${normalizedPhone}`)

    // Verify OTP using the existing SMS verification system
    const isValidOTP = await verifyOTP(normalizedPhone, otp)
    console.log(`[LOGIN] OTP verification result: ${isValidOTP}`)

    if (!isValidOTP) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code' },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    if (!subscriber.isActive) {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      )
    }

    if (!subscriber.phoneVerified) {
      return NextResponse.json(
        { error: 'Phone number not verified' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!subscriber.firstName || !subscriber.lastName || !subscriber.phone) {
      return NextResponse.json(
        { error: 'Account profile is incomplete. Please contact support.' },
        { status: 400 }
      )
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
  } catch (error) {
    console.error('[LOGIN] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}