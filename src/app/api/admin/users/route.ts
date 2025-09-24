import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminAuth()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const verified = searchParams.get('verified') || ''
    const activeStatus = searchParams.get('activeStatus') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Note: Subscribers don't have roles, so role filtering is removed

    if (verified === 'true') {
      whereClause.phoneVerified = { not: null }
    } else if (verified === 'false') {
      whereClause.phoneVerified = null
    }

    // Filter by active status
    if (activeStatus === 'active') {
      whereClause.isActive = true
    } else if (activeStatus === 'inactive') {
      whereClause.isActive = false
    }
    // If activeStatus is 'all' or empty, don't filter by isActive (show both)

    // Get total count for pagination
    const totalUsers = await prisma.subscriber.count({ where: whereClause })

    // Get subscribers with pagination (these are the platform clients)
    const users = await prisma.subscriber.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        phoneVerified: true,
        emailVerified: true,
        termsAccepted: true,
        marketingConsent: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      },
      skip,
      take: limit
    })

    const totalPages = Math.ceil(totalUsers / limit)

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminAuth()

    const body = await request.json()
    const { userId, action, data } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    let updatedUser

    switch (action) {
      case 'toggle-active':
        updatedUser = await prisma.subscriber.update({
          where: { id: userId },
          data: { isActive: !data.isActive },
          select: {
            id: true,
            isActive: true,
            firstName: true,
            lastName: true
          }
        })
        break

      case 'update-role':
        // Subscribers don't have roles, so this action is not supported
        return NextResponse.json(
          { error: 'Role update not supported for subscribers' },
          { status: 400 }
        )

      case 'delete':
        // Soft delete by setting isActive to false
        updatedUser = await prisma.subscriber.update({
          where: { id: userId },
          data: { isActive: false },
          select: {
            id: true,
            isActive: true,
            firstName: true,
            lastName: true
          }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Log compliance event
    await prisma.complianceEvent.create({
      data: {
        subscriberId: userId,
        eventType: 'DATA_MODIFICATION',
        description: `Admin ${action} performed on subscriber`,
        metadata: JSON.stringify({
          action,
          previousData: data,
          newData: updatedUser
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}