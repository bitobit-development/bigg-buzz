import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {
        database: { status: 'unknown', details: null },
        clickatel: { status: 'unknown', details: null },
        envVars: {
          CLICKATEL_API_KEY: process.env.CLICKATEL_API_KEY ? 'Set' : 'Not set',
          DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
          POSTGRES_URL: process.env.POSTGRES_URL ? 'Set' : 'Not set',
        }
      }
    }

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      results.checks.database.status = 'connected'
      results.checks.database.details = 'Database connection successful'
    } catch (error) {
      results.checks.database.status = 'failed'
      results.checks.database.details = error instanceof Error ? error.message : String(error)
    }

    // Test Clickatel API (without actually sending SMS)
    try {
      const apiKey = process.env.CLICKATEL_API_KEY
      if (!apiKey) {
        results.checks.clickatel.status = 'missing_key'
        results.checks.clickatel.details = 'CLICKATEL_API_KEY not set'
      } else {
        // Test API connectivity (GET to check endpoint)
        const response = await fetch('https://platform.clickatell.com/v1/coverage', {
          method: 'GET',
          headers: {
            'Authorization': apiKey,
            'Accept': 'application/json',
          },
        })

        if (response.ok) {
          results.checks.clickatel.status = 'connected'
          results.checks.clickatel.details = 'Clickatel API accessible'
        } else {
          results.checks.clickatel.status = 'auth_failed'
          results.checks.clickatel.details = `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      results.checks.clickatel.status = 'failed'
      results.checks.clickatel.details = error instanceof Error ? error.message : String(error)
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostic test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}