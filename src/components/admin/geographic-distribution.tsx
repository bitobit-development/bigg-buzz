'use client'

import { motion } from 'framer-motion'
import { MapPin, Users } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface GeographicData {
  region: string
  count: number
}

interface GeographicDistributionProps {
  data: GeographicData[]
}

export function GeographicDistribution({ data }: GeographicDistributionProps) {
  const totalUsers = data.reduce((sum, item) => sum + item.count, 0)
  const sortedData = [...data].sort((a, b) => b.count - a.count)

  const getRegionColor = (index: number) => {
    const colors = [
      'bg-bigg-neon-green/20 text-bigg-neon-green border-bigg-neon-green/30',
      'bg-bigg-bee-orange/20 text-bigg-bee-orange border-bigg-bee-orange/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'bg-green-500/20 text-green-400 border-green-500/30',
      'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    ]
    return colors[index % colors.length] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

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
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 }
    }
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <div className="text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No geographic data available</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-bigg-neon-green" />
          <span className="text-white font-medium">Regional Distribution</span>
        </div>
        <Badge className="bg-bigg-dark/50 text-gray-300 border-bigg-neon-green/20">
          <Users className="w-3 h-3 mr-1" />
          {totalUsers} Total
        </Badge>
      </div>

      {/* Distribution List */}
      <div className="space-y-3">
        {sortedData.map((region, index) => {
          const percentage = totalUsers > 0 ? (region.count / totalUsers) * 100 : 0

          return (
            <motion.div
              key={region.region}
              variants={itemVariants}
              className="flex items-center space-x-4 p-3 rounded-lg bg-bigg-dark/20 border border-bigg-neon-green/10 hover:border-bigg-neon-green/20 transition-all duration-200"
            >
              {/* Region Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getRegionColor(index)}>
                      #{index + 1}
                    </Badge>
                    <span className="text-white font-medium">
                      {region.region}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-semibold">
                      {region.count.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-bigg-dark/50 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-bigg-neon-green' :
                        index === 1 ? 'bg-bigg-bee-orange' :
                        index === 2 ? 'bg-purple-500' :
                        index === 3 ? 'bg-blue-500' :
                        index === 4 ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <motion.div
        variants={itemVariants}
        className="mt-6 p-4 rounded-lg bg-gradient-to-r from-bigg-neon-green/10 to-bigg-bee-orange/10 border border-bigg-neon-green/20"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-bigg-neon-green font-semibold text-lg">
              {sortedData.length}
            </div>
            <div className="text-xs text-gray-400">Regions</div>
          </div>
          <div>
            <div className="text-bigg-bee-orange font-semibold text-lg">
              {sortedData[0]?.region || 'N/A'}
            </div>
            <div className="text-xs text-gray-400">Top Region</div>
          </div>
          <div>
            <div className="text-bigg-neon-green font-semibold text-lg">
              {sortedData[0] ? ((sortedData[0].count / totalUsers) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-gray-400">Market Share</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}