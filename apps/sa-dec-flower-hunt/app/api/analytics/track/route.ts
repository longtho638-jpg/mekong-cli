import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler to avoid build-time errors
// const supabase = createClient(...);

/**
 * Track analytics events
 * POST /api/analytics/track
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { event_name, properties, userId } = await request.json();

        // Insert to analytics table if it exists
        const { error } = await supabase
            .from('analytics')
            .insert({
                event_name,
                properties,
                user_id: userId,
                channel: properties?.platform || properties?.channel,
                campaign_id: properties?.campaign_id,
            });

        if (error && error.code !== '42P01') { // 42P01 = table doesn't exist
            console.error('Analytics insert error:', error);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Analytics track error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
