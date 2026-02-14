import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyWebhookData } from '@/lib/payos';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 0. Security Check: Verify PayOS Signature
        // Must verify that the request comes from PayOS
        if (!verifyWebhookData(body)) {
            console.error('[Webhook] Invalid PayOS signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() { return [] },
                    setAll() { },
                },
            }
        );

        const { webhookId, orderId, userId, amount, paymentMethod, orderCode, code } = body;

        // Handle PayOS simplified webhook format if needed
        // Adaptation logic: if orderCode exists but no orderId, we need to lookup orderId from transaction
        let finalOrderId = orderId;
        let finalUserId = userId;
        let finalWebhookId = webhookId || `webhook-${Date.now()}-${Math.random()}`;
        let finalAmount = amount;

        if (!finalOrderId && orderCode) {
            const { data: tx } = await supabase.from('transactions').select('order_id, user_id, amount').eq('payos_order_code', orderCode).single();
            if (tx) {
                finalOrderId = tx.order_id;
                finalUserId = tx.user_id;
                finalAmount = tx.amount || amount;
            }
        }

        // 1. Validate input
        if (!finalOrderId || !finalUserId || !finalAmount) {
            // Logic for standard PayOS webhook verification if it's a direct PayOS hit
            if (code === '00' && orderCode) {
                // This is a PayOS webhook, let's try to process it via existing logic but safer
                // Check if transaction exists
                const { data: tx } = await supabase.from('transactions').select('*').eq('payos_order_code', orderCode).single();
                if (tx) {
                    finalOrderId = tx.order_id;
                    finalUserId = tx.user_id;

                    // Recursively call the secure RPC now that we have data
                    if (tx.status === 'completed') {
                        return NextResponse.json({ success: true, message: 'Already processed' });
                    }
                } else {
                    return NextResponse.json({ error: 'Transaction not found for PayOS orderCode' }, { status: 404 });
                }
            } else {
                return NextResponse.json(
                    { error: 'Missing required fields' },
                    { status: 400 }
                );
            }
        }

        if (finalAmount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        // 2. Check idempotency - already processed?
        // Double safeguard: check webhook_log AND transaction status
        const { data: existingLog } = await supabase
            .from('webhook_log')
            .select('id')
            .eq('webhook_id', finalWebhookId)
            .single();

        if (existingLog) {
            console.log(`Webhook ${finalWebhookId} already processed`);
            return NextResponse.json({
                status: 'already_processed',
                message: 'Webhook already processed',
            });
        }

        // 3. Process payment in transaction
        const { data, error } = await supabase.rpc('process_payment_webhook', {
            p_webhook_id: finalWebhookId,
            p_order_id: finalOrderId,
            p_user_id: finalUserId,
            p_amount: finalAmount,
            p_payment_method: paymentMethod || 'payos',
        });

        if (error) {
            // Handle the "Webhook already processed" exception from SQL gracefully
            if (error.message.includes('Webhook already processed')) {
                return NextResponse.json({ status: 'already_processed', message: 'Webhook already processed' });
            }

            console.error('Payment processing failed:', error);
            return NextResponse.json(
                { error: 'Payment processing failed', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            webhook_id: finalWebhookId,
            order_id: finalOrderId,
            message: 'Payment processed successfully',
        });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
