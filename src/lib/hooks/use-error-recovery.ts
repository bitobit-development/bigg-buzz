'use client'

import { useState, useCallback } from 'react'

interface ErrorState {
  hasError: boolean
  error: Error | null
  canRetry: boolean
  retryCount: number
  lastAttempt: Date | null
}

interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: boolean
  onRetry?: (attempt: number) => void
  onMaxRetriesReached?: (error: Error) => void
}

export function useErrorRecovery(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = true,
    onRetry,
    onMaxRetriesReached
  } = options

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    canRetry: true,
    retryCount: 0,
    lastAttempt: null
  })

  const setError = useCallback((error: Error | null) => {
    setErrorState(prev => ({
      ...prev,
      hasError: !!error,
      error,
      lastAttempt: error ? new Date() : null
    }))
  }, [])

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      canRetry: true,
      retryCount: 0,
      lastAttempt: null
    })
  }, [])

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (!errorState.canRetry || errorState.retryCount >= maxRetries) {
      if (errorState.error && onMaxRetriesReached) {
        onMaxRetriesReached(errorState.error)
      }
      return Promise.reject(errorState.error)
    }

    const newRetryCount = errorState.retryCount + 1

    setErrorState(prev => ({
      ...prev,
      retryCount: newRetryCount,
      lastAttempt: new Date()
    }))

    if (onRetry) {
      onRetry(newRetryCount)
    }

    // Calculate delay with optional exponential backoff
    const retryDelay = backoff ? delay * Math.pow(2, newRetryCount - 1) : delay

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryDelay))

    try {
      const result = await operation()
      clearError()
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      setErrorState(prev => ({
        ...prev,
        hasError: true,
        error: err,
        canRetry: newRetryCount < maxRetries
      }))

      if (newRetryCount >= maxRetries && onMaxRetriesReached) {
        onMaxRetriesReached(err)
      }

      throw err
    }
  }, [errorState, maxRetries, delay, backoff, onRetry, onMaxRetriesReached, clearError])

  const executeWithRetry = useCallback(async (operation: () => Promise<any>) => {
    try {
      clearError()
      return await operation()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setError(err)
      throw err
    }
  }, [setError, clearError])

  return {
    error: errorState.error,
    hasError: errorState.hasError,
    canRetry: errorState.canRetry,
    retryCount: errorState.retryCount,
    lastAttempt: errorState.lastAttempt,
    isMaxRetriesReached: errorState.retryCount >= maxRetries,
    setError,
    clearError,
    retry,
    executeWithRetry
  }
}

// Utility function to create user-friendly error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      return 'Unable to connect to the server. Please check your internet connection.'
    }

    // Authentication errors
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'Your session has expired. Please log in again.'
    }

    // Permission errors
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return 'You don\'t have permission to perform this action.'
    }

    // Not found errors
    if (error.message.includes('404') || error.message.includes('not found')) {
      return 'The requested resource could not be found.'
    }

    // Server errors
    if (error.message.includes('500') || error.message.includes('internal server')) {
      return 'A server error occurred. Please try again later.'
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return 'The request took too long. Please try again.'
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return error.message // Return the specific validation message
    }

    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

// Hook for API calls with automatic error handling and retry
export function useApiCall<T = any>(options: RetryOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)

  const errorRecovery = useErrorRecovery({
    ...options,
    onRetry: (attempt) => {
      console.log(`Retrying API call (attempt ${attempt})`)
      options.onRetry?.(attempt)
    }
  })

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setLoading(true)

    try {
      const result = await errorRecovery.executeWithRetry(apiCall)
      setData(result)
      return result
    } catch (error) {
      console.error('API call failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [errorRecovery])

  const retryLastCall = useCallback(async (apiCall: () => Promise<T>) => {
    if (!errorRecovery.canRetry) return

    setLoading(true)

    try {
      const result = await errorRecovery.retry(apiCall)
      setData(result)
      return result
    } catch (error) {
      console.error('Retry failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [errorRecovery])

  return {
    loading,
    data,
    error: errorRecovery.error,
    hasError: errorRecovery.hasError,
    canRetry: errorRecovery.canRetry,
    retryCount: errorRecovery.retryCount,
    isMaxRetriesReached: errorRecovery.isMaxRetriesReached,
    execute,
    retry: retryLastCall,
    clearError: errorRecovery.clearError,
    errorMessage: errorRecovery.error ? getErrorMessage(errorRecovery.error) : null
  }
}