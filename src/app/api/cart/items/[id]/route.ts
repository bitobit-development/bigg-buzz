import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { CartItemUpdateSchema } from '@/lib/validations/cart'
import { requireSubscriberAuth } from '@/lib/auth/subscriber-auth'

// PUT /api/cart/items/[id] - Update cart item quantity
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id
  const resolvedParams = await params
  const itemId = resolvedParams.id

  try {
    const body = await request.json()
    const { quantity } = CartItemUpdateSchema.parse(body)

    // Verify cart item belongs to user and get product info
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { subscriberId }
      },
      include: {
        product: {
          select: {
            id: true,
            price: true,
            inStock: true,
            stockQuantity: true
          }
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Validate stock availability
    if (!cartItem.product.inStock || cartItem.product.stockQuantity < quantity) {
      return NextResponse.json(
        { error: 'Not enough stock available' },
        { status: 400 }
      )
    }

    // Update cart item
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
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

    // Transform response
    const transformedItem = {
      ...updatedItem,
      variant: updatedItem.variant ? JSON.parse(updatedItem.variant) : null,
      product: {
        ...updatedItem.product,
        images: updatedItem.product.images ? JSON.parse(updatedItem.product.images) : []
      }
    }

    return NextResponse.json(transformedItem)
  } catch (error) {
    console.error('Error updating cart item:', error)
    throw error
  }
})

// DELETE /api/cart/items/[id] - Remove cart item
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const subscriber = await requireSubscriberAuth(request)
  const subscriberId = subscriber.id
  const resolvedParams = await params
  const itemId = resolvedParams.id

  try {
    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { subscriberId }
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Error removing cart item:', error)
    throw error
  }
})