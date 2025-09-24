import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminAuth()

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Get total subscriber count
    const totalUsers = await prisma.subscriber.count()

    // Get verified subscribers count
    const verifiedUsers = await prisma.subscriber.count({
      where: {
        phoneVerified: { not: null }
      }
    })

    // Get daily signups
    const dailySignups = await prisma.subscriber.count({
      where: {
        createdAt: { gte: startOfToday }
      }
    })

    // Get weekly signups
    const weeklySignups = await prisma.subscriber.count({
      where: {
        createdAt: { gte: startOfWeek }
      }
    })

    // Get monthly signups
    const monthlySignups = await prisma.subscriber.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    })

    // Get registration completion rates
    const registrationFunnel = await prisma.subscriber.groupBy({
      by: ['phoneVerified', 'termsAccepted'],
      _count: true,
      where: {
        createdAt: { gte: startOfMonth }
      }
    })

    // Get recent registrations
    const recentRegistrations = await prisma.subscriber.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        phoneVerified: true,
        termsAccepted: true,
        createdAt: true
      }
    })

    // Note: Subscribers don't have roles, so role distribution is not applicable
    const roleDistribution = []

    // Get daily signup trend for the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dailyTrend = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM subscribers
      WHERE createdAt >= ${thirtyDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `

    // Get geographic distribution based on phone number area codes (South African context)
    const geographicDistribution = await prisma.$queryRaw<Array<{ region: string; count: number }>>`
      SELECT
        CASE
          WHEN phone LIKE '+2711%' OR phone LIKE '011%' THEN 'Johannesburg'
          WHEN phone LIKE '+2721%' OR phone LIKE '021%' THEN 'Cape Town'
          WHEN phone LIKE '+2731%' OR phone LIKE '031%' THEN 'Durban'
          WHEN phone LIKE '+2712%' OR phone LIKE '012%' THEN 'Pretoria'
          WHEN phone LIKE '+2741%' OR phone LIKE '041%' THEN 'Port Elizabeth'
          WHEN phone LIKE '+2751%' OR phone LIKE '051%' THEN 'Bloemfontein'
          WHEN phone LIKE '+2743%' OR phone LIKE '043%' THEN 'East London'
          WHEN phone LIKE '+2718%' OR phone LIKE '018%' THEN 'Rustenburg'
          WHEN phone LIKE '+2713%' OR phone LIKE '013%' THEN 'Nelspruit'
          WHEN phone LIKE '+2717%' OR phone LIKE '017%' THEN 'Secunda'
          ELSE 'Other Regions'
        END as region,
        COUNT(*) as count
      FROM subscribers
      WHERE phone IS NOT NULL
      GROUP BY region
      ORDER BY count DESC
    `

    // Get user activity trends (last 7 days)
    const activityTrends = await prisma.$queryRaw<Array<{ date: string; new_users: number; verified_users: number }>>`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as new_users,
        SUM(CASE WHEN phoneVerified IS NOT NULL THEN 1 ELSE 0 END) as verified_users
      FROM subscribers
      WHERE createdAt >= ${startOfWeek}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `

    // Calculate completion rates
    const totalRegistrations = registrationFunnel.reduce((sum, item) => sum + item._count, 0)
    const phoneVerifiedCount = registrationFunnel
      .filter(item => item.phoneVerified !== null)
      .reduce((sum, item) => sum + item._count, 0)
    const completedRegistrations = registrationFunnel
      .filter(item => item.phoneVerified !== null && item.termsAccepted)
      .reduce((sum, item) => sum + item._count, 0)

    const phoneVerificationRate = totalRegistrations > 0 ? (phoneVerifiedCount / totalRegistrations) * 100 : 0
    const completionRate = totalRegistrations > 0 ? (completedRegistrations / totalRegistrations) * 100 : 0

    return NextResponse.json({
      totalUsers,
      verifiedUsers,
      dailySignups,
      weeklySignups,
      monthlySignups,
      registrationFunnel: {
        totalRegistrations,
        phoneVerifiedCount,
        completedRegistrations,
        phoneVerificationRate: Math.round(phoneVerificationRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100
      },
      recentRegistrations,
      roleDistribution: [],
      dailyTrend: dailyTrend.map(item => ({
        date: item.date,
        count: Number(item.count)
      })),
      geographicDistribution: geographicDistribution.map(item => ({
        region: item.region,
        count: Number(item.count)
      })),
      activityTrends: activityTrends.map(item => ({
        date: item.date,
        newUsers: Number(item.new_users),
        verifiedUsers: Number(item.verified_users)
      }))
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}