import { useState, useEffect, useCallback } from 'react'

export interface DashboardStats {
  totalOrders: number
  deliveredOrders: number
  totalSpent: number
  thisMonthSpent: number
  thisMonthOrders: number
  averageOrderValue: number | null
  favoriteCategory: string
  memberSince: string
  currentBalance: number
}

export interface UseDashboardStatsResult {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboardStats(): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/subscribers/dashboard-stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setStats(data.stats || null)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}