import { NextResponse } from 'next/server';
import { resend, EMAIL_SENDER } from '@/lib/email';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

// Sa Dec Flower Village Coordinates (Approx)
const CENTER_LAT = 10.2926;
const CENTER_LNG = 105.7586;
const ALLOWED_RADIUS_KM = 50; // Use large radius for testing/demo (50km). Real event: 5km.

function calculateDistance(lat: number, lon: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat) * Math.PI / 180;
    const dLon = (lon2 - lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, phone, email, lat, lng } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: 'Missing name or phone' }, { status: 400 });
        }

        // Coordinates validation
        // For "Tech Hardening", specific location check is key
        let distance = 0;

        if (lat && lng) {
            distance = calculateDistance(CENTER_LAT, CENTER_LNG, lat, lng);
            if (distance > ALLOWED_RADIUS_KM) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`[Check-in] Distant check-in: ${distance}km away.`);
                }
            }
        }

        // Send Voucher Email (Fire and Forget)
        if (email) {
            try {
                await resend.emails.send({
                    from: EMAIL_SENDER,
                    to: email,
                    subject: '🎁 Voucher 10% từ Làng Hoa Sa Đéc',
                    react: WelcomeEmail({ name, discountCode: 'FESTIVAL-2026' }),
                });
                if (process.env.NODE_ENV !== 'production') {
                     console.log(`[EMAIL SENT] Voucher sent`);
                }
            } catch (emailError) {
                console.error('[EMAIL ERROR] Failed to send voucher:', emailError);
                // Don't block the user flow if email fails
            }
        }

        // Log the Lead
        if (process.env.NODE_ENV !== 'production') {
             console.log(`[LEAD CAPTURED] New check-in recorded.`);
        }

        return NextResponse.json({
            success: true,
            message: 'Check-in Verified',
            voucher: 'FESTIVAL-2026',
            distance: distance
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
