'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'

interface RoleData {
  role: string
  count: number
}

interface RoleDistributionChartProps {
  data: RoleData[]
}

const COLORS = {
  'CUSTOMER': '#39FF14',
  'VENDOR': '#FF6B35',
  'ADMIN': '#FFD700',
  'SUPER_ADMIN': '#FF1744'
}

const ROLE_LABELS = {
  'CUSTOMER': 'Customers',
  'VENDOR': 'Vendors',
  'ADMIN': 'Admins',
  'SUPER_ADMIN': 'Super Admins'
}

export function RoleDistributionChart({ data }: RoleDistributionChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.count, 0)

    return data.map(item => ({
      name: ROLE_LABELS[item.role as keyof typeof ROLE_LABELS] || item.role,
      value: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0',
      color: COLORS[item.role as keyof typeof COLORS] || '#9CA3AF'
    }))
  }, [data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-bigg-dark/90 backdrop-blur-xl border border-bigg-neon-green/30 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-gray-300 text-sm">
            Count: <span className="font-semibold">{data.value}</span>
          </p>
          <p className="text-gray-300 text-sm">
            Percentage: <span className="font-semibold">{data.percentage}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (parseFloat(percentage) < 5) return null // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="semibold"
      >
        {`${percentage}%`}
      </text>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No role data available</p>
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1000}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ color: '#fff', fontSize: '12px' }}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}