
import { NextResponse } from 'next/server';
import { createPaymentLink, generateOrderCode } from '@/lib/payos';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
        }

        const { data: { user } } = await supabase.auth.getUser();

        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        // 1. Fetch order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name))')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 2. Check if already paid
        const { data: existingTransaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('order_id', orderId)
            .eq('status', 'completed')
            .single();

        if (existingTransaction) {
            return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
        }

        // 3. Prepare payment data
        const orderCode = generateOrderCode();
        const items = order.order_items?.map((item: any) => ({
            name: item.products?.name || 'Sản phẩm',
            quantity: item.quantity,
            price: item.price,
        })) || [];

        // 4. Create payment link
        const { checkoutUrl, paymentLinkId } = await createPaymentLink({
            orderCode,
            amount: order.final_price,
            description: `Đơn hàng #${orderId.substring(0, 8)} `,
            buyerName: order.recipient_name,
            buyerPhone: order.recipient_phone,
            buyerAddress: order.recipient_address,
            items,
        });

        // 5. Create pending transaction
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
                order_id: orderId,
                amount: order.final_price,
                status: 'pending',
                payment_method: 'payos',
                payos_order_code: orderCode,
                payos_payment_link_id: paymentLinkId,
            });

        if (transactionError) {
            console.error('Transaction creation error:', transactionError);
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            checkoutUrl,
            orderCode,
        });

    } catch (error: any) {
        console.error('Payment creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
