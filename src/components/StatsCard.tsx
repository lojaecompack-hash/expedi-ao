'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: LucideIcon
  iconBgColor: string
  iconColor: string
  delay?: number
  loading?: boolean
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
  delay = 0,
  loading = false
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-600">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {loading ? '...' : value}
          </p>
          <p className="text-sm text-zinc-600 mt-2">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
  )
}
