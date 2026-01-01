'use client';

import { Store, Package, TrendingUp, DollarSign, Users, ShoppingBag } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const retailMetrics = [
    { label: 'Daily Sales', value: '$28.5K', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+12%', direction: 'up' as const } },
    { label: 'Transactions', value: '342', icon: <ShoppingBag className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+28', direction: 'up' as const } },
    { label: 'Avg Basket', value: '$83', icon: <TrendingUp className="w-5 h-5" />, color: '#a855f7', trend: { value: '+$5', direction: 'up' as const } },
    { label: 'Stock Level', value: '94%', icon: <Package className="w-5 h-5" />, color: '#f59e0b', trend: { value: 'Healthy', direction: 'up' as const } },
];

const salesByStore = [
    { name: 'Downtown', value: 12500, color: '#22c55e' },
    { name: 'Mall', value: 9800, color: '#3b82f6' },
    { name: 'Airport', value: 4200, color: '#a855f7' },
    { name: 'Online', value: 2000, color: '#f59e0b' },
];

const hourlySales = [
    { name: '9AM', value: 1200 }, { name: '11AM', value: 3500 }, { name: '1PM', value: 4800 },
    { name: '3PM', value: 3200 }, { name: '5PM', value: 5500 }, { name: '7PM', value: 6200 }, { name: '9PM', value: 4100 },
];

const retailCharts = [
    { type: 'bar' as const, title: 'Sales by Location', data: salesByStore },
    { type: 'area' as const, title: 'Hourly Sales Today', data: hourlySales },
];

const retailActions = [
    { icon: '🛒', label: 'POS', onClick: () => { } },
    { icon: '📦', label: 'Inventory', onClick: () => { } },
    { icon: '👥', label: 'Staff', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '🎯', label: 'Promos', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function RetailPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Retail Hub" subtitle="POS • Inventory • Staff • Multi-Location" icon="🏪" color="green"
            statusLabel="Sales" statusValue="$28.5K" metrics={retailMetrics} charts={retailCharts} quickActions={retailActions} locale={locale}
        />
    );
}
