'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  RefreshCw,
  X,
  Copy,
  ExternalLink,
  Shield,
  Wifi,
  Clock,
  Server,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useErrorRecovery, getErrorMessage } from '@/lib/hooks/use-error-recovery'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
  error: Error | null
  onRetry?: () => void | Promise<void>
  onDismiss?: () => void
  retryable?: boolean
  context?: string
  className?: string
  variant?: 'inline' | 'modal' | 'toast'
}

export function EnhancedErrorDisplay({
  error,
  onRetry,
  onDismiss,
  retryable = true,
  context,
  className,
  variant = 'inline'
}: ErrorDisplayProps) {
  const [copied, setCopied] = useState(false)

  if (!error) return null

  const errorMessage = getErrorMessage(error)
  const isNetworkError = error.message.includes('fetch') || error.message.includes('NetworkError')
  const isAuthError = error.message.includes('401') || error.message.includes('unauthorized')
  const isServerError = error.message.includes('500') || error.message.includes('internal server')

  const getErrorIcon = () => {
    if (isNetworkError) return Wifi
    if (isAuthError) return Shield
    if (isServerError) return Server
    return AlertTriangle
  }

  const getErrorColor = () => {
    if (isNetworkError) return 'text-blue-400'
    if (isAuthError) return 'text-bigg-bee-orange'
    if (isServerError) return 'text-red-400'
    return 'text-red-400'
  }

  const copyErrorDetails = async () => {
    const details = `Error: ${error.message}\nContext: ${context || 'Unknown'}\nTime: ${new Date().toISOString()}\nStack: ${error.stack || 'N/A'}`

    try {
      await navigator.clipboard.writeText(details)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  const ErrorIcon = getErrorIcon()

  if (variant === 'toast') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.3 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.5 }}
        className="fixed top-4 right-4 z-50 w-96"
      >
        <Card className="border-red-500/20 bg-bigg-dark/95 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className={cn('p-2 rounded-lg bg-red-500/20 flex-shrink-0', getErrorColor())}>
                <ErrorIcon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm mb-1">
                  {context ? `${context} Error` : 'Error'}
                </h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {errorMessage}
                </p>

                {retryable && onRetry && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Button
                      onClick={onRetry}
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs border-bigg-neon-green/30 text-bigg-neon-green hover:bg-bigg-neon-green/10"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}
              </div>

              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-red-500/20 bg-bigg-dark/95 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn('p-2 rounded-lg bg-red-500/20', getErrorColor())}>
                    <ErrorIcon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-white">
                    {context ? `${context} Error` : 'Error Occurred'}
                  </CardTitle>
                </div>

                {onDismiss && (
                  <Button
                    onClick={onDismiss}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm">
                {errorMessage}
              </p>

              <div className="flex justify-between space-x-2">
                <Button
                  onClick={copyErrorDetails}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy Details'}
                </Button>

                {retryable && onRetry && (
                  <Button
                    onClick={onRetry}
                    className="bg-bigg-neon-green hover:bg-bigg-neon-green/80 text-black"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Inline variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full", className)}
    >
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={cn('p-2 rounded-lg bg-red-500/20 flex-shrink-0', getErrorColor())}>
              <ErrorIcon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium mb-1">
                {context ? `${context} Error` : 'Something went wrong'}
              </h4>
              <p className="text-gray-300 text-sm mb-3">
                {errorMessage}
              </p>

              <div className="flex items-center space-x-3">
                {retryable && onRetry && (
                  <Button
                    onClick={onRetry}
                    size="sm"
                    variant="outline"
                    className="border-bigg-neon-green/30 text-bigg-neon-green hover:bg-bigg-neon-green/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}

                <Button
                  onClick={copyErrorDetails}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy Details'}
                </Button>

                {onDismiss && (
                  <Button
                    onClick={onDismiss}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white ml-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Component for displaying retry progress
interface RetryProgressProps {
  isRetrying: boolean
  retryCount: number
  maxRetries: number
  lastAttempt?: Date | null
}

export function RetryProgress({ isRetrying, retryCount, maxRetries, lastAttempt }: RetryProgressProps) {
  if (!isRetrying && retryCount === 0) return null

  const progress = (retryCount / maxRetries) * 100

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="w-full space-y-2"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {isRetrying ? 'Retrying...' : `Attempt ${retryCount} of ${maxRetries}`}
        </span>
        {lastAttempt && (
          <span className="text-gray-500">
            {lastAttempt.toLocaleTimeString()}
          </span>
        )}
      </div>

      <Progress
        value={progress}
        className="h-1 bg-bigg-dark"
      />

      {isRetrying && (
        <div className="flex items-center space-x-2 text-xs text-bigg-neon-green">
          <div className="animate-spin w-3 h-3 border border-bigg-neon-green border-t-transparent rounded-full" />
          <span>Attempting to reconnect...</span>
        </div>
      )}
    </motion.div>
  )
}