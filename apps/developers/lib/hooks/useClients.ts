 
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { useAgency } from './useAgency';
import type { Client, CreateClient, UpdateClient } from '@/lib/types/database';

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 USE CLIENTS HOOK - Full CRUD for clients
// ═══════════════════════════════════════════════════════════════════════════════

export function useClients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { agency } = useAgency();
    const supabase = createSupabaseClient();

    // READ - Fetch all clients
    const fetchClients = useCallback(async () => {
        if (!agency) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('clients')
                .select('*')
                .eq('agency_id', agency.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setClients(data as Client[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    }, [agency, supabase]);

    // CREATE - Add new client
    const createClient = async (client: Omit<CreateClient, 'agency_id'>) => {
        if (!agency) throw new Error('No agency');

        try {
            const { data, error } = await supabase
                .from('clients')
                .insert({
                    ...client,
                    agency_id: agency.id,
                })
                .select()
                .single();

            if (error) throw error;
            setClients(prev => [data as Client, ...prev]);
            return data as Client;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create client');
            throw err;
        }
    };

    // UPDATE - Modify existing client
    const updateClient = async (id: string, updates: UpdateClient) => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setClients(prev => prev.map(c => c.id === id ? data as Client : c));
            return data as Client;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update client');
            throw err;
        }
    };

    // DELETE - Remove client
    const deleteClient = async (id: string) => {
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setClients(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete client');
            throw err;
        }
    };

    // Get single client by ID
    const getClient = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Client;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch client');
            throw err;
        }
    };

    useEffect(() => {
        if (agency) {
            fetchClients();
        }
    }, [agency, fetchClients]);

    // Computed stats
    const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        pending: clients.filter(c => c.status === 'pending').length,
        churned: clients.filter(c => c.status === 'churned').length,
        totalMRR: clients.reduce((sum, c) => sum + (c.mrr || 0), 0),
    };

    return {
        clients,
        loading,
        error,
        stats,
        createClient,
        updateClient,
        deleteClient,
        getClient,
        refetch: fetchClients,
    };
}
