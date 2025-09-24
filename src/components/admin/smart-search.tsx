'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Clock,
  User,
  Mail,
  Phone,
  Shield,
  Star,
  TrendingUp,
  Filter
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  id: string
  type: 'user' | 'filter' | 'recent' | 'suggestion'
  title: string
  description?: string
  category?: string
  icon?: React.ReactNode
  value: string
}

interface FilterPreset {
  id: string
  name: string
  filters: Record<string, string>
  icon?: React.ReactNode
  color?: string
}

interface SmartSearchProps {
  placeholder?: string
  value: string
  onValueChange: (value: string) => void
  onSearch?: (query: string) => void
  onFilterPreset?: (preset: FilterPreset) => void
  className?: string
  showSuggestions?: boolean
  maxSuggestions?: number
}

// Mock data for suggestions and presets
const mockFilterPresets: FilterPreset[] = [
  {
    id: 'verified-users',
    name: 'Verified Users',
    filters: { verified: 'true', activeStatus: 'active' },
    icon: <Shield className="w-4 h-4" />,
    color: 'text-bigg-neon-green'
  },
  {
    id: 'new-signups',
    name: 'New Signups (7 days)',
    filters: { sortBy: 'createdAt', sortOrder: 'desc' },
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-bigg-bee-orange'
  },
  {
    id: 'unverified-users',
    name: 'Unverified Users',
    filters: { verified: 'false' },
    icon: <User className="w-4 h-4" />,
    color: 'text-yellow-400'
  },
  {
    id: 'admins',
    name: 'Admin Users',
    filters: { role: 'ADMIN' },
    icon: <Star className="w-4 h-4" />,
    color: 'text-purple-400'
  }
]

const searchCategories = [
  { value: 'email:', label: 'Email', icon: <Mail className="w-3 h-3" /> },
  { value: 'phone:', label: 'Phone', icon: <Phone className="w-3 h-3" /> },
  { value: 'name:', label: 'Name', icon: <User className="w-3 h-3" /> },
  { value: 'role:', label: 'Role', icon: <Shield className="w-3 h-3" /> }
]

