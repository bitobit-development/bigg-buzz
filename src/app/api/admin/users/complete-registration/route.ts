import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { parseSAID } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdminAuth()

    const body = await request.json()
    const { pendingRegistrationId } = body

    // Validate required fields
    if (!pendingRegistrationId) {
      return NextResponse.json(
        { error: 'Missing required field: pendingRegistrationId' },
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

    // Check if OTP was verified
    if (!pendingRegistration.otpVerified) {
      return NextResponse.json(
        { error: 'OTP must be verified before completing registration' },
        { status: 400 }
      )
    }

    // Parse SA ID to get date of birth
    const saIdInfo = parseSAID(pendingRegistration.saId)

    // Double-check that user doesn't already exist (race condition protection)
    const existingUser = await Promise.all([
      prisma.user.findUnique({ where: { email: pendingRegistration.email } }),
      prisma.user.findUnique({ where: { phone: pendingRegistration.phone } }),
      prisma.user.findUnique({ where: { saId: pendingRegistration.saId } })
    ])

    const [existingByEmail, existingByPhone, existingBySaId] = existingUser

    if (existingByEmail) {
      // Clean up pending registration
      await prisma.pendingAdminRegistration.delete({
        where: { id: pendingRegistrationId }
      })

      return NextResponse.json(
        { error: 'A user with this email address already exists' },
        { status: 409 }
      )
    }

    if (existingByPhone) {
      // Clean up pending registration
      await prisma.pendingAdminRegistration.delete({
        where: { id: pendingRegistrationId }
      })

      return NextResponse.json(
        { error: 'A user with this phone number already exists' },
        { status: 409 }
      )
    }

    if (existingBySaId) {
      // Clean up pending registration
      await prisma.pendingAdminRegistration.delete({
        where: { id: pendingRegistrationId }
      })

      return NextResponse.json(
        { error: 'A user with this SA ID already exists' },
        { status: 409 }
      )
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        firstName: pendingRegistration.firstName,
        lastName: pendingRegistration.lastName,
        email: pendingRegistration.email,
        phone: pendingRegistration.phone,
        saId: pendingRegistration.saId,
        dateOfBirth: saIdInfo.dateOfBirth,
        role: pendingRegistration.role,
        isActive: pendingRegistration.isActive,
        termsAccepted: pendingRegistration.termsAccepted,
        marketingConsent: pendingRegistration.marketingConsent,
        // Set verification timestamps since admin created and phone was verified
        phoneVerified: new Date(),
        emailVerified: null, // Email not verified yet
        termsAcceptedDate: pendingRegistration.termsAccepted ? new Date() : null,
        marketingConsentDate: pendingRegistration.marketingConsent ? new Date() : null,
        privacyAccepted: true, // Assume privacy accepted for admin-created users
        privacyAcceptedDate: new Date()
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
        dateOfBirth: true,
        createdAt: true
      }
    })

    // Log compliance events
    await Promise.all([
      // Log successful user creation
      prisma.complianceEvent.create({
        data: {
          userId: newUser.id,
          eventType: 'USER_REGISTRATION',
          description: 'Admin completed user registration after OTP verification',
          metadata: JSON.stringify({
            action: 'admin-complete-registration',
            pendingRegistrationId,
            adminUserId: adminUser.id,
            saIdInfo: {
              age: saIdInfo.age,
              gender: saIdInfo.gender,
              isSACitizen: saIdInfo.isSACitizen
            }
          }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        }
      }),

      // Log age and ID verification
      prisma.complianceEvent.create({
        data: {
          userId: newUser.id,
          eventType: 'AGE_VERIFICATION',
          description: 'Age verified through SA ID during admin registration',
          metadata: JSON.stringify({
            age: saIdInfo.age,
            isValidAge: saIdInfo.isValidAge,
            verificationMethod: 'sa_id_parsing'
          }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        }
      }),

      prisma.complianceEvent.create({
        data: {
          userId: newUser.id,
          eventType: 'ID_VERIFICATION',
          description: 'SA ID verified during admin registration',
          metadata: JSON.stringify({
            saIdVerified: true,
            isSACitizen: saIdInfo.isSACitizen,
            verificationMethod: 'luhn_algorithm'
          }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        }
      })
    ])

    // Clean up the pending registration
    await prisma.pendingAdminRegistration.delete({
      where: { id: pendingRegistrationId }
    })

    return NextResponse.json({
      success: true,
      message: 'User registration completed successfully',
      user: {
        ...newUser,
        age: saIdInfo.age,
        gender: saIdInfo.gender,
        isSACitizen: saIdInfo.isSACitizen
      }
    })

  } catch (error) {
    console.error('Complete registration error:', error)

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
      { error: 'Failed to complete registration' },
      { status: 500 }
    )
  }
}

// GET endpoint to get all pending registrations for admin dashboard
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminAuth()

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get pending registrations that haven't expired
    const [pendingRegistrations, totalCount] = await Promise.all([
      prisma.pendingAdminRegistration.findMany({
        where: {
          expiresAt: {
            gt: new Date() // Not expired
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.pendingAdminRegistration.count({
        where: {
          expiresAt: {
            gt: new Date() // Not expired
          }
        }
      })
    ])

    // Clean up expired registrations (cleanup task)
    await prisma.pendingAdminRegistration.deleteMany({
      where: {
        expiresAt: {
          lt: new Date() // Expired
        }
      }
    })

    // Add calculated age from SA ID for each registration
    const registrationsWithAge = pendingRegistrations.map(registration => {
      try {
        const saIdInfo = parseSAID(registration.saId)
        return {
          ...registration,
          age: saIdInfo.age,
          gender: saIdInfo.gender,
          isSACitizen: saIdInfo.isSACitizen
        }
      } catch (error) {
        console.warn(`Failed to parse SA ID for registration ${registration.id}:`, error)
        return {
          ...registration,
          age: null,
          gender: null,
          isSACitizen: null
        }
      }
    })

    return NextResponse.json({
      success: true,
      pendingRegistrations: registrationsWithAge,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error('Get pending registrations error:', error)

    return NextResponse.json(
      { error: 'Failed to get pending registrations' },
      { status: 500 }
    )
  }
}