'use client'

import { useEffect, ReactNode } from 'react'
import { useAdminAuthStore } from '@/lib/stores/admin-auth-store'

interface AdminAuthProviderProps {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const { checkAuth } = useAdminAuthStore()

  useEffect(() => {
    // Check authentication status when the app loads
    checkAuth()
  }, [checkAuth])

  return <>{children}</>
}