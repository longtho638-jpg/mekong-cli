import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Debug Environment Check API
 * 🔒 SECURITY: Only available in development mode
 * Returns minimal info about env var presence (not values)
 */
export async function GET() {
    // 🔒 SECURITY: Block in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'This endpoint is disabled in production' },
            { status: 403 }
        );
    }

    // 🔒 Only show boolean presence, never actual values
    const checks = {
        environment: process.env.NODE_ENV,
        supabase_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        tiktok_configured: !!process.env.TIKTOK_CLIENT_KEY,
        gemini_configured: !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY,
        timestamp: new Date().toISOString()
    };

    return NextResponse.json(checks);
}
