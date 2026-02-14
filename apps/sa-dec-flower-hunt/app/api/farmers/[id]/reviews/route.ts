import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize inside handler
// const supabase = createClient(...)

/**
 * Get all reviews for a farmer
 * GET /api/farmers/[id]/reviews
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
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');
        const minRating = parseInt(searchParams.get('minRating') || '1');

        // Get reviews
        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('*, profiles!reviews_buyer_id_fkey(name, email)')
            .eq('farmer_id', farmerId)
            .gte('rating', minRating)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (reviewsError) {
            console.error('Failed to fetch reviews:', reviewsError);
            return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
        }

        // Get rating summary
        const { data: summary } = await supabase
            .from('farmer_ratings')
            .select('*')
            .eq('farmer_id', farmerId)
            .single();

        return NextResponse.json({
            reviews: reviews || [],
            summary: summary || {
                average_rating: 0,
                total_reviews: 0,
                five_star: 0,
                four_star: 0,
                three_star: 0,
                two_star: 0,
                one_star: 0,
            },
        });

    } catch (error: any) {
        console.error('Farmer reviews fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
