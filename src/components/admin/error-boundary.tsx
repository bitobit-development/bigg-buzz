'use client'

import React, { Component, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, ArrowLeft, Bug, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class AdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin Error Boundary caught an error:', error, errorInfo)
    }

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo)

    // In a real app, you would send this to your error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  handleReportError = () => {
    const { error, errorId } = this.state
    const subject = `Admin Error Report - ${errorId}`
    const body = `Error ID: ${errorId}\n\nError: ${error?.message}\n\nStack: ${error?.stack}\n\nPlease describe what you were doing when this error occurred:`

    window.open(`mailto:support@biggbuzz.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  getErrorMessage(error: Error): { title: string; description: string; category: string } {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        category: 'network'
      }
    }

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        title: 'Access Denied',
        description: 'You don\'t have permission to access this resource. Please contact your administrator.',
        category: 'auth'
      }
    }

    if (message.includes('not found') || message.includes('404')) {
      return {
        title: 'Resource Not Found',
        description: 'The requested resource could not be found. It may have been moved or deleted.',
        category: 'notfound'
      }
    }

    if (message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        description: 'The request took too long to complete. Please try again.',
        category: 'timeout'
      }
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return {
        title: 'Invalid Data',
        description: 'The data provided is invalid. Please check your input and try again.',
        category: 'validation'
      }
    }

    return {
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred. Our team has been notified and is working on a fix.',
      category: 'general'
    }
  }

  getCategoryColor(category: string) {
    switch (category) {
      case 'network': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'auth': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'notfound': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'timeout': return 'bg-bigg-bee-orange/20 text-bigg-bee-orange border-bigg-bee-orange/30'
      case 'validation': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      const { error, errorId } = this.state
      const errorDetails = error ? this.getErrorMessage(error) : {
        title: 'Unknown Error',
        description: 'An unknown error occurred.',
        category: 'general'
      }

      return (
        <div className="min-h-screen bg-bigg-darker flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
          >
            <Card className="border-red-500/20 bg-bigg-dark/50 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <CardTitle className="text-white text-xl mb-2">
                  {errorDetails.title}
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  {errorDetails.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Error Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Error ID:</span>
                    <Badge className="font-mono text-xs bg-gray-500/20 text-gray-300">
                      {errorId}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Category:</span>
                    <Badge className={this.getCategoryColor(errorDetails.category)}>
                      {errorDetails.category}
                    </Badge>
                  </div>

                  {process.env.NODE_ENV === 'development' && error && (
                    <details className="mt-4 p-3 bg-bigg-dark/50 rounded-lg border border-bigg-neon-green/10">
                      <summary className="cursor-pointer text-sm text-gray-400 mb-2">
                        Developer Details
                      </summary>
                      <div className="text-xs text-red-400 font-mono break-all">
                        <div className="mb-2">
                          <strong>Message:</strong> {error.message}
                        </div>
                        {error.stack && (
                          <div>
                            <strong>Stack:</strong>
                            <pre className="mt-1 text-xs overflow-x-auto">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <Button
                    onClick={this.handleRetry}
                    className="bg-bigg-neon-green hover:bg-bigg-neon-green/80 text-black font-semibold"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>

                  <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    className="border-bigg-neon-green/20 hover:border-bigg-neon-green/40"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                </div>

                {/* Additional Actions */}
                <div className="flex justify-center space-x-4 pt-4 border-t border-bigg-neon-green/10">
                  <Button
                    onClick={this.handleReportError}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Report Error
                  </Button>

                  <Button
                    onClick={() => window.location.href = '/admin/dashboard'}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error ${context ? `in ${context}` : ''}:`, error)

    // You could integrate with your error reporting service here
    // Example: Sentry.captureException(error, { tags: { context } })

    // Show user-friendly error message
    return {
      title: 'Something went wrong',
      message: error.message || 'An unexpected error occurred',
      canRetry: true
    }
  }

  return { handleError }
}