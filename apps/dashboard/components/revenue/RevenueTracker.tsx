'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { formatNumber } from '@/lib/format'

interface RevenueData {
  mrr: number
  arr: number
  goal: number
  growth: number
  clients: number
  churnRate: number
}

export function RevenueTracker() {
  const [data, setData] = useState<RevenueData>({
    mrr: 8500,
    arr: 102000,
    goal: 1000000,
    growth: 12.5,
    clients: 24,
    churnRate: 2.1,
  })

  const progress = (data.arr / data.goal) * 100

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        mrr: prev.mrr + Math.floor(Math.random() * 100 - 50),
        growth: +(prev.growth + (Math.random() - 0.5)).toFixed(1),
      }))
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-neutral-900/80 border border-emerald-500/20 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">💰 Revenue Tracker</h2>
          <p className="text-sm text-neutral-400">$1M ARR Goal 2026</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400">${formatNumber(data.arr)}</div>
          <div className="text-xs text-neutral-400">ARR</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-400">Progress to $1M</span>
          <span className="text-emerald-400 font-medium">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-neutral-800/50 rounded-xl">
          <div className="text-lg font-bold text-white">${formatNumber(data.mrr)}</div>
          <div className="text-xs text-neutral-400">MRR</div>
        </div>
        <div className="text-center p-3 bg-neutral-800/50 rounded-xl">
          <div className="text-lg font-bold text-emerald-400">+{data.growth}%</div>
          <div className="text-xs text-neutral-400">Growth</div>
        </div>
        <div className="text-center p-3 bg-neutral-800/50 rounded-xl">
          <div className="text-lg font-bold text-white">{data.clients}</div>
          <div className="text-xs text-neutral-400">Clients</div>
        </div>
      </div>

      {/* Churn Alert */}
      {data.churnRate > 3 && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <span className="text-red-400 text-sm">⚠️ Churn Rate: {data.churnRate}%</span>
        </div>
      )}
    </motion.div>
  )
}
