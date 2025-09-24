'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserCheck,
  TrendingUp,
  Calendar,
  Activity,
  Shield,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardChart } from '@/components/admin/dashboard-chart'
import { RecentRegistrations } from '@/components/admin/recent-registrations'
import { RegistrationFunnel } from '@/components/admin/registration-funnel'
import { GeographicDistribution } from '@/components/admin/geographic-distribution'
import { ActivityTrendsChart } from '@/components/admin/activity-trends-chart'
import { RoleDistributionChart } from '@/components/admin/role-distribution-chart'
import { AutoRefreshIndicator } from '@/components/admin/auto-refresh-indicator'

interface DashboardStats {
  totalUsers: number
  verifiedUsers: number
  dailySignups: number
  weeklySignups: number
  monthlySignups: number
  registrationFunnel: {
    totalRegistrations: number
    phoneVerifiedCount: number
    completedRegistrations: number
    phoneVerificationRate: number
    completionRate: number
  }
  recentRegistrations: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    phoneVerified: string | null
    termsAccepted: boolean
    createdAt: string
    role: string
  }>
  roleDistribution: Array<{
    role: string
    count: number
  }>
  dailyTrend: Array<{
    date: string
    count: number
  }>
  geographicDistribution: Array<{
    region: string
    count: number
  }>
  activityTrends: Array<{
    date: string
    newUsers: number
    verifiedUsers: number
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [fetchError, setFetchError] = useState<Error | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const response = await fetch('/api/admin/dashboard-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setLastUpdated(new Date())
      } else {
        const error = new Error(`Failed to fetch dashboard stats: ${response.status}`)
        setFetchError(error)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      const err = error instanceof Error ? error : new Error('Unknown error occurred')
      setFetchError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-bigg-neon-green/20">
              <CardHeader>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-bigg-neon-green/20">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card className="border-bigg-neon-green/20">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Failed to load dashboard data</p>
          <Button onClick={fetchStats} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-bigg-neon-green to-white bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor user registrations and system health
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <AutoRefreshIndicator
          onRefresh={fetchStats}
          isLoading={loading}
          lastRefresh={lastUpdated}
          error={fetchError}
          defaultInterval={300000}
          showProgress={true}
          showLastRefresh={true}
        />
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-bigg-neon-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-500">
              +{stats.monthlySignups} this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-bigg-bee-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.verifiedUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-500">
              {((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)}% verification rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Today&apos;s Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-bigg-neon-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.dailySignups}</div>
            <p className="text-xs text-gray-500">
              +{stats.weeklySignups} this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-bigg-bee-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.registrationFunnel.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              Registration completion
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signup Trends Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-bigg-neon-green" />
                Signup Trends (30 Days)
              </CardTitle>
              <CardDescription className="text-gray-400">
                Daily user registrations over the past month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardChart data={stats.dailyTrend} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Registration Funnel */}
        <motion.div variants={itemVariants}>
          <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-bigg-bee-orange" />
                Registration Funnel
              </CardTitle>
              <CardDescription className="text-gray-400">
                User progression through registration steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationFunnel funnel={stats.registrationFunnel} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trends */}
        <motion.div variants={itemVariants}>
          <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-bigg-neon-green" />
                Activity Trends (7 Days)
              </CardTitle>
              <CardDescription className="text-gray-400">
                New users vs verified users with verification rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTrendsChart data={stats.activityTrends} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Role Distribution Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-bigg-bee-orange" />
                Role Distribution Chart
              </CardTitle>
              <CardDescription className="text-gray-400">
                Visual breakdown of user roles in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleDistributionChart data={stats.roleDistribution} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Registrations & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <motion.div variants={itemVariants}>
          <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-bigg-neon-green" />
                Recent Registrations
              </CardTitle>
              <CardDescription className="text-gray-400">
                Latest user sign-ups and their verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentRegistrations registrations={stats.recentRegistrations} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Geographic Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="border-bigg-neon-green/20 bg-bigg-dark/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-bigg-neon-green" />
                Geographic Distribution
              </CardTitle>
              <CardDescription className="text-gray-400">
                User distribution across South African regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeographicDistribution data={stats.geographicDistribution} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </motion.div>
  )
}