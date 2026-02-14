"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface RealtimeMetrics {
    totalOrders: number;
    totalRevenue: number;
    activeProducts: number;
    activeFarmers: number;
    activeCustomers: number;
    pendingOrders: number;
    todayOrders: number;
    isLoading: boolean;
    lastUpdate: Date | null;
    error: string | null;
}

export function useRealtimeMetrics() {
    const [metrics, setMetrics] = useState<RealtimeMetrics>({
        totalOrders: 0,
        totalRevenue: 0,
        activeProducts: 0,
        activeFarmers: 0,
        activeCustomers: 0,
        pendingOrders: 0,
        todayOrders: 0,
        isLoading: true,
        lastUpdate: null,
        error: null,
    });

    // Fetch initial metrics
    const fetchMetrics = useCallback(async () => {
        if (!supabase) {
            setMetrics(prev => ({ ...prev, error: "Supabase not configured", isLoading: false }));
            return;
        }

        try {
            // Parallel queries for better performance
            const [ordersResult, productsResult, profilesResult] = await Promise.all([
                supabase.from('orders').select('id, total_amount, status, created_at'),
                supabase.from('products').select('id, status').eq('status', 'active'),
                supabase.from('profiles').select('id, role'),
            ]);

            const orders = ordersResult.data || [];
            const products = productsResult.data || [];
            const profiles = profilesResult.data || [];

            // Calculate metrics
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const farmers = profiles.filter(p => p.role === 'farmer');
            const customers = profiles.filter(p => p.role === 'customer');
            const pendingOrders = orders.filter(o => o.status === 'pending');
            const todayOrders = orders.filter(o => new Date(o.created_at) >= startOfDay);
            const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

            setMetrics({
                totalOrders: orders.length,
                totalRevenue,
                activeProducts: products.length,
                activeFarmers: farmers.length,
                activeCustomers: customers.length,
                pendingOrders: pendingOrders.length,
                todayOrders: todayOrders.length,
                isLoading: false,
                lastUpdate: new Date(),
                error: null,
            });

        } catch (error: any) {
            console.error("Failed to fetch metrics:", error);
            setMetrics(prev => ({
                ...prev,
                error: error.message || "Failed to fetch metrics",
                isLoading: false
            }));
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchMetrics();

        if (!supabase) return;

        // Setup realtime subscriptions
        const ordersChannel = supabase
            .channel('admin-orders-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    console.log('📦 Order change:', payload.eventType);
                    fetchMetrics(); // Refetch all metrics on change
                }
            )
            .subscribe();

        const productsChannel = supabase
            .channel('admin-products-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                (payload) => {
                    console.log('🌸 Product change:', payload.eventType);
                    fetchMetrics();
                }
            )
            .subscribe();

        const profilesChannel = supabase
            .channel('admin-profiles-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'profiles' },
                (payload) => {
                    console.log('👤 New profile:', payload.new);
                    fetchMetrics();
                }
            )
            .subscribe();

        // Cleanup
        return () => {
            supabase?.removeChannel(ordersChannel);
            supabase?.removeChannel(productsChannel);
            supabase?.removeChannel(profilesChannel);
        };
    }, [fetchMetrics]);

    return { ...metrics, refetch: fetchMetrics };
}
