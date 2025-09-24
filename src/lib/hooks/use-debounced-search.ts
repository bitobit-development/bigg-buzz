'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseDebouncedSearchOptions {
  delay?: number
  minLength?: number
  onSearch?: (query: string) => void
}

export function useDebouncedSearch({
  delay = 300,
  minLength = 1,
  onSearch
}: UseDebouncedSearchOptions = {}) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce the search query
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length === 0) {
      setDebouncedQuery('')
      setIsSearching(false)
      return
    }

    if (query.length < minLength) {
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query)
      setIsSearching(false)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, delay, minLength])

  // Call onSearch when debounced query changes
  useEffect(() => {
    if (debouncedQuery && onSearch) {
      onSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch])

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
    setIsSearching(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Manually trigger search (bypass debounce)
  const triggerSearch = useCallback((searchQuery?: string) => {
    const searchValue = searchQuery ?? query
    if (searchValue.length >= minLength) {
      setDebouncedQuery(searchValue)
      setIsSearching(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, minLength])

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearching,
    clearSearch,
    triggerSearch
  }
}

// Hook for managing filter presets
export function useFilterPresets(storageKey: string = 'admin-filter-presets') {
  const [presets, setPresets] = useState<Record<string, any>[]>([])

  // Load presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setPresets(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error)
    }
  }, [storageKey])

  // Save preset
  const savePreset = useCallback((name: string, filters: Record<string, any>) => {
    const newPreset = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString()
    }

    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    localStorage.setItem(storageKey, JSON.stringify(updatedPresets))

    return newPreset
  }, [presets, storageKey])

  // Delete preset
  const deletePreset = useCallback((id: string) => {
    const updatedPresets = presets.filter(preset => preset.id !== id)
    setPresets(updatedPresets)
    localStorage.setItem(storageKey, JSON.stringify(updatedPresets))
  }, [presets, storageKey])

  // Apply preset
  const applyPreset = useCallback((id: string) => {
    return presets.find(preset => preset.id === id)?.filters || {}
  }, [presets])

  return {
    presets,
    savePreset,
    deletePreset,
    applyPreset
  }
}