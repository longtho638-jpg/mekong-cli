 
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import type { Agency } from '@/lib/types/database';

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 USE AGENCY HOOK - Get current user's agency
// ═══════════════════════════════════════════════════════════════════════════════

export function useAgency() {
    const [agency, setAgency] = useState<Agency | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createSupabaseClient();

    const fetchAgency = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setAgency(null);
                return;
            }

            // Fetch user's agency
            const { data, error: fetchError } = await supabase
                .from('agencies')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (fetchError) {
                // No agency found - user needs to create one
                if (fetchError.code === 'PGRST116') {
                    setAgency(null);
                    return;
                }
                throw fetchError;
            }

            const agencyData = data as Agency;

            // 🔄 Unified Billing Sync: Check subscriptions table for source of truth
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('plan, status')
                .eq('tenant_id', agencyData.id)
                .single();

            if (subData) {
                // Override legacy fields with unified billing data
                agencyData.subscription_tier = subData.plan.toLowerCase() as 'free' | 'pro' | 'enterprise';
                agencyData.subscription_status = subData.status as 'active' | 'cancelled' | 'past_due';
            }

            setAgency(agencyData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch agency');
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const createAgency = async (name: string, niche?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('agencies')
                .insert({
                    user_id: user.id,
                    name,
                    niche,
                    subscription_tier: 'free',
                    subscription_status: 'active',
                })
                .select()
                .single();

            if (error) throw error;
            setAgency(data as Agency);
            return data as Agency;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create agency');
            throw err;
        }
    };

    const updateAgency = async (updates: Partial<Agency>) => {
        if (!agency) throw new Error('No agency to update');

        try {
            const { data, error } = await supabase
                .from('agencies')
                .update(updates)
                .eq('id', agency.id)
                .select()
                .single();

            if (error) throw error;
            setAgency(data as Agency);
            return data as Agency;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update agency');
            throw err;
        }
    };

    useEffect(() => {
        fetchAgency();
    }, [fetchAgency]);

    return {
        agency,
        loading,
        error,
        createAgency,
        updateAgency,
        refetch: fetchAgency,
    };
}
