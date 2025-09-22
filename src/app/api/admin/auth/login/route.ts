import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-key-32-characters-minimum-length')

interface AdminLoginRequest {
  username: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AdminLoginRequest = await request.json()
    const { username, password } = body

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Get admin credentials from environment
    const adminUsername = process.env.ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminEmail = process.env.ADMIN_EMAIL

    if (!adminUsername || !adminPassword || !adminEmail) {
      console.error('Admin credentials not configured in environment')
      return NextResponse.json(
        { error: 'Admin authentication not configured' },
        { status: 500 }
      )
    }

    // Verify credentials
    const isValidUsername = username === adminUsername
    const isValidPassword = password === adminPassword

    if (!isValidUsername || !isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create admin user object
    const adminUser = {
      id: 'admin-user',
      username: adminUsername,
      email: adminEmail,
      role: 'ADMIN',
      isActive: true,
      firstName: 'Admin',
      lastName: 'User'
    }

    // Create JWT token
    const token = await new SignJWT({
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      isActive: adminUser.isActive,
      type: 'admin'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 days
      .sign(JWT_SECRET)

    // Create response with token in httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: adminUser,
      message: 'Login successful'
    })

    // Set secure httpOnly cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    // Log successful login (for security monitoring)
    console.log(`Admin login successful: ${username} at ${new Date().toISOString()}`)

    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}