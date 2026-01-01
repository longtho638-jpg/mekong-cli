'use client';

import { Home, DollarSign, TrendingUp, MapPin, Calendar, Users } from 'lucide-react';
import { DepartmentDashboard } from '@/components/DepartmentDashboard';

const realEstateMetrics = [
    { label: 'Portfolio Value', value: '$4.2M', icon: <DollarSign className="w-5 h-5" />, color: '#22c55e', trend: { value: '+8%', direction: 'up' as const } },
    { label: 'Active Listings', value: '24', icon: <Home className="w-5 h-5" />, color: '#3b82f6', trend: { value: '+3', direction: 'up' as const } },
    { label: 'Occupancy Rate', value: '92%', icon: <TrendingUp className="w-5 h-5" />, color: '#a855f7', trend: { value: '+2%', direction: 'up' as const } },
    { label: 'Monthly Revenue', value: '$48K', icon: <Calendar className="w-5 h-5" />, color: '#f59e0b', trend: { value: '+$5K', direction: 'up' as const } },
];

const propertiesByType = [
    { name: 'Residential', value: 12, color: '#3b82f6' },
    { name: 'Commercial', value: 6, color: '#22c55e' },
    { name: 'Industrial', value: 3, color: '#a855f7' },
    { name: 'Land', value: 3, color: '#f59e0b' },
];

const monthlyRevenue = [
    { name: 'Jul', value: 42000 }, { name: 'Aug', value: 44000 }, { name: 'Sep', value: 43000 },
    { name: 'Oct', value: 45000 }, { name: 'Nov', value: 46000 }, { name: 'Dec', value: 48000 },
];

const realEstateCharts = [
    { type: 'bar' as const, title: 'Properties by Type', data: propertiesByType },
    { type: 'area' as const, title: 'Monthly Rental Revenue', data: monthlyRevenue },
];

const realEstateActions = [
    { icon: '🏠', label: 'Add Listing', onClick: () => { } },
    { icon: '📋', label: 'Manage', onClick: () => { } },
    { icon: '👥', label: 'Tenants', onClick: () => { } },
    { icon: '💰', label: 'Finances', onClick: () => { } },
    { icon: '🔧', label: 'Maintenance', onClick: () => { } },
    { icon: '📊', label: 'Analytics', onClick: () => { } },
];

export default function RealEstatePage({ params: { locale } }: { params: { locale: string } }) {
    return (
        <DepartmentDashboard title="Real Estate Hub" subtitle="Properties • Tenants • Leases • Valuations" icon="🏠" color="blue"
            statusLabel="Value" statusValue="$4.2M" metrics={realEstateMetrics} charts={realEstateCharts} quickActions={realEstateActions} locale={locale}
        />
    );
}
