'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  Play,
  Pause,
  Clock,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface AutoRefreshOptions {
  interval: number
  enabled: boolean
  label: string
}

interface AutoRefreshIndicatorProps {
  onRefresh: () => Promise<void> | void
  isLoading?: boolean
  lastRefresh?: Date | null
  error?: Error | null
  className?: string
  position?: 'inline' | 'floating'
  defaultInterval?: number
  showProgress?: boolean
  showLastRefresh?: boolean
  customIntervals?: number[]
}

const DEFAULT_INTERVALS = [
  { value: 5000, label: '5 seconds' },
  { value: 10000, label: '10 seconds' },
  { value: 30000, label: '30 seconds' },
  { value: 60000, label: '1 minute' },
  { value: 300000, label: '5 minutes' },
  { value: 600000, label: '10 minutes' }
]

export function AutoRefreshIndicator({
  onRefresh,
  isLoading = false,
  lastRefresh,
  error,
  className,
  position = 'inline',
  defaultInterval = 30000,
  showProgress = true,
  showLastRefresh = true,
  customIntervals
}: AutoRefreshIndicatorProps) {
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(defaultInterval)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(refreshInterval)
  const [isConnected, setIsConnected] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)

  const intervals = customIntervals
    ? customIntervals.map(value => ({
        value,
        label: value < 60000 ? `${value / 1000} seconds` : `${value / 60000} minute${value === 60000 ? '' : 's'}`
      }))
    : DEFAULT_INTERVALS

  // Auto-refresh timer
  useEffect(() => {
    if (!isAutoRefreshEnabled || isLoading) return

    const interval = setInterval(() => {
      setTimeUntilRefresh(prev => {
        if (prev <= 1000) {
          handleRefresh()
          return refreshInterval
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isAutoRefreshEnabled, isLoading, refreshInterval])

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Reset timer when interval changes
  useEffect(() => {
    setTimeUntilRefresh(refreshInterval)
  }, [refreshInterval])

  const handleRefresh = useCallback(async () => {
    if (isLoading) return

    try {
      await onRefresh()
      setRefreshCount(prev => prev + 1)
    } catch (error) {
      console.error('Auto-refresh failed:', error)
      // Auto-refresh will continue unless manually disabled
    }
  }, [onRefresh, isLoading])

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(prev => {
      const newValue = !prev
      if (newValue) {
        setTimeUntilRefresh(refreshInterval)
      }
      return newValue
    })
  }

  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatLastRefresh = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleTimeString()
  }

  const getStatusColor = () => {
    if (!isConnected) return 'text-red-400'
    if (error) return 'text-bigg-bee-orange'
    if (isLoading) return 'text-bigg-neon-green'
    return 'text-gray-400'
  }

  const getStatusIcon = () => {
    if (!isConnected) return WifiOff
    if (error) return AlertCircle
    if (isLoading) return RefreshCw
    return isAutoRefreshEnabled ? Wifi : CheckCircle
  }

  const progressPercentage = showProgress && isAutoRefreshEnabled
    ? ((refreshInterval - timeUntilRefresh) / refreshInterval) * 100
    : 0

  if (position === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "fixed bottom-4 left-4 z-40 bg-bigg-dark/95 backdrop-blur-xl border border-bigg-neon-green/20 rounded-lg shadow-2xl",
          className
        )}
      >
        <div className="p-3">
          <div className="flex items-center space-x-3">
            {/* Status Indicator */}
            <div className={cn('p-2 rounded-lg bg-bigg-dark/50', getStatusColor())}>
              {React.createElement(getStatusIcon(), {
                className: cn('w-4 h-4', isLoading && 'animate-spin')
              })}
            </div>

            {/* Auto-refresh Controls */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleAutoRefresh}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2",
                  isAutoRefreshEnabled ? "text-bigg-neon-green" : "text-gray-400"
                )}
              >
                {isAutoRefreshEnabled ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </Button>

              {isAutoRefreshEnabled && (
                <Badge className="bg-bigg-neon-green/20 text-bigg-neon-green text-xs">
                  {formatTimeRemaining(timeUntilRefresh)}
                </Badge>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-gray-400 hover:text-white"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-bigg-dark border-bigg-neon-green/20">
                  {intervals.map((interval) => (
                    <DropdownMenuItem
                      key={interval.value}
                      onClick={() => setRefreshInterval(interval.value)}
                      className={cn(
                        "text-white hover:bg-bigg-neon-green/10",
                        refreshInterval === interval.value && "bg-bigg-neon-green/20"
                      )}
                    >
                      {interval.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Progress Bar */}
          {showProgress && isAutoRefreshEnabled && (
            <Progress
              value={progressPercentage}
              className="h-1 mt-2 bg-bigg-dark"
            />
          )}
        </div>
      </motion.div>
    )
  }

  // Inline variant
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Manual Refresh Button */}
      <Button
        onClick={handleRefresh}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="border-bigg-neon-green/20 hover:border-bigg-neon-green/40"
      >
        <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
        Refresh
      </Button>

      {/* Auto-refresh Toggle */}
      <Button
        onClick={toggleAutoRefresh}
        variant="ghost"
        size="sm"
        className={cn(
          "text-gray-400 hover:text-white",
          isAutoRefreshEnabled && "text-bigg-neon-green hover:text-bigg-neon-green/80"
        )}
      >
        {isAutoRefreshEnabled ? (
          <Pause className="w-4 h-4 mr-1" />
        ) : (
          <Play className="w-4 h-4 mr-1" />
        )}
        Auto-refresh
      </Button>

      {/* Status and Settings */}
      <div className="flex items-center space-x-2">
        {/* Connection Status */}
        <div className={cn('p-1 rounded', getStatusColor())}>
          {React.createElement(getStatusIcon(), {
            className: 'w-4 h-4'
          })}
        </div>

        {/* Time Until Next Refresh */}
        {isAutoRefreshEnabled && (
          <Badge className="bg-bigg-neon-green/20 text-bigg-neon-green text-xs">
            {formatTimeRemaining(timeUntilRefresh)}
          </Badge>
        )}

        {/* Last Refresh Time */}
        {showLastRefresh && lastRefresh && (
          <span className="text-xs text-gray-500">
            Updated {formatLastRefresh(lastRefresh)}
          </span>
        )}

        {/* Refresh Count */}
        {refreshCount > 0 && (
          <Badge className="bg-gray-500/20 text-gray-400 text-xs">
            {refreshCount} updates
          </Badge>
        )}

        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1 text-gray-400 hover:text-white"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-bigg-dark border-bigg-neon-green/20">
            <div className="px-2 py-1 text-xs text-gray-400">Refresh Interval</div>
            <DropdownMenuSeparator className="border-bigg-neon-green/20" />
            {intervals.map((interval) => (
              <DropdownMenuItem
                key={interval.value}
                onClick={() => setRefreshInterval(interval.value)}
                className={cn(
                  "text-white hover:bg-bigg-neon-green/10",
                  refreshInterval === interval.value && "bg-bigg-neon-green/20"
                )}
              >
                {interval.label}
                {refreshInterval === interval.value && (
                  <CheckCircle className="w-3 h-3 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress Bar */}
      {showProgress && isAutoRefreshEnabled && (
        <div className="w-16">
          <Progress
            value={progressPercentage}
            className="h-1 bg-bigg-dark"
          />
        </div>
      )}
    </div>
  )
}