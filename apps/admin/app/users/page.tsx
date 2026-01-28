'use client';

import React, { useState } from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3DataTable, MD3Chip } from '@/components/md3';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Search, Filter, MoreVertical, Ban, Shield, Edit } from 'lucide-react';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params: { page, per_page: 20 } });
      return res.data;
    }
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, duration }: { userId: string, duration?: string }) => {
        await api.post(`/admin/users/${userId}/ban`, null, { params: { duration }});
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const handleBan = (userId: string) => {
      if (confirm("Are you sure you want to ban this user?")) {
          banMutation.mutate({ userId, duration: 'forever' });
      }
  }

  const columns = [
    {
        header: 'User',
        accessor: 'name',
        render: (row: any) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {row.name ? row.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                    <div className="font-medium text-gray-900">{row.name || 'Unknown'}</div>
                    <div className="text-gray-500 text-xs">{row.email}</div>
                </div>
            </div>
        )
    },
    { header: 'Role', accessor: 'role', render: (row: any) => <MD3Chip label={row.role || 'user'} size="small" /> },
    { header: 'Status', accessor: 'status', render: (row: any) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {row.is_active ? 'Active' : 'Inactive'}
        </span>
    )},
    { header: 'Joined', accessor: 'created_at', render: (row: any) => new Date(row.created_at).toLocaleDateString() },
    {
        header: 'Actions',
        accessor: 'id',
        render: (row: any) => (
            <div className="flex gap-2">
                <MD3Button variant="text" size="small" onClick={() => {}} startIcon={<Edit size={14} />}>Edit</MD3Button>
                <MD3Button variant="text" size="small" color="error" onClick={() => handleBan(row.id)} startIcon={<Ban size={14} />}>Ban</MD3Button>
            </div>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Users</MD3Typography>
          <MD3Typography variant="body-large" className="text-gray-500">Manage system users and permissions</MD3Typography>
        </div>
        <MD3Button startIcon={<Plus size={18} />}>Add User</MD3Button>
      </div>

      <MD3Card variant="elevated" className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <MD3Button variant="outlined" startIcon={<Filter size={18} />}>Filters</MD3Button>
        </div>

        {isLoading ? (
            <div className="p-8 text-center">Loading users...</div>
        ) : (
            <MD3DataTable
                columns={columns}
                data={usersData?.items || []}
                selectable
            />
        )}

        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-500">Showing {usersData?.items?.length || 0} of {usersData?.total || 0} users</span>
            <div className="flex gap-2">
                <MD3Button variant="outlined" size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</MD3Button>
                <MD3Button variant="outlined" size="small" disabled={!usersData?.has_next} onClick={() => setPage(p => p + 1)}>Next</MD3Button>
            </div>
        </div>
      </MD3Card>
    </div>
  );
}
