'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface, MD3Text } from '@/components/md3-dna';
import { useClients } from '@/lib/hooks';
import {
    Users, UserPlus, Search, MoreHorizontal, Mail, Phone, Building2,
    DollarSign, Trash2, Edit, X, Check, AlertCircle
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 CRM HUB - REAL CRUD with Supabase
// DNA: MD3AppShell + MD3SupportingPaneLayout + MD3Surface
// ═══════════════════════════════════════════════════════════════════════════════

export default function CRMPage({ params: { locale } }: { params: { locale: string } }) {
    const {
        clients,
        loading,
        error,
        stats,
        createClient,
        updateClient,
        deleteClient,
    } = useClients();

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter clients by search
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <MD3AppShell title="CRM Hub" subtitle="Client Management">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards - Using gap-3 like KPIHeroGrid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <KPICard
                                icon={<Users className="w-5 h-5" />}
                                label="Total Clients"
                                value={stats.total.toString()}
                                color="var(--md-sys-color-primary)"
                            />
                            <KPICard
                                icon={<Check className="w-5 h-5" />}
                                label="Active"
                                value={stats.active.toString()}
                                color="var(--md-sys-color-tertiary)"
                            />
                            <KPICard
                                icon={<AlertCircle className="w-5 h-5" />}
                                label="Pending"
                                value={stats.pending.toString()}
                                color="var(--md-sys-color-secondary)"
                            />
                            <KPICard
                                icon={<DollarSign className="w-5 h-5" />}
                                label="Total MRR"
                                value={formatCurrency(stats.totalMRR)}
                                color="var(--md-sys-color-primary)"
                            />
                        </div>

                        {/* Search Bar */}
                        <div
                            className="flex items-center rounded-xl px-4 py-3"
                            style={{
                                backgroundColor: 'var(--md-sys-color-surface-container)',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                            }}
                        >
                            <Search className="w-5 h-5 mr-3" style={{ color: 'var(--md-sys-color-outline)' }} />
                            <input
                                type="text"
                                placeholder="Search clients by name, company, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none"
                                style={{
                                    color: 'var(--md-sys-color-on-surface)',
                                    fontSize: 'var(--md-sys-typescale-body-large-size)',
                                }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')}>
                                    <X className="w-4 h-4" style={{ color: 'var(--md-sys-color-outline)' }} />
                                </button>
                            )}
                        </div>

                        {/* Clients List */}
                        <MD3Card headline={`Clients (${filteredClients.length})`}>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
                                        style={{ borderColor: 'var(--md-sys-color-primary)' }} />
                                </div>
                            ) : error ? (
                                <div className="text-center py-8" style={{ color: 'var(--md-sys-color-error)' }}>
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                    <p>{error}</p>
                                </div>
                            ) : filteredClients.length === 0 ? (
                                <div className="text-center py-8" style={{ color: 'var(--md-sys-color-outline)' }}>
                                    <Users className="w-8 h-8 mx-auto mb-2" />
                                    <p>No clients found</p>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="mt-4 px-4 py-2 rounded-lg transition-all"
                                        style={{
                                            backgroundColor: 'var(--md-sys-color-primary)',
                                            color: 'var(--md-sys-color-on-primary)',
                                        }}
                                    >
                                        Add Your First Client
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col" style={{ gap: '8px' }}>
                                    {filteredClients.map((client) => (
                                        <ClientRow
                                            key={client.id}
                                            client={client}
                                            onEdit={() => setEditingId(client.id)}
                                            onDelete={() => deleteClient(client.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </MD3Card>
                    </>
                }
                supportingContent={
                    <>
                        {/* Quick Actions */}
                        <MD3Card headline="Quick Actions">
                            <div className="flex flex-col" style={{ gap: '8px' }}>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center w-full p-3 rounded-lg transition-all hover:opacity-80"
                                    style={{
                                        backgroundColor: 'var(--md-sys-color-primary)',
                                        color: 'var(--md-sys-color-on-primary)',
                                        gap: '12px',
                                    }}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Add New Client</span>
                                </button>
                                <button
                                    className="flex items-center w-full p-3 rounded-lg transition-all hover:opacity-80"
                                    style={{
                                        backgroundColor: 'var(--md-sys-color-surface-container)',
                                        gap: '12px',
                                    }}
                                >
                                    <Mail className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} />
                                    <span style={{ color: 'var(--md-sys-color-on-surface)' }}>Send Campaign</span>
                                </button>
                            </div>
                        </MD3Card>

                        {/* Stats Summary */}
                        <MD3Card headline="Pipeline Stats">
                            <div className="flex flex-col" style={{ gap: '12px' }}>
                                <StatRow label="Active Clients" value={stats.active} color="var(--md-sys-color-tertiary)" />
                                <StatRow label="Pending" value={stats.pending} color="var(--md-sys-color-secondary)" />
                                <StatRow label="Churned" value={stats.churned} color="var(--md-sys-color-error)" />
                                <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                                    <StatRow label="Monthly Revenue" value={formatCurrency(stats.totalMRR)} color="var(--md-sys-color-primary)" />
                                </div>
                            </div>
                        </MD3Card>

                        {/* Recent Activity */}
                        <MD3Card headline="Recent Activity">
                            <div className="flex flex-col" style={{ gap: '8px' }}>
                                {clients.slice(0, 3).map((client, i) => (
                                    <div key={i} className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        <span style={{ color: 'var(--md-sys-color-primary)' }}>{client.name}</span>
                                        <span> added on {new Date(client.created_at).toLocaleDateString()}</span>
                                    </div>
                                ))}
                                {clients.length === 0 && (
                                    <div className="text-sm" style={{ color: 'var(--md-sys-color-outline)' }}>
                                        No recent activity
                                    </div>
                                )}
                            </div>
                        </MD3Card>
                    </>
                }
            />

            {/* Add Client Modal */}
            {showAddModal && (
                <AddClientModal
                    onClose={() => setShowAddModal(false)}
                    onCreate={async (data) => {
                        await createClient(data);
                        setShowAddModal(false);
                    }}
                />
            )}
        </MD3AppShell>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <MD3Surface shape="large" color="surface-container" interactive={true}>
            {/* Header Row - Icon + Label */}
            <div className="flex items-center gap-2 mb-3">
                <div
                    className="p-1.5 rounded-lg"
                    style={{
                        backgroundColor: 'var(--md-sys-color-primary-container)',
                        color,
                    }}
                >
                    {icon}
                </div>
                <MD3Text variant="label-small" color="on-surface-variant" transform="uppercase">
                    {label}
                </MD3Text>
            </div>

            {/* Value */}
            <MD3Text variant="headline-small" color="on-surface">
                {value}
            </MD3Text>

            {/* Pulse Indicator */}
            <div
                className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: color }}
            />
        </MD3Surface>
    );
}

