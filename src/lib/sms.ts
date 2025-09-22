import { prisma } from './prisma'
import { normalizePhoneNumber } from './validation'

// In-memory OTP storage for development (use Redis in production)
// Enhanced with phone number association for proper validation
const otpStore = new Map<string, { code: string; expiresAt: Date; phone: string; userId?: string }>()

/**
 * Generate a 6-digit OTP code
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP via SMS or WhatsApp
 */
export async function sendOTP(phone: string, channel: 'sms' | 'whatsapp' = 'sms', userId?: string): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone)
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Clean up any existing OTP for this phone number first
    otpStore.delete(normalizedPhone)

    // Store OTP in memory with enhanced tracking
    otpStore.set(normalizedPhone, {
      code: otpCode,
      expiresAt,
      phone: normalizedPhone,
      userId
    })

    // Store OTP token in database for tracking if userId is provided
    // Skip database storage for test users to avoid foreign key issues
    if (userId && !userId.startsWith('test-user-')) {
      try {
        // First, clean up any existing unused OTP tokens for this user
        await prisma.userToken.deleteMany({
          where: {
            userId,
            type: 'OTP_VERIFICATION',
            isUsed: false,
          },
        })

        // Also clean up any existing OTP tokens for this phone number
        const existingUser = await prisma.user.findUnique({
          where: { phone: normalizedPhone }
        })

        if (existingUser) {
          await prisma.userToken.deleteMany({
            where: {
              userId: existingUser.id,
              type: 'OTP_VERIFICATION',
              isUsed: false,
            },
          })
        }

        // Create new OTP token with additional metadata
        await prisma.userToken.create({
          data: {
            userId,
            type: 'OTP_VERIFICATION',
            token: `${normalizedPhone}:${otpCode}`, // Include phone for validation
            expiresAt,
            isUsed: false,
          },
        })
      } catch (error) {
        console.warn('Failed to store OTP in database:', error)
        // Continue anyway as in-memory storage is the primary method
      }
    }

    // Send OTP via Clickatel (Primary SA SMS provider)
    if (process.env.CLICKATEL_API_KEY || process.env.NODE_ENV === 'development') {
      if (channel === 'whatsapp') {
        await sendClickatelWhatsApp(normalizedPhone, otpCode)
      } else {
        await sendClickatelSMS(normalizedPhone, otpCode)
      }
    } else if (process.env.TWILIO_ACCOUNT_SID) {
      // Fallback to Twilio (SMS only)
      await sendTwilioSMS(normalizedPhone, otpCode)
    } else {
      // Development mode - log OTP
      console.log(`[DEV] OTP for ${normalizedPhone} via ${channel}: ${otpCode}`)
    }

    return true
  } catch (error) {
    console.error('Failed to send OTP:', error)
    return false
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log(`[OTP] Verifying OTP for ${normalizedPhone}: ${code}`)

    // First check in-memory store (primary verification method)
    const stored = otpStore.get(normalizedPhone)
    let isValidFromMemory = false

    if (stored) {
      const { code: storedCode, expiresAt, phone: storedPhone } = stored
      console.log(`[OTP] Found in memory - Phone: ${storedPhone}, Code: ${storedCode}, Expires: ${expiresAt}`)

      // Verify phone matches and code matches and not expired
      if (storedPhone === normalizedPhone && new Date() <= expiresAt && code === storedCode) {
        isValidFromMemory = true
        console.log(`[OTP] Memory verification successful`)
        // Remove from memory store immediately to prevent reuse
        otpStore.delete(normalizedPhone)
      } else if (new Date() > expiresAt) {
        console.log(`[OTP] Code expired, cleaning up`)
        // Clean up expired OTP
        otpStore.delete(normalizedPhone)
      } else {
        console.log(`[OTP] Memory verification failed - phone match: ${storedPhone === normalizedPhone}, code match: ${code === storedCode}, not expired: ${new Date() <= expiresAt}`)
      }
    } else {
      console.log(`[OTP] No OTP found in memory for ${normalizedPhone}`)
    }

    // Also check database for additional validation (fallback)
    let isValidFromDatabase = false
    try {
      // Look for token with phone:code format
      const expectedToken = `${normalizedPhone}:${code}`
      const dbToken = await prisma.userToken.findFirst({
        where: {
          token: expectedToken,
          type: 'OTP_VERIFICATION',
          isUsed: false,
          expiresAt: {
            gt: new Date(), // Not expired
          },
        },
        include: {
          user: {
            select: {
              phone: true
            }
          }
        }
      })

      if (dbToken && dbToken.user?.phone === normalizedPhone) {
        isValidFromDatabase = true
        console.log(`[OTP] Database verification successful`)
        // Mark as used immediately to prevent reuse
        await prisma.userToken.update({
          where: { id: dbToken.id },
          data: { isUsed: true },
        })
      } else if (dbToken) {
        console.log(`[OTP] Database token found but phone mismatch: ${dbToken.user?.phone} vs ${normalizedPhone}`)
      } else {
        console.log(`[OTP] No valid database token found for ${expectedToken}`)
      }
    } catch (error) {
      console.warn('Database OTP verification failed:', error)
      // Don't fail the entire verification if database check fails
    }

    // OTP is valid if either in-memory or database verification succeeded
    const isValid = isValidFromMemory || isValidFromDatabase

    if (!isValid) {
      console.log(`[OTP] Verification failed for ${normalizedPhone}. Code: ${code}. Memory: ${isValidFromMemory}, DB: ${isValidFromDatabase}`)
      // Log current in-memory store for debugging
      console.log(`[OTP] Current in-memory store:`, Array.from(otpStore.entries()))
    } else {
      console.log(`[OTP] Verification successful for ${normalizedPhone}`)
    }

    return isValid
  } catch (error) {
    console.error('Failed to verify OTP:', error)
    return false
  }
}

