'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  Users,
  TrendingUp,
  Shield,
  Database
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Using native JavaScript date formatting instead of date-fns

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  category: 'user' | 'system' | 'security' | 'analytics'
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'New User Registration',
      message: 'John Doe has completed registration and phone verification',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      category: 'user'
    },
    {
      id: '2',
      type: 'warning',
      title: 'High Registration Volume',
      message: 'Registration volume is 150% above normal for this time period',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      read: false,
      category: 'analytics'
    },
    {
      id: '3',
      type: 'success',
      title: 'Backup Completed',
      message: 'Daily system backup completed successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      category: 'system'
    },
    {
      id: '4',
      type: 'error',
      title: 'Failed Login Attempts',
      message: 'Multiple failed login attempts detected from IP 192.168.1.100',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      read: false,
      category: 'security'
    }
  ])

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add new notifications
      if (Math.random() > 0.8) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ['info', 'success', 'warning'][Math.floor(Math.random() * 3)] as any,
          title: 'System Update',
          message: 'A new system event has occurred',
          timestamp: new Date(),
          read: false,
          category: 'system'
        }
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]) // Keep only 10 notifications
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const getIcon = (type: string, category: string) => {
    if (category === 'user') return Users
    if (category === 'security') return Shield
    if (category === 'analytics') return TrendingUp
    if (category === 'system') return Database

    switch (type) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      default: return Info
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-bigg-neon-green'
      case 'warning': return 'text-bigg-bee-orange'
      case 'error': return 'text-red-400'
      default: return 'text-blue-400'
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-bigg-neon-green/20 text-bigg-neon-green border-bigg-neon-green/30'
      case 'warning': return 'bg-bigg-bee-orange/20 text-bigg-bee-orange border-bigg-bee-orange/30'
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Notification Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-bigg-dark/95 backdrop-blur-xl border-l border-bigg-neon-green/20 shadow-2xl z-50"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-bigg-neon-green/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-bigg-neon-green" />
                    <h2 className="text-lg font-semibold text-white">Notifications</h2>
                    {unreadCount > 0 && (
                      <Badge className="bg-bigg-bee-orange hover:bg-bigg-bee-orange">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="mt-2 text-bigg-neon-green hover:text-bigg-neon-green/80"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <div className="text-center">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {notifications.map((notification) => {
                      const Icon = getIcon(notification.type, notification.category)

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <Card
                            className={`border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl cursor-pointer transition-all duration-200 hover:border-bigg-neon-green/40 ${
                              !notification.read ? 'border-l-4 border-l-bigg-neon-green' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start space-x-3">
                                {/* Icon */}
                                <div className={`p-2 rounded-lg bg-bigg-dark/50 ${getTypeColor(notification.type)}`}>
                                  <Icon className="w-4 h-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-white font-medium text-sm truncate">
                                      {notification.title}
                                    </h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteNotification(notification.id)
                                      }}
                                      className="text-gray-400 hover:text-white p-1 h-auto"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>

                                  <p className="text-gray-300 text-xs mb-2">
                                    {notification.message}
                                  </p>

                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {notification.timestamp.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </span>
                                    <Badge className={getBadgeColor(notification.type)}>
                                      {notification.type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}