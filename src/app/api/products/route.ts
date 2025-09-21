import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/error-handler'
import { z } from 'zod'

const productsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  category: z.string().optional(),
  search: z.string().optional(),
  vendor: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const query = productsQuerySchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    category: searchParams.get('category'),
    search: searchParams.get('search'),
    vendor: searchParams.get('vendor'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
  })

  const {
    page,
    limit,
    category,
    search,
    vendor,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  } = query

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {
    isActive: true,
    isVerified: true,
  }

  if (category) {
    where.category = category
  }

  if (vendor) {
    where.vendor = {
      businessName: {
        contains: vendor,
        mode: 'insensitive',
      },
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
        tags: {
          array_contains: search.toLowerCase(),
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

  if (sortBy === 'rating') {
    // For rating, we need to sort by vendor rating since products don't have individual ratings
    orderBy = {
      vendor: {
        rating: sortOrder,
      },
    }
  } else {
    orderBy[sortBy] = sortOrder
  }

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
            businessName: true,
            rating: true,
            address: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  // Calculate average rating for each product
  const productsWithRating = products.map(product => ({
    ...product,
    averageRating: product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : null,
    reviewCount: product.reviews.length,
    reviews: undefined, // Remove reviews from response
  }))

  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return NextResponse.json({
    products: productsWithRating,
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
      search,
      vendor,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    },
  })
})