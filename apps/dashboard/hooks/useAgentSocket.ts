 
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/utils/logger'

interface AgentStatus {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy' | 'idle'
  lastActive: Date
  xp: number
  tasks: number
}

interface WebSocketMessage {
  type: 'agent_update' | 'task_complete' | 'alert' | 'heartbeat'
  payload: unknown
}

interface UseAgentSocketOptions {
  url?: string
  reconnectInterval?: number
  maxRetries?: number
}

export function useAgentSocket(options: UseAgentSocketOptions = {}) {
  const {
    url = 'ws://localhost:8000/ws/agents',
    reconnectInterval = 3000,
    maxRetries = 5,
  } = options

  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(undefined)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionState('connecting')

    try {
      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setConnectionState('connected')
        retriesRef.current = 0
      }

      wsRef.current.onmessage = event => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)

          switch (message.type) {
            case 'agent_update':
              setAgents(message.payload as AgentStatus[])
              break
            case 'task_complete':
              // Trigger confetti or notification
              break
            case 'alert':
              // Show alert toast
              break
          }
        } catch {
          logger.error('Failed to parse WebSocket message')
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        setConnectionState('disconnected')

        if (retriesRef.current < maxRetries) {
          retriesRef.current++
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
        }
      }

      wsRef.current.onerror = () => {
        setConnectionState('error')
      }
    } catch {
      setConnectionState('error')
    }
  }, [url, reconnectInterval, maxRetries])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current?.close()
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Mock data removed to enforce API usage
  useEffect(() => {
    // Auto-connect on mount (optional)
    // connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    agents,
    isConnected,
    connectionState,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
  }
}
