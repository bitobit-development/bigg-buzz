'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Shield,
  ChevronDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { NotificationCenter } from './notification-center'
import { useAdminAuthStore } from '@/lib/stores/admin-auth-store'
import { toast } from 'sonner'

export function AdminHeader() {
  const { user, logout } = useAdminAuthStore()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notifications] = useState(3) // Mock notification count
  const [showNotifications, setShowNotifications] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleSignOut = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      router.push('/admin-login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  return (
    <header className="bg-bigg-dark/30 backdrop-blur-xl border-b border-bigg-neon-green/20 shadow-lg">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* Left Section - Search */}
        <div className="flex items-center space-x-4">
          <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users, analytics..."
              className="pl-10 bg-bigg-dark/50 border-bigg-neon-green/20 text-white placeholder-gray-400 focus:border-bigg-neon-green"
            />
          </div>
        </div>

        {/* Right Section - Time, Notifications, User */}
        <div className="flex items-center space-x-6">
          {/* Current Time */}
          {mounted && (
            <div className="hidden md:block text-sm text-gray-300">
              <div className="font-semibold text-bigg-neon-green">
                {currentTime.toLocaleDateString('en-ZA')}
              </div>
              <div className="text-xs">
                {currentTime.toLocaleTimeString('en-ZA')}
              </div>
            </div>
          )}

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-lg bg-bigg-dark/50 hover:bg-bigg-neon-green/10 text-gray-300 hover:text-bigg-neon-green transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-bigg-bee-orange hover:bg-bigg-bee-orange flex items-center justify-center">
                {notifications}
              </Badge>
            )}
          </motion.button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-3 bg-bigg-dark/50 hover:bg-bigg-neon-green/10 text-white border border-bigg-neon-green/20 hover:border-bigg-neon-green/40"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-bigg-neon-green to-bigg-bee-orange flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold">
                    {user ? `${user.firstName} ${user.lastName}` : 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {user?.role === 'ADMIN' ? 'Administrator' : 'Admin'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-bigg-dark border-bigg-neon-green/20 text-white"
            >
              <div className="px-3 py-2 border-b border-bigg-neon-green/20">
                <div className="font-semibold text-bigg-neon-green">
                  {user ? `${user.firstName} ${user.lastName}` : 'Admin User'}
                </div>
                <div className="text-xs text-gray-400">
                  {user?.email || user?.username}
                </div>
              </div>

              <DropdownMenuItem className="text-white hover:bg-bigg-neon-green/10 focus:bg-bigg-neon-green/10">
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>

              <DropdownMenuItem className="text-white hover:bg-bigg-neon-green/10 focus:bg-bigg-neon-green/10">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </DropdownMenuItem>

              <DropdownMenuItem className="text-white hover:bg-bigg-neon-green/10 focus:bg-bigg-neon-green/10">
                <Settings className="w-4 h-4 mr-2" />
                Admin Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator className="border-bigg-neon-green/20" />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </header>
  )
}