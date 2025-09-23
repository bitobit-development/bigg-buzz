import { useState, useEffect, useCallback } from 'react'

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  priceAtOrder: number
  variant: any
  product: {
    id: string
    name: string
    price: number
    images: string[]
    category: string
    vendor: {
      id: string
      name: string
    }
  }
}

export interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  total: number
  subtotal: number
  tax: number
  deliveryAddress: any
  deliveryMethod: 'STANDARD' | 'EXPRESS' | 'PICKUP' | 'DRONE'
  estimatedDelivery: string | null
  actualDelivery: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export interface OrderFilters {
  status?: string
  startDate?: string
  endDate?: string
  minTotal?: number
  maxTotal?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface OrderPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface UseOrdersResult {
  orders: Order[]
  pagination: OrderPagination | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOrders(
  filters: OrderFilters = {},
  page: number = 1,
  limit: number = 10
): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<OrderPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc'
      })

      if (filters.status) {
        params.append('status', filters.status)
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }
      if (filters.minTotal !== undefined) {
        params.append('minTotal', filters.minTotal.toString())
      }
      if (filters.maxTotal !== undefined) {
        params.append('maxTotal', filters.maxTotal.toString())
      }

      const response = await fetch(`/api/orders?${params}`, {
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
      setOrders(data.orders || [])
      setPagination(data.pagination || null)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      setOrders([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.startDate, filters.endDate, filters.minTotal, filters.maxTotal, filters.sortBy, filters.sortOrder, page, limit])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    pagination,
    loading,
    error,
    refetch: fetchOrders
  }
}