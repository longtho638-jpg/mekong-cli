'use client';

import React, { useState } from 'react';
import { Package, Truck, BarChart3, AlertTriangle, Clock, DollarSign, Plus, Loader2, Monitor, Laptop, Server, Smartphone } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useAssets, useAssetSummary, useLicenses } from '@/hooks/useInventory';

// Tenant ID - in production, get from auth context
const TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'demo-tenant';

export default function InventoryPage() {
    const { assets, loading, error, createAsset } = useAssets(TENANT_ID);
    const { summary } = useAssetSummary(TENANT_ID);
    const { licenses } = useLicenses(TENANT_ID);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
        return `$${amount.toFixed(0)}`;
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'hardware': return <Laptop className="w-4 h-4" />;
            case 'software': return <Monitor className="w-4 h-4" />;
            case 'subscription': return <Server className="w-4 h-4" />;
            case 'digital': return <Smartphone className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#22c55e';
            case 'in_use': return '#3b82f6';
            case 'maintenance': return '#f59e0b';
            case 'retired': return '#9ca3af';
            case 'disposed': return '#ef4444';
            default: return '#9ca3af';
        }
    };

    // Filtered assets
    const filteredAssets = activeFilter
        ? assets.filter(a => a.type === activeFilter)
        : assets;

    return (
        <MD3AppShell title="Inventory Hub 📦" subtitle="Assets • Licenses • Equipment • Digital">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards - REAL DATA from useAssetSummary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Package className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Assets</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : summary?.totalAssets || 0}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {summary?.byType.hardware || 0} hardware items
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Value</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(summary?.totalValue || 0)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Across all categories
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expiring Soon</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: (summary?.expiringThisMonth || 0) > 5 ? '#ef4444' : '#f59e0b' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : summary?.expiringThisMonth || 0}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    This month
                                </div>
                            </MD3Surface>

                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5" style={{ color: '#a855f7' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Licenses</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#a855f7' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : licenses.length}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Active licenses
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-2 mt-4 flex-wrap">
                            <button
                                onClick={() => setActiveFilter(null)}
                                className="px-4 py-2 rounded-full transition-colors"
                                style={{
                                    backgroundColor: !activeFilter ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container)',
                                    color: !activeFilter ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                                }}
                            >
                                All
                            </button>
                            {['hardware', 'software', 'subscription', 'digital'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setActiveFilter(type)}
                                    className="px-4 py-2 rounded-full transition-colors capitalize"
                                    style={{
                                        backgroundColor: activeFilter === type ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container)',
                                        color: activeFilter === type ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
                                    }}
                                >
                                    {type} ({summary?.byType[type as keyof typeof summary.byType] || 0})
                                </button>
                            ))}
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
                            </div>
                        )}

                        {/* Assets List - REAL DATA */}
                        <div className="mt-4 space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                </div>
                            ) : filteredAssets.length === 0 ? (
                                <MD3Surface shape="large" className="text-center py-8">
                                    <Package className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--md-sys-color-outline)' }} />
                                    <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        No assets found. Add your first asset!
                                    </p>
                                </MD3Surface>
                            ) : (
                                filteredAssets.slice(0, 15).map((asset) => (
                                    <MD3Surface key={asset.id} shape="large" className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                                {getIconForType(asset.type)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span style={{
                                                        fontSize: 'var(--md-sys-typescale-title-medium-size)',
                                                        color: 'var(--md-sys-color-on-surface)',
                                                    }}>
                                                        {asset.name}
                                                    </span>
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-xs uppercase"
                                                        style={{
                                                            backgroundColor: `${getStatusColor(asset.status)}20`,
                                                            color: getStatusColor(asset.status)
                                                        }}
                                                    >
                                                        {asset.status}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                                    {asset.code} • {asset.category || asset.type}
                                                    {asset.assignedTo && ` • Assigned`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span style={{
                                                fontSize: 'var(--md-sys-typescale-title-large-size)',
                                                fontWeight: 600,
                                                color: 'var(--md-sys-color-on-surface)'
                                            }}>
                                                {formatCurrency(asset.currentValue || asset.purchasePrice || 0)}
                                            </span>
                                        </div>
                                    </MD3Surface>
                                ))
                            )}
                        </div>
                    </>
                }
                supportingContent={
                    <>
                        <MD3Card headline="Quick Actions" subhead="Asset Tools">
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                                    style={{ backgroundColor: '#3b82f6', border: 'none' }}
                                >
                                    <Plus className="w-5 h-5 text-white" />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'white' }}>Add Asset</span>
                                </button>
                                {[
                                    { icon: '📦', label: 'Add Stock' },
                                    { icon: '🔍', label: 'Search' },
                                    { icon: '🚚', label: 'Movements' },
                                    { icon: '📊', label: 'Reports' },
                                    { icon: '⚠️', label: 'Alerts' },
                                    { icon: '⚙️', label: 'Settings' },
                                ].map((action) => (
                                    <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                                        <span style={{ fontSize: '20px' }}>{action.icon}</span>
                                        <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'var(--md-sys-color-on-surface)' }}>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </MD3Card>

                        {/* Asset Distribution */}
                        <MD3Card headline="Asset Distribution" subhead="By Type" className="mt-4">
                            <div className="space-y-2">
                                {Object.entries(summary?.byType || {}).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span style={{ color: 'var(--md-sys-color-on-surface)', textTransform: 'capitalize' }}>{type}</span>
                                        <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>{count as number}</span>
                                    </div>
                                ))}
                            </div>
                        </MD3Card>
                    </>
                }
            />
        </MD3AppShell>
    );
}
