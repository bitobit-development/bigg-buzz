import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { appLogger } from './logger'

// Error types
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public code?: string

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient privileges') {
    super(message, 403, true, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT_ERROR')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

export class ComplianceError extends AppError {
  constructor(message: string) {
    super(message, 403, true, 'COMPLIANCE_ERROR')
    this.name = 'ComplianceError'
  }
}

// Error response interface
interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  code?: string
  details?: any
  timestamp: string
  path?: string
}

// Global error handler for API routes
export function handleAPIError(
  error: any,
  request?: NextRequest,
  context?: string
): NextResponse<ErrorResponse> {
  let statusCode = 500
  let message = 'Internal server error'
  let code = 'INTERNAL_ERROR'
  let details: any = undefined

  // Log the error
  const errorId = generateErrorId()
  const logContext = {
    errorId,
    context,
    path: request?.nextUrl?.pathname,
    method: request?.method,
    userAgent: request?.headers.get('user-agent'),
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip'),
  }

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code || 'APP_ERROR'

    if (error.isOperational) {
      appLogger.warn(`Operational error: ${message}`, { ...logContext, stack: error.stack })
    } else {
      appLogger.error(`Non-operational error: ${message}`, { ...logContext, stack: error.stack })
    }
  } else if (error instanceof ZodError) {
    statusCode = 400
    message = 'Invalid input data'
    code = 'VALIDATION_ERROR'
    details = Array.isArray(error.issues) ? error.issues.map(err => ({
      field: err.path?.join('.') || 'unknown',
      message: err.message || 'Validation error',
      code: err.code || 'VALIDATION_ERROR',
    })) : []

    appLogger.warn(`Validation error: ${message}`, { ...logContext, details })
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error)
    statusCode = prismaError.statusCode
    message = prismaError.message
    code = prismaError.code

    appLogger.error(`Database error: ${message}`, {
      ...logContext,
      prismaCode: error.code,
      stack: error.stack
    })
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400
    message = 'Invalid database query'
    code = 'DATABASE_VALIDATION_ERROR'

    appLogger.error(`Database validation error: ${message}`, { ...logContext, stack: error.stack })
  } else {
    // Unknown error
    appLogger.error(`Unknown error: ${error.message || 'Unknown error'}`, {
      ...logContext,
      stack: error.stack,
      errorType: error.constructor.name,
    })

    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal server error'
    } else {
      message = error.message || 'Unknown error'
      details = error.stack
    }
  }

  const errorResponse: ErrorResponse = {
    error: code,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: request?.nextUrl?.pathname,
    ...(code && { code }),
    ...(details && { details }),
  }

  return NextResponse.json(errorResponse, { status: statusCode })
}

// Handle Prisma-specific errors
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number
  message: string
  code: string
} {
  switch (error.code) {
    case 'P2002':
      return {
        statusCode: 409,
        message: 'A record with this information already exists',
        code: 'DUPLICATE_RECORD',
      }
    case 'P2025':
      return {
        statusCode: 404,
        message: 'Record not found',
        code: 'RECORD_NOT_FOUND',
      }
    case 'P2003':
      return {
        statusCode: 400,
        message: 'Foreign key constraint failed',
        code: 'FOREIGN_KEY_CONSTRAINT',
      }
    case 'P2004':
      return {
        statusCode: 400,
        message: 'A constraint failed on the database',
        code: 'CONSTRAINT_FAILED',
      }
    default:
      return {
        statusCode: 500,
        message: 'Database error',
        code: 'DATABASE_ERROR',
      }
  }
}

// Generate unique error ID for tracking
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

// Wrapper for async API route handlers
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return handleAPIError(error, request, handler.name)
    }
  }
}

// Utility for throwing errors with consistent format
export const throwError = {
  validation: (message: string, details?: any) => {
    throw new ValidationError(message, details)
  },
  authentication: (message?: string) => {
    throw new AuthenticationError(message)
  },
  authorization: (message?: string) => {
    throw new AuthorizationError(message)
  },
  notFound: (message?: string) => {
    throw new NotFoundError(message)
  },
  conflict: (message?: string) => {
    throw new ConflictError(message)
  },
  rateLimit: (message?: string) => {
    throw new RateLimitError(message)
  },
  compliance: (message: string) => {
    throw new ComplianceError(message)
  },
  internal: (message: string) => {
    throw new AppError(message, 500, false, 'INTERNAL_ERROR')
  },
}

// Client-side error boundary component props
export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

// Error reporting utility
export async function reportError(error: Error, context?: any) {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  }

  // Log locally
  appLogger.error('Client error reported', errorReport)

  // Send to external error reporting service if configured
  if (process.env.SENTRY_DSN) {
    // Sentry reporting would go here
  }

  if (process.env.BUGSNAG_API_KEY) {
    // Bugsnag reporting would go here
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private startTime: number
  private checkpoints: { [key: string]: number } = {}

  constructor() {
    this.startTime = Date.now()
  }

  checkpoint(name: string) {
    this.checkpoints[name] = Date.now() - this.startTime
  }

  finish(operation: string, meta?: any) {
    const totalTime = Date.now() - this.startTime

    appLogger.performanceMetric(operation, totalTime, 'ms', {
      checkpoints: this.checkpoints,
      ...meta,
    })

    return totalTime
  }
}