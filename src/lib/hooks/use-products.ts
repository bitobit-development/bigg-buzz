'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Types for the products API
export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  strain?: string;
  inStock?: boolean;
  vendorId?: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  strain?: string;
  thcContent?: number;
  cbdContent?: number;
  weight?: number;
  inStock: boolean;
  stockQuantity: number;
  images: string[];
  vendorId: string;
  sku: string;
  compliance?: any;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}

export interface UiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  thc: string;
  cbd: string;
  strain: string;
  weight: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  stockQuantity: number;
  vendor: string;
  image: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UseProductsResult {
  products: UiProduct[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  refetch: () => void;
}

// Transform API product to UI product format
export const transformApiProduct = (apiProduct: ApiProduct): UiProduct => {
  const formatPercentage = (value?: number) => {
    if (!value) return '0%';
    return `${value.toFixed(1)}%`;
  };

  const formatWeight = (weight?: number) => {
    if (!weight) return '3.5g'; // Default weight
    return `${weight}g`;
  };

  const formatStrain = (strain?: string, category?: string) => {
    if (strain) return strain;
    // Default strain based on category
    switch (category?.toLowerCase()) {
      case 'flower': return 'Hybrid';
      case 'edibles': return 'Indica';
      case 'concentrates': return 'Sativa';
      case 'wellness': return 'CBD';
      default: return 'Hybrid';
    }
  };

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description,
    price: apiProduct.price,
    category: apiProduct.category.toLowerCase(),
    thc: formatPercentage(apiProduct.thcContent),
    cbd: formatPercentage(apiProduct.cbdContent),
    strain: formatStrain(apiProduct.strain, apiProduct.category),
    weight: formatWeight(apiProduct.weight),
    rating: 4.5, // Default until reviews system is implemented
    reviews: 0,  // Default until reviews system is implemented
    inStock: apiProduct.inStock,
    stockQuantity: apiProduct.stockQuantity,
    vendor: apiProduct.vendor.name,
    image: apiProduct.images?.[0] || '/api/placeholder/300/200'
  };
};

export const useProducts = (
  filters: ProductFilters = {},
  page: number = 1,
  limit: number = 50
): UseProductsResult => {
  const [products, setProducts] = useState<UiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Debug logging
  const debugLog = (message: string, data?: any) => {
    console.log(`[useProducts] ${message}`, data || '');
  };

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => {
    const filters_obj = {
      category: filters.category,
      search: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      strain: filters.strain,
      inStock: filters.inStock,
      vendorId: filters.vendorId
    };
    debugLog('Filters memoized:', filters_obj);
    return filters_obj;
  }, [
    filters.category,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.strain,
    filters.inStock,
    filters.vendorId
  ]);

  const fetchProducts = useCallback(async () => {
    debugLog('fetchProducts called', { isMounted: isMountedRef.current });

    // Prevent fetch if component is unmounted
    if (!isMountedRef.current) {
      debugLog('Component unmounted, skipping fetch');
      return;
    }

    debugLog('Starting fetch, setting loading=true');
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const searchParams = new URLSearchParams();

      // Add pagination
      searchParams.set('page', page.toString());
      searchParams.set('limit', limit.toString());

      // Add filters using memoized values
      if (memoizedFilters.category && memoizedFilters.category !== 'all') {
        searchParams.set('category', memoizedFilters.category.toUpperCase());
      }
      if (memoizedFilters.search) {
        searchParams.set('search', memoizedFilters.search);
      }
      if (memoizedFilters.minPrice !== undefined) {
        searchParams.set('minPrice', memoizedFilters.minPrice.toString());
      }
      if (memoizedFilters.maxPrice !== undefined) {
        searchParams.set('maxPrice', memoizedFilters.maxPrice.toString());
      }
      if (memoizedFilters.strain) {
        searchParams.set('strain', memoizedFilters.strain);
      }
      if (memoizedFilters.inStock !== undefined) {
        searchParams.set('inStock', memoizedFilters.inStock.toString());
      }
      if (memoizedFilters.vendorId) {
        searchParams.set('vendorId', memoizedFilters.vendorId);
      }

      // Add sorting
      searchParams.set('sortBy', 'name');
      searchParams.set('sortOrder', 'asc');

      const url = `/api/products?${searchParams.toString()}`;
      debugLog('Making API request to:', url);

      const response = await fetch(url);
      debugLog('API response received:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      debugLog('API data parsed:', { productsCount: data.products?.length, pagination: data.pagination });

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        debugLog('Component unmounted during fetch, discarding data');
        return;
      }

      // Transform API products to UI format
      const transformedProducts = data.products.map(transformApiProduct);
      debugLog('Products transformed:', { transformedCount: transformedProducts.length });

      setProducts(transformedProducts);
      setPagination(data.pagination);
      debugLog('State updated successfully');

    } catch (err) {
      console.error('Error fetching products:', err);
      debugLog('Error occurred:', err);

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        debugLog('Component unmounted during error, not updating state');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]); // Clear products on error
      debugLog('Error state updated');
    } finally {
      // Always try to set loading to false, but check if component is mounted
      debugLog('Finally block executing', { isMounted: isMountedRef.current });
      if (isMountedRef.current) {
        debugLog('Setting loading=false');
        setLoading(false);
      } else {
        debugLog('Component unmounted, not setting loading=false');
      }
    }
  }, [memoizedFilters, page, limit]);

  useEffect(() => {
    debugLog('useEffect triggered, calling fetchProducts');
    fetchProducts();
  }, [fetchProducts]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    // Set mounted ref on mount
    isMountedRef.current = true;
    debugLog('Component mounted');

    return () => {
      debugLog('Component unmounting');
      isMountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(() => {
    debugLog('refetch called', { isMounted: isMountedRef.current });
    if (isMountedRef.current) {
      fetchProducts();
    } else {
      debugLog('Component unmounted, not refetching');
    }
  }, [fetchProducts]);

  debugLog('Hook returning state', {
    productsCount: products.length,
    loading,
    error: !!error,
    isMounted: isMountedRef.current
  });

  return {
    products,
    loading,
    error,
    pagination,
    refetch
  };
};