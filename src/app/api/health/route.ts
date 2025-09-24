import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'CLICKATEL_API_KEY'
    ]

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      database: 'connected',
      missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : null
    }

    if (missingEnvVars.length > 0) {
      healthStatus.status = 'warning'
    }

    return NextResponse.json(healthStatus, {
      status: missingEnvVars.length > 0 ? 200 : 200
    })

  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })

  } finally {
    await prisma.$disconnect()
  }
}