'use client'

import { create } from 'zustand'
import { nanoid } from 'nanoid'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  createdAt: Date
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string
  removeToast: (id: string) => void
  updateToast: (id: string, toast: Partial<Toast>) => void
  clearAll: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = nanoid()
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: new Date(),
      duration: toast.duration ?? (toast.type === 'loading' ? 0 : 5000)
    }

    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))

    // Auto remove after duration (except loading toasts)
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }

    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
  },

  updateToast: (id, updatedToast) => {
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id ? { ...toast, ...updatedToast } : toast
      )
    }))
  },

  clearAll: () => {
    set({ toasts: [] })
  }
}))

// Convenience functions
export const toast = {
  success: (title: string, description?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'success', title, description, ...options }),

  error: (title: string, description?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'error', title, description, duration: 7000, ...options }),

  warning: (title: string, description?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'warning', title, description, ...options }),

  info: (title: string, description?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'info', title, description, ...options }),

  loading: (title: string, description?: string) =>
    useToastStore.getState().addToast({ type: 'loading', title, description, duration: 0 }),

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
    const toastId = toast.loading(loadingMessage)

    try {
      const data = await promise
      const message = typeof successMessage === 'function' ? successMessage(data) : successMessage
      useToastStore.getState().updateToast(toastId, {
        type: 'success',
        title: message,
        duration: 5000
      })
      return data
    } catch (error) {
      const message = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage
      useToastStore.getState().updateToast(toastId, {
        type: 'error',
        title: message,
        duration: 7000
      })
      throw error
    }
  }
}