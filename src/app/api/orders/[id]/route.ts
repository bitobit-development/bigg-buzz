import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { UpdateOrderSchema } from '@/lib/validations/order'
import { requireSubscriberAuth } from '@/lib/auth/subscriber-auth'

// GET /api/orders/[id] - Get specific order
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id
  const { id: orderId } = await params

  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        subscriberId // Ensure user can only access their own orders
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                category: true,
                strain: true,
                thcContent: true,
                cbdContent: true,
                vendor: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        tokenTransactions: {
          select: {
            id: true,
            amount: true,
            type: true,
            createdAt: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Transform response
    const transformedOrder = {
      ...order,
      deliveryAddress: order.deliveryAddress ? JSON.parse(order.deliveryAddress) : null,
      items: order.items.map(item => ({
        ...item,
        variant: item.variant ? JSON.parse(item.variant) : null,
        product: {
          ...item.product,
          images: item.product.images ? JSON.parse(item.product.images) : []
        }
      }))
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
})

// PUT /api/orders/[id] - Update order status (admin only)
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // TODO: Replace with actual admin authentication
  // For now, this endpoint is available for testing
  const { id: orderId } = await params

  try {
    const body = await request.json()
    const updateData = UpdateOrderSchema.parse(body)

    // Verify order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                category: true,
                vendor: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    })

    // Transform response
    const transformedOrder = {
      ...updatedOrder,
      deliveryAddress: updatedOrder.deliveryAddress ? JSON.parse(updatedOrder.deliveryAddress) : null,
      items: updatedOrder.items.map(item => ({
        ...item,
        variant: item.variant ? JSON.parse(item.variant) : null,
        product: {
          ...item.product,
          images: item.product.images ? JSON.parse(item.product.images) : []
        }
      }))
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
})

// DELETE /api/orders/[id] - Cancel order (only if status is PENDING)
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id
  const { id: orderId } = await params

  try {
    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        subscriberId
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, stockQuantity: true }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending orders can be cancelled' },
        { status: 400 }
      )
    }

    // Use transaction to cancel order and restore stock
    await prisma.$transaction(async (tx) => {
      // Update order status to cancelled
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      })

      // Restore stock for all items
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity
            }
          }
        })
      }

      // For now, always refund tokens since we only support token payments
      // TODO: Add paymentMethod field to Order model and check it here
      // if (order.paymentMethod === 'TOKENS') {
        const updatedSubscriber = await tx.subscriber.update({
          where: { id: subscriberId },
          data: {
            tokenBalance: {
              increment: order.total
            }
          },
          select: { tokenBalance: true }
        })

        // Create refund transaction record
        await tx.tokenTransaction.create({
          data: {
            subscriberId,
            type: 'REFUND',
            amount: order.total,
            balance: updatedSubscriber.tokenBalance,
            description: `Refund for cancelled order #${order.orderNumber}`,
            status: 'COMPLETED'
          }
        })
      // }
    })

    return NextResponse.json({ message: 'Order cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling order:', error)
    throw error
  }
})