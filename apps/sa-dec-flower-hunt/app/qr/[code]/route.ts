import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler
// const supabase = createClient(...)

/**
 * QR code scan redirect and tracking
 * GET /qr/[code]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Find QR code
        const { data: qrCode, error: qrError } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (qrError || !qrCode) {
            // Redirect to home if QR code not found
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Track scan
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';

        await supabase
            .from('qr_scans')
            .insert({
                qr_code_id: qrCode.id,
                user_agent: userAgent,
                ip_address: ipAddress,
            });

        // Increment scan count
        await supabase
            .from('qr_codes')
            .update({
                scan_count: qrCode.scan_count + 1,
                last_scanned_at: new Date().toISOString(),
            })
            .eq('id', qrCode.id);

        // Redirect to farmer's shop
        const farmerShopUrl = `/farmer-shop/${qrCode.farmer_id}?ref=qr-${code}`;
        return NextResponse.redirect(new URL(farmerShopUrl, request.url));

    } catch (error: any) {
        console.error('QR scan error:', error);
        return NextResponse.redirect(new URL('/', request.url));
    }
}
