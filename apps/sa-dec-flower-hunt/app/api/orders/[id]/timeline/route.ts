import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler
// const supabase = createClient(...)

/**
 * Get order timeline (status history)
 * GET /api/orders/[id]/timeline
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { id: orderId } = await params;

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Get status history
        const { data: history, error: historyError } = await supabase
            .from('order_status_history')
            .select('*, profiles(name, email)')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });

        if (historyError) {
            console.error('Failed to fetch history:', historyError);
            return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
        }

        // Format timeline
        const timeline = history?.map(entry => ({
            id: entry.id,
            status: entry.status,
            previousStatus: entry.previous_status,
            note: entry.note,
            changedBy: entry.profiles?.name || 'System',
            changedByRole: entry.changed_by_role,
            timestamp: entry.created_at,
            metadata: entry.metadata,
        })) || [];

        return NextResponse.json({
            order: {
                id: order.id,
                currentStatus: order.status,
                createdAt: order.created_at,
            },
            timeline,
        });

    } catch (error: any) {
        console.error('Timeline fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
