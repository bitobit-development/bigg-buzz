import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminAuth()

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      saId,
      dateOfBirth,
      role = 'CUSTOMER',
      isActive = true,
      termsAccepted = true,
      marketingConsent = false
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !saId || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, phone, saId, dateOfBirth' },
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

    // Validate SA ID format (13 digits)
    const saIdRegex = /^[0-9]{13}$/
    if (!saIdRegex.test(saId)) {
      return NextResponse.json(
        { error: 'SA ID must be 13 digits' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
        { status: 400 }
      )
    }

    // Validate age (must be 18 or older)
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Subtract a year if birthday hasn't occurred this year
    }

    if (age < 18) {
      return NextResponse.json(
        { error: 'User must be 18 years or older' },
        { status: 400 }
      )
    }

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

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        saId: saId.trim(),
        dateOfBirth: new Date(dateOfBirth),
        role,
        isActive,
        termsAccepted,
        marketingConsent,
        // Set verification timestamps if created by admin
        phoneVerified: isActive ? new Date() : null,
        emailVerified: isActive ? new Date() : null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        phoneVerified: true,
        emailVerified: true,
        termsAccepted: true,
        marketingConsent: true,
        createdAt: true
      }
    })

    // Log compliance event for admin user creation
    await prisma.complianceEvent.create({
      data: {
        userId: newUser.id,
        eventType: 'DATA_MODIFICATION',
        description: 'Admin created new user account',
        metadata: JSON.stringify({
          action: 'admin-create-user',
          createdFields: {
            firstName,
            lastName,
            email,
            phone,
            role,
            isActive,
            termsAccepted,
            marketingConsent
          }
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    })

  } catch (error) {
    console.error('User creation error:', error)

    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        const target = (error as any).meta?.target
        if (target?.includes('email')) {
          return NextResponse.json(
            { error: 'A user with this email address already exists' },
            { status: 409 }
          )
        }
        if (target?.includes('phone')) {
          return NextResponse.json(
            { error: 'A user with this phone number already exists' },
            { status: 409 }
          )
        }
        if (target?.includes('saId')) {
          return NextResponse.json(
            { error: 'A user with this SA ID already exists' },
            { status: 409 }
          )
        }
      }
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}