import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-key-32-characters-minimum-length');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Test credentials for development
    if (username === 'admin' && password === 'admin') {
      // Create JWT token for marketplace access
      const token = await new SignJWT({
        sub: 'test-user-001',
        type: 'marketplace',
        role: 'SUBSCRIBER',
        username: 'admin',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@biggbuzz.com',
        phone: '+27821234567'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 'test-user-001',
          username: 'admin',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@biggbuzz.com',
          phone: '+27821234567',
          role: 'SUBSCRIBER'
        }
      });

      // Set HTTP-only cookie for marketplace access
      response.cookies.set('marketplace-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });

      return response;
    }

    // Invalid credentials
    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}