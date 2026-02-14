import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );
}

export async function GET(req: NextRequest) {
    try {
        const orderId = req.nextUrl.searchParams.get('orderId');
        const trackingCode = req.nextUrl.searchParams.get('trackingCode');

        if (!orderId && !trackingCode) {
            return NextResponse.json(
                { error: 'orderId or trackingCode is required' },
                { status: 400 }
            );
        }

        const supabase = await getSupabase();

        // Query by orderId or tracking_code
        let query = supabase.from('orders').select('*');

        if (orderId) {
            query = query.eq('id', orderId);
        } else if (trackingCode) {
            query = query.eq('tracking_code', trackingCode);
        }

        const { data: order, error } = await query.single();

        if (error || !order) {
            // Return demo data if not found
            return NextResponse.json({
                success: true,
                mode: 'demo',
                tracking: {
                    orderId: orderId || 'DEMO-ORDER',
                    trackingCode: trackingCode || 'GHTK123456',
                    status: 'in_transit',
                    statusLabel: 'Đang vận chuyển',
                    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    steps: [
                        { status: 'Đơn hàng đã xác nhận', time: '2 giờ trước', completed: true },
                        { status: 'Đã gửi cho đơn vị vận chuyển', time: '1 giờ trước', completed: true },
                        { status: 'Đang vận chuyển', time: 'Hiện tại', completed: true },
                        { status: 'Giao hàng thành công', time: 'Dự kiến', completed: false }
                    ],
                    carrier: 'GHTK',
                    note: '[Demo data - không có đơn hàng thực]'
                }
            });
        }

        // Real order data
        return NextResponse.json({
            success: true,
            mode: 'live',
            tracking: {
                orderId: order.id,
                trackingCode: order.tracking_code || null,
                status: order.status || 'pending',
                statusLabel: getStatusLabel(order.status),
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                buyerName: order.buyer_name,
                totalPrice: order.total_price,
                deliveryAddress: order.delivery_address,
                steps: generateTrackingSteps(order.status),
                carrier: order.carrier || 'Chưa xác định',
                estimatedDelivery: order.estimated_delivery || null
            }
        });

    } catch (error: any) {
        console.error('Tracking API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tracking info', details: error.message },
            { status: 500 }
        );
    }
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'processing': 'Đang xử lý',
        'shipped': 'Đã gửi hàng',
        'in_transit': 'Đang vận chuyển',
        'delivered': 'Đã giao hàng',
        'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
}

function generateTrackingSteps(status: string) {
    const allSteps = [
        { status: 'Đơn hàng đã xác nhận', key: 'confirmed' },
        { status: 'Đang xử lý', key: 'processing' },
        { status: 'Đã gửi cho đơn vị vận chuyển', key: 'shipped' },
        { status: 'Đang vận chuyển', key: 'in_transit' },
        { status: 'Giao hàng thành công', key: 'delivered' }
    ];

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    return allSteps.map((step, i) => ({
        ...step,
        completed: i <= currentIndex
    }));
}
