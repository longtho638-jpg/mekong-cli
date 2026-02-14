import { NextRequest, NextResponse } from 'next/server';
import { verifyCallback, isSuccessTransaction, getResponseMessage, type VNPayCallbackParams } from '@/lib/vnpay';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side operations
// Use service role for server-side operations
// const supabase = createClient(...)

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const searchParams = request.nextUrl.searchParams;
        const callbackParams = Object.fromEntries(searchParams.entries()) as unknown as VNPayCallbackParams;

        // 1. Verify signature
        const isValid = verifyCallback(callbackParams);
        if (!isValid) {
            console.error('Invalid VNPay signature');
            return NextResponse.redirect(new URL('/payment-result/failed?reason=invalid_signature', request.url));
        }

        // 2. Extract data
        const orderId = callbackParams.vnp_TxnRef;
        const responseCode = callbackParams.vnp_ResponseCode;
        const transactionNo = callbackParams.vnp_TransactionNo;
        const amount = parseInt(callbackParams.vnp_Amount) / 100; // Convert back from cents

        const isSuccess = isSuccessTransaction(responseCode);

        // 3. Update transaction status
        const { error: updateError } = await supabase
            .from('transactions')
            .update({
                status: isSuccess ? 'completed' : 'failed',
                vnpay_transaction_id: transactionNo,
                vnpay_response_code: responseCode,
                vnpay_response_message: getResponseMessage(responseCode),
                updated_at: new Date().toISOString(),
            })
            .eq('order_id', orderId);

        if (updateError) {
            console.error('Transaction update error:', updateError);
        }

        // 4. If successful, process the order
        if (isSuccess) {
            // Update order status
            await supabase
                .from('orders')
                .update({ status: 'paid' })
                .eq('id', orderId);

            // Credit farmer wallet
            const { data: order } = await supabase
                .from('orders')
                .select('*, order_items(farmer_id, price, quantity)')
                .eq('id', orderId)
                .single();

            if (order && order.order_items) {
                // Calculate amounts
                const platformCommission = amount * 0.03; // 3%
                const farmerAmount = amount - platformCommission;

                // Get farmer_id (assuming single farmer per order for now)
                const farmerId = order.order_items[0]?.farmer_id;

                if (farmerId) {
                    // Update farmer wallet
                    const { data: wallet } = await supabase
                        .from('farmer_wallets')
                        .select('*')
                        .eq('farmer_id', farmerId)
                        .single();

                    if (wallet) {
                        // Update existing wallet
                        await supabase
                            .from('farmer_wallets')
                            .update({
                                balance: wallet.balance + farmerAmount,
                                total_earned: wallet.total_earned + farmerAmount,
                            })
                            .eq('farmer_id', farmerId);
                    } else {
                        // Create new wallet
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
                            description: `Thanh toán đơn hàng #${orderId.substring(0, 8)}`,
                            order_id: orderId,
                        });

                    console.log(`✅ Credited ${farmerAmount} VND to farmer ${farmerId}`);
                }
            }

            // Redirect to success page
            return NextResponse.redirect(new URL(`/payment-result/success?orderId=${orderId}`, request.url));
        } else {
            // Failed transaction
            return NextResponse.redirect(
                new URL(`/payment-result/failed?reason=${encodeURIComponent(getResponseMessage(responseCode))}`, request.url)
            );
        }

    } catch (error: any) {
        console.error('Payment callback error:', error);
        return NextResponse.redirect(new URL('/payment-result/failed?reason=system_error', request.url));
    }
}
