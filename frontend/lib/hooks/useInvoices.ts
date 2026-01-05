'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAgency } from './useAgency';
import type { Invoice, CreateInvoice, UpdateInvoice } from '@/lib/types/database';

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 USE INVOICES HOOK - Full CRUD for invoices
// ═══════════════════════════════════════════════════════════════════════════════

export function useInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { agency } = useAgency();
    const supabase = createClient();

    // READ - Fetch all invoices with client data
    const fetchInvoices = useCallback(async () => {
        if (!agency) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('invoices')
                .select(`
                    *,
                    client:clients(id, name, company),
                    project:projects(id, name)
                `)
                .eq('agency_id', agency.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setInvoices(data as Invoice[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    }, [agency, supabase]);

    // CREATE - Add new invoice
    const createInvoice = async (invoice: Partial<Omit<CreateInvoice, 'agency_id' | 'invoice_number' | 'issue_date'>> & { amount: number; total: number }) => {
        if (!agency) throw new Error('No agency');

        // Generate invoice number and set issue date
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

        try {
            const { data, error } = await supabase
                .from('invoices')
                .insert({
                    ...invoice,
                    agency_id: agency.id,
                    invoice_number: invoiceNumber,
                    issue_date: new Date().toISOString().split('T')[0],
                })
                .select(`
                    *,
                    client:clients(id, name, company),
                    project:projects(id, name)
                `)
                .single();

            if (error) throw error;
            setInvoices(prev => [data as Invoice, ...prev]);
            return data as Invoice;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invoice');
            throw err;
        }
    };

    // UPDATE - Modify existing invoice
    const updateInvoice = async (id: string, updates: UpdateInvoice) => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .update(updates)
                .eq('id', id)
                .select(`
                    *,
                    client:clients(id, name, company),
                    project:projects(id, name)
                `)
                .single();

            if (error) throw error;
            setInvoices(prev => prev.map(i => i.id === id ? data as Invoice : i));
            return data as Invoice;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update invoice');
            throw err;
        }
    };

    // Mark as paid
    const markAsPaid = async (id: string) => {
        return updateInvoice(id, {
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0],
        });
    };

    // DELETE - Remove invoice
    const deleteInvoice = async (id: string) => {
        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setInvoices(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete invoice');
            throw err;
        }
    };

    useEffect(() => {
        if (agency) {
            fetchInvoices();
        }
    }, [agency, fetchInvoices]);

    // Computed stats
    const stats = {
        total: invoices.length,
        draft: invoices.filter(i => i.status === 'draft').length,
        sent: invoices.filter(i => i.status === 'sent').length,
        paid: invoices.filter(i => i.status === 'paid').length,
        overdue: invoices.filter(i => i.status === 'overdue').length,
        totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
        outstanding: invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.total, 0),
    };

    return {
        invoices,
        loading,
        error,
        stats,
        createInvoice,
        updateInvoice,
        markAsPaid,
        deleteInvoice,
        refetch: fetchInvoices,
    };
}
