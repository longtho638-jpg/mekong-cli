'use client'

import { useState, useEffect } from 'react'
import { MD3Card } from '@/components/md3/MD3Card'
import { MD3Text } from '@/components/md3-dna/MD3Text'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { developerApi } from '@/lib/developer-api'
import { ApiUsageStats } from '@/lib/types/developer-types'

export default function UsagePage() {
    const [stats, setStats] = useState<ApiUsageStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchStats = async () => {
        try {
            setLoading(true)
            const data = await developerApi.getUsageStats(30)
            setStats(data)
        } catch (err) {
            console.error(err)
            setError('Failed to load usage statistics')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    if (loading) {
        return <div className="p-8 text-center">Loading usage statistics...</div>
    }

    if (error || !stats) {
        return (
            <div className="p-8 text-center text-red-500">
                {error || 'No data available'}
            </div>
        )
    }

    // Calculate derived metrics
    const totalErrors = Object.entries(stats.requests_by_status)
        .filter(([status]) => parseInt(status) >= 400)
        .reduce((sum, [, count]) => sum + count, 0)

    const errorRate = stats.total_requests > 0
        ? ((totalErrors / stats.total_requests) * 100).toFixed(2)
        : '0.00'

    // Format endpoint breakdown for display
    const endpointBreakdown = Object.entries(stats.requests_by_endpoint)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // Top 5

    return (
        <div className="space-y-8">
            <div>
                <MD3Text variant="display-small">Usage Analytics</MD3Text>
                <MD3Text variant="body-large" className="text-[var(--md-sys-color-on-surface-variant)]">
                    Monitor your API consumption and performance.
                </MD3Text>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MD3Card variant="filled" className="p-6">
                    <MD3Text variant="title-medium" className="mb-2 text-[var(--md-sys-color-on-surface-variant)]">
                        Total Requests (30d)
                    </MD3Text>
                    <MD3Text variant="display-medium" className="text-[var(--md-sys-color-primary)]">
                        {stats.total_requests.toLocaleString()}
                    </MD3Text>
                </MD3Card>
                <MD3Card variant="filled" className="p-6">
                    <MD3Text variant="title-medium" className="mb-2 text-[var(--md-sys-color-on-surface-variant)]">
                        Error Rate
                    </MD3Text>
                    <MD3Text variant="display-medium" className={parseFloat(errorRate as string) > 1 ? "text-red-500" : "text-green-500"}>
                        {errorRate}%
                    </MD3Text>
                </MD3Card>
                <MD3Card variant="filled" className="p-6">
                    <MD3Text variant="title-medium" className="mb-2 text-[var(--md-sys-color-on-surface-variant)]">
                        Avg Latency
                    </MD3Text>
                    <MD3Text variant="display-medium" className="text-[var(--md-sys-color-tertiary)]">
                        {stats.average_response_time_ms.toFixed(0)}ms
                    </MD3Text>
                </MD3Card>
            </div>

            {/* Main Chart */}
            <MD3Card variant="outlined" className="p-6">
                <MD3Text variant="title-large" className="mb-6">Request Volume</MD3Text>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chart_data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="var(--md-sys-color-on-surface-variant)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                            />
                            <YAxis
                                stroke="var(--md-sys-color-on-surface-variant)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--md-sys-color-surface-container)',
                                    borderColor: 'var(--md-sys-color-outline)',
                                    borderRadius: '8px',
                                    color: 'var(--md-sys-color-on-surface)'
                                }}
                                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                            />
                            <Bar dataKey="requests" name="Requests" fill="var(--md-sys-color-primary)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="errors" name="Errors" fill="var(--md-sys-color-error)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </MD3Card>

            {/* Endpoint Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MD3Card variant="outlined" className="p-6">
                    <MD3Text variant="title-large" className="mb-4">Top Endpoints</MD3Text>
                    <div className="space-y-4">
                        {endpointBreakdown.length === 0 ? (
                             <div className="text-[var(--md-sys-color-on-surface-variant)] text-sm">No requests yet.</div>
                        ) : (
                            endpointBreakdown.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded bg-[var(--md-sys-color-surface-container-low)]">
                                    <span className="font-mono text-sm truncate max-w-[200px]">{item.name}</span>
                                    <span className="font-bold">{item.value.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </MD3Card>

                <MD3Card variant="outlined" className="p-6">
                    <MD3Text variant="title-large" className="mb-4">Response Status Codes</MD3Text>
                    <div className="space-y-4">
                         {Object.entries(stats.requests_by_status).length === 0 ? (
                            <div className="text-[var(--md-sys-color-on-surface-variant)] text-sm">No data available.</div>
                         ) : (
                             Object.entries(stats.requests_by_status)
                                .sort((a, b) => b[1] - a[1])
                                .map(([status, count], i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded bg-[var(--md-sys-color-surface-container-low)]">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${
                                                status.startsWith('2') ? 'bg-green-500' :
                                                status.startsWith('4') ? 'bg-yellow-500' :
                                                status.startsWith('5') ? 'bg-red-500' : 'bg-gray-500'
                                            }`} />
                                            <span className="font-mono text-sm">{status}</span>
                                        </div>
                                        <span className="font-bold">{count.toLocaleString()}</span>
                                    </div>
                                ))
                         )}
                    </div>
                </MD3Card>
            </div>
        </div>
    )
}
