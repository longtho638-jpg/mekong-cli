import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler
// const supabase = createClient(...)

/**
 * Update order status and create history entry
 * POST /api/orders/[id]/update-status
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { status, note, userId, userRole } = await request.json();
        const { id: orderId } = await params;

        // Validate status
        const validStatuses = ['pending', 'paid', 'confirmed', 'preparing', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Get current order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const previousStatus = order.status;

        // Update order status
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', orderId);

        if (updateError) {
            console.error('Failed to update order:', updateError);
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        // Create status history entry
        const { error: historyError } = await supabase
            .from('order_status_history')
            .insert({
                order_id: orderId,
                status,
                previous_status: previousStatus,
                note,
                changed_by: userId,
                changed_by_role: userRole || 'system',
            });

        if (historyError) {
            console.error('Failed to create history:', historyError);
            // Don't fail the request if history fails
        }

        // Handle escrow logic based on status
        if (status === 'delivered') {
            // Auto-release escrow after delivery (or schedule for 7 days)
            await handleEscrowRelease(supabase, orderId, 'buyer_confirmed');
        } else if (status === 'cancelled') {
            // Refund to buyer
            await handleEscrowRefund(supabase, orderId, 'order_cancelled');
        }

        return NextResponse.json({
            success: true,
            order: { ...order, status },
            previousStatus,
        });

    } catch (error: any) {
        console.error('Update status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Release escrow to farmer
 */
async function handleEscrowRelease(supabase: any, orderId: string, reason: string) {
    try {
        // Get transaction
        const { data: transaction } = await supabase
            .from('transactions')
            .select('*, orders(order_items(farmer_id))')
            .eq('order_id', orderId)
            .eq('status', 'completed')
            .single();

        if (!transaction || transaction.escrow_status === 'released_to_farmer') {
            return; // Already released or no transaction
        }

        const amount = transaction.amount;
        const platformCommission = amount * 0.03;
        const farmerAmount = amount - platformCommission;
        const farmerId = transaction.orders?.order_items?.[0]?.farmer_id;

        if (!farmerId) return;

        // Update transaction escrow status
        await supabase
            .from('transactions')
            .update({
                escrow_status: 'released_to_farmer',
                escrow_released_at: new Date().toISOString(),
                release_reason: reason,
            })
            .eq('id', transaction.id);

        // Credit farmer wallet (if not already credited)
        const { data: wallet } = await supabase
            .from('farmer_wallets')
            .select('*')
            .eq('farmer_id', farmerId)
            .single();

        if (wallet) {
            await supabase
                .from('farmer_wallets')
                .update({
                    balance: wallet.balance + farmerAmount,
                    total_earned: wallet.total_earned + farmerAmount,
                })
                .eq('farmer_id', farmerId);
        } else {
            await supabase
                .from('farmer_wallets')
                .insert({
                    farmer_id: farmerId,
                    balance: farmerAmount,
                    total_earned: farmerAmount,
                });
        }

        // Log wallet transaction
        await supabase
            .from('wallet_transactions')
            .insert({
                farmer_id: farmerId,
                type: 'credit',
                amount: farmerAmount,
                description: `Escrow released: Order #${orderId.substring(0, 8)}`,
                order_id: orderId,
            });

        console.log(`✅ Escrow released: ${farmerAmount} VND to farmer ${farmerId}`);

    } catch (error) {
        console.error('Escrow release error:', error);
    }
}

/**
 * Refund escrow to buyer
 */
async function handleEscrowRefund(supabase: any, orderId: string, reason: string) {
    try {
        // Update transaction
        await supabase
            .from('transactions')
            .update({
                escrow_status: 'refunded_to_buyer',
                escrow_released_at: new Date().toISOString(),
                release_reason: reason,
            })
            .eq('order_id', orderId);

        // TODO: Implement actual refund via PayOS API
        console.log(`⚠️ Refund needed for order ${orderId}`);

    } catch (error) {
        console.error('Escrow refund error:', error);
    }
}
