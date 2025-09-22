'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Edit3,
  Mail,
  Phone,
  Trash2,
  X,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { ConfirmationDialog, useConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { AddSubscriberForm } from '@/components/admin/add-subscriber-form'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  isActive: boolean
  phoneVerified: string | null
  emailVerified: string | null
  termsAccepted: boolean
  marketingConsent: boolean
  createdAt: string
  updatedAt: string
  dateOfBirth: string | null
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    totalUsers: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function SubscribersPage() {
  // Native date formatting functions to replace date-fns
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const formatDateForFilename = (date: Date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('CUSTOMER')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('active')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<UsersResponse['pagination'] | null>(null)

  // Bulk actions
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Confirmation dialogs
  const [confirmationDialog, setConfirmationDialog] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const { toast } = useToast()
  const confirmations = useConfirmationDialog()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        search: searchTerm,
        role: roleFilter === 'all' ? '' : roleFilter,
        verified: verifiedFilter === 'all' ? '' : verifiedFilter,
        activeStatus: activeFilter,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data: UsersResponse = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        toast.error('Failed to fetch subscribers')
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error)
      toast.error('Failed to fetch subscribers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, roleFilter, verifiedFilter, activeFilter, sortBy, sortOrder])

  // Bulk selection handlers
  const toggleSelectUser = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
    setSelectAll(newSelection.size === users.length && users.length > 0)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set())
      setSelectAll(false)
    } else {
      setSelectedUsers(new Set(users.map(user => user.id)))
      setSelectAll(true)
    }
  }

  // Clear selections when users change
  useEffect(() => {
    setSelectedUsers(new Set())
    setSelectAll(false)
  }, [users])

  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, action, data })
      })

      if (response.ok) {
        try {
          const result = await response.json()
          toast.success(`Subscriber ${action} completed successfully`)
          fetchUsers() // Refresh the list
        } catch (jsonError) {
          console.error('Failed to parse success response as JSON:', jsonError)
          toast.success(`Subscriber ${action} completed successfully`)
          fetchUsers() // Refresh the list
        }
      } else {
        try {
          const error = await response.json()
          toast.error(error.error || `Failed to ${action} subscriber`)
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError)
          toast.error(`Failed to ${action} subscriber (HTTP ${response.status})`)
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      toast.error(`Failed to ${action} subscriber`)
    }
  }

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedUsers.size === 0) {
      toast.warning('No subscribers selected', 'Please select at least one subscriber to perform bulk actions.')
      return
    }

    setBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          action,
          data
        })
      })

      if (response.ok) {
        try {
          const result = await response.json()
          toast.success(`Bulk ${action} completed`, `Successfully processed ${selectedUsers.size} subscribers`)
          setSelectedUsers(new Set())
          setSelectAll(false)
          fetchUsers() // Refresh the list
        } catch (jsonError) {
          console.error('Failed to parse success response as JSON:', jsonError)
          toast.success(`Bulk ${action} completed`, `Successfully processed ${selectedUsers.size} subscribers`)
          setSelectedUsers(new Set())
          setSelectAll(false)
          fetchUsers() // Refresh the list
        }
      } else {
        try {
          const error = await response.json()
          toast.error(error.error || `Failed to perform bulk ${action}`)
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError)
          toast.error(`Failed to perform bulk ${action} (HTTP ${response.status})`)
        }
      }
    } catch (error) {
      console.error(`Failed to perform bulk ${action}:`, error)
      toast.error(`Failed to perform bulk ${action}`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const confirmDeleteUser = (user: User) => {
    setConfirmationDialog({
      ...confirmations.deleteUser(`${user.firstName} ${user.lastName}`, () =>
        handleUserAction(user.id, 'delete')
      ),
      isOpen: true,
      onClose: () => setConfirmationDialog(null)
    })
  }

  const confirmBulkDelete = () => {
    setConfirmationDialog({
      ...confirmations.bulkDelete(selectedUsers.size, () =>
        handleBulkAction('delete')
      ),
      isOpen: true,
      onClose: () => setConfirmationDialog(null)
    })
  }

  const exportUsers = async (format: 'csv' | 'json' = 'csv', includeCompliance: boolean = false) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const params = new URLSearchParams({
          format,
          search: searchTerm,
          role: roleFilter === 'all' ? '' : roleFilter,
          verified: verifiedFilter === 'all' ? '' : verifiedFilter,
          sortBy,
          sortOrder,
          includeCompliance: includeCompliance.toString()
        })

        const response = await fetch(`/api/admin/export-users?${params}`)
        if (response.ok) {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)

          // Get filename from response headers or create default
          const contentDisposition = response.headers.get('content-disposition')
          const filename = contentDisposition
            ? contentDisposition.split('filename="')[1]?.split('"')[0]
            : `bigg-buzz-users-${format === 'csv' ? 'export' : 'data'}-${formatDateForFilename(new Date())}.${format}`

          // Download file
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          resolve({ filename, format })
        } else {
          throw new Error('Export request failed')
        }
      } catch (error) {
        reject(error)
      }
    })

    toast.promise(promise, {
      loading: 'Generating export file...',
      success: (data: any) => `Export complete! Downloaded ${data.filename}`,
      error: 'Failed to export subscribers'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'ADMIN':
        return 'bg-bigg-bee-orange/20 text-bigg-bee-orange border-bigg-bee-orange/30'
      case 'VENDOR':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-bigg-neon-green/20 text-bigg-neon-green border-bigg-neon-green/30'
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-bigg-neon-green to-white bg-clip-text text-transparent">
            Subscribers
          </h1>
          <p className="text-gray-400 mt-1">
            Manage subscriber accounts and access permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-bigg-neon-green hover:bg-bigg-neon-green/80 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subscriber
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-bigg-neon-green/20 hover:border-bigg-neon-green/40"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-bigg-dark border-bigg-neon-green/20">
              <DropdownMenuItem
                onClick={() => exportUsers('csv', false)}
                className="text-white hover:bg-bigg-neon-green/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportUsers('json', false)}
                className="text-white hover:bg-bigg-neon-green/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator className="border-bigg-neon-green/20" />
              <DropdownMenuItem
                onClick={() => exportUsers('csv', true)}
                className="text-white hover:bg-bigg-neon-green/10"
              >
                <Shield className="w-4 h-4 mr-2" />
                CSV with Compliance Data
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportUsers('json', true)}
                className="text-white hover:bg-bigg-neon-green/10"
              >
                <Shield className="w-4 h-4 mr-2" />
                JSON with Compliance Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={fetchUsers}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-bigg-neon-green/20 hover:border-bigg-neon-green/40"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Filter className="w-5 h-5 mr-2 text-bigg-neon-green" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search subscribers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-bigg-dark/50 border-bigg-neon-green/20 text-white"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>

            {/* Verification Filter */}
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white">
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
                <SelectItem value="all">All Subscribers</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>

            {/* Active Status Filter */}
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-')
              setSortBy(field)
              setSortOrder(order)
            }}>
              <SelectTrigger className="bg-bigg-dark/50 border-bigg-neon-green/20 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-bigg-dark border-bigg-neon-green/20">
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="firstName-asc">Name A-Z</SelectItem>
                <SelectItem value="firstName-desc">Name Z-A</SelectItem>
                <SelectItem value="role-asc">Role A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedUsers.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="border-bigg-neon-green/30 bg-bigg-dark/95 backdrop-blur-xl shadow-2xl shadow-bigg-neon-green/20">
            <CardContent className="flex items-center space-x-4 p-4">
              <div className="text-sm text-white font-medium">
                {selectedUsers.size} subscriber{selectedUsers.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleBulkAction('activate')}
                  disabled={bulkActionLoading}
                  variant="outline"
                  size="sm"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  Activate
                </Button>
                <Button
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={bulkActionLoading}
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Deactivate
                </Button>
                <Button
                  onClick={confirmBulkDelete}
                  disabled={bulkActionLoading}
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
                <Button
                  onClick={() => setSelectedUsers(new Set())}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Subscribers Table */}
      <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              Subscribers
              {selectedUsers.size > 0 && (
                <Badge className="ml-2 bg-bigg-neon-green/20 text-bigg-neon-green">
                  {selectedUsers.size} selected
                </Badge>
              )}
            </CardTitle>
            {pagination && (
              <div className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-bigg-neon-green/20">
                    <TableHead className="text-gray-300 w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={toggleSelectAll}
                        className="border-bigg-neon-green/30 data-[state=checked]:bg-bigg-neon-green data-[state=checked]:border-bigg-neon-green"
                      />
                    </TableHead>
                    <TableHead className="text-gray-300">Subscriber</TableHead>
                    <TableHead className="text-gray-300">Contact</TableHead>
                    <TableHead className="text-gray-300">Role</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Registered</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-bigg-neon-green/10 hover:bg-bigg-neon-green/5">
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                          className="border-bigg-neon-green/30 data-[state=checked]:bg-bigg-neon-green data-[state=checked]:border-bigg-neon-green"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8 border border-bigg-neon-green/20">
                            <AvatarFallback className="bg-gradient-to-r from-bigg-neon-green/20 to-bigg-bee-orange/20 text-white text-xs">
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-white font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center space-x-1 text-xs text-gray-300">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-32">{user.email}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 text-xs text-gray-300">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {user.isActive ? (
                              <Badge className="bg-bigg-neon-green/20 text-bigg-neon-green border-bigg-neon-green/30">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            {user.phoneVerified ? (
                              <span className="text-bigg-neon-green">✓ Phone</span>
                            ) : (
                              <span className="text-gray-400">✗ Phone</span>
                            )}
                            {user.termsAccepted ? (
                              <span className="text-bigg-neon-green">✓ Terms</span>
                            ) : (
                              <span className="text-gray-400">✗ Terms</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-300">
                          {formatDate(user.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-bigg-dark border-bigg-neon-green/20">
                            <DropdownMenuItem className="text-white hover:bg-bigg-neon-green/10">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user.id, 'toggle-active', { isActive: user.isActive })}
                              className="text-white hover:bg-bigg-neon-green/10"
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="border-bigg-neon-green/20" />
                            <DropdownMenuItem className="text-white hover:bg-bigg-neon-green/10">
                              <Shield className="w-4 h-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDeleteUser(user)}
                              className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Subscriber
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalUsers)} of{' '}
                {pagination.totalUsers} subscribers
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="border-bigg-neon-green/20 hover:border-bigg-neon-green/40"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="border-bigg-neon-green/20 hover:border-bigg-neon-green/40"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {confirmationDialog && (
        <ConfirmationDialog
          {...confirmationDialog}
          loading={bulkActionLoading}
        />
      )}

      {/* Add Subscriber Form */}
      <AddSubscriberForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false)
          fetchUsers()
        }}
      />
    </div>
  )
}