'use client'

import { useEffect, useRef, useState } from 'react'
import { AgentMessage } from '@/lib/swarm-api'
import { Card, CardContent, CardHeader, CardTitle } from '@agencyos/ui'
import { ArrowRight, Bot, User, CheckCircle, AlertTriangle } from 'lucide-react'

interface SwarmVisualizerProps {
  messages: AgentMessage[]
}

export default function SwarmVisualizer({ messages }: SwarmVisualizerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No swarm activity yet. Dispatch a task to start.
      </div>
    )
  }

  return (
    <div className="space-y-4 h-[500px] overflow-y-auto p-4 border rounded-lg bg-gray-50" ref={scrollRef}>
      {messages.map((msg) => (
        <div key={msg.id} className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="font-mono text-xs">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded border">
              <span className="font-bold text-blue-600">{msg.sender}</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <span className="font-bold text-green-600">{msg.recipient}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs uppercase ${getTypeColor(msg.type)}`}>
              {msg.type}
            </span>
          </div>

          <Card className="ml-8 border-l-4 border-l-blue-500">
            <CardContent className="p-3 text-sm">
              {typeof msg.content === 'string' ? (
                msg.content
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-100 p-2 rounded">
                  {JSON.stringify(msg.content, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'task': return 'bg-blue-100 text-blue-800'
    case 'result': return 'bg-green-100 text-green-800'
    case 'error': return 'bg-red-100 text-red-800'
    case 'query': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
