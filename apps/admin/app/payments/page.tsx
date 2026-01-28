'use client';

import React from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3DataTable, MD3Chip } from '@/components/md3';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DollarSign, Search, Filter } from 'lucide-react';

interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  user: string;
  date: string;
  method: string;
  [key: string]: unknown;
}

export default function PaymentsPage() {
  // Mock data fetching for now, as we haven't implemented specific payment endpoints in admin yet
  // But we have the structure ready
  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      // const res = await api.get('/admin/payments');
      // return res.data;
      return [
          { id: 'txn_123', amount: 39500, currency: 'USD', status: 'succeeded', user: 'alice@example.com', date: '2024-01-27T10:00:00Z', method: 'stripe' },
          { id: 'txn_124', amount: 99500, currency: 'USD', status: 'succeeded', user: 'bob@example.com', date: '2024-01-27T11:30:00Z', method: 'paypal' },
          { id: 'txn_125', amount: 39500, currency: 'USD', status: 'failed', user: 'charlie@example.com', date: '2024-01-26T15:00:00Z', method: 'stripe' },
      ];
    }
  });

  const columns = [
    {
        header: 'ID',
        accessor: 'id',
        render: (data: unknown) => {
            const row = data as PaymentRow;
            return <span className="font-mono text-xs">{row.id}</span>;
        }
    },
    {
        header: 'Amount',
        accessor: 'amount',
        render: (data: unknown) => {
            const row = data as PaymentRow;
            return (
                <span className="font-bold">
                    {(row.amount / 100).toLocaleString('en-US', { style: 'currency', currency: row.currency })}
                </span>
            );
        }
    },
    { header: 'User', accessor: 'user' },
    {
        header: 'Status',
        accessor: 'status',
        render: (data: unknown) => {
            const row = data as PaymentRow;
            return (
                <MD3Chip
                    label={row.status}
                    className={row.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                />
            );
        }
    },
    { header: 'Method', accessor: 'method', render: (data: unknown) => { const row = data as PaymentRow; return <span className="uppercase text-xs font-bold">{row.method}</span>; } },
    { header: 'Date', accessor: 'date', render: (data: unknown) => { const row = data as PaymentRow; return new Date(row.date).toLocaleString(); } },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Payments</MD3Typography>
          <MD3Typography variant="body-large" className="text-gray-500">Transaction history and financial records</MD3Typography>
        </div>
        <MD3Button startIcon={<DollarSign size={18} />}>Process Refund</MD3Button>
      </div>

      <MD3Card variant="elevated" className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <MD3Button variant="outlined" startIcon={<Filter size={18} />}>Filter</MD3Button>
        </div>
        {isLoading ? (
            <div className="p-8 text-center">Loading payments...</div>
        ) : (
            <MD3DataTable<PaymentRow>
                columns={columns as any}
                data={payments || []}
            />
        )}
      </MD3Card>
    </div>
  );
}
