'use client'

import { useState, useEffect } from 'react'
import { getAuditLogs, type AuditLog } from '@/lib/audit-api'
import { useAuth } from '@/lib/auth-context'
import { Card, CardHeader, CardTitle, CardContent } from '@agencyos/ui'
import { ShieldCheck, User } from 'lucide-react'

export default function AuditPage() {
  const { token } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      getAuditLogs(token).then((data) => {
        setLogs(data)
        setLoading(false)
      })
    }
  }, [token])

  if (loading) return <div className="p-8 text-center">Loading audit logs...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          System Audit Log
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-medium">Timestamp</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Resource</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No logs found.
                    </td>
                  </tr>
                )}
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-4 whitespace-nowrap text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 flex items-center gap-2 font-medium">
                      <User className="w-4 h-4 text-gray-400" />
                      {log.user}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs">{log.resource}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 truncate max-w-xs">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
