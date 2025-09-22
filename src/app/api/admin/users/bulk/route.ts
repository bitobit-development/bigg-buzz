import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminAuth()

    const body = await request.json()
    const { userIds, action, data } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const updatedUsers = []

    switch (action) {
      case 'toggle-active':
        // Toggle active status for all selected users
        for (const userId of userIds) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isActive: true }
          })

          if (user) {
            const updatedUser = await prisma.user.update({
              where: { id: userId },
              data: { isActive: !user.isActive },
              select: {
                id: true,
                isActive: true,
                firstName: true,
                lastName: true
              }
            })
            updatedUsers.push(updatedUser)

            // Log compliance event
            await prisma.complianceEvent.create({
              data: {
                userId,
                eventType: 'DATA_MODIFICATION',
                description: `Admin bulk toggle-active performed`,
                metadata: JSON.stringify({
                  action: 'bulk-toggle-active',
                  previousIsActive: user.isActive,
                  newIsActive: !user.isActive
                }),
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent')
              }
            })
          }
        }
        break

      case 'update-role':
        if (!data?.role || !['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN'].includes(data.role)) {
          return NextResponse.json(
            { error: 'Valid role is required' },
            { status: 400 }
          )
        }

        for (const userId of userIds) {
          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: data.role },
            select: {
              id: true,
              role: true,
              firstName: true,
              lastName: true
            }
          })
          updatedUsers.push(updatedUser)

          // Log compliance event
          await prisma.complianceEvent.create({
            data: {
              userId,
              eventType: 'DATA_MODIFICATION',
              description: `Admin bulk update-role performed`,
              metadata: JSON.stringify({
                action: 'bulk-update-role',
                newRole: data.role
              }),
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
              userAgent: request.headers.get('user-agent')
            }
          })
        }
        break

      case 'delete':
        for (const userId of userIds) {
          // Soft delete by setting isActive to false
          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
            select: {
              id: true,
              isActive: true,
              firstName: true,
              lastName: true
            }
          })
          updatedUsers.push(updatedUser)

          // Log compliance event
          await prisma.complianceEvent.create({
            data: {
              userId,
              eventType: 'DATA_MODIFICATION',
              description: `Admin bulk delete performed`,
              metadata: JSON.stringify({
                action: 'bulk-delete',
                deactivated: true
              }),
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
              userAgent: request.headers.get('user-agent')
            }
          })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully performed ${action} on ${updatedUsers.length} users`,
      updatedUsers,
      affectedCount: updatedUsers.length
    })

  } catch (error) {
    console.error('Bulk user update error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}