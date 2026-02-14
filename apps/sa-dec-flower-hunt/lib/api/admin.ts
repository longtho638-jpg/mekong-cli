
import { supabase } from '@/lib/supabase';

export interface DailyRevenue {
    date: string;
    revenue: number;
    order_count: number;
}

export interface AdminStats {
    total_revenue: number;
    total_orders: number;
    active_products: number;
    low_stock_products: number;
}

export async function getDailyRevenue(): Promise<DailyRevenue[]> {
    if (!supabase) return [];

    const { data, error } = await supabase.rpc('get_daily_revenue');

    if (error) {
        console.error('Error fetching daily revenue:', error);
        // Fallback to empty array to prevent crash
        return [];
    }

    // Format dates if needed, or return raw
    return data || [];
}

export async function getAdminStats(): Promise<AdminStats | null> {
    if (!supabase) return null;

    const { data, error } = await supabase.rpc('get_admin_stats');

    if (error) {
        console.error('Error fetching admin stats:', error);
        return null;
    }

    if (data && data.length > 0) {
        return data[0];
    }

    return null;
}
