import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-key-32-characters-minimum-length')

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No admin token found' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Ensure this is an admin token
    if (payload.type !== 'admin' || payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      )
    }

    // Return admin user info
    const adminUser = {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      isActive: payload.isActive,
      firstName: 'Admin',
      lastName: 'User'
    }

    return NextResponse.json({
      success: true,
      user: adminUser
    })

  } catch (error) {
    console.error('Admin auth verification error:', error)
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}