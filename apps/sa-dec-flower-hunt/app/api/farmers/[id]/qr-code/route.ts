import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

// Initialize inside handler
// const supabase = createClient(...)

/**
 * Get or create QR code for farmer
 * GET /api/farmers/[id]/qr-code
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

        const { id: farmerId } = await params;
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'json'; // 'json' or 'image'

        // Check if QR code exists
        let { data: qrCode, error: qrError } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('farmer_id', farmerId)
            .eq('is_active', true)
            .single();

        // Create if doesn't exist
        if (!qrCode) {
            // Generate code using database function
            const { data: newCode } = await supabase
                .rpc('generate_farmer_qr_code', { p_farmer_id: farmerId });

            if (!newCode) {
                return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
            }

            const url = `${process.env.NEXT_PUBLIC_APP_URL}/qr/${newCode}`;

            // Insert QR code
            const { data: inserted, error: insertError } = await supabase
                .from('qr_codes')
                .insert({
                    farmer_id: farmerId,
                    code: newCode,
                    url,
                })
                .select()
                .single();

            if (insertError) {
                console.error('Failed to create QR code:', insertError);
                return NextResponse.json({ error: 'Failed to create QR code' }, { status: 500 });
            }

            qrCode = inserted;
        }

        // Return format
        if (format === 'image') {
            // Generate QR code image
            const qrImage = await QRCode.toDataURL(qrCode.url, {
                width: 512,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });

            return new NextResponse(Buffer.from(qrImage.split(',')[1], 'base64'), {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=31536000',
                },
            });
        }

        // Default JSON response
        return NextResponse.json({
            qrCode: {
                id: qrCode.id,
                code: qrCode.code,
                url: qrCode.url,
                scanCount: qrCode.scan_count,
                createdAt: qrCode.created_at,
            },
        });

    } catch (error: any) {
        console.error('QR code fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
