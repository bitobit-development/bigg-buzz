'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  X
} from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { Toast as ToastType, useToastStore } from '@/lib/stores/toast-store'

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2
}

const toastStyles = {
  success: {
    container: 'bg-green-500/10 border-green-500/20 text-green-400',
    icon: 'text-green-400',
    progress: 'bg-green-500'
  },
  error: {
    container: 'bg-red-500/10 border-red-500/20 text-red-400',
    icon: 'text-red-400',
    progress: 'bg-red-500'
  },
  warning: {
    container: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    icon: 'text-yellow-400',
    progress: 'bg-yellow-500'
  },
  info: {
    container: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    icon: 'text-blue-400',
    progress: 'bg-blue-500'
  },
  loading: {
    container: 'bg-bigg-neon-green/10 border-bigg-neon-green/20 text-bigg-neon-green',
    icon: 'text-bigg-neon-green',
    progress: 'bg-bigg-neon-green'
  }
}

interface ToastItemProps {
  toast: ToastType
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToastStore()
  const Icon = toastIcons[toast.type]
  const styles = toastStyles[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={cn(
        'relative w-full max-w-sm rounded-lg border backdrop-blur-xl shadow-2xl p-4',
        'bg-bigg-dark/95 border-bigg-neon-green/20',
        styles.container
      )}
    >
      {/* Progress Bar for Timed Toasts */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className={cn('absolute bottom-0 left-0 h-1 rounded-bl-lg', styles.progress)}
          style={{ transformOrigin: 'left' }}
        />
      )}

      <div className="flex items-start space-x-3">
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          {toast.type === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{toast.title}</div>
          {toast.description && (
            <div className="text-gray-400 text-xs mt-1">{toast.description}</div>
          )}

          {toast.action && (
            <Button
              onClick={toast.action.onClick}
              variant="ghost"
              size="sm"
              className="mt-2 h-auto p-0 text-xs font-medium hover:underline"
            >
              {toast.action.label}
            </Button>
          )}
        </div>

        <Button
          onClick={() => removeToast(toast.id)}
          variant="ghost"
          size="sm"
          className="flex-shrink-0 h-auto p-1 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook to use toast
export const useToast = () => {
  const { addToast, removeToast, updateToast, clearAll } = useToastStore()

  return {
    toast: {
      success: (title: string, description?: string, options?: Partial<ToastType>) =>
        addToast({ type: 'success', title, description, ...options }),
      error: (title: string, description?: string, options?: Partial<ToastType>) =>
        addToast({ type: 'error', title, description, duration: 7000, ...options }),
      warning: (title: string, description?: string, options?: Partial<ToastType>) =>
        addToast({ type: 'warning', title, description, ...options }),
      info: (title: string, description?: string, options?: Partial<ToastType>) =>
        addToast({ type: 'info', title, description, ...options }),
      loading: (title: string, description?: string) =>
        addToast({ type: 'loading', title, description, duration: 0 }),
      promise: async <T>(
        promise: Promise<T>,
        {
          loading: loadingMessage,
          success: successMessage,
          error: errorMessage
        }: {
          loading: string
          success: string | ((data: T) => string)
          error: string | ((error: any) => string)
        }
      ) => {
        const toastId = addToast({ type: 'loading', title: loadingMessage, duration: 0 })

        try {
          const data = await promise
          const message = typeof successMessage === 'function' ? successMessage(data) : successMessage
          updateToast(toastId, {
            type: 'success',
            title: message,
            duration: 5000
          })
          return data
        } catch (error) {
          const message = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage
          updateToast(toastId, {
            type: 'error',
            title: message,
            duration: 7000
          })
          throw error
        }
      }
    },
    removeToast,
    clearAll
  }
}