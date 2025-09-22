import { ReactNode } from 'react'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { AdminNav } from '@/components/admin/admin-nav'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminAuthProvider } from '@/components/admin/admin-auth-provider'
import { ToastContainer } from '@/components/ui/toast'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // This will redirect to /admin/login if not authenticated as admin
  const adminUser = await requireAdminAuth()

  return (
    <AdminAuthProvider>
      <div className="bg-gradient-to-br from-bigg-darker via-bigg-dark to-bigg-darker">
        {/* Animated background effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bigg-neon-green/10 rounded-full blur-3xl animate-bigg-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-bigg-bee-orange/10 rounded-full blur-3xl animate-bigg-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex">
          {/* Sidebar Navigation */}
          <AdminNav />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <AdminHeader />

            {/* Page Content */}
            <main className="flex-1 px-4 md:px-6 py-6 md:py-8">
              {children}
            </main>
          </div>
        </div>

        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </AdminAuthProvider>
  )
}