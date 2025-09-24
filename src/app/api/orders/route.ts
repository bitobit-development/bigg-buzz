import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { CreateOrderSchema, OrderFilterSchema } from '@/lib/validations/order'
import { requireSubscriberAuth } from '@/lib/auth/subscriber-auth'

// GET /api/orders - Get user's orders with filtering
export const GET = withErrorHandler(async (request: NextRequest) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id

  const { searchParams } = new URL(request.url)

  // Parse and validate query parameters
  const rawFilters = {
    status: searchParams.get('status') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    minTotal: searchParams.get('minTotal') ? parseFloat(searchParams.get('minTotal')!) : undefined,
    maxTotal: searchParams.get('maxTotal') ? parseFloat(searchParams.get('maxTotal')!) : undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: searchParams.get('sortOrder') || undefined
  }

  const filters = OrderFilterSchema.parse(rawFilters)
  const { status, startDate, endDate, minTotal, maxTotal, page, limit, sortBy, sortOrder } = filters

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
    subscriberId
  }

  if (status) {
    where.status = status
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = new Date(startDate)
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate)
    }
  }

  if (minTotal !== undefined || maxTotal !== undefined) {
    where.total = {}
    if (minTotal !== undefined) {
      where.total.gte = minTotal
    }
    if (maxTotal !== undefined) {
      where.total.lte = maxTotal
    }
  }

  // Build order by clause
  let orderBy: any = {}
  orderBy[sortBy] = sortOrder

  try {
    // Execute query
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
      }),
      prisma.order.count({ where })
    ])

    // Transform orders for response
    const transformedOrders = orders.map(order => ({
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
    }))

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        status,
        startDate,
        endDate,
        minTotal,
        maxTotal,
        sortBy,
        sortOrder
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
})

// POST /api/orders - Create order (checkout)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id

  try {
    const body = await request.json()
    const orderData = CreateOrderSchema.parse(body)

    // Get user's cart with items
    const cart = await prisma.cart.findUnique({
      where: { subscriberId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                inStock: true,
                stockQuantity: true,
                vendorId: true,
                images: true,
                category: true
              }
            }
          }
        }
      }
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Validate all items are still in stock
    for (const item of cart.items) {
      if (!item.product.inStock || item.product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Product "${item.product.name}" is not available in requested quantity` },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) =>
      total + (item.priceAtAdd * item.quantity), 0
    )
    const tax = subtotal * 0.1 // 10% tax
    const deliveryFee = orderData.deliveryMethod === 'EXPRESS' ? 50 :
                       orderData.deliveryMethod === 'STANDARD' ? 25 : 0
    const total = subtotal + tax + deliveryFee

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Check if user has enough tokens (if paying with tokens)
    if (orderData.paymentMethod === 'TOKENS') {
      const subscriber = await prisma.subscriber.findUnique({
        where: { id: subscriberId },
        select: { tokenBalance: true }
      })

      if (!subscriber || subscriber.tokenBalance < total) {
        return NextResponse.json(
          { error: 'Insufficient token balance' },
          { status: 400 }
        )
      }
    }

    // Use transaction for order creation and stock updates
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          subscriberId,
          status: 'PENDING',
          subtotal,
          tax,
          total,
          deliveryMethod: orderData.deliveryMethod,
          deliveryAddress: JSON.stringify(orderData.deliveryAddress),
          notes: orderData.notes || null
        }
      })

      // Create order items and update stock
      const orderItems = []
      for (const cartItem of cart.items) {
        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            priceAtOrder: cartItem.priceAtAdd,
            variant: cartItem.variant
          },
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
        })
        orderItems.push(orderItem)

        // Update product stock
        await tx.product.update({
          where: { id: cartItem.productId },
          data: {
            stockQuantity: {
              decrement: cartItem.quantity
            }
          }
        })
      }

      // Deduct tokens if paying with tokens
      if (orderData.paymentMethod === 'TOKENS') {
        // Update subscriber balance and get new balance
        const updatedSubscriber = await tx.subscriber.update({
          where: { id: subscriberId },
          data: {
            tokenBalance: {
              decrement: total
            }
          },
          select: { tokenBalance: true }
        })

        // Create token transaction record
        await tx.tokenTransaction.create({
          data: {
            subscriberId,
            type: 'PURCHASE',
            amount: -total,
            balance: updatedSubscriber.tokenBalance,
            description: `Order #${order.orderNumber}`,
            status: 'COMPLETED'
          }
        })
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      })

      return { order, orderItems }
    })

    // Transform response
    const transformedOrder = {
      ...result.order,
      deliveryAddress: JSON.parse(result.order.deliveryAddress),
      items: result.orderItems.map(item => ({
        ...item,
        variant: item.variant ? JSON.parse(item.variant) : null,
        product: {
          ...item.product,
          images: item.product.images ? JSON.parse(item.product.images) : []
        }
      }))
    }

    return NextResponse.json(transformedOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    if (error.message?.includes('Insufficient token balance') ||
        error.message?.includes('Cart is empty') ||
        error.message?.includes('not available')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    throw error
  }
})