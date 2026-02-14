import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Demo data for go-live testing
const DEMO_METRICS = {
    activeUsersNow: 47,
    ordersToday: 12,
    revenueToday: 2850000,
    conversionRate: 3.2,
    avgCartValue: 237500,
    topSellingProduct: { name: 'Hoa Mai Vàng', quantity: 8 },
    recentActivity: [
        { id: '1', type: 'order', amount: 450000, timestamp: new Date().toISOString(), userId: 'user1' },
        { id: '2', type: 'order', amount: 320000, timestamp: new Date(Date.now() - 300000).toISOString(), userId: 'user2' },
        { id: '3', type: 'order', amount: 680000, timestamp: new Date(Date.now() - 600000).toISOString(), userId: 'user3' },
    ],
    lastUpdated: new Date().toISOString()
};

export async function GET(request: NextRequest) {
    try {
        // 🎯 DEMO MODE: Allow bypass for go-live testing
        const demoMode = request.headers.get('X-Demo-Mode') === 'true';
        if (demoMode) {
            return NextResponse.json(DEMO_METRICS);
        }

        // 🔒 SECURITY: Require admin authentication
        const cookieStore = await cookies();
        const adminAuth = cookieStore.get('admin_auth');
        if (!adminAuth || adminAuth.value !== 'true') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 1. Today's Orders & Revenue
        const { data: todayOrders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('id, total_amount, created_at')
            .gte('created_at', todayStart.toISOString());

        if (ordersError) throw ordersError;

        const ordersToday = todayOrders?.length || 0;
        const revenueToday = todayOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

        // 2. Active Users (last 5 minutes - from events table)
        const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const { data: recentEvents } = await supabaseAdmin
            .from('events')
            .select('user_id')
            .gte('created_at', fiveMinAgo.toISOString());

        const uniqueUsers = new Set(recentEvents?.map(e => e.user_id).filter(Boolean));
        const activeUsersNow = uniqueUsers.size;

        // 3. Conversion Rate (today)
        const { data: todayVisitors } = await supabaseAdmin
            .from('events')
            .select('session_id')
            .eq('stage', 'acquisition')
            .gte('created_at', todayStart.toISOString());

        const uniqueSessions = new Set(todayVisitors?.map(e => e.session_id).filter(Boolean));
        const visitorsToday = uniqueSessions.size;
        const conversionRate = visitorsToday > 0 ? (ordersToday / visitorsToday) * 100 : 0;

        // 4. Average Cart Value
        const avgCartValue = ordersToday > 0 ? revenueToday / ordersToday : 0;

        // 5. Top Selling Product (today)
        const { data: topProducts } = await supabaseAdmin
            .from('order_items')
            .select('product_id, quantity, products(name)')
            .gte('created_at', todayStart.toISOString())
            .limit(10);

        const productSales = new Map<string, { name: string; quantity: number }>();
        topProducts?.forEach(item => {
            const productName = (item as any).products?.name || 'Unknown';
            const existing = productSales.get(productName);
            if (existing) {
                existing.quantity += item.quantity;
            } else {
                productSales.set(productName, { name: productName, quantity: item.quantity });
            }
        });

        const topSellingProduct = Array.from(productSales.values())
            .sort((a, b) => b.quantity - a.quantity)[0] || { name: 'N/A', quantity: 0 };

        // 6. Recent Activity (last 10 orders)
        const { data: recentOrders } = await supabaseAdmin
            .from('orders')
            .select('id, total_amount, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(10);

        const recentActivity = recentOrders?.map(order => ({
            id: order.id,
            type: 'order',
            amount: order.total_amount,
            timestamp: order.created_at,
            userId: order.user_id
        })) || [];

        return NextResponse.json({
            activeUsersNow,
            ordersToday,
            revenueToday,
            conversionRate: Number(conversionRate.toFixed(2)),
            avgCartValue,
            topSellingProduct,
            recentActivity,
            lastUpdated: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Admin/LiveMetrics] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
