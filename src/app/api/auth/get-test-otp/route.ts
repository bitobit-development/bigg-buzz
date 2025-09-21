import { NextRequest, NextResponse } from 'next/server'
import { getOTPForTesting } from '@/lib/sms'
import { normalizePhoneNumber } from '@/lib/validation'

// Note: Using Node.js runtime for consistency

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json(
      { error: 'Phone number is required' },
      { status: 400 }
    )
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phone)
    const otp = getOTPForTesting(normalizedPhone)

    if (!otp) {
      return NextResponse.json(
        { error: 'No OTP found for this phone number' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      phone: normalizedPhone,
      otp,
    })
  } catch (error) {
    console.error('Get test OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}