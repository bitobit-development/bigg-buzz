import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST-LOGIN] Starting test login process')

    const body = await request.json()
    console.log('[TEST-LOGIN] Received body:', body)

    // Test basic response
    return NextResponse.json({
      success: true,
      message: 'Test login endpoint working',
      receivedData: body
    })
  } catch (error) {
    console.error('[TEST-LOGIN] Error:', error)
    return NextResponse.json(
      { error: 'Test login failed', details: String(error) },
      { status: 500 }
    )
  }
}