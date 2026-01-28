'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    MD3Card,
    MD3Typography,
    MD3Button,
    MD3DataTable,
    MD3TextField,
    MD3Dialog
} from '@/components/md3';
import { Trash2, Shield, Plus } from 'lucide-react';

interface BlockedIPRow {
    ip_address: string;
    reason: string;
    blocked_at: string;
    expires_at: string | null;
}

export default function BlockedIPsPage() {
    const queryClient = useQueryClient();
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
    const [blockForm, setBlockForm] = useState({ ip: '', reason: '', duration: '3600' });

    // Fetch Blocked IPs
    const { data: blockedIpsData, isLoading } = useQuery({
        queryKey: ['blocked-ips'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/rate-limits/blocked-ips');
            return res.data.blocked_ips;
        }
    });

    // Block IP Mutation
    const blockIpMutation = useMutation({
        mutationFn: async (data: { ip_address: string; reason: string; duration_seconds: number }) => {
            return await api.post('/api/v1/admin/rate-limits/blocked-ips', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
            setIsBlockDialogOpen(false);
            setBlockForm({ ip: '', reason: '', duration: '3600' });
        },
        onError: (error) => {
            alert('Failed to block IP: ' + error);
        }
    });

    // Unblock IP Mutation
    const unblockIpMutation = useMutation({
        mutationFn: async (ip: string) => {
            return await api.delete(`/api/v1/admin/rate-limits/blocked-ips/${ip}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
        }
    });

    const handleBlockSubmit = () => {
        if (!blockForm.ip) return;
        blockIpMutation.mutate({
            ip_address: blockForm.ip,
            reason: blockForm.reason,
            duration_seconds: parseInt(blockForm.duration)
        });
    };

    const columns = [
        {
            header: 'IP Address',
            accessor: 'ip_address',
            render: (row: BlockedIPRow) => <span className="font-mono font-bold">{row.ip_address}</span>
        },
        {
            header: 'Reason',
            accessor: 'reason',
        },
        {
            header: 'Blocked At',
            accessor: 'blocked_at',
            render: (row: BlockedIPRow) => new Date(row.blocked_at).toLocaleString()
        },
        {
            header: 'Expires At',
            accessor: 'expires_at',
            render: (row: BlockedIPRow) => row.expires_at ? new Date(row.expires_at).toLocaleString() : 'Permanent'
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (row: BlockedIPRow) => (
                <MD3Button
                    variant="text"
                    color="error"
                    size="small"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => {
                        if (confirm(`Unblock IP ${row.ip_address}?`)) {
                            unblockIpMutation.mutate(row.ip_address);
                        }
                    }}
                >
                    Unblock
                </MD3Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <MD3Typography variant="headline-medium">Blocked IPs</MD3Typography>
                    <MD3Typography variant="body-medium" className="text-gray-500">
                        Manage IP addresses blocked from accessing the API.
                    </MD3Typography>
                </div>
                <MD3Button
                    variant="filled"
                    startIcon={<Plus size={18} />}
                    onClick={() => setIsBlockDialogOpen(true)}
                >
                    Block IP
                </MD3Button>
            </div>

            <MD3Card className="p-6">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading blocked IPs...</div>
                ) : (
                    <MD3DataTable
                        columns={columns}
                        data={blockedIpsData || []}
                    />
                )}
                {blockedIpsData?.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mt-4 border border-dashed border-gray-300">
                        <Shield size={48} className="mx-auto text-gray-300 mb-2" />
                        <p>No IPs currently blocked.</p>
                    </div>
                )}
            </MD3Card>

            <MD3Dialog
                open={isBlockDialogOpen}
                onClose={() => setIsBlockDialogOpen(false)}
                title="Block IP Address"
                actions={
                    <>
                        <MD3Button variant="text" onClick={() => setIsBlockDialogOpen(false)}>Cancel</MD3Button>
                        <MD3Button variant="filled" onClick={handleBlockSubmit} disabled={blockIpMutation.isPending}>
                            {blockIpMutation.isPending ? 'Blocking...' : 'Block IP'}
                        </MD3Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <MD3TextField
                        label="IP Address"
                        value={blockForm.ip}
                        onChange={(e) => setBlockForm({ ...blockForm, ip: e.target.value })}
                        placeholder="e.g., 192.168.1.1"
                    />
                    <MD3TextField
                        label="Reason"
                        value={blockForm.reason}
                        onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                        placeholder="e.g., Suspicious activity"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            value={blockForm.duration}
                            onChange={(e) => setBlockForm({ ...blockForm, duration: e.target.value })}
                        >
                            <option value="300">5 Minutes</option>
                            <option value="3600">1 Hour</option>
                            <option value="86400">24 Hours</option>
                            <option value="604800">7 Days</option>
                            <option value="2592000">30 Days</option>
                        </select>
                    </div>
                </div>
            </MD3Dialog>
        </div>
    );
}
