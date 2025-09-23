import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Create response
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  })

  // Clear the subscriber token cookie
  response.cookies.set('subscriber-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Expire immediately
    path: '/' // Clear from all paths
  })

  return response
})