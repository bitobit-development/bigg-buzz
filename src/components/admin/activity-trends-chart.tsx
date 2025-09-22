'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

interface ActivityData {
  date: string
  newUsers: number
  verifiedUsers: number
}

interface ActivityTrendsChartProps {
  data: ActivityData[]
}

export function ActivityTrendsChart({ data }: ActivityTrendsChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('en-ZA', {
        month: 'short',
        day: 'numeric'
      }),
      verificationRate: item.newUsers > 0 ? (item.verifiedUsers / item.newUsers) * 100 : 0
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bigg-dark/90 backdrop-blur-xl border border-bigg-neon-green/30 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm mb-2">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.dataKey === 'verificationRate' ? '%' : ''}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#39FF14" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="verifiedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#39FF14" strokeOpacity={0.1} />

          <XAxis
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />

          <YAxis
            yAxisId="users"
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />

          <YAxis
            yAxisId="rate"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            domain={[0, 100]}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ color: '#fff', fontSize: '12px' }}
            iconType="rect"
          />

          <Bar
            yAxisId="users"
            dataKey="newUsers"
            fill="url(#newUsersGradient)"
            stroke="#39FF14"
            strokeWidth={1}
            name="New Users"
            radius={[2, 2, 0, 0]}
          />

          <Bar
            yAxisId="users"
            dataKey="verifiedUsers"
            fill="url(#verifiedGradient)"
            stroke="#FF6B35"
            strokeWidth={1}
            name="Verified Users"
            radius={[2, 2, 0, 0]}
          />

          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="verificationRate"
            stroke="#FFD700"
            strokeWidth={3}
            dot={{ fill: '#FFD700', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#FFD700', strokeWidth: 2 }}
            name="Verification Rate (%)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}