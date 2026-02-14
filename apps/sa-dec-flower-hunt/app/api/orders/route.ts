import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Fetch Orders for Authenticated User
        // Use the authenticated client (respects RLS)
        // Filter by user_id to ensure they only see their own orders
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    quantity,
                    price_at_purchase,
                    product:products (
                        name,
                        metadata
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (orderError) {
            console.error('[API/Orders] DB Error:', orderError);
            throw orderError;
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json({ orders: [] });
        }

        // 3. Format Data
        const formattedOrders = orders.map(order => {
            // Flatten items
            // If order has multiple items, we might need to handle it differently, 
            // but the previous code seemed to return one entry per item-order combo or just list them.
            // Let's stick to the previous return shape: List of items essentially.
            // Wait, the previous code returned a flat list of "formattedOrders" where each entry looked like an item.
            // Let's replicate that structure for compatibility.
            
            return (order.order_items || []).map((item: any) => ({
                id: item.id,
                flower_name: item.product?.name || 'Sản phẩm không xác định',
                size: item.product?.metadata?.size || 'Tiêu chuẩn',
                quantity: item.quantity,
                price: (item.price_at_purchase || 0) * (item.quantity || 1),
                status: order.status || 'pending',
                address: order.shipping_address?.address || 'Tại vườn',
                created_at: order.created_at
            }));
        }).flat();

        // Sort descending
        formattedOrders.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return NextResponse.json({ orders: formattedOrders });

    } catch (error: any) {
        console.error('[API/Orders] Uncaught error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
