'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    MD3Card,
    MD3Typography,
    MD3Button,
    MD3DataTable,
    MD3Chip
} from '@/components/md3';
import { ShieldAlert, Activity, UserX, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function RateLimitsPage() {
    // Fetch Recent Violations
    const { data: violationsData, isLoading: isLoadingViolations } = useQuery({
        queryKey: ['rate-limit-violations'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/rate-limits/violations?limit=50');
            return res.data;
        }
    });

    // Fetch Top Violators
    const { data: topUsersData, isLoading: isLoadingTopUsers } = useQuery({
        queryKey: ['rate-limit-top-users'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/rate-limits/top-users?limit=10');
            return res.data;
        }
    });

    const columns = [
        {
            header: 'IP Address',
            accessor: 'ip_address',
            render: (row: any) => <span className="font-mono">{row.ip_address}</span>
        },
        {
            header: 'Type',
            accessor: 'violation_type',
            render: (row: any) => (
                <MD3Chip
                    label={row.violation_type}
                    variant="assist"
                    className={row.violation_type === 'global_ip' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}
                />
            )
        },
        {
            header: 'Endpoint',
            accessor: 'endpoint',
            render: (row: any) => <span className="text-gray-600 text-sm">{row.endpoint}</span>
        },
        {
            header: 'User ID',
            accessor: 'user_id',
            render: (row: any) => row.user_id ? <span className="text-xs text-gray-500">{row.user_id}</span> : '-'
        },
        {
            header: 'Time',
            accessor: 'timestamp',
            render: (row: any) => new Date(row.timestamp).toLocaleString()
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <MD3Typography variant="headline-medium">Rate Limits Defense</MD3Typography>
                    <MD3Typography variant="body-medium" className="text-gray-500">
                        Monitor API traffic violations and DDoS attempts.
                    </MD3Typography>
                </div>
                <Link href="/rate-limits/blocked-ips">
                    <MD3Button variant="filled" startIcon={<UserX size={18} />}>
                        Manage Blocked IPs
                    </MD3Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MD3Card className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <MD3Typography variant="label-medium" className="text-gray-500">Total Violations (24h)</MD3Typography>
                        <MD3Typography variant="headline-small">
                           {violationsData?.length || 0}
                        </MD3Typography>
                    </div>
                </MD3Card>

                <MD3Card className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <MD3Typography variant="label-medium" className="text-gray-500">High Risk IPs</MD3Typography>
                        <MD3Typography variant="headline-small">
                            {topUsersData?.top_users?.length || 0}
                        </MD3Typography>
                    </div>
                </MD3Card>

                <MD3Card className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <MD3Typography variant="label-medium" className="text-gray-500">System Status</MD3Typography>
                        <MD3Typography variant="headline-small" className="text-green-600">
                            Active
                        </MD3Typography>
                    </div>
                </MD3Card>
            </div>

            <MD3Card className="p-6">
                <div className="mb-4">
                    <MD3Typography variant="title-large">Recent Violations</MD3Typography>
                </div>
                {isLoadingViolations ? (
                    <div className="text-center py-8 text-gray-500">Loading violations...</div>
                ) : (
                    <MD3DataTable
                        columns={columns}
                        data={violationsData || []}
                    />
                )}
            </MD3Card>
        </div>
    );
}
