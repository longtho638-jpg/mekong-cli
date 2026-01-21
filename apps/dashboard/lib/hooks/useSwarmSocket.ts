import { useEffect, useRef, useState } from 'react'
import { AgentMessage } from '@/lib/swarm-api'
import { logger } from '@/lib/utils/logger'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/swarm/ws'

export function useSwarmSocket() {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    connect()
    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  const connect = () => {
    setStatus('connecting')
    const ws = new WebSocket(WS_URL)
    socketRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      logger.info('Swarm WebSocket connected')
    }

    ws.onclose = () => {
      setStatus('disconnected')
      logger.info('Swarm WebSocket disconnected')
      // Reconnect after 3s
      setTimeout(connect, 3000)
    }

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'agent_message') {
          setMessages((prev) => [...prev, payload.data])
        }
      } catch (error) {
        logger.error('WebSocket message parsing error', error)
      }
    }
  }

  const sendMessage = (msg: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg))
    }
  }

  return { messages, status, sendMessage }
}
