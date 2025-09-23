import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { requireSubscriberAuth } from '@/lib/auth/subscriber-auth'

// GET /api/subscribers/profile - Get subscriber profile and token balance
export const GET = withErrorHandler(async (request: NextRequest) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id

  try {
    // Get subscriber details with token balance
    const subscriberData = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        tokenBalance: true,
        isActive: true,
        phoneVerified: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!subscriberData) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      subscriber: subscriberData
    })
  } catch (error) {
    console.error('Error fetching subscriber profile:', error)
    throw error
  }
})