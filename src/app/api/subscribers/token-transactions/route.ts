import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { requireSubscriberAuth } from '@/lib/auth/subscriber-auth'

// GET /api/subscribers/token-transactions - Get subscriber's token transaction history
export const GET = withErrorHandler(async (request: NextRequest) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id

  const { searchParams } = new URL(request.url)

  // Parse pagination and filter parameters
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50
  const type = searchParams.get('type') || undefined // Filter by transaction type

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
    subscriberId
  }

  if (type && ['PURCHASE', 'REFUND', 'DEPOSIT', 'WITHDRAWAL', 'BONUS', 'PENALTY', 'ADJUSTMENT'].includes(type)) {
    where.type = type
  }

  try {
    // Execute query
    const [transactions, total] = await Promise.all([
      prisma.tokenTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true
            }
          }
        }
      }),
      prisma.tokenTransaction.count({ where })
    ])

    // Transform transactions for response
    const transformedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      balance: transaction.balance,
      description: transaction.description,
      reference: transaction.reference,
      status: transaction.status,
      createdAt: transaction.createdAt,
      processedAt: transaction.processedAt,
      order: transaction.order ? {
        id: transaction.order.id,
        orderNumber: transaction.order.orderNumber,
        status: transaction.order.status
      } : null,
      metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null
    }))

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      transactions: transformedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        type
      }
    })
  } catch (error) {
    console.error('Error fetching token transactions:', error)
    throw error
  }
})