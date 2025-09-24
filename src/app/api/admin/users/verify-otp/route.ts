import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { verifyOTP } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdminAuth()

    const body = await request.json()
    const { pendingRegistrationId, otp } = body

    // Validate required fields
    if (!pendingRegistrationId || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields: pendingRegistrationId, otp' },
        { status: 400 }
      )
    }

    // Find the pending registration
    const pendingRegistration = await prisma.pendingAdminRegistration.findUnique({
      where: { id: pendingRegistrationId }
    })

    if (!pendingRegistration) {
      return NextResponse.json(
        { error: 'Pending registration not found' },
        { status: 404 }
      )
    }

    // Check if registration has expired
    if (new Date() > pendingRegistration.expiresAt) {
      // Clean up expired registration
      await prisma.pendingAdminRegistration.delete({
        where: { id: pendingRegistrationId }
      })

      return NextResponse.json(
        { error: 'Registration has expired. Please start a new registration.' },
        { status: 410 }
      )
    }

    // Check if OTP was sent
    if (!pendingRegistration.otpSent) {
      return NextResponse.json(
        { error: 'OTP has not been sent for this registration' },
        { status: 400 }
      )
    }

    // Check if OTP was already verified
    if (pendingRegistration.otpVerified) {
      return NextResponse.json(
        { error: 'OTP has already been verified for this registration' },
        { status: 400 }
      )
    }

    // Check OTP attempt limits (max 5 attempts)
    if (pendingRegistration.otpAttempts >= 5) {
      // Too many attempts, delete the pending registration
      await prisma.pendingAdminRegistration.delete({
        where: { id: pendingRegistrationId }
      })

      return NextResponse.json(
        { error: 'Maximum OTP verification attempts exceeded. Please start a new registration.' },
        { status: 429 }
      )
    }

    // Verify the OTP
    const isValidOTP = await verifyOTP(pendingRegistration.phone, otp)

    // Increment attempt counter
    await prisma.pendingAdminRegistration.update({
      where: { id: pendingRegistrationId },
      data: {
        otpAttempts: pendingRegistration.otpAttempts + 1
      }
    })

    if (!isValidOTP) {
      const remainingAttempts = 5 - (pendingRegistration.otpAttempts + 1)

      return NextResponse.json(
        {
          error: 'Invalid OTP code',
          remainingAttempts,
          message: remainingAttempts > 0
            ? `Invalid OTP. You have ${remainingAttempts} attempts remaining.`
            : 'Invalid OTP. No attempts remaining.'
        },
        { status: 400 }
      )
    }

    // OTP is valid, mark as verified
    const updatedPendingRegistration = await prisma.pendingAdminRegistration.update({
      where: { id: pendingRegistrationId },
      data: {
        otpVerified: true,
        otpVerifiedAt: new Date()
      }
    })

    // Log compliance event
    await prisma.complianceEvent.create({
      data: {
        userId: adminUser.id,
        eventType: 'USER_REGISTRATION',
        description: 'Admin registration OTP verified successfully',
        metadata: JSON.stringify({
          action: 'admin-registration-otp-verified',
          pendingRegistrationId,
          targetPhone: pendingRegistration.phone,
          targetEmail: pendingRegistration.email,
          attempts: pendingRegistration.otpAttempts + 1
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    })

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully. Registration can now be completed.',
      pendingRegistration: {
        id: updatedPendingRegistration.id,
        firstName: updatedPendingRegistration.firstName,
        lastName: updatedPendingRegistration.lastName,
        email: updatedPendingRegistration.email,
        phone: updatedPendingRegistration.phone,
        role: updatedPendingRegistration.role,
        otpVerified: true,
        otpVerifiedAt: updatedPendingRegistration.otpVerifiedAt,
        expiresAt: updatedPendingRegistration.expiresAt
      }
    })

  } catch (error) {
    console.error('OTP verification error:', error)

    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}

// GET endpoint to check pending registration status
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminAuth()

    const url = new URL(request.url)
    const pendingRegistrationId = url.searchParams.get('id')

    if (!pendingRegistrationId) {
      return NextResponse.json(
        { error: 'Missing pendingRegistrationId parameter' },
        { status: 400 }
      )
    }

    // Find the pending registration
    const pendingRegistration = await prisma.pendingAdminRegistration.findUnique({
      where: { id: pendingRegistrationId }
    })

    if (!pendingRegistration) {
      return NextResponse.json(
        { error: 'Pending registration not found' },
        { status: 404 }
      )
    }

    // Check if registration has expired
    if (new Date() > pendingRegistration.expiresAt) {
      // Clean up expired registration
      await prisma.pendingAdminRegistration.delete({
        where: { id: pendingRegistrationId }
      })

      return NextResponse.json(
        { error: 'Registration has expired' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      success: true,
      pendingRegistration: {
        id: pendingRegistration.id,
        firstName: pendingRegistration.firstName,
        lastName: pendingRegistration.lastName,
        email: pendingRegistration.email,
        phone: pendingRegistration.phone,
        role: pendingRegistration.role,
        otpSent: pendingRegistration.otpSent,
        otpVerified: pendingRegistration.otpVerified,
        otpAttempts: pendingRegistration.otpAttempts,
        lastOtpSentAt: pendingRegistration.lastOtpSentAt,
        otpVerifiedAt: pendingRegistration.otpVerifiedAt,
        expiresAt: pendingRegistration.expiresAt,
        createdAt: pendingRegistration.createdAt
      }
    })

  } catch (error) {
    console.error('Pending registration status error:', error)

    return NextResponse.json(
      { error: 'Failed to get registration status' },
      { status: 500 }
    )
  }
}