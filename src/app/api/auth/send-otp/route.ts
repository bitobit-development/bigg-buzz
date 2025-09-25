import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Import with try-catch protection
let prisma: any
let normalizePhoneNumber: any
let rateLimit: any

try {
  prisma = require('@/lib/prisma').prisma
  normalizePhoneNumber = require('@/lib/validation').normalizePhoneNumber
  rateLimit = require('@/lib/rate-limit').rateLimit
} catch (importError) {
  console.error('[SEND-OTP] Import error:', importError)
}

// Direct phone validation
const phoneSchema = z.string()
  .min(10, 'Phone number too short')
  .max(15, 'Phone number too long')

// Direct phone normalization
function normalizePhoneDirect(phone: string): string {
  if (!phone) return ''
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  if (cleanPhone.startsWith('0')) {
    return '+27' + cleanPhone.substring(1)
  } else if (cleanPhone.startsWith('27')) {
    return '+' + cleanPhone
  } else if (cleanPhone.startsWith('+27')) {
    return cleanPhone
  }
  return phone
}

// Generate OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Direct SMS sending via Clickatel
async function sendSMSDirect(phone: string, otp: string): Promise<boolean> {
  try {
    const apiKey = process.env.CLICKATEL_API_KEY || 'oM4fRQK2Q0qEETwY0pl2Tw=='
    const message = `Your Bigg Buzz verification code is: ${otp}. Valid for 10 minutes.`

    const response = await fetch('https://platform.clickatell.com/v1/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          channel: 'sms',
          to: phone,
          content: message,
        }],
      }),
    })

    if (!response.ok) {
      console.error('SMS API error:', response.status, await response.text())
      return false
    }

    const result = await response.json()
    console.log('SMS sent successfully:', result)
    return true
  } catch (error) {
    console.error('SMS sending error:', error)
    return false
  }
}

// Direct cleanup of expired OTPs
async function cleanupExpiredOTPsDirect(): Promise<void> {
  try {
    if (!prisma) return

    const now = new Date()
    await prisma.subscriberToken.deleteMany({
      where: {
        type: 'OTP_VERIFICATION',
        expiresAt: { lt: now },
      },
    })
    await prisma.userToken.deleteMany({
      where: {
        type: 'OTP_VERIFICATION',
        expiresAt: { lt: now },
      },
    })
  } catch (error) {
    console.warn('Cleanup failed:', error)
  }
}

// Note: Using Node.js runtime for Prisma compatibility

export async function POST(request: NextRequest) {
  try {
    console.log('[SEND-OTP] Starting OTP send process')

    // Check dependencies
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 500 }
      )
    }

    // Clean up expired OTPs first
    await cleanupExpiredOTPsDirect()

    // Apply rate limiting if available
    if (rateLimit) {
      const rateLimitResult = await rateLimit(request, 'send-otp', 5, 900000)
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      }
    }

    const body = await request.json()
    const { phone, channel = 'sms' } = body

    // Validate phone number
    const validatedPhone = phoneSchema.parse(phone)
    const normalizedPhone = normalizePhoneNumber ? normalizePhoneNumber(validatedPhone) : normalizePhoneDirect(validatedPhone)

    console.log(`[SEND-OTP] Original phone: ${phone}`)
    console.log(`[SEND-OTP] Normalized phone: ${normalizedPhone}`)

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
    } else {
      // For test users, try to find existing test subscriber or create a virtual one
      console.log(`[SMS] Processing test user: ${normalizedPhone}`)
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

    // Generate and send OTP directly
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    console.log(`[SEND-OTP] Generated OTP: ${otpCode} for phone: ${normalizedPhone}`)

    // Store OTP in database
    if (subscriber) {
      // Clean up any existing unused OTP tokens for this subscriber
      await prisma.subscriberToken.deleteMany({
        where: {
          subscriberId: subscriber.id,
          type: 'OTP_VERIFICATION',
          isUsed: false,
        },
      })

      // Create new OTP token
      await prisma.subscriberToken.create({
        data: {
          subscriberId: subscriber.id,
          type: 'OTP_VERIFICATION',
          token: `${normalizedPhone}:${otpCode}`,
          expiresAt,
          isUsed: false,
        },
      })

      console.log(`[SEND-OTP] Stored OTP token: ${normalizedPhone}:${otpCode}`)

      if (isTestUser) {
        console.log(`[SEND-OTP] Test user detected - token still stored for: ${normalizedPhone}`)
      }
    } else if (isTestUser) {
      console.log(`[SEND-OTP] Test user without subscriber record - SMS sent but no token stored`)
    }

    // Send SMS
    const smsSent = await sendSMSDirect(normalizedPhone, otpCode)

    if (!smsSent) {
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