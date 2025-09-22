'use client'

import { motion } from 'framer-motion'
import { Users, UserCheck, CheckSquare, Trophy } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface RegistrationFunnelProps {
  funnel: {
    totalRegistrations: number
    phoneVerifiedCount: number
    completedRegistrations: number
    phoneVerificationRate: number
    completionRate: number
  }
}

export function RegistrationFunnel({ funnel }: RegistrationFunnelProps) {
  const steps = [
    {
      label: 'Started Registration',
      count: funnel.totalRegistrations,
      percentage: 100,
      icon: Users,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20'
    },
    {
      label: 'Phone Verified',
      count: funnel.phoneVerifiedCount,
      percentage: funnel.phoneVerificationRate,
      icon: UserCheck,
      color: 'text-bigg-bee-orange',
      bgColor: 'bg-bigg-bee-orange/20'
    },
    {
      label: 'Completed Registration',
      count: funnel.completedRegistrations,
      percentage: funnel.completionRate,
      icon: Trophy,
      color: 'text-bigg-neon-green',
      bgColor: 'bg-bigg-neon-green/20'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {steps.map((step, index) => {
        const Icon = step.icon
        const isLast = index === steps.length - 1

        return (
          <motion.div key={step.label} variants={itemVariants}>
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-bigg-dark/20 border border-bigg-neon-green/10">
              {/* Icon */}
              <div className={`p-2 rounded-lg ${step.bgColor}`}>
                <Icon className={`w-5 h-5 ${step.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{step.label}</h4>
                  <div className="text-right">
                    <span className="text-white font-semibold text-lg">
                      {step.count.toLocaleString()}
                    </span>
                    <span className={`ml-2 text-sm ${step.color}`}>
                      {step.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-bigg-dark/50 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${step.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className={`h-2 rounded-full ${
                        step.color.includes('neon-green')
                          ? 'bg-bigg-neon-green'
                          : step.color.includes('bee-orange')
                          ? 'bg-bigg-bee-orange'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div className="flex justify-center">
                <div className="w-px h-4 bg-bigg-neon-green/20" />
              </div>
            )}
          </motion.div>
        )
      })}

      {/* Summary */}
      <motion.div
        variants={itemVariants}
        className="mt-6 p-4 rounded-lg bg-gradient-to-r from-bigg-neon-green/10 to-bigg-bee-orange/10 border border-bigg-neon-green/20"
      >
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-bigg-bee-orange font-semibold text-lg">
              {funnel.phoneVerificationRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Verification Rate</div>
          </div>
          <div>
            <div className="text-bigg-neon-green font-semibold text-lg">
              {funnel.completionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Completion Rate</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}