/**
 * Send SMS via Clickatel (South African SMS provider) with retry logic
 */
async function sendClickatelSMS(phone: string, otp: string, retries = 3): Promise<void> {
  const apiKey = process.env.CLICKATEL_API_KEY || 'oM4fRQK2Q0qEETwY0pl2Tw=='
  const apiId = process.env.CLICKATEL_API_ID || 'd054ccf83dbc4f6a98d66588a4708225'

  if (!apiKey) {
    throw new Error('Clickatel API key not configured')
  }

  const message = `Your Bigg Buzz verification code is: ${otp}. Valid for 10 minutes.`

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://platform.clickatell.com/v1/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              channel: 'sms',
              to: phone,
              content: message,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData;
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }

        // Check for specific error types that shouldn't be retried
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Clickatel authentication error: ${errorData.error || errorText}`)
        }

        if (response.status === 400) {
          throw new Error(`Clickatel request error: ${errorData.error || errorText}`)
        }

        // For server errors, retry if attempts remain
        if (attempt === retries) {
          throw new Error(`Clickatel API error after ${retries} attempts: ${errorData.error || errorText}`)
        }

        console.warn(`Clickatel SMS attempt ${attempt} failed, retrying...`, errorData)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        continue
      }

      const result = await response.json()
      console.log('SMS sent via Clickatel:', result)

      // Check if the message was accepted
      if (result.messages && result.messages[0] && result.messages[0].accepted === false) {
        throw new Error(`Clickatel message rejected: ${result.messages[0].error || 'Unknown error'}`)
      }

      return // Success
    } catch (error) {
      if (attempt === retries) {
        console.error('Clickatel SMS error (final attempt):', error)
        throw error
      }
      console.warn(`Clickatel SMS attempt ${attempt} failed:`, error)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
    }
  }
}

/**
 * Send WhatsApp message via Clickatel with retry logic
 */
async function sendClickatelWhatsApp(phone: string, otp: string, retries = 3): Promise<void> {
  const apiKey = process.env.CLICKATEL_API_KEY || 'oM4fRQK2Q0qEETwY0pl2Tw=='
  const apiId = process.env.CLICKATEL_API_ID || 'd054ccf83dbc4f6a98d66588a4708225'

  if (!apiKey) {
    throw new Error('Clickatel API key not configured')
  }

  const message = `Your Bigg Buzz verification code is: ${otp}. Valid for 10 minutes.`

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://platform.clickatell.com/v1/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              channel: 'whatsapp',
              to: phone,
              content: message,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData;
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }

        // Check for specific error types that shouldn't be retried
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Clickatel WhatsApp authentication error: ${errorData.error || errorText}`)
        }

        if (response.status === 400) {
          throw new Error(`Clickatel WhatsApp request error: ${errorData.error || errorText}`)
        }

        // For server errors, retry if attempts remain
        if (attempt === retries) {
          throw new Error(`Clickatel WhatsApp API error after ${retries} attempts: ${errorData.error || errorText}`)
        }

        console.warn(`Clickatel WhatsApp attempt ${attempt} failed, retrying...`, errorData)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        continue
      }

      const result = await response.json()
      console.log('WhatsApp sent via Clickatel:', result)

      // Check if the message was accepted
      if (result.messages && result.messages[0] && result.messages[0].accepted === false) {
        throw new Error(`Clickatel WhatsApp message rejected: ${result.messages[0].error || 'Unknown error'}`)
      }

      return // Success
    } catch (error) {
      if (attempt === retries) {
        console.error('Clickatel WhatsApp error (final attempt):', error)
        throw error
      }
      console.warn(`Clickatel WhatsApp attempt ${attempt} failed:`, error)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
    }
  }
}

