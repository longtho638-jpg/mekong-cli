'use client'

import { useEffect, useState } from 'react'
import { getSystemStatus, DashboardResponse } from '@/lib/monitor-api'
import { SystemHealthCard } from '@/components/SystemHealthCard'
import { Card, CardContent, CardHeader, CardTitle } from '@agencyos/ui'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function MonitorPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await getSystemStatus()
      if (result) {
        setData(result)
        setError(null)
      } else {
        setError('Failed to load system status')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return <div className="p-8 text-center">Loading system status...</div>
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Monitor</h1>
        <button
          onClick={fetchData}
          className="p-2 rounded hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {data?.anomalies && data.anomalies.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <CardTitle className="text-lg font-medium text-red-700">
              Active Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.anomalies.map((anomaly, idx) => (
                <div key={idx} className="flex flex-col p-2 bg-white rounded border border-red-100">
                  <div className="flex justify-between font-medium">
                    <span className="text-red-600 uppercase">{anomaly.system}</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      {anomaly.severity}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{anomaly.message}</p>
                  {anomaly.recovery_action && (
                    <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                      <strong>Recovery:</strong> {anomaly.recovery_action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.systems && Object.entries(data.systems).map(([name, status]) => (
          <SystemHealthCard key={name} name={name} status={status} />
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center mt-8">
        Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Never'}
      </div>
    </div>
  )
}
