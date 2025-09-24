import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { ProductFilterSchema } from '@/lib/validations/product'
import { requireSubscriberAuth } from '@/lib/auth/subscriber-auth'

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Require authentication for products API
  await requireSubscriberAuth(request)

  const { searchParams } = new URL(request.url)

  // Parse and validate query parameters
  const rawFilters = {
    category: searchParams.get('category') || undefined,
    strain: searchParams.get('strain') || undefined,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    inStock: searchParams.get('inStock') === 'true' ? true : searchParams.get('inStock') === 'false' ? false : undefined,
    search: searchParams.get('search') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: searchParams.get('sortOrder') || undefined,
    vendorId: searchParams.get('vendorId') || undefined
  }

  const filters = ProductFilterSchema.parse(rawFilters)

  const {
    category,
    strain,
    minPrice,
    maxPrice,
    inStock,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
    vendorId
  } = filters

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (category) {
    where.category = category
  }

  if (strain) {
    where.strain = strain
  }

  if (vendorId) {
    where.vendorId = vendorId
  }

  if (inStock !== undefined) {
    if (inStock) {
      where.inStock = true
      where.stockQuantity = { gt: 0 }
    } else {
      where.OR = [
        { inStock: false },
        { stockQuantity: { lte: 0 } }
      ]
    }
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        sku: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ]
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) {
      where.price.gte = minPrice
    }
    if (maxPrice !== undefined) {
      where.price.lte = maxPrice
    }
  }

  // Build order by clause
  let orderBy: any = {}
  orderBy[sortBy] = sortOrder

  try {
    // Execute query
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    // Transform products for response
    const transformedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      compliance: product.compliance ? JSON.parse(product.compliance) : null,
    }))

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: {
        category,
        strain,
        minPrice,
        maxPrice,
        inStock,
        search,
        sortBy,
        sortOrder,
        vendorId
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
})