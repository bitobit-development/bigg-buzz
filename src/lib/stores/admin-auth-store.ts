import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  isActive: boolean
  firstName: string
  lastName: string
}

interface AdminAuthState {
  // State
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: AdminUser | null) => void
  setLoading: (loading: boolean) => void
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
  refresh: () => Promise<void>
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      login: async (username, password) => {
        set({ isLoading: true })

        try {
          const response = await fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Login failed')
          }

          if (data.success && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            })

            return { success: true }
          } else {
            throw new Error(data.error || 'Login failed')
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })

          const errorMessage = error instanceof Error ? error.message : 'Login failed'
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        set({ isLoading: true })

        try {
          // Call logout API to clear cookie
          await fetch('/api/admin/auth/logout', {
            method: 'POST',
          })
        } catch (error) {
          console.error('Logout API error:', error)
        } finally {
          // Always clear local state regardless of API call result
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      checkAuth: async () => {
        set({ isLoading: true })

        try {
          const response = await fetch('/api/admin/auth/me', {
            method: 'GET',
            credentials: 'include', // Include cookies
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.user) {
              set({
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
              })
              return true
            }
          }

          // If we get here, auth check failed
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
          return false
        } catch (error) {
          console.error('Auth check error:', error)
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
          return false
        }
      },

      refresh: async () => {
        await get().checkAuth()
      },
    }),
    {
      name: 'admin-auth-storage',
      // Only persist user and isAuthenticated, not isLoading
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)