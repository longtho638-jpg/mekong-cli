'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@agencyos/ui'
import { SystemStatus } from '@/lib/monitor-api'
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'

interface SystemHealthCardProps {
  name: string
  status: SystemStatus
}

export function SystemHealthCard({ name, status }: SystemHealthCardProps) {
  const getIcon = () => {
    switch (status.status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'healthy':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card className={`border ${getStatusColor()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium uppercase">{name}</CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-sm font-medium">{status.message}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Last check: {new Date(status.last_check).toLocaleTimeString()}
        </p>
        {status.details && Object.keys(status.details).length > 0 && (
          <div className="mt-2 text-xs border-t pt-2 border-gray-200/50">
            {Object.entries(status.details).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-500 capitalize">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
