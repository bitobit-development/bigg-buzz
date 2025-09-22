'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Trash2,
  UserX,
  Shield,
  Download,
  RefreshCw,
  Check,
  X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmationVariant
  icon?: React.ReactNode
  loading?: boolean
  additionalInfo?: {
    label: string
    value: string
    highlight?: boolean
  }[]
}

const variantStyles = {
  danger: {
    icon: Trash2,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    border: 'border-red-500/20'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10',
    confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    border: 'border-yellow-500/20'
  },
  info: {
    icon: Shield,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    border: 'border-blue-500/20'
  },
  success: {
    icon: Check,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10',
    confirmButton: 'bg-green-600 hover:bg-green-700 text-white',
    border: 'border-green-500/20'
  }
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  loading = false,
  additionalInfo
}: ConfirmationDialogProps) {
  const styles = variantStyles[variant]
  const IconComponent = icon || styles.icon

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Confirmation action failed:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-bigg-dark/95 backdrop-blur-xl border-bigg-neon-green/20 max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-4 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5, delay: 0.1 }}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full',
                styles.iconBg,
                styles.border,
                'border'
              )}
            >
              <IconComponent className={cn('w-6 h-6', styles.iconColor)} />
            </motion.div>
            <div className="flex-1">
              <DialogTitle className="text-white text-lg font-semibold">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-gray-300 text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Additional Information */}
        {additionalInfo && additionalInfo.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 py-4 border-t border-b border-bigg-neon-green/10"
          >
            {additionalInfo.map((info, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{info.label}:</span>
                <div className={cn(
                  info.highlight ? 'text-bigg-neon-green font-medium' : 'text-white'
                )}>
                  {info.highlight ? (
                    <Badge variant="outline" className="border-bigg-neon-green/30 text-bigg-neon-green">
                      {info.value}
                    </Badge>
                  ) : (
                    <span className="text-sm">{info.value}</span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end space-x-3 pt-4"
        >
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(styles.confirmButton, 'relative overflow-hidden')}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </motion.div>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {confirmText}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

// Pre-configured confirmation dialogs for common actions
export const useConfirmationDialog = () => {
  return {
    deleteUser: (userName: string, onConfirm: () => void | Promise<void>) => ({
      title: 'Delete User Account',
      description: `Are you sure you want to permanently delete this user account? This action cannot be undone and will remove all associated data.`,
      confirmText: 'Delete User',
      variant: 'danger' as const,
      icon: UserX,
      additionalInfo: [
        { label: 'User', value: userName, highlight: true },
        { label: 'Impact', value: 'Permanent deletion' }
      ],
      onConfirm
    }),

    bulkDelete: (count: number, onConfirm: () => void | Promise<void>) => ({
      title: 'Bulk Delete Users',
      description: `You are about to delete ${count} user accounts. This action is permanent and cannot be undone.`,
      confirmText: `Delete ${count} Users`,
      variant: 'danger' as const,
      additionalInfo: [
        { label: 'Selected Users', value: count.toString(), highlight: true },
        { label: 'Action', value: 'Permanent deletion' }
      ],
      onConfirm
    }),

    exportData: (format: string, onConfirm: () => void | Promise<void>) => ({
      title: 'Export User Data',
      description: `This will generate and download a ${format.toUpperCase()} file containing user data. The export may take a few moments to complete.`,
      confirmText: `Export ${format.toUpperCase()}`,
      variant: 'info' as const,
      icon: Download,
      additionalInfo: [
        { label: 'Format', value: format.toUpperCase() },
        { label: 'Estimated Size', value: 'TBD' }
      ],
      onConfirm
    }),

    resetUserPassword: (userName: string, onConfirm: () => void | Promise<void>) => ({
      title: 'Reset User Password',
      description: `This will send a password reset link to the user's email address. They will need to create a new password to access their account.`,
      confirmText: 'Send Reset Link',
      variant: 'warning' as const,
      additionalInfo: [
        { label: 'User', value: userName, highlight: true },
        { label: 'Method', value: 'Email reset link' }
      ],
      onConfirm
    })
  }
}