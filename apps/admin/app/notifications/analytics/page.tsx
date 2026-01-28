'use client';

import React from 'react';
import { MD3Card, MD3Typography } from '@/components/md3';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
    stats: {
        total_sent: number;
        success_rate: number;
        channels: Record<string, number>;
        statuses: Record<string, number>;
    };
    trends: Array<{ date: string; count: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function NotificationAnalyticsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['notification-analytics'],
        queryFn: async () => {
            const res = await api.get('/api/v1/notifications/analytics?days=30');
            return res.data as AnalyticsData;
        }
    });

    if (isLoading) return <div>Loading analytics...</div>;
    if (!data) return <div>No data available</div>;

    const channelData = Object.entries(data.stats.channels).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-6">
            <div>
                <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Notification Analytics</MD3Typography>
                <MD3Typography variant="body-large" className="text-gray-500">Overview of notification delivery performance</MD3Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MD3Card className="p-4">
                    <MD3Typography variant="title-medium" className="text-gray-500">Total Sent</MD3Typography>
                    <MD3Typography variant="display-small" className="font-bold">{data.stats.total_sent}</MD3Typography>
                </MD3Card>
                <MD3Card className="p-4">
                    <MD3Typography variant="title-medium" className="text-gray-500">Success Rate</MD3Typography>
                    <MD3Typography variant="display-small" className={`font-bold ${data.stats.success_rate > 95 ? 'text-green-500' : 'text-orange-500'}`}>
                        {data.stats.success_rate}%
                    </MD3Typography>
                </MD3Card>
                 <MD3Card className="p-4">
                    <MD3Typography variant="title-medium" className="text-gray-500">Push Sent</MD3Typography>
                    <MD3Typography variant="display-small" className="font-bold">{data.stats.channels.push || 0}</MD3Typography>
                </MD3Card>
                 <MD3Card className="p-4">
                    <MD3Typography variant="title-medium" className="text-gray-500">Email Sent</MD3Typography>
                    <MD3Typography variant="display-small" className="font-bold">{data.stats.channels.email || 0}</MD3Typography>
                </MD3Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MD3Card className="p-6">
                    <MD3Typography variant="headline-small" className="mb-4">Delivery Trends (Last 7 Days)</MD3Typography>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString()} />
                                <YAxis />
                                <Tooltip labelFormatter={(str) => new Date(str).toLocaleDateString()} />
                                <Bar dataKey="count" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </MD3Card>

                <MD3Card className="p-6">
                    <MD3Typography variant="headline-small" className="mb-4">Channel Distribution</MD3Typography>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={channelData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {channelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </MD3Card>
            </div>
        </div>
    );
}
