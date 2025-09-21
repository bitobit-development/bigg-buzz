import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { withErrorHandler, throwError } from '@/lib/error-handler'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('South Africa'),
  }).optional(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throwError.authentication()
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      address: true,
      profileImage: true,
      role: true,
      isActive: true,
      saIdVerified: true,
      phoneVerified: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      currentSubscription: {
        include: {
          plan: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          status: true,
          rating: true,
        },
      },
    },
  })

  if (!user) {
    throwError.notFound('User not found')
  }

  return NextResponse.json({ user })
})

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throwError.authentication()
  }

  const body = await request.json()
  const validatedData = updateProfileSchema.parse(body)

  // Check if email is being changed and if it's already taken
  if (validatedData.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        id: { not: session.user.id },
      },
    })

    if (existingUser) {
      throwError.conflict('Email address is already in use')
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...validatedData,
      ...(validatedData.email && { emailVerified: null }), // Reset email verification if email changed
    },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      address: true,
      profileImage: true,
      role: true,
      isActive: true,
      saIdVerified: true,
      phoneVerified: true,
      emailVerified: true,
      updatedAt: true,
    },
  })

  // Log compliance event
  await prisma.complianceEvent.create({
    data: {
      userId: session.user.id,
      eventType: 'DATA_MODIFICATION',
      description: 'User profile updated',
      metadata: {
        updatedFields: Object.keys(validatedData),
        emailChanged: !!validatedData.email,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    },
  })

  return NextResponse.json({
    message: 'Profile updated successfully',
    user: updatedUser,
  })
})