/**
 * Send SMS via Twilio (Backup provider)
 */
async function sendTwilioSMS(phone: string, otp: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured')
  }

  const message = `Your Bigg Buzz verification code is: ${otp}. This code expires in 5 minutes.`

  try {
    // Create Twilio client (simplified version - in production use Twilio SDK)
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: phone,
          From: fromNumber || '',
          Body: message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Twilio API error: ${error}`)
    }

    const result = await response.json()
    console.log('SMS sent via Twilio:', result)
  } catch (error) {
    console.error('Twilio SMS error:', error)
    throw error
  }
}

/**
 * Send email verification (using Resend)
 */
export async function sendEmailVerification(
  email: string,
  verificationUrl: string
): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.FROM_EMAIL

    if (!apiKey) {
      console.log('[DEV] Email verification URL:', verificationUrl)
      return true
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: 'Verify your Bigg Buzz account',
        html: `
          <h2>Welcome to Bigg Buzz!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        `,
      }),
    })

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Failed to send email verification:', error)
    return false
  }
}

/**
 * Clean up expired OTPs (should be run periodically)
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  const now = new Date()
  let memoryCleanedCount = 0
  let dbCleanedCount = 0

  // Clean up in-memory storage
  for (const [phone, { expiresAt }] of otpStore.entries()) {
    if (now > expiresAt) {
      otpStore.delete(phone)
      memoryCleanedCount++
    }
  }

  // Clean up database storage
  try {
    const result = await prisma.userToken.deleteMany({
      where: {
        type: 'OTP_VERIFICATION',
        expiresAt: {
          lt: now, // Less than current time (expired)
        },
      },
    })
    dbCleanedCount = result.count
  } catch (error) {
    console.warn('Failed to cleanup expired OTPs from database:', error)
  }

  if (memoryCleanedCount > 0 || dbCleanedCount > 0) {
    console.log(`[OTP] Cleaned up ${memoryCleanedCount} expired OTPs from memory and ${dbCleanedCount} from database`)
  }
}

// Development helper to get current OTP for testing
export function getOTPForTesting(phone: string): string | null {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const normalizedPhone = normalizePhoneNumber(phone)
  const stored = otpStore.get(normalizedPhone)

  // Also check if it's not expired
  if (stored && new Date() <= stored.expiresAt) {
    return stored.code
  }

  // Clean up expired entry
  if (stored && new Date() > stored.expiresAt) {
    otpStore.delete(normalizedPhone)
  }

  return null
}

// Development helper to get current OTP store state
export function getOTPStoreForTesting(): Map<string, { code: string; expiresAt: Date; phone: string; userId?: string }> | null {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  return otpStore
}