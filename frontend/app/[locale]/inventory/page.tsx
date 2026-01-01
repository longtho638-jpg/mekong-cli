'use client';

import { Package, Truck, BarChart3, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const inventoryMetrics = [
    { label: 'Total SKUs', value: '2,450', icon: <Package className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+120', direction: 'up' as const } },
    { label: 'Stock Value', value: '$1.8M', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+$150K', direction: 'up' as const } },
    { label: 'Low Stock', value: '34', icon: <AlertTriangle className="w-5 h-5" />, color: '#f59e0b', trend: { value: '-8', direction: 'down' as const } },
    { label: 'Turn Rate', value: '4.2x', icon: <Clock className="w-5 h-5" />, color: '#a855f7', trend: { value: '+0.3x', direction: 'up' as const } },
];

const stockByCategory = [
    { name: 'Electronics', value: 850, color: '#3b82f6' },
    { name: 'Apparel', value: 620, color: '#ec4899' },
    { name: 'Home', value: 480, color: '#22c55e' },
    { name: 'Beauty', value: 320, color: '#a855f7' },
    { name: 'Other', value: 180, color: '#f59e0b' },
];

const monthlyMovement = [
    { name: 'Jul', value: 12000 }, { name: 'Aug', value: 14500 }, { name: 'Sep', value: 13200 },
    { name: 'Oct', value: 15800 }, { name: 'Nov', value: 18200 }, { name: 'Dec', value: 22000 },
];

const inventoryCharts = [
    { type: 'bar' as const, title: 'Stock by Category', data: stockByCategory },
    { type: 'area' as const, title: 'Monthly Units Moved', data: monthlyMovement },
];

const inventoryActions = [
    { icon: '📦', label: 'Add Stock', onClick: () => { } },
    { icon: '🔍', label: 'Search', onClick: () => { } },
    { icon: '🚚', label: 'Orders', onClick: () => { } },
    { icon: '📊', label: 'Reports', onClick: () => { } },
    { icon: '⚠️', label: 'Alerts', onClick: () => { } },
    { icon: '⚙️', label: 'Settings', onClick: () => { } },
];

export default function InventoryPage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Inventory Hub" subtitle="Stock • Warehousing • Fulfillment • Reordering" icon="📦" color="orange"
            statusLabel="SKUs" statusValue="2,450" metrics={inventoryMetrics} charts={inventoryCharts} quickActions={inventoryActions} locale={locale}
        />
    );
}
