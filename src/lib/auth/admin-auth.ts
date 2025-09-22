import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-key-32-characters-minimum-length')

export interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  isActive: boolean
  firstName: string
  lastName: string
}

/**
 * Verify admin token from cookies (server-side)
 */
export async function verifyAdminToken(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return null
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Ensure this is an admin token
    if (payload.type !== 'admin' || payload.role !== 'ADMIN') {
      return null
    }

    return {
      id: payload.id as string,
      username: payload.username as string,
      email: payload.email as string,
      role: payload.role as string,
      isActive: payload.isActive as boolean,
      firstName: 'Admin',
      lastName: 'User'
    }
  } catch (error) {
    console.error('Admin token verification error:', error)
    return null
  }
}

/**
 * Require admin authentication (server-side)
 * Redirects to login if not authenticated
 */
export async function requireAdminAuth(): Promise<AdminUser> {
  const adminUser = await verifyAdminToken()

  if (!adminUser) {
    redirect('/admin-login')
  }

  return adminUser
}

/**
 * Check if current request has admin authentication (server-side)
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const adminUser = await verifyAdminToken()
  return !!adminUser
}

/**
 * Get admin user from token (server-side)
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  return await verifyAdminToken()
}