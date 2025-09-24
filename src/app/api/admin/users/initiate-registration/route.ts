import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { sendOTP } from '@/lib/sms'
import { validateSAID, parseSAID } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdminAuth()

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      saId,
      role = 'CUSTOMER',
      isActive = true,
      termsAccepted = true,
      marketingConsent = false
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !saId) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, phone, saId' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone format (South African)
    const phoneRegex = /^\+27[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Phone number must be in format +27xxxxxxxxx' },
        { status: 400 }
      )
    }

    // Validate SA ID format and extract age
    if (!validateSAID(saId)) {
      return NextResponse.json(
        { error: 'Invalid SA ID number' },
        { status: 400 }
      )
    }

    // Parse SA ID to get age and validate minimum age
    const saIdInfo = parseSAID(saId)
    if (!saIdInfo.isValidAge) {
      return NextResponse.json(
        { error: 'User must be 18 years or older' },
        { status: 400 }
      )
    }

    // Validate role and ensure it's a valid UserRole enum value
    const validRoles = ['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN'] as const
    if (!validRoles.includes(role as any)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
        { status: 400 }
      )
    }

    // Ensure role is properly typed for Prisma
    const userRole = role as 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN'

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists' },
        { status: 409 }
      )
    }

    // Check if user already exists with this phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: 'A user with this phone number already exists' },
        { status: 409 }
      )
    }

    // Check if user already exists with this SA ID
    const existingSaId = await prisma.user.findUnique({
      where: { saId }
    })

    if (existingSaId) {
      return NextResponse.json(
        { error: 'A user with this SA ID already exists' },
        { status: 409 }
      )
    }

    // Check if there's already a pending registration for this phone/email/saId
    const existingPending = await prisma.pendingAdminRegistration.findFirst({
      where: {
        OR: [
          { phone },
          { email: email.toLowerCase() },
          { saId }
        ],
        expiresAt: {
          gt: new Date() // Not expired
        }
      }
    })

    if (existingPending) {
      return NextResponse.json(
        { error: 'A pending registration already exists for this user. Please wait for it to expire or complete the verification.' },
        { status: 409 }
      )
    }

    // Create pending registration (expires in 30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    const pendingRegistration = await prisma.pendingAdminRegistration.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        saId: saId.trim(),
        role: userRole,
        isActive,
        termsAccepted,
        marketingConsent,
        adminUserId: adminUser.id,
        expiresAt
      }
    })

    // Send OTP to the phone number
    const otpSent = await sendOTP(phone, 'sms', pendingRegistration.id, false)

    if (!otpSent) {
      // If OTP sending fails, delete the pending registration
      await prisma.pendingAdminRegistration.delete({
        where: { id: pendingRegistration.id }
      })

      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      )
    }

    // Update pending registration to mark OTP as sent
    await prisma.pendingAdminRegistration.update({
      where: { id: pendingRegistration.id },
      data: {
        otpSent: true,
        lastOtpSentAt: new Date()
      }
    })

    // Log compliance event
    await prisma.complianceEvent.create({
      data: {
        userId: adminUser.id,
        eventType: 'USER_REGISTRATION',
        description: 'Admin initiated user registration with OTP verification',
        metadata: JSON.stringify({
          action: 'admin-initiate-registration',
          pendingRegistrationId: pendingRegistration.id,
          targetPhone: phone,
          targetEmail: email
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Registration initiated. OTP has been sent to the phone number.',
      pendingRegistration: {
        id: pendingRegistration.id,
        firstName,
        lastName,
        email,
        phone,
        age: saIdInfo.age,
        gender: saIdInfo.gender,
        role: userRole,
        expiresAt: pendingRegistration.expiresAt,
        otpSent: true
      }
    })

  } catch (error) {
    console.error('Admin registration initiation error:', error)

    return NextResponse.json(
      { error: 'Failed to initiate registration' },
      { status: 500 }
    )
  }
}