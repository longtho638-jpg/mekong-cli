'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  GitBranch,
  Cpu,
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Loader2,
} from 'lucide-react'
import { fetchBridgeStatus, refreshBridgeStatus } from '@/lib/api/bridge-api'
import type { BridgeStatus, RateLimitStatus, UsageStats } from '@/lib/api/bridge-api'
import { BridgeErrorBoundary } from './BridgeErrorBoundary'

/**
 * UnifiedBridgeWidget - Real API Integration
 * "Dễ như ăn kẹo!" - Easy as candy!
 */
function UnifiedBridgeWidgetCore() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null)
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadBridgeData()
  }, [])

  // Countdown timer for rate limit reset
  useEffect(() => {
    if (!rateLimit) return

    const timer = setInterval(() => {
      setRateLimit((prev) =>
        prev
          ? {
              ...prev,
              resetIn: Math.max(0, prev.resetIn - 1),
            }
          : null
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [rateLimit])

  async function loadBridgeData() {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchBridgeStatus()
      setBridgeStatus(data.status)
      setRateLimit(data.rateLimit)
      setUsageStats(data.usage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bridge data')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRefresh() {
    try {
      setIsRefreshing(true)
      setError(null)
      const data = await refreshBridgeStatus()
      setBridgeStatus(data.status)
      setRateLimit(data.rateLimit)
      setUsageStats(data.usage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh bridge data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const progressPercentage = rateLimit
    ? ((rateLimit.max - rateLimit.remaining) / rateLimit.max) * 100
    : 0

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error && !bridgeStatus) {
    return <ErrorState error={error} onRetry={loadBridgeData} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-white/10 backdrop-blur-xl shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Unified Bridge</h3>
            <p className="text-xs text-neutral-400">Dễ như ăn kẹo!</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-neutral-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Error notification */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-300">{error}</span>
        </motion.div>
      )}

      {/* Rate Limit Gauge */}
      {rateLimit && (
        <div className="mb-6 p-4 rounded-xl bg-neutral-900/50 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-400">Rate Limit</span>
            <span className="text-sm font-mono text-white">
              {rateLimit.used}/{rateLimit.max}
            </span>
          </div>

          <div className="h-2 bg-neutral-700 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                progressPercentage > 80
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-green-500 to-emerald-400'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{rateLimit.remaining} remaining</span>
            <span>Reset in {rateLimit.resetIn}s</span>
          </div>
        </div>
      )}

      {/* Bridge Status Cards */}
      {bridgeStatus && usageStats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <BridgeCard
            name="Gemini"
            icon={<Sparkles className="w-4 h-4" />}
            status={bridgeStatus.gemini}
            usage={usageStats.gemini}
            color="purple"
          />
          <BridgeCard
            name="Git"
            icon={<GitBranch className="w-4 h-4" />}
            status={bridgeStatus.git}
            usage={usageStats.git}
            color="green"
          />
          <BridgeCard
            name="Python"
            icon={<Cpu className="w-4 h-4" />}
            status={bridgeStatus.antigravity}
            usage={usageStats.antigravity}
            color="blue"
          />
        </div>
      )}

      {/* Quick Commands */}
      <div className="space-y-2">
        <p className="text-xs text-neutral-500 mb-3">Quick Commands</p>
        <div className="grid grid-cols-2 gap-2">
          <QuickCommandButton
            label="Status"
            command="status"
            icon={<Terminal className="w-3 h-3" />}
          />
          <QuickCommandButton
            label="Ask Gemini"
            command="gemini ask"
            icon={<Sparkles className="w-3 h-3" />}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface BridgeCardProps {
  name: string
  icon: React.ReactNode
  status: boolean
  usage: number
  color: 'purple' | 'green' | 'blue'
}

function BridgeCard({ name, icon, status, usage, color }: BridgeCardProps) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  }

  const iconColors = {
    purple: 'text-purple-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColors[color]}>{icon}</span>
        <span className="text-xs font-medium text-white">{name}</span>
      </div>
      <div className="flex items-center gap-1">
        {status ? (
          <CheckCircle2 className="w-3 h-3 text-green-400" />
        ) : (
          <AlertCircle className="w-3 h-3 text-red-400" />
        )}
        <span className="text-[10px] text-neutral-400">{status ? 'Ready' : 'Offline'}</span>
      </div>
    </motion.div>
  )
}

interface QuickCommandButtonProps {
  label: string
  command: string
  icon: React.ReactNode
}

function QuickCommandButton({ label, command, icon }: QuickCommandButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = () => {
    const fullCommand = `node .claude/scripts/agencyos-bridge.cjs ${command}`
    navigator.clipboard.writeText(fullCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
    >
      <span className="text-purple-400">{icon}</span>
      <span className="text-xs text-white flex-1">{label}</span>
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-[10px] text-green-400"
          >
            ✓
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-red-900/20 to-neutral-900/80 border border-red-500/30 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Failed to Load</h3>
          <p className="text-xs text-neutral-400">{error}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-colors"
      >
        Retry
      </button>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED COMPONENT WITH ERROR BOUNDARY
// ─────────────────────────────────────────────────────────────────────────────

export function UnifiedBridgeWidget() {
  return (
    <BridgeErrorBoundary>
      <UnifiedBridgeWidgetCore />
    </BridgeErrorBoundary>
  )
}

export default UnifiedBridgeWidget
