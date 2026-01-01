'use client';

import { Package, DollarSign, TrendingUp, Star, Truck, BarChart3 } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const fbaMetrics = [
    { label: 'Active Listings', value: '248', icon: <Package className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+32', direction: 'up' as const } },
    { label: 'Monthly Revenue', value: '$42K', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$8K', direction: 'up' as const } },
    { label: 'BSR Avg', value: '12,450', icon: <TrendingUp className="w-5 h-5" />, color: '#3b82f6', trend: { value: '-2,100', direction: 'down' as const } },
    { label: 'Rating', value: '4.6', icon: <Star className="w-5 h-5" />, color: '#a855f7', trend: { value: '+0.2', direction: 'up' as const } },
];

const salesByCategory = [
    { name: 'Home', value: 18500, color: '#f59e0b' },
    { name: 'Electronics', value: 12400, color: '#3b82f6' },
    { name: 'Sports', value: 8200, color: '#22c55e' },
    { name: 'Beauty', value: 2900, color: '#ec4899' },
];

const monthlySales = [
    { name: 'Jul', value: 28000 }, { name: 'Aug', value: 32000 }, { name: 'Sep', value: 35000 },
    { name: 'Oct', value: 38000 }, { name: 'Nov', value: 40000 }, { name: 'Dec', value: 42000 },
];

const fbaCharts = [
    { type: 'bar' as const, title: 'Sales by Category', data: salesByCategory },
    { type: 'area' as const, title: 'Monthly Revenue', data: monthlySales },
];

const fbaActions = [
    { icon: '📦', label: 'Inventory', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🏷️', label: 'Listings', onClick: () => { } },
    { icon: '🚚', label: 'Shipments', onClick: () => { } },
    { icon: '💰', label: 'Profits', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function AmazonFBAPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Amazon FBA" subtitle="Listings • Inventory • Sales • Analytics" icon="📦" color="orange"
            statusLabel="Revenue" statusValue="$42K" metrics={fbaMetrics} charts={fbaCharts} quickActions={fbaActions} locale={locale}
        />
    );
}
