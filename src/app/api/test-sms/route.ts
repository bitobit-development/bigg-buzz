import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Test environment variables
    const apiKey = process.env.CLICKATEL_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: 'CLICKATEL_API_KEY not configured',
        details: 'Environment variable missing'
      }, { status: 500 })
    }

    console.log(`[TEST-SMS] Testing Clickatel API for phone: ${phone}`)

    // Test Clickatel API directly
    const message = `Test SMS from Bigg Buzz: ${Math.floor(100000 + Math.random() * 900000)}`

    const response = await fetch('https://platform.clickatell.com/v1/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            channel: 'sms',
            to: phone,
            content: message,
          },
        ],
      }),
    })

    console.log(`[TEST-SMS] Clickatel response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[TEST-SMS] Clickatel error: ${errorText}`)

      let errorData;
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }

      return NextResponse.json({
        error: 'Clickatel API error',
        status: response.status,
        details: errorData,
        message: 'Failed to send SMS via Clickatel'
      }, { status: 500 })
    }

    const result = await response.json()
    console.log(`[TEST-SMS] Clickatel success:`, result)

    // Check if message was accepted
    if (result.messages && result.messages[0]) {
      const msg = result.messages[0]
      if (msg.accepted === false) {
        return NextResponse.json({
          error: 'Message rejected by Clickatel',
          details: msg.error || 'Unknown rejection reason',
          messageId: msg.apiMessageId
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully',
        messageId: msg.apiMessageId,
        to: msg.to,
        details: result
      })
    }

    return NextResponse.json({
      error: 'Unexpected response format',
      details: result
    }, { status: 500 })

  } catch (error) {
    console.error('[TEST-SMS] Unexpected error:', error)

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}