export function SmartSearch({
  placeholder = "Search users, emails, phones...",
  value,
  onValueChange,
  onSearch,
  onFilterPreset,
  className,
  showSuggestions = true,
  maxSuggestions = 8
}: SmartSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bigg-buzz-recent-searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error)
    }
  }, [])

  // Generate suggestions based on input
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = []
    const lowercaseQuery = query.toLowerCase()

    // Add filter presets if they match
    mockFilterPresets.forEach(preset => {
      if (preset.name.toLowerCase().includes(lowercaseQuery)) {
        suggestions.push({
          id: `preset-${preset.id}`,
          type: 'filter',
          title: preset.name,
          description: `Filter: ${Object.entries(preset.filters).map(([k, v]) => `${k}:${v}`).join(', ')}`,
          icon: preset.icon,
          value: preset.name,
          category: 'Filter Presets'
        })
      }
    })

    // Add search categories if query matches
    searchCategories.forEach(category => {
      if (category.label.toLowerCase().includes(lowercaseQuery) ||
          category.value.includes(lowercaseQuery)) {
        suggestions.push({
          id: `category-${category.value}`,
          type: 'suggestion',
          title: `Search by ${category.label}`,
          description: `Use "${category.value}" to search by ${category.label.toLowerCase()}`,
          icon: category.icon,
          value: category.value,
          category: 'Search Categories'
        })
      }
    })

    // Add recent searches
    recentSearches.forEach((search, index) => {
      if (search.toLowerCase().includes(lowercaseQuery) && search !== query) {
        suggestions.push({
          id: `recent-${index}`,
          type: 'recent',
          title: search,
          icon: <Clock className="w-4 h-4" />,
          value: search,
          category: 'Recent Searches'
        })
      }
    })

    return suggestions.slice(0, maxSuggestions)
  }, [recentSearches, maxSuggestions])

  // Update suggestions when query changes
  useEffect(() => {
    if (value.trim() && showSuggestions) {
      setSuggestions(generateSuggestions(value))
    } else {
      setSuggestions([])
    }
    setSelectedIndex(-1)
  }, [value, generateSuggestions, showSuggestions])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onValueChange(newValue)
    setShowDropdown(true)
  }

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true)
    setShowDropdown(true)
  }

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding dropdown to allow for suggestion clicks
    setTimeout(() => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
        setIsFocused(false)
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }, 150)
  }

  // Handle search execution
  const executeSearch = (searchValue: string) => {
    if (searchValue.trim()) {
      // Save to recent searches
      const newRecentSearches = [
        searchValue,
        ...recentSearches.filter(s => s !== searchValue)
      ].slice(0, 5)

      setRecentSearches(newRecentSearches)
      localStorage.setItem('bigg-buzz-recent-searches', JSON.stringify(newRecentSearches))

      onSearch?.(searchValue)
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'filter') {
      // Find and apply filter preset
      const preset = mockFilterPresets.find(p => p.name === suggestion.value)
      if (preset && onFilterPreset) {
        onFilterPreset(preset)
        onValueChange('')
      }
    } else {
      onValueChange(suggestion.value)
      executeSearch(suggestion.value)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        executeSearch(value)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex])
        } else {
          executeSearch(value)
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Clear search
  const handleClear = () => {
    onValueChange('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const category = suggestion.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(suggestion)
    return groups
  }, {} as Record<string, SearchSuggestion[]>)

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-10 bg-bigg-dark/50 border-bigg-neon-green/20 text-white placeholder-gray-400",
            "focus:border-bigg-neon-green focus:ring-1 focus:ring-bigg-neon-green/50",
            isFocused && "border-bigg-neon-green"
          )}
        />

        {/* Clear Button */}
        {value && (
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showDropdown && (suggestions.length > 0 || recentSearches.length > 0) && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <div className="bg-bigg-dark/95 backdrop-blur-xl border border-bigg-neon-green/20 rounded-lg shadow-2xl shadow-bigg-neon-green/10 max-h-80 overflow-y-auto">
              {/* Filter Presets */}
              {!value && (
                <div className="p-3 border-b border-bigg-neon-green/10">
                  <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center">
                    <Filter className="w-3 h-3 mr-1" />
                    Quick Filters
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {mockFilterPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleSuggestionSelect({
                          id: preset.id,
                          type: 'filter',
                          title: preset.name,
                          value: preset.name
                        })}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-bigg-neon-green/10 text-left transition-colors"
                      >
                        <span className={preset.color}>{preset.icon}</span>
                        <span className="text-sm text-white truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions by Category */}
              {Object.entries(groupedSuggestions).map(([category, categoryItems]) => (
                <div key={category} className="p-2">
                  <div className="text-xs font-semibold text-gray-400 mb-1 px-2">
                    {category}
                  </div>
                  {categoryItems.map((suggestion, index) => {
                    const globalIndex = suggestions.indexOf(suggestion)
                    return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors",
                          "hover:bg-bigg-neon-green/10",
                          selectedIndex === globalIndex && "bg-bigg-neon-green/20"
                        )}
                      >
                        <span className="text-gray-400 flex-shrink-0">
                          {suggestion.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            {suggestion.title}
                          </div>
                          {suggestion.description && (
                            <div className="text-xs text-gray-400 truncate">
                              {suggestion.description}
                            </div>
                          )}
                        </div>
                        {suggestion.type === 'filter' && (
                          <Badge className="bg-bigg-neon-green/20 text-bigg-neon-green border-bigg-neon-green/30 text-xs">
                            Filter
                          </Badge>
                        )}
                        {suggestion.type === 'recent' && (
                          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                            Recent
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}

              {/* No suggestions */}
              {suggestions.length === 0 && value && (
                <div className="p-4 text-center text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No suggestions found</p>
                  <p className="text-xs">Press Enter to search for "{value}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}