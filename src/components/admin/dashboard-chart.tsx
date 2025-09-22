'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Legend,
  ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ChartData {
  date: string
  count: number
}

interface DashboardChartProps {
  data: ChartData[]
}

export function DashboardChart({ data }: DashboardChartProps) {
  const [chartType, setChartType] = useState<'area' | 'line'>('area')
  const [showAverage, setShowAverage] = useState(false)

  const { chartData, stats } = useMemo(() => {
    const formattedData = data.map((item, index) => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('en-ZA', {
        month: 'short',
        day: 'numeric'
      }),
      fullDate: new Date(item.date).toLocaleDateString('en-ZA'),
      index
    }))

    const total = data.reduce((sum, item) => sum + item.count, 0)
    const average = Math.round(total / data.length)
    const maxValue = Math.max(...data.map(item => item.count))
    const minValue = Math.min(...data.map(item => item.count))

    // Calculate trend
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))
    const firstAvg = firstHalf.reduce((sum, item) => sum + item.count, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.count, 0) / secondHalf.length
    const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable'
    const trendPercentage = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0

    return {
      chartData: formattedData,
      stats: {
        total,
        average,
        maxValue,
        minValue,
        trend,
        trendPercentage: Math.abs(trendPercentage)
      }
    }
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-bigg-dark/95 backdrop-blur-xl border border-bigg-neon-green/30 rounded-lg p-4 shadow-2xl shadow-bigg-neon-green/20"
        >
          <p className="text-gray-300 text-sm font-medium mb-2">{data.fullDate}</p>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-bigg-neon-green rounded-full"></div>
            <p className="text-bigg-neon-green font-semibold text-lg">
              {payload[0].value} signups
            </p>
          </div>
          {stats.average && (
            <p className="text-xs text-gray-400 mt-1">
              {payload[0].value > stats.average ? '+' : ''}
              {payload[0].value - stats.average} vs avg
            </p>
          )}
        </motion.div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (payload.count === stats.maxValue) {
      return (
        <motion.circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#00ff88"
          stroke="#ffffff"
          strokeWidth={2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="drop-shadow-lg"
        />
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Chart Controls and Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-bigg-neon-green/30 text-bigg-neon-green">
            <Activity className="w-3 h-3 mr-1" />
            Total: {stats.total.toLocaleString()}
          </Badge>
          <Badge variant="outline" className="border-bigg-bee-orange/30 text-bigg-bee-orange">
            Avg: {stats.average}
          </Badge>
          <Badge variant="outline" className={`border-${stats.trend === 'up' ? 'green' : stats.trend === 'down' ? 'red' : 'gray'}-500/30 text-${stats.trend === 'up' ? 'green' : stats.trend === 'down' ? 'red' : 'gray'}-500`}>
            {stats.trend === 'up' ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : stats.trend === 'down' ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : (
              <Activity className="w-3 h-3 mr-1" />
            )}
            {stats.trend === 'stable' ? 'Stable' : `${stats.trendPercentage}%`}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowAverage(!showAverage)}
            variant={showAverage ? "default" : "outline"}
            size="sm"
            className="text-xs"
          >
            Avg Line
          </Button>
          <Button
            onClick={() => setChartType(chartType === 'area' ? 'line' : 'area')}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {chartType === 'area' ? 'Line' : 'Area'}
          </Button>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-80 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#00ff88" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0.05} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#00ff88" strokeOpacity={0.1} />
              <XAxis
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} />
              {showAverage && (
                <ReferenceLine
                  y={stats.average}
                  stroke="#ff8c00"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{ value: `Avg: ${stats.average}`, position: "topRight", fill: "#ff8c00", fontSize: 12 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="count"
                stroke="#00ff88"
                strokeWidth={3}
                fill="url(#signupGradient)"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: "#00ff88", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#00ff88" strokeOpacity={0.1} />
              <XAxis
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} />
              {showAverage && (
                <ReferenceLine
                  y={stats.average}
                  stroke="#ff8c00"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{ value: `Avg: ${stats.average}`, position: "topRight", fill: "#ff8c00", fontSize: 12 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00ff88"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: "#00ff88", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}