import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Supply Chain Traceability API
 * GET /api/supply-chain?qr_code=XXX or ?product_id=XXX
 * Returns the full journey of a product from farm to customer
 */
export async function GET(req: NextRequest) {
    try {
        const qrCode = req.nextUrl.searchParams.get('qr_code');
        const productId = req.nextUrl.searchParams.get('product_id');

        if (!qrCode && !productId) {
            return NextResponse.json(
                { error: 'qr_code or product_id is required' },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Build query
        let query = supabase
            .from('supply_chain_events')
            .select('*')
            .order('timestamp', { ascending: true });

        if (qrCode) {
            // First get qr_code_id
            const { data: qrData } = await supabase
                .from('qr_codes')
                .select('id, farmer_id, code')
                .eq('code', qrCode)
                .single();

            if (qrData) {
                query = query.eq('qr_code_id', qrData.id);
            }
        } else if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data: events, error } = await query;

        if (error) {
            console.error('Supply chain query error:', error);
        }

        // If no real events, return demo journey
        if (!events || events.length === 0) {
            return NextResponse.json({
                success: true,
                mode: 'demo',
                qr_code: qrCode || 'DEMO',
                journey: getDemoJourney(),
                message: '[Demo data - chạy migration SQL để có dữ liệu thực]'
            });
        }

        // Format real events
        const journey = events.map((event: any) => ({
            id: event.id,
            event: getEventLabel(event.event_type),
            event_type: event.event_type,
            location: event.location,
            actor: event.actor_name,
            role: event.actor_role,
            notes: event.notes,
            photo: event.photo_url,
            timestamp: event.timestamp,
            timeAgo: getTimeAgo(new Date(event.timestamp))
        }));

        return NextResponse.json({
            success: true,
            mode: 'live',
            qr_code: qrCode,
            total_events: journey.length,
            journey,
            verified: true,
            certification: 'AGRIOS.tech Traceability v1.0'
        });

    } catch (error: any) {
        console.error('Supply chain API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch supply chain data', details: error.message },
            { status: 500 }
        );
    }
}

function getEventLabel(eventType: string): string {
    const labels: Record<string, string> = {
        'planted': '🌱 Gieo trồng',
        'growing': '🌿 Đang chăm sóc',
        'harvested': '✂️ Thu hoạch',
        'packed': '📦 Đóng gói',
        'quality_check': '✅ Kiểm tra chất lượng',
        'shipped': '🚚 Xuất kho',
        'in_transit': '🛣️ Đang vận chuyển',
        'delivered': '🏠 Giao thành công'
    };
    return labels[eventType] || eventType;
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

function getDemoJourney() {
    const now = new Date();
    return [
        {
            event: '🌱 Gieo trồng',
            event_type: 'planted',
            location: 'Vườn hoa Chú Ba, Sa Đéc',
            actor: 'Chú Ba',
            role: 'Nhà vườn',
            notes: 'Giống hoa đạt chuẩn VietGAP',
            timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            timeAgo: '30 ngày trước'
        },
        {
            event: '🌿 Đang chăm sóc',
            event_type: 'growing',
            location: 'Vườn hoa Chú Ba, Sa Đéc',
            actor: 'Chú Ba',
            role: 'Nhà vườn',
            notes: 'Tưới nước, bón phân hữu cơ',
            timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            timeAgo: '15 ngày trước'
        },
        {
            event: '✂️ Thu hoạch',
            event_type: 'harvested',
            location: 'Vườn hoa Chú Ba, Sa Đéc',
            actor: 'Chú Ba',
            role: 'Nhà vườn',
            notes: 'Thu hoạch lúc 5h sáng để giữ độ tươi',
            timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
            timeAgo: '3 giờ trước'
        },
        {
            event: '✅ Kiểm tra chất lượng',
            event_type: 'quality_check',
            location: 'Trung tâm đóng gói Sa Đéc',
            actor: 'Cô Lan',
            role: 'QC Inspector',
            notes: 'Độ tươi 98%, đạt chuẩn A+',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            timeAgo: '2 giờ trước'
        },
        {
            event: '📦 Đóng gói',
            event_type: 'packed',
            location: 'Trung tâm đóng gói Sa Đéc',
            actor: 'Team Đóng gói',
            role: 'Packer',
            notes: 'Đóng gói kín khí, bọc xốp bảo vệ',
            timestamp: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
            timeAgo: '1 giờ 30 phút trước'
        }
    ];
}
