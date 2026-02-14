import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler
// const supabase = createClient(...)

/**
 * Check-in at a landmark
 * POST /api/check-in
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const body = await request.json();
        const { qr_code, user_id, photo_url } = body;

        if (!qr_code) {
            return NextResponse.json({ error: 'QR code is required' }, { status: 400 });
        }

        // Find landmark by QR code
        const { data: landmark, error: landmarkError } = await supabase
            .from('landmarks')
            .select('*')
            .eq('qr_code', qr_code)
            .single();

        if (landmarkError || !landmark) {
            return NextResponse.json({
                success: false,
                message: 'Invalid QR code or landmark not found'
            }, { status: 404 });
        }

        // Use demo user if not provided
        const effectiveUserId = user_id || '00000000-0000-0000-0000-000000000001';

        // Check if already checked in
        const { data: existing } = await supabase
            .from('user_check_ins')
            .select('id')
            .eq('landmark_id', landmark.id)
            .eq('user_id', effectiveUserId)
            .single();

        if (existing) {
            return NextResponse.json({
                success: false,
                message: 'You have already checked in at this location'
            });
        }

        // Create check-in
        const { data: checkIn, error: checkInError } = await supabase
            .from('user_check_ins')
            .insert({
                landmark_id: landmark.id,
                user_id: effectiveUserId,
                photo_url,
                shared: false
            })
            .select()
            .single();

        if (checkInError) {
            console.error('Check-in error:', checkInError);
            return NextResponse.json({
                success: false,
                message: 'Failed to create check-in'
            }, { status: 500 });
        }

        // Get user's total check-ins to determine badge
        const { data: checkInCount } = await supabase
            .from('user_check_ins')
            .select('id', { count: 'exact' })
            .eq('user_id', effectiveUserId);

        const total = checkInCount?.length || 1;

        // Determine if badge was earned
        let badgeEarned = null;
        if (total === 1) badgeEarned = 'Explorer 🧭';
        else if (total === 5) badgeEarned = 'Adventurer 🗺️';
        else if (total === 10) badgeEarned = 'Sa Dec Legend 🏆';

        return NextResponse.json({
            success: true,
            landmark_id: landmark.id,
            landmark_name: landmark.name,
            points: landmark.points || 10,
            total_check_ins: total,
            badge_earned: badgeEarned
        });

    } catch (error: any) {
        console.error('Check-in API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
