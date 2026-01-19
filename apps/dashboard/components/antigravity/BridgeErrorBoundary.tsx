'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary for UnifiedBridgeWidget
 * Catches and displays errors gracefully
 */
export class BridgeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UnifiedBridgeWidget Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-red-900/20 to-neutral-900/80 border border-red-500/30 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bridge Error</h3>
              <p className="text-xs text-neutral-400">Something went wrong</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-neutral-900/50 border border-red-500/20">
            <p className="text-sm text-red-300 font-mono">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>

          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      )
    }

    return this.props.children
  }
}
