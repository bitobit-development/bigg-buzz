import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

// Native date formatting functions to replace date-fns
function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimestamp(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const exportFormat = searchParams.get('format') || 'csv' // csv or json
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const verified = searchParams.get('verified') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeCompliance = searchParams.get('includeCompliance') === 'true'

    // Build where clause
    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Note: Subscribers don't have roles, so role filtering is removed

    if (verified === 'true') {
      whereClause.phoneVerified = { not: null }
    } else if (verified === 'false') {
      whereClause.phoneVerified = null
    }

    // Get subscribers with optional compliance events
    const users = await prisma.subscriber.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        phoneVerified: true,
        emailVerified: true,
        termsAccepted: true,
        termsAcceptedDate: true,
        privacyAccepted: true,
        privacyAcceptedDate: true,
        marketingConsent: true,
        marketingConsentDate: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        complianceEvents: includeCompliance ? {
          select: {
            eventType: true,
            description: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Last 5 compliance events per user
        } : false
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      }
    })

    const timestamp = formatTimestamp(new Date())

    if (exportFormat === 'json') {
      // Enhanced JSON export
      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          totalUsers: users.length,
          filters: {
            search,
            role,
            verified,
            sortBy,
            sortOrder
          },
          includeCompliance
        },
        users: users.map(user => ({
          ...user,
          // Format dates for better readability
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          phoneVerified: user.phoneVerified?.toISOString() || null,
          emailVerified: user.emailVerified?.toISOString() || null,
          termsAcceptedDate: user.termsAcceptedDate?.toISOString() || null,
          privacyAcceptedDate: user.privacyAcceptedDate?.toISOString() || null,
          marketingConsentDate: user.marketingConsentDate?.toISOString() || null,
          dateOfBirth: user.dateOfBirth?.toISOString() || null,
          // Add computed fields
          registrationStatus: getRegistrationStatus(user),
          daysSinceRegistration: Math.floor(
            (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        }))
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="bigg-buzz-users-export-${timestamp}.json"`
        }
      })
    }

    // Enhanced CSV export
    const headers = [
      'User ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Role',
      'Status',
      'Phone Verified',
      'Email Verified',
      'Terms Accepted',
      'Terms Date',
      'Privacy Accepted',
      'Privacy Date',
      'Marketing Consent',
      'Marketing Date',
      'Registration Status',
      'Registration Date',
      'Last Updated',
      'Date of Birth',
      'Days Since Registration',
      'Age (if DOB provided)'
    ]

    if (includeCompliance) {
      headers.push('Last Compliance Event', 'Compliance Event Date', 'Total Compliance Events')
    }

    const csvContent = [
      headers.join(','),
      ...users.map(user => {
        const age = user.dateOfBirth
          ? Math.floor((new Date().getTime() - user.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365))
          : null

        const daysSinceRegistration = Math.floor(
          (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        const registrationStatus = getRegistrationStatus(user)

        const baseFields = [
          user.id,
          user.firstName || '',
          user.lastName || '',
          user.email || '',
          user.phone || '',
          'Subscriber',
          user.isActive ? 'Active' : 'Inactive',
          user.phoneVerified ? 'Yes' : 'No',
          user.emailVerified ? 'Yes' : 'No',
          user.termsAccepted ? 'Yes' : 'No',
          user.termsAcceptedDate ? formatDateTime(user.termsAcceptedDate) : '',
          user.privacyAccepted ? 'Yes' : 'No',
          user.privacyAcceptedDate ? formatDateTime(user.privacyAcceptedDate) : '',
          user.marketingConsent ? 'Yes' : 'No',
          user.marketingConsentDate ? formatDateTime(user.marketingConsentDate) : '',
          registrationStatus,
          formatDateTime(user.createdAt),
          formatDateTime(user.updatedAt),
          user.dateOfBirth ? formatDateOnly(user.dateOfBirth) : '',
          daysSinceRegistration.toString(),
          age?.toString() || ''
        ]

        if (includeCompliance && user.complianceEvents) {
          const lastEvent = user.complianceEvents[0]
          baseFields.push(
            lastEvent ? lastEvent.description : '',
            lastEvent ? formatDateTime(lastEvent.createdAt) : '',
            user.complianceEvents.length.toString()
          )
        }

        return baseFields.map(field => `"${field}"`).join(',')
      })
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="bigg-buzz-users-export-${timestamp}.csv"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    )
  }
}

function getRegistrationStatus(user: any): string {
  if (user.phoneVerified && user.termsAccepted && user.privacyAccepted) {
    return 'Complete'
  } else if (user.phoneVerified) {
    return 'Phone Verified'
  } else if (user.termsAccepted || user.privacyAccepted) {
    return 'Partially Complete'
  } else {
    return 'Incomplete'
  }
}