'use client';

import React, { useState } from 'react';
import { Receipt, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2, Plus, Send } from 'lucide-react';
import { MD3AppShell } from '@/components/md3/MD3AppShell';
import { MD3SupportingPaneLayout } from '@/components/md3/MD3SupportingPaneLayout';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Surface } from '@/components/md3-dna/MD3Surface';
import { useInvoices } from '@/lib/hooks/useInvoices';

export default function FinOpsPage() {
    const { invoices, loading, error, stats, createInvoice, markAsPaid, deleteInvoice } = useInvoices();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newInvoice, setNewInvoice] = useState({
        amount: 0,
        tax: 0,
        total: 0,
        status: 'draft' as const,
        currency: 'USD'
    });

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    const handleCreateInvoice = async () => {
        if (!newInvoice.amount) return;
        try {
            const total = newInvoice.amount + newInvoice.tax;
            await createInvoice({ ...newInvoice, total });
            setNewInvoice({ amount: 0, tax: 0, total: 0, status: 'draft', currency: 'USD' });
            setShowCreateForm(false);
        } catch (err) {
            console.error('Failed to create invoice:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return '#22c55e';
            case 'sent': return '#3b82f6';
            case 'overdue': return '#ef4444';
            case 'draft': return '#9ca3af';
            default: return '#9ca3af';
        }
    };

    return (
        <MD3AppShell title="FinOps Hub 💰" subtitle="Invoices • Revenue • Outstanding • Cash Flow">
            <MD3SupportingPaneLayout
                mainContent={
                    <>
                        {/* KPI Cards - Now with REAL DATA from Supabase */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#22c55e' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(stats.totalRevenue)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {stats.paid} paid invoices
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#f59e0b' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(stats.outstanding)}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {stats.sent} pending
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <Receipt className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Invoices</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#3b82f6' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.total}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    {stats.draft} drafts
                                </div>
                            </MD3Surface>
                            <MD3Surface shape="large" className="auto-safe">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} />
                                    <span style={{ fontSize: 'var(--md-sys-typescale-label-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue</span>
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 600, color: '#ef4444' }}>
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.overdue}
                                </div>
                                <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-tertiary)' }}>
                                    Needs attention
                                </div>
                            </MD3Surface>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
                            </div>
                        )}

                        {/* Create Invoice Form */}
                        {showCreateForm && (
                            <MD3Surface shape="large" className="mt-4">
                                <h3 style={{ fontSize: 'var(--md-sys-typescale-title-medium-size)', marginBottom: '16px' }}>Create New Invoice</h3>
                                <div className="space-y-3">
                                    <input
                                        type="number"
                                        placeholder="Amount ($)"
                                        value={newInvoice.amount || ''}
                                        onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
                                        className="w-full p-3 rounded-xl"
                                        style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Tax ($)"
                                        value={newInvoice.tax || ''}
                                        onChange={(e) => setNewInvoice({ ...newInvoice, tax: Number(e.target.value) })}
                                        className="w-full p-3 rounded-xl"
                                        style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateInvoice}
                                            className="flex-1 p-3 rounded-xl"
                                            style={{ backgroundColor: '#22c55e', color: 'white' }}
                                        >
                                            Create Invoice
                                        </button>
                                        <button
                                            onClick={() => setShowCreateForm(false)}
                                            className="p-3 rounded-xl"
                                            style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </MD3Surface>
                        )}

                        {/* Invoices List - REAL DATA */}
                        <div className="mt-4 space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
                                </div>
                            ) : invoices.length === 0 ? (
                                <MD3Surface shape="large" className="text-center py-8">
                                    <Receipt className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--md-sys-color-outline)' }} />
                                    <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>No invoices yet. Create your first invoice!</p>
                                </MD3Surface>
                            ) : (
                                invoices.slice(0, 10).map((invoice) => (
                                    <MD3Surface key={invoice.id} shape="large" className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span style={{
                                                    fontSize: 'var(--md-sys-typescale-title-medium-size)',
                                                    color: 'var(--md-sys-color-on-surface)',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {invoice.invoice_number}
                                                </span>
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs uppercase"
                                                    style={{
                                                        backgroundColor: `${getStatusColor(invoice.status)}20`,
                                                        color: getStatusColor(invoice.status)
                                                    }}
                                                >
                                                    {invoice.status}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 'var(--md-sys-typescale-body-small-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                                {invoice.client?.name || 'No client'} • Due: {invoice.due_date || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span style={{
                                                fontSize: 'var(--md-sys-typescale-title-large-size)',
                                                fontWeight: 600,
                                                color: 'var(--md-sys-color-on-surface)'
                                            }}>
                                                {formatCurrency(invoice.total)}
                                            </span>
                                            {invoice.status !== 'paid' && (
                                                <button
                                                    onClick={() => markAsPaid(invoice.id)}
                                                    className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
                                                    title="Mark as paid"
                                                >
                                                    <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteInvoice(invoice.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                                title="Delete invoice"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </MD3Surface>
                                ))
                            )}
                        </div>
                    </>
                }
                supportingContent={
                    <MD3Card headline="Quick Actions" subhead="FinOps Tools">
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                                style={{ backgroundColor: '#22c55e', border: 'none' }}
                            >
                                <Plus className="w-5 h-5 text-white" />
                                <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'white' }}>New Invoice</span>
                            </button>
                            {[{ icon: '📊', label: 'Dashboard' }, { icon: '💳', label: 'Payments' }, { icon: '📈', label: 'Reports' }, { icon: '🔔', label: 'Reminders' }, { icon: '⚙️', label: 'Settings' }].map((action) => (
                                <button key={action.label} className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                                    <span style={{ fontSize: '20px' }}>{action.icon}</span>
                                    <span style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'var(--md-sys-color-on-surface)' }}>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </MD3Card>
                }
            />
        </MD3AppShell>
    );
}
