import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { requireSubscriberAuth } from '@/lib/auth/subscriber-auth'

// GET /api/subscribers/dashboard-stats - Get subscriber's dashboard statistics
export const GET = withErrorHandler(async (request: NextRequest) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id

  try {
    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Execute multiple queries in parallel for better performance
    const [
      totalOrdersCount,
      deliveredOrdersCount,
      thisMonthOrdersCount,
      totalSpentResult,
      thisMonthSpentResult,
      favoriteCategory,
      memberSince,
      subscriberBalance
    ] = await Promise.all([
      // Total orders count
      prisma.order.count({
        where: { subscriberId }
      }),

      // Delivered orders count
      prisma.order.count({
        where: {
          subscriberId,
          status: 'DELIVERED'
        }
      }),

      // This month orders count
      prisma.order.count({
        where: {
          subscriberId,
          createdAt: {
            gte: startOfMonth,
            lt: startOfNextMonth
          }
        }
      }),

      // Total spent (sum of all completed orders)
      prisma.order.aggregate({
        where: {
          subscriberId,
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY']
          }
        },
        _sum: { total: true }
      }),

      // This month spent
      prisma.order.aggregate({
        where: {
          subscriberId,
          status: {
            in: ['DELIVERED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY']
          },
          createdAt: {
            gte: startOfMonth,
            lt: startOfNextMonth
          }
        },
        _sum: { total: true }
      }),

      // Favorite category (most purchased product category)
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            subscriberId,
            status: {
              in: ['DELIVERED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY']
            }
          }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 1
      }).then(async (result) => {
        if (result.length === 0 || !result[0]?.productId) return null

        const topProduct = await prisma.product.findUnique({
          where: { id: result[0].productId },
          select: { category: true }
        })

        return topProduct?.category || null
      }),

      // Member since (subscriber creation date)
      prisma.subscriber.findUnique({
        where: { id: subscriberId },
        select: { createdAt: true }
      }),

      // Subscriber token balance
      prisma.subscriber.findUnique({
        where: { id: subscriberId },
        select: { tokenBalance: true }
      })
    ])

    // Calculate average order value
    const totalSpent = totalSpentResult._sum.total || 0
    const averageOrderValue = deliveredOrdersCount > 0 ? totalSpent / deliveredOrdersCount : 0

    // Format member since date
    const memberSinceFormatted = memberSince?.createdAt
      ? new Date(memberSince.createdAt).toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'short'
        })
      : 'Unknown'

    // Format favorite category for display
    const formatCategory = (category: string | null) => {
      if (!category) return 'None yet'
      return category.toLowerCase().replace(/^\w/, c => c.toUpperCase())
    }

    const stats = {
      totalOrders: totalOrdersCount,
      deliveredOrders: deliveredOrdersCount,
      totalSpent: totalSpent,
      thisMonthSpent: thisMonthSpentResult._sum.total || 0,
      thisMonthOrders: thisMonthOrdersCount,
      averageOrderValue: averageOrderValue,
      favoriteCategory: formatCategory(favoriteCategory),
      memberSince: memberSinceFormatted,
      currentBalance: subscriberBalance?.tokenBalance || 0
    }

    return NextResponse.json({
      stats,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
})