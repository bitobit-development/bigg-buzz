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
  Database,
  Wifi,
  WifiOff,
  Filter,
  Search,
  ExternalLink,
  Trash2,
  CheckCheck,
  Circle,
  Clock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useRealTimeNotifications, RealTimeNotification } from '@/lib/hooks/use-realtime-notifications'
import { cn } from '@/lib/utils'

interface EnhancedNotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function EnhancedNotificationCenter({ isOpen, onClose }: EnhancedNotificationCenterProps) {
  const { notifications, isConnected, lastActivity, counts, actions } = useRealTimeNotifications()
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false
    if (showUnreadOnly && notification.read) return false
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getIcon = (type: string, category: string) => {
    if (category === 'user') return Users
    if (category === 'security') return Shield
    if (category === 'analytics') return TrendingUp
    if (category === 'system') return Database
    if (category === 'bulk_action') return TrendingUp

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 animate-pulse'
      case 'high': return 'bg-bigg-bee-orange'
      case 'medium': return 'bg-bigg-neon-green'
      default: return 'bg-gray-500'
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleNotificationAction = (notification: RealTimeNotification) => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
    actions.markAsRead(notification.id)
  }

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
            className="fixed right-0 top-0 h-full w-96 bg-bigg-dark/95 backdrop-blur-xl border-l border-bigg-neon-green/20 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-bigg-neon-green/20 bg-bigg-dark/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-bigg-neon-green" />
                  <h2 className="text-lg font-semibold text-white">Live Notifications</h2>
                  {counts.unread > 0 && (
                    <Badge className="bg-bigg-bee-orange hover:bg-bigg-bee-orange">
                      {counts.unread}
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

              {/* Connection Status */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-bigg-neon-green" />
                      <span className="text-bigg-neon-green">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">Disconnected</span>
                    </>
                  )}
                </div>
                {lastActivity && (
                  <div className="flex items-center space-x-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Last: {formatTimeAgo(lastActivity)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-bigg-neon-green/10 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 text-xs bg-bigg-dark/50 border-bigg-neon-green/20 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-8 text-xs bg-bigg-dark/50 border-bigg-neon-green/20 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="bulk_action">Bulk Actions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className={cn(
                      "h-7 text-xs",
                      showUnreadOnly ? "text-bigg-neon-green bg-bigg-neon-green/10" : "text-gray-400"
                    )}
                  >
                    <Circle className="w-3 h-3 mr-1" />
                    Unread Only
                  </Button>
                </div>

                <div className="flex space-x-1">
                  {counts.unread > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={actions.markAllAsRead}
                      className="h-7 text-xs text-bigg-neon-green hover:text-bigg-neon-green/80"
                    >
                      <CheckCheck className="w-3 h-3 mr-1" />
                      Mark All Read
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.clearAll}
                    className="h-7 text-xs text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <div className="text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                    {searchQuery && (
                      <p className="text-xs">Try adjusting your filters</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredNotifications.map((notification) => {
                    const Icon = getIcon(notification.type, notification.category)

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        layout
                      >
                        <Card
                          className={cn(
                            "border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl cursor-pointer transition-all duration-200 hover:border-bigg-neon-green/40 relative",
                            !notification.read && "border-l-4 border-l-bigg-neon-green",
                            notification.priority === 'critical' && "animate-pulse"
                          )}
                          onClick={() => actions.markAsRead(notification.id)}
                        >
                          {/* Priority Indicator */}
                          {notification.priority !== 'low' && (
                            <div className={cn(
                              "absolute top-2 right-2 w-2 h-2 rounded-full",
                              getPriorityColor(notification.priority)
                            )} />
                          )}

                          <CardContent className="p-3">
                            <div className="flex items-start space-x-3">
                              {/* Icon */}
                              <div className={cn(
                                "p-1.5 rounded-lg bg-bigg-dark/50 flex-shrink-0",
                                getTypeColor(notification.type)
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="text-white font-medium text-sm truncate pr-2">
                                    {notification.title}
                                  </h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      actions.deleteNotification(notification.id)
                                    }}
                                    className="text-gray-400 hover:text-white p-0 h-auto w-4"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>

                                <p className="text-gray-300 text-xs mb-2 leading-relaxed">
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(notification.timestamp)}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={cn("text-xs", getBadgeColor(notification.type))}>
                                      {notification.type}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Action Button */}
                                {notification.actionable && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleNotificationAction(notification)
                                    }}
                                    className="mt-2 h-6 text-xs text-bigg-neon-green hover:text-bigg-neon-green/80 p-0"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    {notification.actionLabel || 'View'}
                                  </Button>
                                )}
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

            {/* Footer */}
            <div className="p-3 border-t border-bigg-neon-green/10 bg-bigg-dark/50">
              <div className="text-xs text-gray-400 text-center">
                {counts.total} total • {counts.unread} unread
                {counts.high > 0 && (
                  <span className="text-bigg-bee-orange"> • {counts.high} high priority</span>
                )}
                {counts.critical > 0 && (
                  <span className="text-red-400"> • {counts.critical} critical</span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}