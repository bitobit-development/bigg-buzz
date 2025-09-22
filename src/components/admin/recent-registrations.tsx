'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Clock, User, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Registration {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  phoneVerified: string | null
  termsAccepted: boolean
  createdAt: string
  role: string
}

interface RecentRegistrationsProps {
  registrations: Registration[]
}

export function RecentRegistrations({ registrations }: RecentRegistrationsProps) {
  // Native date formatting functions to replace date-fns
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const day = date.getDate().toString().padStart(2, '0')
    return `${month} ${day}`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const getStatusInfo = (registration: Registration) => {
    if (registration.phoneVerified && registration.termsAccepted) {
      return {
        status: 'completed',
        label: 'Completed',
        color: 'bg-bigg-neon-green/20 text-bigg-neon-green border-bigg-neon-green/30',
        icon: CheckCircle
      }
    } else if (registration.phoneVerified) {
      return {
        status: 'verified',
        label: 'Phone Verified',
        color: 'bg-bigg-bee-orange/20 text-bigg-bee-orange border-bigg-bee-orange/30',
        icon: CheckCircle
      }
    } else {
      return {
        status: 'pending',
        label: 'Pending',
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: Clock
      }
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  }

  if (registrations.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <div className="text-center">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No recent registrations</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {registrations.map((registration) => {
        const statusInfo = getStatusInfo(registration)
        const StatusIcon = statusInfo.icon

        return (
          <motion.div
            key={registration.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-4 p-4 rounded-lg bg-bigg-dark/30 border border-bigg-neon-green/10 hover:border-bigg-neon-green/20 transition-all duration-200"
          >
            {/* Avatar */}
            <Avatar className="w-10 h-10 border-2 border-bigg-neon-green/20">
              <AvatarFallback className="bg-gradient-to-r from-bigg-neon-green/20 to-bigg-bee-orange/20 text-white font-semibold text-sm">
                {getInitials(registration.firstName, registration.lastName)}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-white font-semibold truncate">
                  {registration.firstName} {registration.lastName}
                </h4>
                <Badge className={statusInfo.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="flex items-center space-x-4 text-xs text-gray-400">
                {registration.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-32">{registration.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>{registration.phone}</span>
                </div>
              </div>
            </div>

            {/* Registration Time */}
            <div className="text-right">
              <div className="text-xs text-gray-400">
                {formatDate(registration.createdAt)}
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(registration.createdAt)}
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}