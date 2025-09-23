'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface RealTimeNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  category: 'user' | 'system' | 'security' | 'analytics' | 'bulk_action'
  priority: 'low' | 'medium' | 'high' | 'critical'
  actionable?: boolean
  actionLabel?: string
  actionUrl?: string
  autoHide?: boolean
  duration?: number
}

interface NotificationEvent {
  type: 'user_registered' | 'user_verified' | 'bulk_action_completed' | 'system_alert' | 'security_event'
  data: any
}

export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>()
  const activityTimeoutRef = useRef<NodeJS.Timeout>()

  // Simulate real-time events (in a real app, this would be WebSocket/SSE)
  const simulateRealTimeEvent = useCallback(() => {
    const events: NotificationEvent[] = [
      {
        type: 'user_registered',
        data: {
          userId: Math.random().toString(36).substr(2, 9),
          name: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'][Math.floor(Math.random() * 4)],
          email: 'user@example.com',
          verified: Math.random() > 0.5
        }
      },
      {
        type: 'user_verified',
        data: {
          userId: Math.random().toString(36).substr(2, 9),
          name: ['Alice Brown', 'Bob Davis', 'Carol White', 'David Clark'][Math.floor(Math.random() * 4)]
        }
      },
      {
        type: 'bulk_action_completed',
        data: {
          action: ['export', 'activate', 'deactivate'][Math.floor(Math.random() * 3)],
          count: Math.floor(Math.random() * 50) + 1,
          success: Math.random() > 0.2
        }
      },
      {
        type: 'system_alert',
        data: {
          metric: ['cpu_usage', 'memory_usage', 'disk_space', 'response_time'][Math.floor(Math.random() * 4)],
          value: Math.floor(Math.random() * 100),
          threshold: 80
        }
      },
      {
        type: 'security_event',
        data: {
          event: ['failed_login', 'suspicious_activity', 'access_denied'][Math.floor(Math.random() * 3)],
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        }
      }
    ]

    const randomEvent = events[Math.floor(Math.random() * events.length)]
    processNotificationEvent(randomEvent)
  }, [])

  // Process notification events into notifications
  const processNotificationEvent = useCallback((event: NotificationEvent) => {
    let notification: RealTimeNotification

    switch (event.type) {
      case 'user_registered':
        notification = {
          id: Date.now().toString(),
          type: 'info',
          title: 'New User Registration',
          message: `${event.data.name} has completed registration${event.data.verified ? ' and verification' : ''}`,
          timestamp: new Date(),
          read: false,
          category: 'user',
          priority: 'medium',
          actionable: true,
          actionLabel: 'View Profile',
          actionUrl: `/admin/users/${event.data.userId}`,
          autoHide: false
        }
        break

      case 'user_verified':
        notification = {
          id: Date.now().toString(),
          type: 'success',
          title: 'User Verified',
          message: `${event.data.name} has completed phone verification`,
          timestamp: new Date(),
          read: false,
          category: 'user',
          priority: 'low',
          autoHide: true,
          duration: 10000
        }
        break

      case 'bulk_action_completed':
        notification = {
          id: Date.now().toString(),
          type: event.data.success ? 'success' : 'error',
          title: 'Bulk Action Completed',
          message: `${event.data.action} operation on ${event.data.count} users ${event.data.success ? 'completed successfully' : 'failed'}`,
          timestamp: new Date(),
          read: false,
          category: 'bulk_action',
          priority: event.data.success ? 'medium' : 'high',
          autoHide: event.data.success,
          duration: event.data.success ? 8000 : undefined
        }
        break

      case 'system_alert':
        const isHigh = event.data.value > event.data.threshold
        notification = {
          id: Date.now().toString(),
          type: isHigh ? 'warning' : 'info',
          title: 'System Alert',
          message: `${event.data.metric.replace('_', ' ').toUpperCase()} is at ${event.data.value}%${isHigh ? ' (above threshold)' : ''}`,
          timestamp: new Date(),
          read: false,
          category: 'system',
          priority: isHigh ? 'high' : 'low',
          autoHide: !isHigh,
          duration: isHigh ? undefined : 15000
        }
        break

      case 'security_event':
        const severityMap = { low: 'info', medium: 'warning', high: 'error' } as const
        notification = {
          id: Date.now().toString(),
          type: severityMap[event.data.severity as keyof typeof severityMap],
          title: 'Security Event',
          message: `${event.data.event.replace('_', ' ').toUpperCase()} from IP ${event.data.ip}`,
          timestamp: new Date(),
          read: false,
          category: 'security',
          priority: event.data.severity as any,
          actionable: true,
          actionLabel: 'View Details',
          autoHide: event.data.severity === 'low',
          duration: event.data.severity === 'low' ? 12000 : undefined
        }
        break

      default:
        return
    }

    addNotification(notification)
    setLastActivity(new Date())
  }, [])

  // Add notification
  const addNotification = useCallback((notification: RealTimeNotification) => {
    setNotifications(prev => {
      // Remove old notifications if we have too many
      const filtered = prev.slice(0, 19) // Keep max 20
      return [notification, ...filtered]
    })

    // Auto-hide notification if specified
    if (notification.autoHide && notification.duration) {
      setTimeout(() => {
        markAsRead(notification.id)
      }, notification.duration)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    )
  }, [])

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Get notification counts
  const getNotificationCounts = useCallback(() => {
    const unread = notifications.filter(n => !n.read).length
    const critical = notifications.filter(n => n.priority === 'critical' && !n.read).length
    const high = notifications.filter(n => n.priority === 'high' && !n.read).length

    return { total: notifications.length, unread, critical, high }
  }, [notifications])

  // Initialize real-time simulation
  useEffect(() => {
    setIsConnected(true)

    // Add some initial notifications
    const initialNotifications: RealTimeNotification[] = [
      {
        id: '1',
        type: 'info',
        title: 'Welcome to Enhanced Admin',
        message: 'Real-time notifications are now active',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        read: false,
        category: 'system',
        priority: 'low',
        autoHide: false
      },
      {
        id: '2',
        type: 'success',
        title: 'System Status',
        message: 'All systems operational',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: true,
        category: 'system',
        priority: 'low',
        autoHide: false
      }
    ]

    setNotifications(initialNotifications)

    // Start simulation interval
    intervalRef.current = setInterval(() => {
      // Randomly trigger events (20% chance every 10 seconds)
      if (Math.random() < 0.2) {
        simulateRealTimeEvent()
      }
    }, 10000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
      setIsConnected(false)
    }
  }, [simulateRealTimeEvent])

  // Simulate connection status changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsConnected(false)
      } else {
        setIsConnected(true)
        // Simulate reconnection delay
        setTimeout(() => {
          setLastActivity(new Date())
        }, 1000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return {
    notifications,
    isConnected,
    lastActivity,
    counts: getNotificationCounts(),
    actions: {
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      addNotification: (notification: Omit<RealTimeNotification, 'id' | 'timestamp'>) => {
        addNotification({
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date()
        })
      }
    }
  }
}