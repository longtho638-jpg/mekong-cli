'use client';

import { ShoppingCart, DollarSign, Package, TrendingUp, Star, Users } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const ecommerceMetrics = [
    { label: 'Revenue Today', value: '$12.4K', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+18%', direction: 'up' as const } },
    { label: 'Orders', value: '156', icon: <ShoppingCart className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+24', direction: 'up' as const } },
    { label: 'Avg Order Value', value: '$79', icon: <TrendingUp className="w-5 h-5" />, color: '#a855f7', trend: { value: '+$8', direction: 'up' as const } },
    { label: 'Conversion Rate', value: '3.2%', icon: <Star className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+0.4%', direction: 'up' as const } },
];

const salesByCategory = [
    { name: 'Electronics', value: 45000, color: '#3b82f6' },
    { name: 'Fashion', value: 32000, color: '#ec4899' },
    { name: 'Home', value: 28000, color: '#22c55e' },
    { name: 'Beauty', value: 18000, color: '#a855f7' },
];

const dailySales = [
    { name: 'Mon', value: 8500 }, { name: 'Tue', value: 9200 }, { name: 'Wed', value: 11000 },
    { name: 'Thu', value: 10500 }, { name: 'Fri', value: 12400 }, { name: 'Sat', value: 15000 }, { name: 'Sun', value: 13200 },
];

const ecommerceCharts = [
    { type: 'bar' as const, title: 'Sales by Category', data: salesByCategory },
    { type: 'area' as const, title: 'Daily Revenue', data: dailySales },
];

const ecommerceActions = [
    { icon: '📦', label: 'Inventory', onClick: () => { } },
    { icon: '🛒', label: 'Orders', onClick: () => { } },
    { icon: '💳', label: 'Payments', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
    { icon: '🎯', label: 'Campaigns', onClick: () => { } },
    { icon: '⭐', label: 'Reviews', onClick: () => { } },
];

export default function EcommercePage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="E-Commerce Hub" subtitle="Orders • Inventory • Payments • Analytics" icon="🛒" color="green"
            statusLabel="Revenue" statusValue="$12.4K" metrics={ecommerceMetrics} charts={ecommerceCharts} quickActions={ecommerceActions} locale={locale}
        />
    );
}
