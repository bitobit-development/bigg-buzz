'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCheck,
  UserX,
  Trash2,
  X,
  MoreHorizontal,
  Download,
  Shield,
  Mail,
  Archive,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
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

interface BulkAction {
  id: string
  label: string
  icon: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  onClick: () => void | Promise<void>
  requiresConfirmation?: boolean
  confirmationMessage?: string
}

interface BulkOperationProgress {
  id: string
  action: string
  total: number
  completed: number
  failed: number
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  errors?: string[]
}

interface EnhancedBulkActionBarProps {
  selectedItems: string[]
  onClear: () => void
  onBulkAction?: (actionId: string, items: string[]) => Promise<void>
  className?: string
  position?: 'top' | 'bottom'
  actions?: BulkAction[]
}

const defaultActions: BulkAction[] = [
  {
    id: 'activate',
    label: 'Activate',
    icon: <UserCheck className="w-4 h-4" />,
    variant: 'success'
  },
  {
    id: 'deactivate',
    label: 'Deactivate',
    icon: <UserX className="w-4 h-4" />,
    variant: 'warning'
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="w-4 h-4" />,
    variant: 'default'
  },
  {
    id: 'send-email',
    label: 'Send Email',
    icon: <Mail className="w-4 h-4" />,
    variant: 'default'
  },
  {
    id: 'change-role',
    label: 'Change Role',
    icon: <Shield className="w-4 h-4" />,
    variant: 'default'
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="w-4 h-4" />,
    variant: 'warning',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to archive these items?'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationMessage: 'This action cannot be undone. Are you sure?'
  }
]

export function EnhancedBulkActionBar({
  selectedItems,
  onClear,
  onBulkAction,
  className,
  position = 'top',
  actions = defaultActions
}: EnhancedBulkActionBarProps) {
  const [operations, setOperations] = useState<BulkOperationProgress[]>([])
  const [showOperationDetails, setShowOperationDetails] = useState(false)

  // Clear operations when no items are selected
  useEffect(() => {
    if (selectedItems.length === 0) {
      // Keep completed operations for 5 seconds before clearing
      const timer = setTimeout(() => {
        setOperations(prev => prev.filter(op => op.status === 'running'))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [selectedItems.length])

  // Handle bulk action execution
  const handleBulkAction = async (action: BulkAction) => {
    if (!onBulkAction) return

    const operationId = Date.now().toString()
    const operation: BulkOperationProgress = {
      id: operationId,
      action: action.label,
      total: selectedItems.length,
      completed: 0,
      failed: 0,
      status: 'running',
      startTime: new Date(),
      errors: []
    }

    setOperations(prev => [...prev, operation])

    try {
      await onBulkAction(action.id, selectedItems)

      // Update operation as completed
      setOperations(prev => prev.map(op =>
        op.id === operationId
          ? { ...op, status: 'completed' as const, completed: op.total }
          : op
      ))
    } catch (error) {
      // Update operation as failed
      setOperations(prev => prev.map(op =>
        op.id === operationId
          ? {
              ...op,
              status: 'failed' as const,
              failed: op.total,
              errors: [error instanceof Error ? error.message : 'Unknown error']
            }
          : op
      ))
    }
  }

  // Get variant classes
  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'border-green-500/30 text-green-400 hover:bg-green-500/10'
      case 'warning':
        return 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
      case 'destructive':
        return 'border-red-500/30 text-red-400 hover:bg-red-500/10'
      default:
        return 'border-bigg-neon-green/30 text-bigg-neon-green hover:bg-bigg-neon-green/10'
    }
  }

  // Get status icon
  const getStatusIcon = (status: BulkOperationProgress['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-bigg-neon-green" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-400" />
    }
  }

  const runningOperations = operations.filter(op => op.status === 'running')
  const hasRunningOperations = runningOperations.length > 0

  if (selectedItems.length === 0 && !hasRunningOperations) {
    return null
  }

  return (
    <>
      {/* Floating Action Bar */}
      <AnimatePresence mode="wait">
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'fixed left-1/2 transform -translate-x-1/2 z-50',
              position === 'top' ? 'top-20' : 'bottom-6',
              className
            )}
          >
            <div className="bg-bigg-dark/95 backdrop-blur-xl border border-bigg-neon-green/30 rounded-xl shadow-2xl shadow-bigg-neon-green/20 p-4 min-w-fit">
              <div className="flex items-center space-x-4">
                {/* Selection Info */}
                <div className="flex items-center space-x-2">
                  <Badge className="bg-bigg-neon-green/20 text-bigg-neon-green border-bigg-neon-green/30">
                    {selectedItems.length} selected
                  </Badge>

                  {hasRunningOperations && (
                    <Button
                      onClick={() => setShowOperationDetails(!showOperationDetails)}
                      variant="ghost"
                      size="sm"
                      className="text-bigg-neon-green hover:bg-bigg-neon-green/10"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      {runningOperations.length} running
                    </Button>
                  )}
                </div>

                {/* Primary Actions */}
                <div className="flex items-center space-x-2">
                  {actions.slice(0, 4).map((action) => (
                    <Button
                      key={action.id}
                      onClick={() => handleBulkAction(action)}
                      variant="outline"
                      size="sm"
                      disabled={hasRunningOperations}
                      className={cn(
                        'flex items-center space-x-1',
                        getVariantClasses(action.variant)
                      )}
                    >
                      {action.icon}
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  ))}

                  {/* More Actions Dropdown */}
                  {actions.length > 4 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={hasRunningOperations}
                          className="border-bigg-neon-green/30 text-bigg-neon-green hover:bg-bigg-neon-green/10"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-bigg-dark border-bigg-neon-green/20 text-white"
                      >
                        {actions.slice(4).map((action) => (
                          <DropdownMenuItem
                            key={action.id}
                            onClick={() => handleBulkAction(action)}
                            className={cn(
                              'text-white hover:bg-bigg-neon-green/10 focus:bg-bigg-neon-green/10',
                              action.variant === 'destructive' && 'text-red-400 hover:bg-red-500/10 focus:bg-red-500/10'
                            )}
                          >
                            {action.icon}
                            <span className="ml-2">{action.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Clear Selection */}
                <Button
                  onClick={onClear}
                  variant="ghost"
                  size="sm"
                  disabled={hasRunningOperations}
                  className="text-gray-400 hover:text-white hover:bg-gray-500/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Operation Progress Details */}
              <AnimatePresence>
                {showOperationDetails && hasRunningOperations && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-bigg-neon-green/20"
                  >
                    <div className="space-y-3">
                      {runningOperations.map((operation) => (
                        <div key={operation.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(operation.status)}
                              <span className="text-white">{operation.action}</span>
                              <Badge variant="outline" className="text-xs">
                                {operation.completed}/{operation.total}
                              </Badge>
                            </div>
                            {operation.status === 'running' && (
                              <span className="text-xs text-gray-400">
                                {Math.round((operation.completed / operation.total) * 100)}%
                              </span>
                            )}
                          </div>

                          {operation.status === 'running' && (
                            <Progress
                              value={(operation.completed / operation.total) * 100}
                              className="h-1 bg-bigg-dark"
                            />
                          )}

                          {operation.errors && operation.errors.length > 0 && (
                            <div className="text-xs text-red-400">
                              {operation.errors[0]}
                              {operation.errors.length > 1 && (
                                <span> +{operation.errors.length - 1} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Overlay (subtle) */}
      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 pointer-events-none z-40"
          />
        )}
      </AnimatePresence>
    </>
  )
}