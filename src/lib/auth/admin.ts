import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function requireAdmin() {
  const session = await getServerSession()

  if (!session?.user?.email) {
    redirect('/admin/sign-in')
  }

  // Check if user has admin role
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, isActive: true }
  })

  if (!user || !user.isActive || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/admin/unauthorized')
  }

  return user
}

export async function isAdmin(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true, isActive: true }
    })

    return !!(user && user.isActive && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'))
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function getAdminUser(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  })
}