import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler
// const supabase = createClient(...)

/**
 * Get farmer's gamification progress
 * GET /api/farmers/[id]/progress
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

        // Get farmer profile with XP and level
        const { data: farmer, error: farmerError } = await supabase
            .from('profiles')
            .select('name, xp, level')
            .eq('id', farmerId)
            .eq('role', 'farmer')
            .single();

        if (farmerError || !farmer) {
            return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
        }

        // Get achievements
        const { data: achievements } = await supabase
            .from('farmer_achievements')
            .select('*')
            .eq('farmer_id', farmerId)
            .order('unlocked_at', { ascending: false });

        // Get stats (orders, revenue)
        const { data: orderStats } = await supabase
            .rpc('get_farmer_stats', { p_farmer_id: farmerId });

        // Get rating
        const { data: rating } = await supabase
            .from('farmer_ratings')
            .select('average_rating')
            .eq('farmer_id', farmerId)
            .single();

        return NextResponse.json({
            name: farmer.name,
            xp: farmer.xp || 0,
            level: farmer.level || 1,
            totalOrders: orderStats?.[0]?.total_orders || 0,
            totalRevenue: orderStats?.[0]?.total_revenue || 0,
            rating: rating?.average_rating,
            achievements: achievements || []
        });

    } catch (error: any) {
        console.error('Progress fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
