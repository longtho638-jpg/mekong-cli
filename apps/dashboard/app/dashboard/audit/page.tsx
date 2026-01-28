'use client'

import { useState, useEffect } from 'react'
// import { getAuditLogs, exportAuditLogs, type AuditLog } from '@/lib/audit-api'
import { useAuth } from '@/lib/auth-context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, User, Download, Search, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock types and functions if not available
interface AuditLog {
    id: string;
    timestamp: string;
    user_id?: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    ip_address?: string;
    metadata?: any;
}

const getAuditLogs = async (token: string, filters: any): Promise<AuditLog[]> => {
    return [];
};

const exportAuditLogs = async (token: string, format: string, filters: any): Promise<any> => {
    return null;
};

export default function AuditPage() {
  const { token } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    resource_type: ''
  })

  const fetchLogs = async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await getAuditLogs(token, {
          user_id: filters.user_id || undefined,
          action: filters.action || undefined,
          resource_type: filters.resource_type || undefined,
          limit: 50
      })
      setLogs(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [token])

  const handleExport = async (format: 'json' | 'csv') => {
      if (!token) return;
      try {
          const result = await exportAuditLogs(token, format, {
            user_id: filters.user_id || undefined
          });

          if (format === 'csv') {
              const url = window.URL.createObjectURL(result);
              const a = document.createElement('a');
              a.href = url;
              a.download = `audit-logs-${new Date().toISOString()}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
          } else {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result));
              const a = document.createElement('a');
              a.href = dataStr;
              a.download = `audit-logs-${new Date().toISOString()}.json`;
              document.body.appendChild(a);
              a.click();
          }
      } catch (e) {
          console.error("Export failed", e);
      }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          System Audit Log
        </h1>
        <div className="flex gap-2">
            <Button variant="outlined" onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-2" /> Export JSON
            </Button>
            <Button variant="outlined" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
        </div>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex gap-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Input
                        placeholder="Filter by User ID"
                        value={filters.user_id}
                        onChange={(e) => setFilters({...filters, user_id: e.target.value})}
                      />
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Input
                        placeholder="Filter by Action"
                        value={filters.action}
                        onChange={(e) => setFilters({...filters, action: e.target.value})}
                      />
                  </div>
                  <Button onClick={fetchLogs}>
                      <Search className="w-4 h-4 mr-2" /> Search
                  </Button>
              </div>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-medium text-gray-500">Timestamp</th>
                  <th className="p-4 font-medium text-gray-500">User</th>
                  <th className="p-4 font-medium text-gray-500">Action</th>
                  <th className="p-4 font-medium text-gray-500">Resource</th>
                  <th className="p-4 font-medium text-gray-500">IP Address</th>
                  <th className="p-4 font-medium text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                            Loading logs...
                        </td>
                    </tr>
                )}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No logs found matching your criteria.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-4 whitespace-nowrap text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 flex items-center gap-2 font-medium text-gray-900">
                      <User className="w-4 h-4 text-gray-400" />
                      {log.user_id || 'System'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-bold font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-600">
                        {log.resource_type ? `${log.resource_type}:${log.resource_id || '*'}` : '-'}
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-500">
                      {log.ip_address || '-'}
                    </td>
                    <td className="p-4 text-gray-500 truncate max-w-xs text-xs font-mono" title={JSON.stringify(log.metadata, null, 2)}>
                      {log.metadata ? JSON.stringify(log.metadata).substring(0, 50) + (JSON.stringify(log.metadata).length > 50 ? '...' : '') : '-'}
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
