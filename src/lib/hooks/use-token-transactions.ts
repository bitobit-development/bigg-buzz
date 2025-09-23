import { useState, useEffect, useCallback } from 'react'

export interface TokenTransaction {
  id: string
  type: 'PURCHASE' | 'REFUND' | 'DEPOSIT' | 'WITHDRAWAL' | 'BONUS' | 'PENALTY' | 'ADJUSTMENT'
  amount: number
  balance: number
  description: string | null
  reference: string | null
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  createdAt: string
  processedAt: string | null
  order: {
    id: string
    orderNumber: string
    status: string
  } | null
  metadata: any
}

export interface TokenTransactionFilters {
  type?: string
}

export interface TokenTransactionPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface UseTokenTransactionsResult {
  transactions: TokenTransaction[]
  pagination: TokenTransactionPagination | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTokenTransactions(
  filters: TokenTransactionFilters = {},
  page: number = 1,
  limit: number = 10
): UseTokenTransactionsResult {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const [pagination, setPagination] = useState<TokenTransactionPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (filters.type) {
        params.append('type', filters.type)
      }

      const response = await fetch(`/api/subscribers/token-transactions?${params}`, {
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
      setTransactions(data.transactions || [])
      setPagination(data.pagination || null)
    } catch (err) {
      console.error('Error fetching token transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch token transactions')
      setTransactions([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [filters.type, page, limit])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    pagination,
    loading,
    error,
    refetch: fetchTransactions
  }
}