function ClientRow({ client, onEdit, onDelete }: { client: any; onEdit: () => void; onDelete: () => void }) {
    const statusColors: Record<string, string> = {
        active: 'var(--md-sys-color-tertiary)',
        pending: 'var(--md-sys-color-secondary)',
        churned: 'var(--md-sys-color-error)',
    };

    return (
        <div
            className="flex items-center justify-between p-4 rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
        >
            <div className="flex items-center" style={{ gap: '16px' }}>
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}
                >
                    {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{client.name}</div>
                    <div className="text-sm flex items-center" style={{ gap: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {client.company && <span className="flex items-center"><Building2 className="w-3 h-3 mr-1" />{client.company}</span>}
                        {client.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1" />{client.email}</span>}
                    </div>
                </div>
            </div>
            <div className="flex items-center" style={{ gap: '16px' }}>
                <span
                    className="px-2 py-1 text-xs rounded-full"
                    style={{ backgroundColor: `${statusColors[client.status]}20`, color: statusColors[client.status] }}
                >
                    {client.status}
                </span>
                <span className="font-medium" style={{ color: 'var(--md-sys-color-primary)' }}>
                    ${client.mrr}/mo
                </span>
                <div className="flex" style={{ gap: '4px' }}>
                    <button onClick={onEdit} className="p-2 rounded-lg hover:opacity-70" style={{ color: 'var(--md-sys-color-outline)' }}>
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-2 rounded-lg hover:opacity-70" style={{ color: 'var(--md-sys-color-error)' }}>
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div className="flex justify-between items-center">
            <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '14px' }}>{label}</span>
            <span style={{ color, fontWeight: 600 }}>{value}</span>
        </div>
    );
}

function AddClientModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => Promise<void> }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        mrr: 0,
        status: 'pending' as const,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        setSaving(true);
        try {
            await onCreate(formData);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div
                className="w-full max-w-md rounded-2xl p-6"
                style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>Add New Client</h2>
                    <button onClick={onClose}><X className="w-5 h-5" style={{ color: 'var(--md-sys-color-outline)' }} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '16px' }}>
                    <InputField label="Name *" value={formData.name} onChange={(v) => setFormData(p => ({ ...p, name: v }))} required />
                    <InputField label="Email" type="email" value={formData.email} onChange={(v) => setFormData(p => ({ ...p, email: v }))} />
                    <InputField label="Phone" value={formData.phone} onChange={(v) => setFormData(p => ({ ...p, phone: v }))} />
                    <InputField label="Company" value={formData.company} onChange={(v) => setFormData(p => ({ ...p, company: v }))} />
                    <InputField label="MRR ($)" type="number" value={formData.mrr.toString()} onChange={(v) => setFormData(p => ({ ...p, mrr: parseFloat(v) || 0 }))} />

                    <div className="flex justify-end" style={{ gap: '12px', marginTop: '8px' }}>
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !formData.name}
                            className="px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                            style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}
                        >
                            {saving ? 'Saving...' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
    return (
        <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                style={{
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-on-surface)',
                }}
            />
        </div>
    );
}
