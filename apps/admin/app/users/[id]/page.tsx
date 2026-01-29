'use client';

import React from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3Chip, MD3DataTable } from '@/components/md3';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Mail, Calendar, Shield, Ban, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserActivityRow {
  id: number;
  action: string;
  ip: string;
  date: string;
  [key: string]: unknown;
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const userId = params.id;

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}`);
      return res.data;
    }
  });

  const { data: activity } = useQuery({
      queryKey: ['admin-user-activity', userId],
      queryFn: async () => {
          // Mock activity data for now
          return [
              { id: 1, action: 'login', ip: '192.168.1.1', date: '2024-01-27T10:00:00Z' },
              { id: 2, action: 'update_profile', ip: '192.168.1.1', date: '2024-01-26T15:30:00Z' },
              { id: 3, action: 'login', ip: '192.168.1.1', date: '2024-01-26T09:00:00Z' },
          ];
      }
  });

  if (isLoading) return <div className="p-8 text-center">Loading user details...</div>;
  if (!user) return <div className="p-8 text-center">User not found</div>;

  const activityColumns = [
      {
          header: 'Action',
          accessor: 'action',
          render: (data: unknown) => {
              const row = data as UserActivityRow;
              return <span className="font-medium capitalize">{row.action.replace('_', ' ')}</span>;
          }
      },
      { header: 'IP Address', accessor: 'ip' },
      {
          header: 'Date',
          accessor: 'date',
          render: (data: unknown) => {
              const row = data as UserActivityRow;
              return new Date(row.date).toLocaleString();
          }
      }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <MD3Button variant="text" size="small" onClick={() => router.back()} startIcon={<ArrowLeft size={18} />}>
            Back
        </MD3Button>
        <MD3Typography variant="headline-medium" className="font-bold text-gray-900">User Details</MD3Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <MD3Card variant="elevated" className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 mb-4">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <MD3Typography variant="headline-small" className="font-bold">{user.email}</MD3Typography>
                <MD3Typography variant="body-medium" className="text-gray-500">{user.id}</MD3Typography>
                <div className="mt-4 flex gap-2">
                    <MD3Chip label={user.role || 'User'} className="bg-blue-50 text-blue-700 border-blue-200" />
                    <MD3Chip
                        label={user.banned_until ? 'Banned' : 'Active'}
                        className={user.banned_until ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}
                    />
                </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 text-gray-600">
                    <Mail size={18} />
                    <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                    <Calendar size={18} />
                    <span className="text-sm">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                    <Shield size={18} />
                    <span className="text-sm">Role: {user.role}</span>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-col gap-2">
                <MD3Button variant="outlined" className="w-full">Reset Password</MD3Button>
                {user.banned_until ? (
                    <MD3Button variant="tonal" className="w-full" color="success" startIcon={<CheckCircle size={16} />}>Unban User</MD3Button>
                ) : (
                    <MD3Button variant="tonal" className="w-full text-red-700 bg-red-50 hover:bg-red-100" color="error" startIcon={<Ban size={16} />}>Ban User</MD3Button>
                )}
            </div>
        </MD3Card>

        {/* Activity & Meta */}
        <div className="lg:col-span-2 space-y-6">
            <MD3Card variant="elevated" className="p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <MD3Typography variant="title-large">Recent Activity</MD3Typography>
                </div>
                <MD3DataTable<UserActivityRow> columns={activityColumns} data={activity || []} />
            </MD3Card>

            <MD3Card variant="elevated" className="p-6">
                <MD3Typography variant="title-large" className="mb-4">Metadata</MD3Typography>
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm text-gray-700 overflow-x-auto">
                    <pre>{JSON.stringify({ user_metadata: user.user_metadata, app_metadata: user.app_metadata }, null, 2)}</pre>
                </div>
            </MD3Card>
        </div>
      </div>
    </div>
  );
}
