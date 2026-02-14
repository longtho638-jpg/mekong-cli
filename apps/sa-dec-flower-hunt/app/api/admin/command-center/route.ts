import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';

// Demo data for go-live testing
const DEMO_COMMAND_CENTER = {
    metrics: {
        orders_today: 15,
        orders_week: 89,
        orders_completed: 245,
        total_revenue: 58500000,
        revenue_today: 3200000,
        revenue_week: 21500000,
        total_farmers: 42,
        active_farmers_week: 28,
        platform_avg_rating: 4.7,
        total_reviews: 156,
        qr_scans_week: 340,
        active_qr_codes: 85,
    },
    revenue_trend: [
        { date: '2025-12-06', revenue: 2800000 },
        { date: '2025-12-07', revenue: 3100000 },
        { date: '2025-12-08', revenue: 2950000 },
        { date: '2025-12-09', revenue: 3400000 },
        { date: '2025-12-10', revenue: 2750000 },
        { date: '2025-12-11', revenue: 3200000 },
        { date: '2025-12-12', revenue: 3200000 },
    ],
    top_farmers: [
        { name: 'Vườn Út Hương', revenue: 12500000, orders: 45 },
        { name: 'Vườn Bình Minh', revenue: 9800000, orders: 38 },
        { name: 'Vườn Hoàng Lan', revenue: 8200000, orders: 31 },
    ],
    recent_activity: [
        { id: '1', recipient_name: 'Nguyễn Văn A', final_price: 450000, status: 'completed', created_at: new Date().toISOString() },
        { id: '2', recipient_name: 'Trần Thị B', final_price: 320000, status: 'shipped', created_at: new Date(Date.now() - 300000).toISOString() },
    ],
    timestamp: new Date().toISOString()
};

/**
 * Live Dashboard Metrics API
 * GET /api/admin/command-center
 * Returns real-time platform metrics
 * SECURED: Requires Admin Authentication (or Demo Mode)
 */
export async function GET(request: NextRequest) {
    try {
        // 🎯 DEMO MODE: Allow bypass for go-live testing
        const demoMode = request.headers.get('X-Demo-Mode') === 'true';
        if (demoMode) {
            return NextResponse.json(DEMO_COMMAND_CENTER);
        }

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Role Check (Admin)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 3. Data Access
        // Initialize Admin Client for global data access (bypassing RLS for aggregation)
        const adminDb = createSupabaseJsClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get live metrics from view
        const { data: metrics, error: metricsError } = await adminDb
            .from('dashboard_live_metrics')
            .select('*')
            .single();

        if (metricsError) {
            console.error('Metrics error:', metricsError);
            // Return mock data if view doesn't exist yet
            return NextResponse.json({
                orders_today: 0,
                orders_week: 0,
                orders_completed: 0,
                total_revenue: 0,
                revenue_today: 0,
                revenue_week: 0,
                total_farmers: 0,
                active_farmers_week: 0,
                platform_avg_rating: 0,
                total_reviews: 0,
                qr_scans_week: 0,
                active_qr_codes: 0,
                updated_at: new Date().toISOString(),
            });
        }

        // Get revenue trend (last 7 days)
        const { data: revenueTrend } = await adminDb
            .from('revenue_daily')
            .select('*')
            .limit(7)
            .order('date', { ascending: true });

        // Get top farmers
        const { data: topFarmers } = await adminDb
            .from('top_farmers')
            .select('*')
            .limit(5);

        // Get recent activity (last 10 orders)
        const { data: recentOrders } = await adminDb
            .from('orders')
            .select('id, recipient_name, final_price, status, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            metrics,
            revenue_trend: revenueTrend || [],
            top_farmers: topFarmers || [],
            recent_activity: recentOrders || [],
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('Command center error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Get real-time updates (for polling/websocket)
 * Can be called every 5-10 seconds for live updates
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;
