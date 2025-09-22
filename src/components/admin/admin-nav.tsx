'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Users,
  Settings,
  Home,
  TrendingUp,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  Activity,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: Home,
    description: 'Overview & Analytics'
  },
  {
    name: 'Subscribers',
    href: '/admin/users',
    icon: Users,
    description: 'Subscriber Management'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Detailed Reports'
  },
  {
    name: 'Compliance',
    href: '/admin/compliance',
    icon: Shield,
    description: 'Audit & Compliance'
  },
  {
    name: 'Activity',
    href: '/admin/activity',
    icon: Activity,
    description: 'System Activity'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: FileText,
    description: 'Export & Reports'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Admin Settings'
  }
]

export function AdminNav() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Handle mobile screen size detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setMobileOpen(true)}
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50 bg-bigg-dark/80 backdrop-blur-sm border border-bigg-neon-green/20 hover:bg-bigg-neon-green/10"
      >
        <Menu className="w-5 h-5 text-bigg-neon-green" />
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block bg-bigg-dark/50 backdrop-blur-xl border-r border-bigg-neon-green/20 shadow-2xl shadow-bigg-neon-green/10 relative z-30 flex-shrink-0"
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} pathname={pathname} />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden fixed left-0 top-0 z-50 w-280 h-screen bg-bigg-dark/95 backdrop-blur-xl border-r border-bigg-neon-green/20 shadow-2xl shadow-bigg-neon-green/10"
          >
            <div className="flex justify-end p-4">
              <Button
                onClick={() => setMobileOpen(false)}
                variant="ghost"
                size="sm"
                className="text-bigg-neon-green hover:bg-bigg-neon-green/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <SidebarContent collapsed={false} setCollapsed={() => {}} pathname={pathname} mobile />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({
  collapsed,
  setCollapsed,
  pathname,
  mobile = false
}: {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  pathname: string
  mobile?: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-bigg-neon-green/20">
        <div className="flex items-center justify-between">
          {(!collapsed || mobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-xl font-black bg-gradient-to-r from-bigg-neon-green to-bigg-chrome bg-clip-text text-transparent">
                BIGG BUZZ
              </h1>
              <p className="text-xs text-gray-400 font-medium">Admin Panel</p>
            </motion.div>
          )}
          {!mobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg bg-bigg-neon-green/10 hover:bg-bigg-neon-green/20 text-bigg-neon-green transition-colors hover:scale-105 active:scale-95"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'group relative flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-bigg-neon-green/20 to-bigg-neon-green/10 text-bigg-neon-green border border-bigg-neon-green/30'
                      : 'text-gray-300 hover:bg-bigg-neon-green/10 hover:text-bigg-neon-green hover:border-bigg-neon-green/20 border border-transparent'
                  )}
                >
                  {/* Background glow effect for active item */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBackground"
                      className="absolute inset-0 bg-bigg-neon-green/5 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Icon with enhanced styling */}
                  <div className={cn(
                    "relative z-10 p-1 rounded-lg transition-all duration-300",
                    isActive ? "bg-bigg-neon-green/20" : "group-hover:bg-bigg-neon-green/10"
                  )}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                  </div>

                  {(!collapsed || mobile) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex-1 relative z-10"
                    >
                      <div className="font-semibold">{item.name}</div>
                      <div className={cn(
                        "text-xs transition-colors duration-300",
                        isActive ? "text-bigg-neon-green/70" : "text-gray-400 group-hover:text-gray-300"
                      )}>
                        {item.description}
                      </div>
                    </motion.div>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="relative z-10 w-3 h-3 bg-bigg-neon-green rounded-full shadow-lg shadow-bigg-neon-green/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Hover line effect */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-bigg-neon-green rounded-r-full"
                    initial={{ scaleY: 0 }}
                    whileHover={{ scaleY: isActive ? 1 : 0.7 }}
                    animate={{ scaleY: isActive ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Enhanced Status Indicator */}
      <div className="p-4 border-t border-bigg-neon-green/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-bigg-neon-green/10 to-bigg-bee-orange/10 border border-bigg-neon-green/20',
            (collapsed && !mobile) && 'justify-center'
          )}
        >
          <div className="relative">
            <div className="w-3 h-3 bg-bigg-neon-green rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-bigg-neon-green rounded-full animate-ping opacity-20" />
          </div>
          {(!collapsed || mobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1"
            >
              <div className="text-sm text-bigg-neon-green font-medium">System Online</div>
              <div className="text-xs text-gray-400">All services operational</div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}