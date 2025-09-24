import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { CartItemSchema } from '@/lib/validations/cart'
import { requireSubscriberAuth } from '@/lib/auth/subscriber-auth'

// Force reload after cart validation schema fix

// GET /api/cart - Get user's cart
export const GET = withErrorHandler(async (request: NextRequest) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id

  try {
    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { subscriberId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                inStock: true,
                stockQuantity: true,
                vendor: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    })

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await prisma.cart.create({
        data: { subscriberId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  inStock: true,
                  stockQuantity: true,
                  vendor: {
                    select: { id: true, name: true }
                  }
                }
              }
            }
          }
        }
      })
    }

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) =>
      total + (item.priceAtAdd * item.quantity), 0
    )
    const tax = subtotal * 0.1 // 10% tax
    const total = subtotal + tax

    // Transform cart items for response
    const transformedItems = cart.items.map(item => ({
      ...item,
      variant: item.variant ? JSON.parse(item.variant) : null,
      product: {
        ...item.product,
        images: item.product.images ? JSON.parse(item.product.images) : []
      }
    }))

    return NextResponse.json({
      ...cart,
      items: transformedItems,
      summary: {
        itemCount: cart.items.reduce((count, item) => count + item.quantity, 0),
        subtotal,
        tax,
        total
      }
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    throw error
  }
})

// POST /api/cart - Add item to cart
export const POST = withErrorHandler(async (request: NextRequest) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id

  try {
    // Safe JSON parsing with error handling
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      )
    }

    const { productId, quantity, variant } = CartItemSchema.parse(body)

    // Validate product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, inStock: true, stockQuantity: true }
    })

    if (!product || !product.inStock || product.stockQuantity < quantity) {
      return NextResponse.json(
        { error: 'Product not available in requested quantity' },
        { status: 400 }
      )
    }

    // Use transaction for thread safety
    const result = await prisma.$transaction(async (tx) => {
      // Get or create cart
      let cart = await tx.cart.findUnique({
        where: { subscriberId }
      })

      if (!cart) {
        cart = await tx.cart.create({
          data: { subscriberId }
        })
      }

      // Check if item already exists in cart (same product and variant)
      const variantString = variant ? JSON.stringify(variant) : null
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variant: variantString
        }
      })

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity

        // Validate total quantity against stock
        if (newQuantity > product.stockQuantity) {
          throw new Error('Not enough stock available')
        }

        return tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                inStock: true,
                stockQuantity: true,
                vendor: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        })
      } else {
        // Add new item
        try {
          return await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              quantity,
              priceAtAdd: product.price,
              variant: variantString
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  inStock: true,
                  stockQuantity: true,
                  vendor: {
                    select: { id: true, name: true }
                  }
                }
              }
            }
          })
        } catch (constraintError) {
          // If we hit a unique constraint violation, it means the item was added
          // by another concurrent request. Let's fetch and update the existing item.
          const existingItem = await tx.cartItem.findFirst({
            where: {
              cartId: cart.id,
              productId,
              variant: variantString
            }
          })

          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity

            // Validate total quantity against stock
            if (newQuantity > product.stockQuantity) {
              throw new Error('Not enough stock available')
            }

            return tx.cartItem.update({
              where: { id: existingItem.id },
              data: { quantity: newQuantity },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    images: true,
                    inStock: true,
                    stockQuantity: true,
                    vendor: {
                      select: { id: true, name: true }
                    }
                  }
                }
              }
            })
          }

          // If we still can't find the item, re-throw the original error
          throw constraintError
        }
      }
    })

    // Transform response
    const transformedResult = {
      ...result,
      variant: result.variant ? JSON.parse(result.variant) : null,
      product: {
        ...result.product,
        images: result.product.images ? JSON.parse(result.product.images) : []
      }
    }

    return NextResponse.json(transformedResult)
  } catch (error) {
    console.error('Error adding item to cart:', error)
    if (error instanceof Error && error.message === 'Not enough stock available') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    throw error
  }
})

// DELETE /api/cart - Clear entire cart
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id

  try {
    // Find cart
    const cart = await prisma.cart.findUnique({
      where: { subscriberId }
    })

    if (!cart) {
      return NextResponse.json({ message: 'Cart is already empty' })
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    })

    return NextResponse.json({ message: 'Cart cleared successfully' })
  } catch (error) {
    console.error('Error clearing cart:', error)
    throw error
  }
})