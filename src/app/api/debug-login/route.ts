import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const LoginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  otp: z.string().min(4, 'OTP must be at least 4 characters').max(6, 'OTP must be at most 6 characters').regex(/^\d+$/, 'OTP must contain only numbers')
})

export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG-LOGIN] Starting debug login process')

    const body = await request.json()
    console.log('[DEBUG-LOGIN] Received body:', body)

    // Test Zod validation
    const { phone, otp } = LoginSchema.parse(body)
    console.log('[DEBUG-LOGIN] Validation passed:', { phone, otp })

    return NextResponse.json({
      success: true,
      message: 'Debug login validation successful',
      data: { phone, otp }
    })
  } catch (error) {
    console.error('[DEBUG-LOGIN] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Debug login failed', details: String(error) },
      { status: 500 }
    )
  }
}