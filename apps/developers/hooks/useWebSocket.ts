'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { logger } from '@/lib/utils/logger'

/**
 * WebSocket Event Types from Backend
 */
export type WSEventType =
  | 'connected'
  | 'disconnected'
  | 'lead_added'
  | 'lead_qualified'
  | 'client_converted'
  | 'invoice_created'
  | 'invoice_paid'
  | 'content_created'
  | 'franchise_added'
  | 'vc_score_updated'
  | 'moat_updated'
  | 'swarm_update'
  | 'data_refresh'
  | 'heartbeat'
  | 'pong'

/**
 * WebSocket Message Interface
 */
export interface WSMessage {
  type: WSEventType
  data?: Record<string, unknown>
  client_id?: string
  timestamp?: string
  connections?: number
}

/**
 * WebSocket Connection State
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * useWebSocket Hook Options
 */
interface UseWebSocketOptions {
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean
  /** Reconnect interval in ms */
  reconnectInterval?: number
  /** Max reconnect attempts */
  maxReconnectAttempts?: number
  /** Callback when connected */
  onConnect?: (clientId: string) => void
  /** Callback when disconnected */
  onDisconnect?: () => void
  /** Callback for any message */
  onMessage?: (message: WSMessage) => void
  /** Callback for specific events */
  onEvent?: (type: WSEventType, data: Record<string, unknown> | undefined) => void
}

/**
 * useWebSocket Hook for Real-time Updates
 *
 * @example
 * const { isConnected, lastMessage, send } = useWebSocket('ws://localhost:8000/ws');
 */
export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onConnect,
    onDisconnect,
    onMessage,
    onEvent,
  } = options

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionState('connecting')
    setError(null)

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConnectionState('connected')
        reconnectAttemptsRef.current = 0
      }

      ws.onclose = () => {
        setConnectionState('disconnected')
        setClientId(null)
        onDisconnect?.()

        // Auto-reconnect
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = () => {
        setConnectionState('error')
        setError('WebSocket connection error')
      }

      ws.onmessage = event => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          setLastMessage(message)

          // Handle specific message types
          if (message.type === 'connected') {
            setClientId(message.client_id || null)
            onConnect?.(message.client_id || '')
          }

          if (message.connections !== undefined) {
            setConnectionCount(message.connections)
          }

          // Call callbacks
          onMessage?.(message)
          onEvent?.(message.type, message.data)
        } catch {
          logger.error('Failed to parse WebSocket message')
        }
      }
    } catch {
      setConnectionState('error')
      setError('Failed to create WebSocket connection')
    }
  }, [
    url,
    autoReconnect,
    reconnectInterval,
    maxReconnectAttempts,
    onConnect,
    onDisconnect,
    onMessage,
    onEvent,
  ])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectAttemptsRef.current = maxReconnectAttempts // Prevent auto-reconnect
    wsRef.current?.close()
    setConnectionState('disconnected')
  }, [maxReconnectAttempts])

  const send = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const ping = useCallback(() => {
    send({ type: 'ping' })
  }, [send])

  const requestRefresh = useCallback(() => {
    send({ type: 'request_refresh' })
  }, [send])

  // Connect on mount
  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  return {
    // State
    connectionState,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    clientId,
    connectionCount,
    lastMessage,
    error,

    // Actions
    connect,
    disconnect,
    send,
    ping,
    requestRefresh,
  }
}

/**
 * useAntigravityRealtime - Specialized hook for AntigravityKit
 */
export function useAntigravityRealtime(options?: {
  onLeadAdded?: (data: Record<string, unknown> | undefined) => void
  onInvoicePaid?: (data: Record<string, unknown> | undefined) => void
  onVCScoreUpdated?: (data: Record<string, unknown> | undefined) => void
  onSwarmUpdate?: (data: Record<string, unknown> | undefined) => void
  onDataRefresh?: () => void
}) {
  const wsUrl =
    typeof window !== 'undefined'
      ? `ws://${window.location.hostname}:8000/ws`
      : 'ws://localhost:8000/ws'

  return useWebSocket(wsUrl, {
    autoReconnect: true,
    onEvent: (type, data) => {
      switch (type) {
        case 'lead_added':
          options?.onLeadAdded?.(data)
          break
        case 'invoice_paid':
          options?.onInvoicePaid?.(data)
          break
        case 'vc_score_updated':
          options?.onVCScoreUpdated?.(data)
          break
        case 'swarm_update':
          options?.onSwarmUpdate?.(data)
          break
        case 'data_refresh':
          options?.onDataRefresh?.()
          break
      }
    },
  })
}

export default useWebSocket
