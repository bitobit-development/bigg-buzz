import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y
    const granularity = searchParams.get('granularity') || 'day' // day, week, month

    const now = new Date()
    let startDate: Date
    let dateFormat: string
    let groupBy: string

    // Determine date range based on period
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Determine grouping and format based on granularity
    switch (granularity) {
      case 'day':
        dateFormat = 'DATE(createdAt)'
        groupBy = 'DATE(createdAt)'
        break
      case 'week':
        dateFormat = 'strftime("%Y-W%W", createdAt)'
        groupBy = 'strftime("%Y-W%W", createdAt)'
        break
      case 'month':
        dateFormat = 'strftime("%Y-%m", createdAt)'
        groupBy = 'strftime("%Y-%m", createdAt)'
        break
      default:
        dateFormat = 'DATE(createdAt)'
        groupBy = 'DATE(createdAt)'
    }

    // Get signup trends
    const signupTrends = await prisma.$queryRaw<Array<{ period: string; count: number }>>`
      SELECT
        ${dateFormat} as period,
        COUNT(*) as count
      FROM users
      WHERE createdAt >= ${startDate}
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `

    // Get verification trends
    const verificationTrends = await prisma.$queryRaw<Array<{ period: string; verified: number; unverified: number }>>`
      SELECT
        ${dateFormat} as period,
        SUM(CASE WHEN phoneVerified IS NOT NULL THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN phoneVerified IS NULL THEN 1 ELSE 0 END) as unverified
      FROM users
      WHERE createdAt >= ${startDate}
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `

    // Get completion trends
    const completionTrends = await prisma.$queryRaw<Array<{ period: string; completed: number; incomplete: number }>>`
      SELECT
        ${dateFormat} as period,
        SUM(CASE WHEN phoneVerified IS NOT NULL AND termsAccepted = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN phoneVerified IS NULL OR termsAccepted = 0 THEN 1 ELSE 0 END) as incomplete
      FROM users
      WHERE createdAt >= ${startDate}
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `

    // Get role distribution trends
    const roleTrends = await prisma.$queryRaw<Array<{ period: string; role: string; count: number }>>`
      SELECT
        ${dateFormat} as period,
        role,
        COUNT(*) as count
      FROM users
      WHERE createdAt >= ${startDate}
      GROUP BY ${groupBy}, role
      ORDER BY period ASC, role ASC
    `

    // Transform data for better frontend consumption
    const transformedSignups = signupTrends.map(item => ({
      period: item.period,
      count: Number(item.count)
    }))

    const transformedVerification = verificationTrends.map(item => ({
      period: item.period,
      verified: Number(item.verified),
      unverified: Number(item.unverified)
    }))

    const transformedCompletion = completionTrends.map(item => ({
      period: item.period,
      completed: Number(item.completed),
      incomplete: Number(item.incomplete)
    }))

    // Group role trends by period
    const groupedRoleTrends = roleTrends.reduce((acc, item) => {
      const period = item.period
      if (!acc[period]) {
        acc[period] = { period, roles: {} }
      }
      acc[period].roles[item.role] = Number(item.count)
      return acc
    }, {} as Record<string, { period: string; roles: Record<string, number> }>)

    const transformedRoleTrends = Object.values(groupedRoleTrends)

    // Calculate summary statistics
    const totalSignupsInPeriod = transformedSignups.reduce((sum, item) => sum + item.count, 0)
    const avgDailySignups = totalSignupsInPeriod / transformedSignups.length || 0

    const latestVerification = transformedVerification[transformedVerification.length - 1]
    const verificationRate = latestVerification
      ? (latestVerification.verified / (latestVerification.verified + latestVerification.unverified)) * 100
      : 0

    const latestCompletion = transformedCompletion[transformedCompletion.length - 1]
    const completionRate = latestCompletion
      ? (latestCompletion.completed / (latestCompletion.completed + latestCompletion.incomplete)) * 100
      : 0

    return NextResponse.json({
      signupTrends: transformedSignups,
      verificationTrends: transformedVerification,
      completionTrends: transformedCompletion,
      roleTrends: transformedRoleTrends,
      summary: {
        totalSignupsInPeriod,
        avgDailySignups: Math.round(avgDailySignups * 100) / 100,
        verificationRate: Math.round(verificationRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100
      },
      period,
      granularity,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    })

  } catch (error) {
    console.error('Signup trends error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signup trends' },
      { status: 500 }
    )
  }
}